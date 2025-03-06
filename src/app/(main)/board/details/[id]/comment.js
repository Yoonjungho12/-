"use client";
import { useState, useEffect } from "react";
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

  // --------------------------------------
  // (1) 초기 로딩: 로그인 정보 & 로컬 스토리지(1분 제한) 불러오기
  // --------------------------------------
  useEffect(() => {
    // 1) 로그인 사용자 정보
    (async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (userData?.user) {
        setCurrentUserId(userData.user.id);
      }
    })();

    // 2) 로컬 스토리지에서 댓글 타임스탬프 가져오기
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
      // 4-1) partnershipsubmit.comment를 그대로 가져와서 reviewCount로 씀
      const { data: psData, error: psError } = await supabase
        .from("partnershipsubmit")
        .select("comment")
        .eq("id", id)
        .single();

      if (psError) {
        console.error("파트너십테이블(comment 칼럼) 불러오기 에러:", psError);
      } else if (psData) {
        // DB에 저장된 comment 값 (예: 12)
        const totalCount = psData.comment || 0;
        setReviewCount(totalCount);
        // 전체 페이지 수 계산 (ex: 12개면 12/5 → 2.4 → 3페이지)
        setTotalPages(Math.ceil(totalCount / PAGE_SIZE));
      }

      // 4-2) is_admitted = true인 댓글만 page에 맞춰 가져오기
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
          profiles!inner(nickname)
        `)
        .eq("partnershipsubmit_id", id)
        .eq("is_admitted", true)
        .order("created_at", { ascending: false })
        .range(start, end);

      if (commentError) {
        console.error("댓글 목록(is_admitted=true) 가져오기 에러:", commentError);
        return;
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
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) {
      console.error("유저 정보 에러:", userError);
      alert("로그인 정보를 확인할 수 없습니다.");
      return;
    }
    if (!userData || !userData.user) {
      alert("로그인이 필요합니다!");
      return;
    }

    // DB insert (is_admitted = false)
    const user_id = userData.user.id;
    const { data, error } = await supabase
      .from("comments")
      .insert({
        user_id,
        partnershipsubmit_id: id,
        comment: commentText,
        is_admitted: false, // 관리자 승인 전
      })
      .select();

    if (error) {
      console.error("댓글 등록 에러:", error);
      alert("댓글 등록 중 문제가 발생했어요!");
      return;
    }

    if (data) {
      alert("댓글이 등록되었습니다! 관리자 승인 후 노출됩니다.");
      setCommentText("");

      // 1분 제한 타임스탬프 갱신
      const now = Date.now();
      const newTimestamps = [
        ...commentTimestamps.filter((ts) => now - ts < ONE_MINUTE),
        now,
      ];
      setCommentTimestamps(newTimestamps);

      // partnershipsubmit.comment는 여기서 절대 수정하지 않는다(관리자 페이지에서 수정)
      // fetchCommentsAndCount() 호출해봐도 is_admitted=false라 화면엔 안 나옴.
      // fetchCommentsAndCount();
    }
  }

  // --------------------------------------
  // (7) 댓글 삭제 (본인 글만 가능)
  // --------------------------------------
  async function handleDelete(commentId, commentUserId) {
    if (currentUserId !== commentUserId) {
      alert("본인이 작성한 댓글만 삭제할 수 있습니다!");
      return;
    }
    if (!confirm("정말 이 댓글을 삭제하시겠습니까?")) {
      return;
    }

    const { error } = await supabase
      .from("comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      console.error("댓글 삭제 에러:", error);
      alert("댓글 삭제 중 문제가 발생했습니다!");
      return;
    }

    // partnershipsubmit.comment도 이 로직에선 수정 안 함
    // 관리자 페이지에서 승인된 댓글을 삭제하면 -1 하든지 등등 처리
    fetchCommentsAndCount();
  }

  // --------------------------------------
  // (8) 날짜 포맷 (MM-DD HH:mm)
  // --------------------------------------
  function formatDate(dateString) {
    const date = new Date(dateString);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    return `${month}-${day} ${hours}:${minutes}`;
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

  // --------------------------------------
  // (10) UI
  // --------------------------------------
  return (
    <div className="bg-white p-6 rounded mt-12">
      {/* 상단: 업체명 + 댓글 개수 ( DB에서 읽어온 partnershipsubmit.comment 값 ) */}
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
          className="w-20 bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
          onClick={handleSubmit}
          disabled={!canSubmit()}
        >
          등록
        </button>
      </div>

      {/* 승인된(is_admitted=true) 댓글 목록 (현재 페이지) */}
      <ul className="space-y-4 mb-4">
        {comments.map((c) => (
          <li
            key={c.id}
            className="p-3 rounded border border-gray-300 flex justify-between items-start"
          >
            <div>
              <div className="font-semibold mb-1">
                {c.profiles.nickname}{" "}
                <span className="text-sm text-gray-500">
                  {formatDate(c.created_at)}
                </span>
              </div>
              <div className="text-gray-700">{c.comment}</div>
            </div>

            {/* 본인 글만 삭제 가능 */}
            {currentUserId === c.user_id && (
              <button
                className="text-red-400 text-sm"
                onClick={() => handleDelete(c.id, c.user_id)}
              >
                삭제
              </button>
            )}
          </li>
        ))}
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
    </div>
  );
}