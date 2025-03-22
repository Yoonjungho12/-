// app/community/board/[board_id]/[post_id]/page.js

import React from 'react';
import { supabase } from '@/lib/supabaseE'; // Supabase 인스턴스
import CommentForm from './CommentForm';
import Link from 'next/link';

export const revalidate = 0; // SSR (매 요청 시 DB에서 다시 fetch)

// board_id ↔ 게시판 이름
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

export default async function PostDetailPage({ params: ParamsPromise }) {
  const params = await ParamsPromise;
  const boardId = parseInt(params.board_id, 10);
  const postId = parseInt(params.post_id, 10);

  if (isNaN(boardId) || isNaN(postId)) {
    return <div>잘못된 접근입니다.</div>;
  }

  // 게시판 이름 매핑
  const boardInfo = boardMap.find((b) => b.id === boardId);
  const boardName = boardInfo ? boardInfo.name : '알 수 없는 게시판';

  // 1) 현재 게시글 조회
  let { data: postData, error: postError } = await supabase
    .from('posts')
    .select(`
      id,
      board_id,
      title,
      content,
      created_at,
      user_id,
      views,    
      profiles(nickname)
    `)
    .eq('id', postId)
    .single();

  if (postError) {
    console.error('게시글 조회 오류:', postError.message);
    return <div>게시글 조회 중 오류가 발생했습니다.</div>;
  }
  if (!postData) {
    return <div>존재하지 않는 게시글입니다.</div>;
  }

  // 2) 조회수 1 증가 (중복 방지 없음: 모든 접속 시 +1)
  const currentViews = postData.views || 0;
  const { data: updatedPost, error: updateError } = await supabase
    .from('posts')
    .update({ views: currentViews + 1 })
    .eq('id', postId)
    .select()
    .single(); // 업데이트 후 변경된 레코드 반환

  if (updateError) {
    console.error('조회수 증가 오류:', updateError.message);
    // 조회수 증가가 실패하더라도, 게시글은 보여줍니다.
  }

  // 갱신된 조회수(업데이트 성공 시 updatedPost.views, 실패 시 기존값)
  const finalViews = updatedPost ? updatedPost.views : currentViews;

  // 작성자, 날짜 표시
  const nickname = postData.profiles?.nickname || '익명';
  const createdAt = new Date(postData.created_at);
  const dateStr = `${(createdAt.getMonth() + 1).toString().padStart(2, '0')}-${createdAt
    .getDate()
    .toString()
    .padStart(2, '0')} ${createdAt.getHours().toString().padStart(2, '0')}:${createdAt
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;

  // 3) (공지사항 제외) 댓글 목록 조회
  let commentList = [];
  if (boardInfo.id !== 1) {
    const { data: cList } = await supabase
      .from('post_comments')
      .select(`
        id,
        content,
        created_at,
        user_id,
        profiles(nickname)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: false });

    commentList = cList || [];
  }

  // 4) 동일 board의 다른 글 목록 (자기 자신 제외)
  const { data: boardPosts } = await supabase
    .from('posts')
    .select(`
      id,
      title,
      created_at,
      user_id,
      profiles(nickname)
    `)
    .eq('board_id', boardId)
    .neq('id', postId)
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* 경로 */}
      <p className="mb-3 text-gray-500 text-sm">
        커뮤니티 &gt; {boardName}
      </p>

      {/* 글 제목 + 작성 정보 */}
      <h1 className="text-xl font-bold mb-1">{postData.title}</h1>
      <div className="bg-gray-50 p-2 mb-4 border-t-[0.5px] border-b-[0.5px] border-black flex justify-between items-center">
        <div className="text-sm text-gray-600">
          글쓴이: {nickname}&nbsp;&nbsp;    | &nbsp;&nbsp;  작성일: {dateStr}&nbsp;&nbsp;   | &nbsp;&nbsp;  조회: {finalViews}
        </div>
      </div>

      {/* 본문 */}
      <div className="mb-8 leading-relaxed whitespace-pre-wrap mt-5">
        {postData.content}
      </div>

      {/* 댓글 (공지사항이면 X) */}
      {boardInfo.id !== 1 && (
        <>
          <section className="mb-6">
            <h2 className="text-lg font-bold mb-3">댓글</h2>
            {!commentList || commentList.length === 0 ? (
              <p className="text-sm text-gray-500">등록된 댓글이 없습니다.</p>
            ) : (
              <div className="space-y-4">
                {commentList.map((comment) => {
                  const cNick = comment.profiles?.nickname || '익명';
                  const cDateObj = new Date(comment.created_at);
                  const cDateStr = `${(cDateObj.getMonth() + 1)
                    .toString()
                    .padStart(2, '0')}-${cDateObj
                    .getDate()
                    .toString()
                    .padStart(2, '0')}`;
                  return (
                    <div
                      key={comment.id}
                      className="bg-white rounded-lg shadow p-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-gray-800 text-sm">
                          {cNick}
                        </span>
                        <span className="text-xs text-gray-400">{cDateStr}</span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
          <CommentForm postId={postData.id} />
        </>
      )}

      {/* 하단 목록 (동일 board, 자기 글 제외) */}
      <section className="mt-10">
        <h2 className="text-lg font-bold mb-3">글 목록</h2>
        {!boardPosts || boardPosts.length === 0 ? (
          <p className="text-sm text-gray-500">게시물이 없습니다.</p>
        ) : (
          <table className="w-full text-sm border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 w-16 border-b border-gray-300 text-center">번호</th>
                <th className="p-2 border-b border-gray-300 text-left">제목</th>
                <th className="p-2 w-28 border-b border-gray-300 text-center">글쓴이</th>
                <th className="p-2 w-28 border-b border-gray-300 text-center">날짜</th>
              </tr>
            </thead>
            <tbody>
              {(boardPosts || []).map((bp) => {
                const bNick = bp.profiles?.nickname || '익명';
                const bDate = new Date(bp.created_at);
                const bDateStr = `${(bDate.getMonth()+1).toString().padStart(2,'0')}-${bDate
                  .getDate()
                  .toString()
                  .padStart(2,'0')}`;
                return (
                  <tr key={bp.id} className="border-b border-gray-200">
                    <td className="p-2 text-center">{bp.id}</td>
                    <td className="p-2">
                      <Link
                        href={`/community/board/${boardId}/${bp.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        {bp.title}
                      </Link>
                    </td>
                    <td className="p-2 text-center">{bNick}</td>
                    <td className="p-2 text-center">{bDateStr}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}