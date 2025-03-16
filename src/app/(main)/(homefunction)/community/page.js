// app/page.jsx

import React from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

// Supabase 서버 컴포넌트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// board_id와 이름 매핑 (8개)
const boardMap = [
  { id: 1, name: '공지사항' },
  { id: 2, name: '가입인사' },
  { id: 3, name: '방문후기' },
  { id: 4, name: '자유게시판' },
  { id: 5, name: '유머게시판' },
  { id: 6, name: '질문답변' },
  { id: 7, name: '제휴업체 SNS' },
  { id: 8, name: '맛집/핫플/데이트 코스 공유' },
];

// Next.js가 매 요청마다 DB 쿼리를 실행하도록 (정적 캐시X)
export const revalidate = 0;

export default async function MainPage() {
  // 8개 게시판 각각에서 최신 5개 게시글 (+ 댓글 수)
  // post_comments(id) => 댓글 배열, 길이 = 댓글 수
  const boardPostsArray = await Promise.all(
    boardMap.map(async (board) => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          post_comments(id)
        `)
        .eq('board_id', board.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error(`게시글 조회 오류 (board_id=${board.id}):`, error.message);
        return { ...board, posts: [] };
      }
      // data = [{ id:..., title:..., post_comments: [ { id:... }, ... ] }, ...]
      return { ...board, posts: data || [] };
    })
  );

  return (
    <main className="max-w-7xl mx-auto p-4 mt-1 md:mt-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-6">
        {boardPostsArray.map((boardItem) => (
          <div key={boardItem.id} className="my-5">
            {/* 게시판 제목 + 더보기 링크 */}
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-bold">{boardItem.name}</h2>
              {/* 전체 게시판으로 이동 */}
              <Link
                href={`/community/board/${encodeURIComponent(boardItem.name)}`}
                className="text-sm text-red-600"
              >
                더보기 &gt;
              </Link>
            </div>

            {/* 구분선 */}
            <div className="border-t border-gray-300 mb-3" />

            {/* 글 목록 */}
            {boardItem.posts.length === 0 ? (
              <p className="text-sm text-gray-500">게시글이 없습니다.</p>
            ) : (
              <ul className="list-disc marker:text-red-500 ml-4 text-sm space-y-1">
                {boardItem.posts.map((post) => {
                  const commentCount = post.post_comments
                    ? post.post_comments.length
                    : 0;
                  return (
                    <li key={post.id}>
                      {/* 게시글 상세보기 링크 */}
                      <Link
                        href={`/community/board/detail/${boardItem.id}/${post.id}`}
                        className="hover:underline"
                      >
                        {post.title}
                      </Link>
                      {/* 댓글 수가 1 이상이면 주황색 숫자 표시, 0이면 표시 X */}
                      {commentCount > 0 && (
                        <span className="text-orange-500 text-xs ml-2">
                          {commentCount}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}