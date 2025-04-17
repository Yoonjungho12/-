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

  // 댓글 수 조회
  const { count: commentCount } = await supabase
    .from('post_comments')
    .select('*', { count: 'exact' })
    .eq('post_id', postId);

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
  const { data: boardPosts, count: totalPosts } = await supabase
    .from('posts')
    .select(`
      id,
      title,
      created_at,
      user_id,
      profiles(nickname)
    `, { count: 'exact' })
    .eq('board_id', boardId)
    .eq('is_admitted', true)
    .neq('id', postId)
    .order('created_at', { ascending: false })
    .limit(20);

  // 페이지네이션 계산
  const totalPages = Math.ceil(totalPosts / 20);
  const currentPage = 1;
  const pageNumbers = [];
  const maxPageDisplay = 5;
  
  let startPage = Math.max(1, currentPage - Math.floor(maxPageDisplay / 2));
  let endPage = Math.min(totalPages, startPage + maxPageDisplay - 1);
  
  if (endPage - startPage + 1 < maxPageDisplay) {
    startPage = Math.max(1, endPage - maxPageDisplay + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      {/* 네비게이션 */}
      <div className="mb-6">
        <div className="text-sm text-gray-600 mb-6">
          <Link href="/community" className="hover:text-orange-500">커뮤니티</Link>
          <span className="mx-2">›</span>
          <span className="text-orange-500 font-medium">{boardName}</span>
        </div>
      </div>

      {/* 게시글 */}
      <div className="border-t-3 border-orange-500 border-black">
        <div className="border-t border-t-2 border-orange-500 py-3 px-4 border-b border-b-1 border-b-gray-300">
          <h1 className="font-bold mb-2">{postData.title}</h1>
          <div className="text-sm flex justify-between items-center">
            <div>
              <span className=''>{nickname}</span>
              <span className="mx-2 text-gray-300">|</span>
              <span>{dateStr}</span>
            </div>
            <div>
              <span>조회 {finalViews}</span>
            </div>
          </div>
        </div>
        <div
          className="prose max-w-none prose-img:float-right prose-img:ml-4 prose-img:block prose-img:max-w-full prose-img:h-auto px-4 py-8"
          dangerouslySetInnerHTML={{ __html: postData.content }}
        />
      </div>

      {/* 댓글 */}
      {boardInfo.id !== 1 && (
        <>
          <div className="mt-10">
            <h3 className="border-b-1 border-black border-gray-300 py-2">
              <span>전체 댓글</span>
              <span className="text-orange-500 ml-2">{commentCount}</span>
            </h3>
            {!commentList || commentList.length === 0 ? (
              <div className="py-4 text-center text-gray-500">
                등록된 댓글이 없습니다.
              </div>
            ) : (
              <div>
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
                    <div key={comment.id} className="border-b border-b-1 border-gray-300 py-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span>{cNick}</span>
                        <span className="text-gray-500">{cDateStr}</span>
                      </div>
                      <p>{comment.content}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="mt-4">
            <CommentForm postId={postData.id} />
          </div>
        </>
      )}

      {/* 목록 */}
      <div className="mt-10">
        <table className="w-full border-t border-gray-200">
          <thead>
            <tr className="bg-gray-50">
              <th className="py-1.5 w-16 text-center text-xs text-gray-500 border-b border-gray-200">번호</th>
              <th className="py-1.5 text-left text-xs text-gray-500 border-b border-gray-200">제목</th>
              <th className="py-1.5 w-24 text-center text-xs text-gray-500 border-b border-gray-200">글쓴이</th>
              <th className="py-1.5 w-20 text-center text-xs text-gray-500 border-b border-gray-200">날짜</th>
            </tr>
          </thead>
          <tbody>
            {!boardPosts || boardPosts.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-4 text-sm text-gray-500">
                  게시물이 없습니다.
                </td>
              </tr>
            ) : (
              boardPosts.map((bp, index) => {
                const bNick = bp.profiles?.nickname || '익명';
                const bDate = new Date(bp.created_at);
                const bDateStr = `${(bDate.getMonth()+1).toString().padStart(2,'0')}-${bDate
                  .getDate()
                  .toString()
                  .padStart(2,'0')}`;
                return (
                  <tr key={bp.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-1.5 text-center text-xs text-gray-600">{totalPosts - index}</td>
                    <td className="py-1.5">
                      <Link 
                        href={`/community/board/detail/${boardId}/${bp.id}`}
                        className="text-xs text-gray-900 hover:text-orange-500"
                      >
                        {bp.title}
                      </Link>
                    </td>
                    <td className="py-1.5 text-center text-xs text-gray-600">{bNick}</td>
                    <td className="py-1.5 text-center text-xs text-gray-500">{bDateStr}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {/* 페이지네이션 */}
        <div className="mt-10">
          <div className="flex justify-center space-x-2">
            <button className="px-3 py-1 text-xs text-gray-600 hover:text-orange-500">이전</button>
            <button className="px-3 py-1 text-xs bg-orange-500 text-white rounded">1</button>
            <button className="px-3 py-1 text-xs text-gray-600 hover:text-orange-500">다음</button>
          </div>
        </div>
      </div>
    </div>
  );
}