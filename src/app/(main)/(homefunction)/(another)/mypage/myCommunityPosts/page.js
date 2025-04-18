"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseF";

export default function MyCommunityPostsCardPage() {
  const router = useRouter();

  // (A) 로그인 세션
  const [session, setSession] = useState(null);

  // (B) 나의 게시글 목록
  const [posts, setPosts] = useState([]);

  // (C) 검색어
  const [searchTerm, setSearchTerm] = useState("");

  // ─────────────────────────────────────────
  // (1) 세션 확인
  // ─────────────────────────────────────────
  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("세션 로드 오류:", error);
        return;
      }
      setSession(session);
    }
    checkSession();
  }, []);

  // ─────────────────────────────────────────
  // (2) 세션 user_id 로 나의 게시글 목록 로드
  // ─────────────────────────────────────────
  useEffect(() => {
    if (!session?.user?.id) {
      setPosts([]);
      return;
    }
    fetchMyPosts(session.user.id);
  }, [session?.user?.id]);

  // ─────────────────────────────────────────
  // (3) 나의 게시글 목록 조회
  // ─────────────────────────────────────────
  async function fetchMyPosts(userId) {
    try {
      // boards 테이블과 조인(boards.name)
      const { data, error } = await supabase
        .from("posts")
        .select(`
          id,
          title,
          content,
          created_at,
          board_id,
          boards:board_id (
            name
          ),
          user_id
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("게시글 목록 조회 오류:", error);
        return;
      }
      setPosts(data || []);
    } catch (err) {
      console.error("fetchMyPosts() unknown error:", err);
    }
  }

  // ─────────────────────────────────────────
  // (4) 날짜 포맷 (상대시간 or YYYY-MM-DD)
  // ─────────────────────────────────────────
  function formatDate(dateString) {
    const dateObj = new Date(dateString);
    const now = new Date();
    const diffMs = now - dateObj;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 1) {
      return "오늘";
    } else if (diffDays <= 7) {
      return `${diffDays}일 전`;
    } else {
      // 당해년도면 MM-DD, 아니면 YYYY-MM-DD
      const isSameYear = dateObj.getFullYear() === now.getFullYear();
      const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
      const dd = String(dateObj.getDate()).padStart(2, "0");
      if (isSameYear) {
        return `${mm}-${dd}`;
      } else {
        const yyyy = dateObj.getFullYear();
        return `${yyyy}-${mm}-${dd}`;
      }
    }
  }

  // ─────────────────────────────────────────
  // (5) 카드 클릭 → 상세 페이지 이동
  // ─────────────────────────────────────────
  function handleCardClick(post) {
    // /community/board/detail/[board_id]/[post_id]
    router.push(`/community/board/detail/${post.board_id}/${post.id}`);
  }

  // ─────────────────────────────────────────
  // (6) 삭제 버튼
  // ─────────────────────────────────────────
  async function handleDelete(e, post) {
    e.stopPropagation(); // 카드 클릭과 구분

    const confirmResult = window.confirm("정말 이 게시글을 삭제하시겠습니까?");
    if (!confirmResult) return;

    try {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("id", post.id);

      if (error) {
        console.error("게시글 삭제 오류:", error);
        alert("삭제 중 오류가 발생했습니다!");
        return;
      }

      alert("삭제가 완료되었습니다.");

      // 다시 목록 로드
      if (session?.user?.id) {
        fetchMyPosts(session.user.id);
      }
    } catch (err) {
      console.error("Unknown delete error:", err);
    }
  }

  // ─────────────────────────────────────────
  // (7) 검색어 필터 (boards.name + title + content)
  // ─────────────────────────────────────────
  const filtered = posts.filter((post) => {
    const boardName = post.boards?.name?.toLowerCase() || "";
    const title = post.title?.toLowerCase() || "";
    const content = post.content?.toLowerCase() || "";
    const term = searchTerm.toLowerCase();
    return (
      boardName.includes(term) ||
      title.includes(term) ||
      content.includes(term)
    );
  });

  // ─────────────────────────────────────────
  // (8) 최종 렌더링 (카드 UI)
  // ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <div className="max-w-[600px] mx-auto p-4 md:p-8">
        {/* (A) 상단 제목 */}
        <h1 className="text-3xl font-bold mb-8 text-gray-900">내 커뮤니티 게시글</h1>

        {/* (B) 검색창 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-lg mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="게시판명, 제목, 내용 검색"
              className="w-full px-4 py-3 bg-neutral-50/80 border border-neutral-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg
              className="w-5 h-5 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* (C) 목록 카드 스타일 */}
        {filtered.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg text-center">
            <svg
              className="w-16 h-16 text-gray-400 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-gray-500 text-lg">게시글이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((post) => {
              const boardName = post.boards?.name || "알 수 없음";
              const formatted = formatDate(post.created_at);

              return (
                <div
                  key={post.id}
                  onClick={() => handleCardClick(post)}
                  className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-all group"
                >
                  {/* (1) 상단: 게시판 이름 + 삭제 버튼 */}
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-medium text-orange-500">
                      {boardName}
                    </span>
                    <button
                      onClick={(e) => handleDelete(e, post)}
                      className="text-red-500 text-sm px-4 py-2 rounded-xl hover:bg-red-50 transition-colors"
                    >
                      삭제
                    </button>
                  </div>

                  {/* (2) 제목 */}
                  <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-orange-500 transition-colors">
                    {post.title || "(제목 없음)"}
                  </h2>

                  {/* (3) 날짜 */}
                  <div className="flex items-center text-sm text-gray-400">
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    {formatted}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}