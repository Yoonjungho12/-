"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseF";

export default function CommentsUI({ company_name, id }) {
  // ========== 기본 상태들 ==========
  const [commentText, setCommentText] = useState("");
  const [commentTimestamps, setCommentTimestamps] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);

  const ONE_MINUTE = 60000;
  const LIMIT_PER_MIN = 10; // 1분 내 10회
  const PAGE_SIZE = 5;      // 페이지당 표시할 댓글 수

  // ========== 페이지네이션 관련 ==========
  const [comments, setComments] = useState([]); // is_admitted = true인 댓글들 (현재 페이지)
  const [reviewCount, setReviewCount] = useState(0); // partnershipsubmit.comment 값
  const [page, setPage] = useState(1);              // 현재 페이지 번호
  const [totalPages, setTotalPages] = useState(1);

  // ========== 팝업(우클릭/롱프레스) 상태 ==========
  const [popup, setPopup] = useState({
    visible: false,
    x: 0,
    y: 0,
    targetUserId: "",
  });
  const pressTimerRef = useRef(null);
  const router = useRouter();

  // --------------------------------------
  // (1) 초기 로딩: 로그인 정보 & 로컬 스토리지(1분 제한) 불러오기
  // --------------------------------------
  useEffect(() => {
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        setCurrentUserId(userData.user.id);
      }
    })();

    const stored = localStorage.getItem("commentTimestamps");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const now = Date.now();
        const validTimestamps = parsed.filter((ts) => now - ts < ONE_MINUTE);
        setCommentTimestamps(validTimestamps);
      } catch (e) {
        console.error("로컬 스토리지 파싱 에러:", e);
      }
    }
  }, []);

  // --------------------------------------
  // (2) page가 바뀌면 댓글 목록 & reviewCount 불러오기
  // --------------------------------------
  useEffect(() => {
    fetchCommentsAndCount();
  }, [id, page]);

  // --------------------------------------
  // (3) commentTimestamps 바뀌면 로컬 스토리지 갱신
  // --------------------------------------
  useEffect(() => {
    localStorage.setItem("commentTimestamps", JSON.stringify(commentTimestamps));
  }, [commentTimestamps]);

  // --------------------------------------
  // (4) DB에서 partnershipsubmit.comment & 댓글 목록(is_admitted=true) 가져오기
  // --------------------------------------
  async function fetchCommentsAndCount() {
    try {
      // partnershipsubmit.comment 가져오기 → 총 댓글 수
      const { data: psData, error: psError } = await supabase
        .from("partnershipsubmit")
        .select("comment")
        .eq("id", id)
        .single();

      if (psError) {
        console.error("파트너십테이블(comment) 불러오기 에러:", psError);
      } else if (psData) {
        const totalCount = psData.comment || 0;
        setReviewCount(totalCount);
        setTotalPages(Math.ceil(totalCount / PAGE_SIZE));
      }

      // is_admitted=true 인 댓글 page 단위로 가져오기
      const start = (page - 1) * PAGE_SIZE;
      const end = start + PAGE_SIZE - 1;
      const { data: commentData, error: commentError } = await supabase
        .from("comments")
        .select(`
          id,
          comment,
          created_at,
          user_id,
          is_admitted,
          profiles!inner(nickname, user_id)
        `)
        .eq("partnershipsubmit_id", id)
        .eq("is_admitted", true)
        .order("created_at", { ascending: false })
        .range(start, end);

      if (commentError) {
        console.error("댓글 목록(is_admitted=true) 가져오기 에러:", commentError);
      }
      if (commentData) {
        setComments(commentData);
      }
    } catch (err) {
      console.error("fetchCommentsAndCount() 에러:", err);
    }
  }

  // --------------------------------------
  // (5) 1분 10회 초과 여부
  // --------------------------------------
  function canSubmit() {
    const now = Date.now();
    const recent = commentTimestamps.filter((ts) => now - ts < ONE_MINUTE);
    return recent.length < LIMIT_PER_MIN;
  }

  // --------------------------------------
  // (6) 댓글 등록 - is_admitted = false
  // --------------------------------------
  async function handleSubmit() {
    if (!commentText.trim()) {
      alert("댓글 내용을 입력해주세요!");
      return;
    }
    if (!canSubmit()) {
      alert(`1분 내에 ${LIMIT_PER_MIN}개 이상은 불가능해요! 잠시 후 다시 시도해 주세요!`);
      return;
    }

    // 로그인 체크
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      alert("로그인이 필요합니다! 로그인 후에 이용 가능합니다.");
      return;
    }

    // 밴 여부 확인
    const user_id = userData.user.id;
    const { data: bannedData, error: bannedError } = await supabase
      .from("profiles")
      .select("is_banned")
      .eq("user_id", user_id)
      .maybeSingle();

    if (bannedError) {
      console.error("밴 여부 확인 에러:", bannedError);
      alert("죄송합니다. 잠시 후 다시 시도해 주세요!");
      return;
    }
    if (bannedData && bannedData.is_banned) {
      alert("차단된 사용자입니다. 1:1쪽지로 운영자에게 문의하시기바랍니다.");
      return;
    }

    // DB insert (is_admitted=false)
    const { error } = await supabase
      .from("comments")
      .insert({
        user_id,
        partnershipsubmit_id: id,
        comment: commentText,
        is_admitted: false,
      });

    if (error) {
      console.error("댓글 등록 에러:", error);
      alert("댓글 등록 중 문제가 발생했어요!");
      return;
    }

    alert("댓글이 등록되었습니다! 관리자 승인 후 노출됩니다.");
    setCommentText("");

    // 1분 제한 타임스탬프 갱신
    const now = Date.now();
    const newTimestamps = [
      ...commentTimestamps.filter((ts) => now - ts < ONE_MINUTE),
      now,
    ];
    setCommentTimestamps(newTimestamps);
  }

  // --------------------------------------
  // (7) 댓글 삭제 (본인 글만 가능) + partnershipsubmit.comment -= 1
  // --------------------------------------
  async function handleDelete(commentId, commentUserId) {
    if (currentUserId !== commentUserId) {
      alert("본인이 작성한 댓글만 삭제할 수 있습니다!");
      return;
    }
    if (!confirm("정말 이 댓글을 삭제하시겠습니까?")) {
      return;
    }

    // 1) 이 댓글이 실제 승인된 상태인지 (local state에서 확인 가능)
    const targetComment = comments.find((c) => c.id === commentId);
    if (!targetComment) {
      console.error("삭제 대상 댓글을 찾지 못했습니다.");
      return;
    }
    const wasAdmitted = targetComment.is_admitted; // 목록상 is_admitted는 true일 것

    // 2) DB에서 댓글 삭제
    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      console.error("댓글 삭제 에러:", error);
      alert("댓글 삭제 중 문제가 발생했습니다!");
      return;
    }

    // 3) 만약 승인된 댓글이었다면 partnershipsubmit.comment - 1
    if (wasAdmitted) {
      const { error: updateError } = await supabase
        .from("partnershipsubmit")
        .update({
          // 만약 음수 방지가 필요하면 Math.max(reviewCount - 1, 0)을 사용
          comment: reviewCount > 0 ? reviewCount - 1 : 0,
        })
        .eq("id", id);
      if (updateError) {
        console.error("업체 리뷰 수 감소 에러:", updateError);
      }
    }

    // 4) 목록 갱신
    fetchCommentsAndCount();
  }

  // --------------------------------------
  // (8) 날짜 포맷 (조건별: 오늘, n일 전, MM-DD, YYYY-MM-DD)
  // --------------------------------------
  function formatDateCustom(dateString) {
    const dateObj = new Date(dateString);
    const now = new Date();

    const diffMs = now - dateObj; // 밀리초 차이
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // 같은 해인지?
    const isSameYear = dateObj.getFullYear() === now.getFullYear();

    if (diffDays < 1) {
      return "오늘";
    } else if (diffDays <= 7) {
      return `${diffDays}일 전`;
    } else {
      const month = String(dateObj.getMonth() + 1).padStart(2, "0");
      const day = String(dateObj.getDate()).padStart(2, "0");
      if (isSameYear) {
        return `${month}-${day}`;
      } else {
        const year = dateObj.getFullYear();
        return `${year}-${month}-${day}`;
      }
    }
  }

  // --------------------------------------
  // (9) 페이지 이동 핸들러
  // --------------------------------------
  function goToPrevPage() {
    if (page > 1) {
      setPage(page - 1);
    }
  }
  function goToNextPage() {
    if (page < totalPages) {
      setPage(page + 1);
    }
  }

  // ======================================
  // (추가) 우클릭/롱프레스 -> 1:1 쪽지 팝업
  // ======================================
  function handleContextMenu(e, commentUserId) {
    e.preventDefault();
    if (commentUserId === currentUserId) return;

    const { clientX, clientY } = e;
    setPopup({
      visible: true,
      x: clientX,
      y: clientY,
      targetUserId: commentUserId,
    });
  }
  function handleTouchStart(e, commentUserId) {
    if (commentUserId === currentUserId) return;
    pressTimerRef.current = setTimeout(() => {
      const touch = e.touches[0];
      setPopup({
        visible: true,
        x: touch.clientX,
        y: touch.clientY,
        targetUserId: commentUserId,
      });
    }, 500);
  }
  function handleTouchEnd() {
    if (pressTimerRef.current) {
      clearTimeout(pressTimerRef.current);
    }
  }
  function handleSendMessage() {
    setPopup((prev) => ({ ...prev, visible: false }));
    if (!currentUserId) {
      alert("로그인이 필요합니다! 로그인 후 이용 가능합니다.");
      return;
    }
    router.push(`/messages/${popup.targetUserId}`);
  }
  useEffect(() => {
    function closePopup() {
      if (popup.visible) {
        setPopup((prev) => ({ ...prev, visible: false }));
      }
    }
    window.addEventListener("click", closePopup);
    return () => window.removeEventListener("click", closePopup);
  }, [popup.visible]);

  // --------------------------------------
  // (10) UI
  // --------------------------------------
  return (
    <div className="bg-white rounded mt-12 relative">
      {/* 상단: 업체명 + 댓글 개수 */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-semibold mb-2">
          {company_name} 업체에 리뷰를 남겨보세요!
        </h2>
        <div className="text-4xl font-bold">{reviewCount}</div>
        <div className="text-gray-500">개의 리뷰</div>
      </div>

      {/* 댓글 입력창 + 등록 버튼 */}
      <div className="flex gap-2 mb-6">
        <textarea
          className="flex-1 border border-gray-300 rounded p-2 focus:outline-none focus:border-blue-400"
          placeholder="리뷰를 입력해주세요"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
        />
        <button
          className="w-20 bg-gray-200 hover:bg-gray-200 rounded text-gray-700"
          onClick={handleSubmit}
          disabled={!canSubmit()}
        >
          등록
        </button>
      </div>

      {/* 승인된(is_admitted=true) 댓글 목록 (현재 페이지) */}
      <ul className="space-y-4 mb-4">
        {comments.map((c) => {
          const displayedDate = formatDateCustom(c.created_at);
          return (
            <li
              key={c.id}
              className="bg-white rounded shadow p-4 flex flex-col"
              onContextMenu={(e) => handleContextMenu(e, c.profiles.user_id)}
              onTouchStart={(e) => handleTouchStart(e, c.profiles.user_id)}
              onTouchEnd={handleTouchEnd}
            >
              {/* 닉네임 + 날짜 */}
              <div className="flex items-baseline gap-2">
                <span className="font-semibold text-black">
                  {c.profiles.nickname}
                </span>
                <span className="text-sm text-gray-400">{displayedDate}</span>
              </div>

              {/* 댓글 내용 */}
              <div className="mt-1 text-gray-700">{c.comment}</div>

              {/* 본인 글이면 삭제 버튼 */}
              {currentUserId === c.user_id && (
                <div className="mt-2 text-right">
                  <button
                    className="text-red-400 text-sm"
                    onClick={() => handleDelete(c.id, c.user_id)}
                  >
                    삭제
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* 페이지네이션 버튼 */}
      <div className="flex justify-center gap-4">
        <button
          className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={goToPrevPage}
          disabled={page <= 1}
        >
          이전
        </button>
        <span className="self-center">
          {page} / {totalPages}
        </span>
        <button
          className="px-3 py-1 border rounded disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={goToNextPage}
          disabled={page >= totalPages}
        >
          다음
        </button>
      </div>

      {/* 우클릭/롱프레스 팝업 (쪽지 보내기) */}
      {popup.visible && (
        <div
          className="z-50 bg-white border border-gray-300 rounded p-2"
          style={{
            position: "fixed",
            top: popup.y,
            left: popup.x,
            minWidth: "120px",
          }}
        >
          <ul className="text-center">
            <li
              className="cursor-pointer hover:underline text-blue-600"
              onClick={handleSendMessage}
            >
              1:1 쪽지 보내기
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}