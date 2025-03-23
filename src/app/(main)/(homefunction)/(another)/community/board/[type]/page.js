import React from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import TrRow from "./TrRow"; // ★ 클라이언트 컴포넌트로 만들어 둔 행
// 테마 목록 등도 여기에 전부 선언할 수도 있지만,
// 아래 THEMES 상수를 넣으려면 'use client'가 붙으면 안 되므로 유의

// Supabase 클라이언트
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const revalidate = 0; // 페이지 요청마다 DB에서 새로 가져오도록(SEO 용)

// 페이지 컴포넌트 (서버 컴포넌트)
export default async function BoardPage({ params:param}) {
  // 1) URL 파라미터
  const params = await param;
  const decodedType = decodeURIComponent(params.type || "");

  // 2) 게시판 정보 매핑
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

  // 잘못된 게시판 처리
  if (boardInfo.id < 1) {
    return (
      <div className="p-5">
        <h2 className="text-xl font-bold mb-4">
          커뮤니티 &gt; {boardInfo.name}
        </h2>
        <p>유효하지 않은 게시판입니다.</p>
      </div>
    );
  }

  // 3) DB에서 게시글 목록 조회
  const { data: posts, error } = await supabase
    .from("posts")
    .select(
      `
        id,
        title,
        created_at,
        views,
        user_id,
        theme_id,
        is_admitted,
        profiles(nickname),
        post_comments(id)
      `
    )
    .eq("board_id", boardInfo.id)
    .eq("is_admitted", true) // 승인된 글만
    .order("created_at", { ascending: false });

  if (error) {
    console.error("게시글 목록 조회 오류:", error.message);
    return (
      <div className="p-5">
        <p>게시글 목록 로드 중 오류가 발생했습니다.</p>
        <p>{error.message}</p>
      </div>
    );
  }

  // 4) 렌더링 (SEO 문제 없음 - 서버에서 HTML을 만들어 제공)
  return (
    <div className="p-5 w-full max-w-5xl mx-auto">
      <h2 className="text-xl font-bold mb-4">
        커뮤니티 &gt; {boardInfo.name}
      </h2>

      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold">{boardInfo.name}</h2>
        <Link
          href={`/community/board/${decodedType}/write`}
          className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm"
        >
          글쓰기
        </Link>
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
          {!posts || posts.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-4 text-center text-gray-500">
                게시글이 없습니다.
              </td>
            </tr>
          ) : (
            posts.map((post) => (
              // ★ 행 하나당 TrRow 클라이언트 컴포넌트로 렌더
              <TrRow
                key={post.id}
                post={post}
                boardInfo={boardInfo}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}