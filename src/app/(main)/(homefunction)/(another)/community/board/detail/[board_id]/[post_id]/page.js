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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* 네비게이션 */}
        <div className="mb-8">
          <nav className="flex items-center text-sm text-gray-600">
            <Link href="/community" className="hover:text-orange-500 transition-colors">커뮤니티</Link>
            <svg className="w-4 h-4 mx-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <Link href={`/community/board/${boardName}`} className="hover:text-orange-500 transition-colors">
              {boardName}
            </Link>
            <svg className="w-4 h-4 mx-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-orange-500 font-medium truncate max-w-[200px]">{postData.title}</span>
          </nav>
        </div>

        {/* 게시글 */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8">
          <div className="p-6 border-b border-gray-100">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{postData.title}</h1>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4 text-gray-600">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>{nickname}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{dateStr}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-gray-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>조회 {finalViews}</span>
              </div>
            </div>
          </div>
          <div
            className="prose max-w-none prose-img:float-right prose-img:ml-4 prose-img:block prose-img:max-w-full prose-img:h-auto p-6"
            dangerouslySetInnerHTML={{ __html: postData.content }}
          />
        </div>

        {/* 댓글 */}
        {boardInfo.id !== 1 && (
          <>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-8">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">댓글</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500">전체</span>
                    <span className="text-sm font-medium text-orange-500">{commentCount}</span>
                  </div>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {!commentList || commentList.length === 0 ? (
                  <div className="p-6 text-center">
                    <div className="text-gray-400 text-sm">등록된 댓글이 없습니다.</div>
                  </div>
                ) : (
                  commentList.map((comment) => {
                    const cNick = comment.profiles?.nickname || '익명';
                    const cDateObj = new Date(comment.created_at);
                    const cDateStr = `${(cDateObj.getMonth() + 1).toString().padStart(2, '0')}-${cDateObj
                      .getDate()
                      .toString()
                      .padStart(2, '0')}`;
                    return (
                      <div key={comment.id} className="p-6">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900">{cNick}</span>
                            <span className="text-xs text-gray-400">{cDateStr}</span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 whitespace-pre-wrap">{comment.content}</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
            <CommentForm postId={postData.id} />
          </>
        )}

        {/* 목록 */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900">같은 게시판의 다른 글</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="py-4 w-16 text-center text-xs font-medium text-gray-500">번호</th>
                  <th className="py-4 text-left text-xs font-medium text-gray-500">제목</th>
                  <th className="py-4 w-24 text-center text-xs font-medium text-gray-500">글쓴이</th>
                  <th className="py-4 w-20 text-center text-xs font-medium text-gray-500">날짜</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {!boardPosts || boardPosts.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center py-12">
                      <div className="text-gray-400 text-sm">게시물이 없습니다.</div>
                    </td>
                  </tr>
                ) : (
                  boardPosts.map((bp, index) => {
                    const bNick = bp.profiles?.nickname || '익명';
                    const bDate = new Date(bp.created_at);
                    const bDateStr = `${(bDate.getMonth() + 1).toString().padStart(2, '0')}-${bDate
                      .getDate()
                      .toString()
                      .padStart(2, '0')}`;
                    return (
                      <tr key={bp.id} className="group hover:bg-gray-50 transition-colors">
                        <td className="py-4 text-center">
                          <div className="text-sm text-gray-600">{totalPosts - index}</div>
                        </td>
                        <td className="py-4">
                          <Link
                            href={`/community/board/detail/${boardId}/${bp.id}`}
                            className="text-sm text-gray-900 group-hover:text-orange-500 transition-colors truncate block"
                          >
                            {bp.title}
                          </Link>
                        </td>
                        <td className="py-4 text-center">
                          <div className="text-sm text-gray-600">{bNick}</div>
                        </td>
                        <td className="py-4 text-center">
                          <div className="text-sm text-gray-500">{bDateStr}</div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {/* 페이지네이션 */}
          <div className="p-6 border-t border-gray-100">
            <div className="flex justify-center gap-1">
              <button className="px-4 py-2 text-sm text-gray-600 hover:text-orange-500 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button className="px-4 py-2 text-sm bg-orange-500 text-white rounded-lg">1</button>
              <button className="px-4 py-2 text-sm text-gray-600 hover:text-orange-500 transition-colors">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}