// app/community/board/[type]/page.js

import React from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import WriteButton from './WriteButton'; // 클라이언트 컴포넌트 (버튼)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const revalidate = 0;

export default async function BoardPage({ params: ParamsPromise }) {
  const params = await ParamsPromise;
  const decodedType = decodeURIComponent(params.type);

  // board_id 매핑
  let boardInfo = { name: '', id: 0 };
  switch (decodedType) {
    case '공지사항':
      boardInfo = { name: '공지사항', id: 1 };
      break;
    case '가입인사':
      boardInfo = { name: '가입인사', id: 2 };
      break;
    case '방문후기':
      boardInfo = { name: '방문후기', id: 3 };
      break;
    case '자유게시판':
      boardInfo = { name: '자유게시판', id: 4 };
      break;
    case '유머게시판':
      boardInfo = { name: '유머게시판', id: 5 };
      break;
    case '질문답변':
      boardInfo = { name: '질문답변', id: 6 };
      break;
    case '제휴업체 SNS':
      boardInfo = { name: '제휴업체 SNS', id: 7 };
      break;
    case '맛집/핫플/데이트 코스 공유':
      boardInfo = { name: '맛집/핫플/데이트 코스 공유', id: 8 };
      break;
    default:
      boardInfo = { name: '알 수 없는 게시판', id: -1 };
  }

  if (boardInfo.id < 1) {
    return (
      <div className="p-5">
        <p className="mb-5 text-xl font-bold">커뮤니티 &gt; {boardInfo.name}</p>
        <p>유효하지 않은 게시판입니다.</p>
      </div>
    );
  }

  // 게시글 목록
  const { data: postList, error } = await supabase
    .from('posts')
    .select(`
      id,
      title,
      created_at,
      views,
      user_id,
      profiles(nickname),
      post_comments(id)
    `)
    .eq('board_id', boardInfo.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('게시글 목록 조회 오류:', error.message);
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

      {/* 글쓰기 버튼 (공지사항이면 숨김 / 제휴업체 SNS는 별도 로직) */}
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-lg font-semibold">{boardInfo.name}</h2>
        {/* 공지사항(id=1)은 아예 미표시,
            제휴업체 SNS(id=7)는 클라이언트 컴포넌트 WriteButton 사용,
            그 외에는 기존처럼 바로 Link */}
        {boardInfo.id === 1 ? null : boardInfo.id === 7 ? (
          <WriteButton boardId={boardInfo.id} decodedType={decodedType} />
        ) : (
          <Link
            href={`/community/board/${decodedType}/write`}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          >
            글쓰기
          </Link>
        )}
      </div>

      {/* 테이블 */}
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