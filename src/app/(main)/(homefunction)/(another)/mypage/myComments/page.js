"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseF";

/**
 * 내 댓글 페이지 (게시글 + 커뮤니티 댓글)
 * 
 * 기능 요약:
 * 1) 로그인 세션 확인
 * 2) 탭("all","board","community")에 따라 comments / post_comments 조회
 * 3) 하나의 리스트로 합쳐 최신순 정렬
 * 4) 승인된 댓글 표시, 승인 대기중이면 "승인 대기중" 노출
 * 5) 게시글 댓글은 /board/details/[partnershipsubmit_id],
 *    커뮤니티 댓글은 /community/board/detail/[posts.board_id]/[posts.id]로 이동
 * 6) 삭제 시 confirm, 그리고 승인 댓글이면 partnershipsubmit.comment -= 1
 * 7) 검색(업체명, 커뮤니티 글 제목, 댓글 내용)에 필터
 */
export default function MyCommentsPage() {
  const router = useRouter();

  // (A) 로그인 세션
  const [session, setSession] = useState(null);

  // (B) 최종 댓글 목록 (게시글 + 커뮤니티)
  const [items, setItems] = useState([]);

  // (C) 검색어 & 탭 상태
  const [searchTerm, setSearchTerm] = useState("");
  const [currentTab, setCurrentTab] = useState("all"); // "all","board","community"

  // ─────────────────────────────────────────
  // (1) 세션 확인
  // ─────────────────────────────────────────
  useEffect(() => {
    async function checkSession() {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error("Session Error:", error);
      }
      setSession(session);
    }
    checkSession();
  }, []);

  // ─────────────────────────────────────────
  // (2) 탭 or 세션 user.id 바뀔 때 → 목록 조회
  // ─────────────────────────────────────────
  useEffect(() => {
    if (!session?.user?.id) {
      setItems([]);
      return;
    }
    fetchData(session.user.id, currentTab);
  }, [session?.user?.id, currentTab]);

  // ─────────────────────────────────────────
  // (3) 두 테이블(comments, post_comments) 조회 + 합치기
  // ─────────────────────────────────────────
  async function fetchData(userId, tab) {
    try {
      // 게시글(comments) 목록
      let boardList = [];
      if (tab === "board" || tab === "all") {
        const { data: boardData, error: boardError } = await supabase
          .from("comments")
          .select(`
            id,
            user_id,
            comment,
            created_at,
            is_admitted,
            partnershipsubmit_id,
            partnershipsubmit:partnershipsubmit_id (
              company_name,
              comment
            )
          `)
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (boardError) {
          console.error("boardError:", boardError);
        } else if (boardData) {
          boardList = boardData.map((item) => ({
            id: item.id,
            user_id: item.user_id,
            content: item.comment,
            created_at: item.created_at,
            mainName: item.partnershipsubmit?.company_name || "알 수 없는 업체",
            detailId: item.partnershipsubmit_id, // 게시글 상세페이지 이동 시 사용
            source: "board",
            isAdmitted: item.is_admitted,
            // partnershipsubmit.comment (총 댓글 수) - 여기서는 굳이 표시 안 함
            psCommentCount: item.partnershipsubmit?.comment || 0,
          }));
        }
      }

      // 커뮤니티(post_comments) 목록
      let communityList = [];
      if (tab === "community" || tab === "all") {
        // posts.board_id도 함께 가져와야 → /community/board/detail/[board_id]/[post_id]
        const { data: commData, error: commError } = await supabase
          .from("post_comments")
          .select(`
            id,
            user_id,
            content,
            created_at,
            post_id,
            posts:post_id (
              title,
              board_id
            )
          `)
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (commError) {
          console.error("commError:", commError);
        } else if (commData) {
          communityList = commData.map((item) => ({
            id: item.id,
            user_id: item.user_id,
            content: item.content,
            created_at: item.created_at,
            mainName: item.posts?.title || "제목 없음",
            detailId: item.post_id, // 커뮤니티 글 상세 이동 시 post.id
            source: "community",
            boardId: item.posts?.board_id || 0, // 커뮤니티 게시글의 board_id
          }));
        }
      }

      // 합치기
      let merged = [];
      if (tab === "all") {
        merged = [...boardList, ...communityList];
        // 최신순 정렬
        merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      } else if (tab === "board") {
        merged = boardList;
      } else {
        merged = communityList;
      }

      setItems(merged);
    } catch (err) {
      console.error("fetchData() Unknown error:", err);
    }
  }

  // ─────────────────────────────────────────
  // (4) 상대시간 계산
  // ─────────────────────────────────────────
  function timeAgo(dateString) {
    const now = new Date();
    const past = new Date(dateString);
    const diff = (now - past) / 1000;
    if (diff < 60) return "방금 전";
    const mins = Math.floor(diff / 60);
    if (mins < 60) return `${mins}분 전`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}시간 전`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}일 전`;
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return `${weeks}주 전`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}개월 전`;
    const years = Math.floor(months / 12);
    return `${years}년 전`;
  }

  // ─────────────────────────────────────────
  // (5) 클릭 → 게시글/커뮤니티 상세 페이지
  // ─────────────────────────────────────────
  function handleItemClick(item) {
    if (item.source === "board") {
      // 게시글 댓글 → /board/details/[partnershipsubmit.id]
      router.push(`/board/details/${item.detailId}`);
    } else {
      // 커뮤니티 댓글 → /community/board/detail/[posts.board_id]/[posts.id]
      router.push(`/community/board/detail/${item.boardId}/${item.detailId}`);
    }
  }

  // ─────────────────────────────────────────
  // (6) 삭제 → Confirm & Delete + partnershipsubmit.comment--
  // ─────────────────────────────────────────
  async function handleDelete(itemId, source) {
    // 삭제 확인
    const confirmResult = window.confirm("정말 삭제하시겠습니까?");
    if (!confirmResult) return;

    try {
      if (source === "board") {
        // (a) 해당 댓글 정보 가져오기
        const { data: targetComment, error: selError } = await supabase
          .from("comments")
          .select("id, is_admitted, partnershipsubmit_id, partnershipsubmit(comment)")
          .eq("id", itemId)
          .single();

        if (selError) {
          console.error("Delete Pre-Check Error:", selError);
          return;
        }
        if (!targetComment) {
          console.error("댓글 정보를 찾을 수 없습니다.");
          return;
        }

        // (b) DB에서 삭제
        const { error: deleteError } = await supabase
          .from("comments")
          .delete()
          .eq("id", itemId);
        if (deleteError) {
          console.error("Delete Error (board):", deleteError);
          return;
        }

        // (c) 승인된 댓글이면 partnershipsubmit.comment -= 1
        if (targetComment.is_admitted) {
          const currentCount = targetComment.partnershipsubmit?.comment || 0;
          const newCount = Math.max(currentCount - 1, 0);

          const { error: updateError } = await supabase
            .from("partnershipsubmit")
            .update({ comment: newCount })
            .eq("id", targetComment.partnershipsubmit_id);
          if (updateError) {
            console.error("파트너십.comment 업데이트 에러:", updateError);
          }
        }
      } else {
        // 커뮤니티 댓글
        const { error } = await supabase
          .from("post_comments")
          .delete()
          .eq("id", itemId);
        if (error) {
          console.error("Delete Error (community):", error);
          return;
        }
      }

      alert("삭제가 완료되었습니다.");

      // 다시 목록 조회
      if (session?.user?.id) {
        fetchData(session.user.id, currentTab);
      }
    } catch (err) {
      console.error("Unknown delete error:", err);
    }
  }

  // ─────────────────────────────────────────
  // (7) 검색어 필터
  // ─────────────────────────────────────────
  const filtered = items.filter((item) => {
    const name = (item.mainName || "").toLowerCase();
    const text = (item.content || "").toLowerCase();
    const term = searchTerm.toLowerCase();
    return name.includes(term) || text.includes(term);
  });

  // ─────────────────────────────────────────
  // (8) 최종 렌더링
  // ─────────────────────────────────────────
  return (
    <div className="max-w-[600px] mx-auto p-4 font-sans">
      {/* (A) 제목 */}
      <h1 className="text-xl font-bold mb-4">내 댓글</h1>

     
     

      {/* (C) 탭 */}
      <div className="flex items-center text-sm text-gray-600 border-b border-gray-200">
        <TabButton
          label="전체"
          active={currentTab === "all"}
          onClick={() => setCurrentTab("all")}
        />
        <TabButton
          label="게시글"
          active={currentTab === "board"}
          onClick={() => setCurrentTab("board")}
        />
        <TabButton
          label="커뮤니티"
          active={currentTab === "community"}
          onClick={() => setCurrentTab("community")}
        />
      </div>

      {/* (D) 댓글 목록 */}
      <div className="mt-4">
        {filtered.length === 0 ? (
          <div className="mt-4 text-gray-500 text-sm">댓글 목록이 없습니다.</div>
        ) : (
          filtered.map((item) => (
            <div
              key={`${item.source}-${item.id}`}
              className="flex justify-between items-center bg-gray-100 rounded p-3 mb-2 cursor-pointer"
            >
              {/* 왼쪽: 업체명/제목 + 내용 */}
              <div className="flex-1" onClick={() => handleItemClick(item)}>
                <div className="text-base font-bold mb-1">{item.mainName}</div>
                {/* 승인 여부 표시 */}
                {item.source === "board" ? (
                  item.isAdmitted ? (
                    <div className="text-sm text-gray-600">{item.content}</div>
                  ) : (
                    <div className="text-sm text-gray-400 italic">승인 대기중</div>
                  )
                ) : (
                  <div className="text-sm text-gray-600">{item.content}</div>
                )}
              </div>

              {/* 작성 시각 */}
              <div className="text-xs text-gray-400 ml-3 whitespace-nowrap">
                {timeAgo(item.created_at)}
              </div>

              {/* 삭제 버튼 */}
              <button
                className="ml-4 text-red-500 text-sm border-none bg-none"
                onClick={() => handleDelete(item.id, item.source)}
              >
                삭제
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// 탭 버튼 컴포넌트
function TabButton({ label, active, onClick }) {
  return (
    <span
      className={`mr-4 cursor-pointer pb-2 ${
        active ? "font-bold border-b-2 border-orange-400" : ""
      }`}
      onClick={onClick}
    >
      {label}
    </span>
  );
}