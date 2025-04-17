import React from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { 
  MegaphoneIcon, 
  UserGroupIcon,
  ChatBubbleLeftRightIcon,
  FaceSmileIcon,
  QuestionMarkCircleIcon,
  BuildingStorefrontIcon,
  MapIcon
} from '@heroicons/react/24/outline';

// Supabase 서버 컴포넌트 설정
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// board_id와 이름 매핑
const boardMap = [
  { id: 1, name: '공지사항', icon: MegaphoneIcon },
  { id: 2, name: '가입인사', icon: UserGroupIcon },
  { id: 3, name: '방문후기', icon: ChatBubbleLeftRightIcon },
  { id: 4, name: '자유게시판', icon: FaceSmileIcon },
  { id: 5, name: '유머게시판', icon: FaceSmileIcon },
  { id: 6, name: '질문답변', icon: QuestionMarkCircleIcon },
  { id: 7, name: '제휴업체 SNS', icon: BuildingStorefrontIcon },
  { id: 8, name: '맛집/핫플/데이트 코스 공유', icon: MapIcon },
];

// Next.js가 매 요청마다 DB 쿼리를 실행하도록 (정적 캐시X)
export const revalidate = 0;

export default async function MainPage() {
  const boardPostsArray = await Promise.all(
    boardMap.map(async (board) => {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          created_at,
          post_comments:post_comments(count)
        `)
        .eq('board_id', board.id)
        .eq('is_admitted', true)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) {
        console.error(`게시글 조회 오류 (board_id=${board.id}):`, error.message);
        return { ...board, posts: [] };
      }
      return { ...board, posts: data || [] };
    })
  );

  return (
    <main className="max-w-7xl mx-auto p-0 md:p-4 mt-1 md:mt-10">
      <div className="flex flex-wrap md:-mx-2 gap-y-4">
        {boardPostsArray.map((boardItem) => (
          <div key={boardItem.id} className="w-full md:w-1/2 lg:w-1/3 md:px-2 mb-6">
            <div className="bg-white md:rounded md:border md:border-gray-200 md:shadow-sm md:hover:shadow-md md:transition-all md:duration-200 md:p-4 h-full">
              <div className="flex items-center bg-zinc-50 md:bg-white justify-between border-b-2 border-orange-500 p-1 md:pb-2 px-2 md:px-0">
                <Link
                  href={`/community/board/${encodeURIComponent(boardItem.name)}`}
                  className="text-base font-bold text-orange-500 md:text-gray-900 hover:text-orange-500 flex items-center gap-1"
                >
                  {boardItem.icon && (
                    <boardItem.icon className="w-5 h-5 text-orange-500 md:text-orange-500" />
                  )}
                  {boardItem.name}
                </Link>
                <Link
                  href={`/community/board/${encodeURIComponent(boardItem.name)}`}
                  className="text-xs text-gray-500 hover:text-orange-500"
                >
                  더보기 +
                </Link>
              </div>
              <div className="px-1 md:px-2 md:px-0 mt-2">
                {boardItem.posts.length === 0 ? (
                  <div className="text-gray-400 text-center py-4 text-sm">게시글이 없습니다.</div>
                ) : (
                  <table className="w-full">
                    <colgroup>
                      <col className="w-auto"/>
                      <col className="w-14 hidden md:table-column"/>
                    </colgroup>
                    <tbody className="divide-y divide-gray-200">
                      {boardItem.posts.map((post) => {
                        const commentCount = post.post_comments?.[0]?.count || 0;
                        const date = new Date(post.created_at);
                        const formattedDate = `${(date.getMonth() + 1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')}`;
                        return (
                          <tr key={post.id} className="hover:bg-gray-50">
                            <td className="py-1">
                              <Link
                                href={`/community/board/detail/${boardItem.id}/${post.id}`}
                                className="text-sm text-gray-900 hover:text-orange-500 truncate block"
                              >
                                {post.title}
                                {commentCount > 0 && (
                                  <span className="text-orange-500 ml-1">[{commentCount}]</span>
                                )}
                              </Link>
                            </td>
                            <td className="py-1 text-[11px] text-gray-400 text-center border-l border-gray-200 hidden md:table-cell">{formattedDate}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}