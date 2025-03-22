// app/community/board/[type]/page.js (서버 컴포넌트 예시)
import React from "react";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import WriteButton from "./WriteButton"; // 클라이언트 컴포넌트 (버튼)

// Supabase 클라이언트 생성
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 테마 목록 상수
const THEMES = [
  { id: 0,  name: "전체",       sort_order: 0 },
  { id: 1,  name: "신규업체",   sort_order: 1 },
  { id: 19, name: "눈썹문신",   sort_order: 19 },
  { id: 20, name: "애견펜션",   sort_order: 20 },
  { id: 21, name: "사주",      sort_order: 21 },
  { id: 22, name: "타로",      sort_order: 22 },
  { id: 23, name: "아이폰-스냅", sort_order: 23 },
  { id: 24, name: "웨딩플래너", sort_order: 24 },
  { id: 25, name: "룸카페",    sort_order: 25 },
  { id: 26, name: "성인용품",  sort_order: 26 },
  { id: 27, name: "클럽",     sort_order: 27 },
  { id: 28, name: "나이트클럽", sort_order: 28 },
  { id: 29, name: "네일샵",   sort_order: 29 },
  { id: 30, name: "애견미용", sort_order: 30 },
  { id: 31, name: "태닝샵",   sort_order: 31 },
  { id: 32, name: "왁싱샵",   sort_order: 32 },
  { id: 33, name: "라운지바", sort_order: 33 },
  { id: 34, name: "헌팅포차", sort_order: 34 },
  { id: 35, name: "바",      sort_order: 35 },
  { id: 36, name: "감성주점", sort_order: 36 },
];

// revalidate = 0 → ISR(Incremental Static Regeneration) 비활성화
export const revalidate = 0;

// Next.js 13 App Router 서버 컴포넌트
// `params`: URL 파라미터, `searchParams`: 쿼리 문자열
export default async function BoardPage({ params, searchParams }) {
  // URL 파라미터 (예: /community/board/방문후기)
  const decodedType = decodeURIComponent(params.type);

  // board_id 매핑
  let boardInfo = { name: "", id: 0 };
  switch (decodedType) {
    case "공지사항":
      boardInfo = { name: "공지사항", id: 1 };
      break;
    case "가입인사":
      boardInfo = { name: "가입인사", id: 2 };
      break;
    case "방문후기":
      boardInfo = { name: "방문후기", id: 3 };
      break;
    case "자유게시판":
      boardInfo = { name: "자유게시판", id: 4 };
      break;
    case "유머게시판":
      boardInfo = { name: "유머게시판", id: 5 };
      break;
    case "질문답변":
      boardInfo = { name: "질문답변", id: 6 };
      break;
    case "제휴업체 SNS":
      boardInfo = { name: "제휴업체 SNS", id: 7 };
      break;
    case "맛집/핫플/데이트 코스 공유":
      boardInfo = { name: "맛집/핫플/데이트 코스 공유", id: 8 };
      break;
    default:
      boardInfo = { name: "알 수 없는 게시판", id: -1 };
  }

  // 유효하지 않은 게시판
  if (boardInfo.id < 1) {
    return (
      <div className="p-5">
        <p className="mb-5 text-xl font-bold">
          커뮤니티 &gt; {boardInfo.name}
        </p>
        <p>유효하지 않은 게시판입니다.</p>
      </div>
    );
  }

  // ★ 테마 선택 (방문후기일 때만 적용) → searchParams.theme으로 필터링
  let themeParam = "0"; // 기본값: 전체
  if (searchParams && searchParams.theme) {
    themeParam = searchParams.theme;
  }

  // posts 조회 쿼리
  let query = supabase
    .from("posts")
    .select(`
      id,
      title,
      created_at,
      views,
      user_id,
      theme_id,
      is_admitted,
      profiles(nickname),
      post_comments(id)
    `)
    .eq("board_id", boardInfo.id)
    .eq("is_admitted", true)  // <= ★ 추가: 승인된 글(is_admitted=true)만 조회
    .order("created_at", { ascending: false });

  // themeParam != "0" 이면 theme_id 필터 (방문후기)
  if (boardInfo.name === "방문후기" && themeParam !== "0") {
    query = query.eq("theme_id", Number(themeParam));
  }

  // 게시글 목록 로드
  const { data: postList, error } = await query;

  if (error) {
    console.error("게시글 목록 조회 오류:", error.message);
    return (
      <div className="p-5">
        <p>게시글 목록 로드 중 오류가 발생했습니다.</p>
        <p>{error.message}</p>
      </div>
    );
  }

  const posts = postList || [];

  return (
    <div className="p-5 w-full max-w-5xl mx-auto">
      {/* 상단 제목 */}
      <p className="mb-5 text-xl font-bold">
        커뮤니티 &gt; {boardInfo.name}
      </p>

      {/* 테마 필터 영역 (방문후기 게시판에서만 노출) */}
      {boardInfo.name === "방문후기" && (
        <form method="GET" className="mb-4 flex items-center gap-2">
          <label htmlFor="themeSelect" className="text-sm">
            테마선택:
          </label>
          <select
            id="themeSelect"
            name="theme"
            defaultValue={themeParam}
            className="border p-1 text-sm"
          >
            {THEMES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="px-3 py-1 bg-orange-500 text-white rounded text-sm hover:bg-orange-600"
          >
            필터 적용
          </button>
        </form>
      )}

      {/* 글쓰기 버튼 (공지사항이면 숨김 / 제휴업체 SNS는 WriteButton, 그 외 Link) */}
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold">{boardInfo.name}</h2>
        {boardInfo.id === 1 ? null : boardInfo.id === 7 ? (
          <WriteButton boardId={boardInfo.id} decodedType={decodedType} />
        ) : (
          <Link
            href={`/community/board/${decodedType}/write`}
            className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm"
          >
            글쓰기
          </Link>
        )}
      </div>

      {/* 게시글 목록 테이블 */}
      <table className="w-full border border-gray-300 text-sm">
        <thead className="bg-gray-100 border-b border-gray-300">
          <tr>
            <th className="p-2 w-16 text-center">번호</th>
            <th className="p-2 text-left">제목</th>
            <th className="p-2 w-20 text-center">글쓴이</th>
            <th className="p-2 w-20 text-center">날짜</th>
            <th className="p-2 w-16 text-center">조회</th>
          </tr>
        </thead>
        <tbody>
          {posts.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-4 text-center text-gray-500">
                게시글이 없습니다.
              </td>
            </tr>
          ) : (
            posts.map((post) => {
              // 닉네임
              const nickname = post.profiles?.nickname || "익명";

              // 날짜 포맷
              const dateObj = new Date(post.created_at);
              const now = new Date();
              let formattedDate;
              if (dateObj.getFullYear() === now.getFullYear()) {
                const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
                const dd = String(dateObj.getDate()).padStart(2, "0");
                formattedDate = `${mm}-${dd}`;
              } else {
                formattedDate = dateObj.toISOString().split("T")[0];
              }

              const commentCount = post.post_comments
                ? post.post_comments.length
                : 0;
              const views = post.views || 0;

              return (
                <tr key={post.id} className="border-b border-gray-200">
                  <td className="p-2 text-center">{post.id}</td>
                  <td className="p-2">
                    <Link
                      href={`/community/board/detail/${boardInfo.id}/${post.id}`}
                      className="hover:underline hover:text-blue-700"
                    >
                      {post.title}
                    </Link>
                    {commentCount > 0 && (
                      <span className="text-orange-500 text-xs ml-2">
                        {commentCount}
                      </span>
                    )}
                    {/* 방문후기인 경우, theme_id 표시 (테마 이름) */}
                    {boardInfo.name === "방문후기" && post.theme_id ? (
                      <span className="ml-2 text-xs text-gray-500">
                        {`[${
                          THEMES.find((t) => t.id === post.theme_id)?.name ||
                          "기타"
                        }]`}
                      </span>
                    ) : null}
                  </td>
                  <td className="p-2 text-center">{nickname}</td>
                  <td className="p-2 text-center">{formattedDate}</td>
                  <td className="p-2 text-center">{views}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}