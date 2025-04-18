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
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="text-center space-y-2 mb-8">
          <h1 className="text-2xl font-bold text-gray-900">커뮤니티</h1>
          <p className="text-gray-500">다양한 주제로 자유롭게 소통해보세요</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boardPostsArray.map((boardItem) => (
            <div key={boardItem.id} className="group">
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 h-full">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Link
                      href={`/community/board/${encodeURIComponent(boardItem.name)}`}
                      className="flex items-center gap-2 group-hover:text-orange-500 transition-colors"
                    >
                      {boardItem.icon && (
                        <boardItem.icon className="w-5 h-5 text-orange-500" />
                      )}
                      <h2 className="text-lg font-bold text-gray-900 group-hover:text-orange-500 transition-colors">
                        {boardItem.name}
                      </h2>
                    </Link>
                    <Link
                      href={`/community/board/${encodeURIComponent(boardItem.name)}`}
                      className="text-sm text-gray-500 hover:text-orange-500 transition-colors"
                    >
                      더보기 →
                    </Link>
                  </div>

                  <div className="space-y-3">
                    {boardItem.posts.length === 0 ? (
                      <div className="text-center py-6">
                        <div className="text-gray-400 text-sm">게시글이 없습니다.</div>
                      </div>
                    ) : (
                      boardItem.posts.map((post) => {
                        const commentCount = post.post_comments?.[0]?.count || 0;
                        const date = new Date(post.created_at);
                        const formattedDate = `${(date.getMonth() + 1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')}`;
                        
                        return (
                          <Link
                            key={post.id}
                            href={`/community/board/detail/${boardItem.id}/${post.id}`}
                            className="block p-3 rounded-xl hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h3 className="text-sm font-medium text-gray-900 truncate">
                                  {post.title}
                                </h3>
                                {commentCount > 0 && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-600 ml-2">
                                    {commentCount}
                                  </span>
                                )}
                              </div>
                              <div className="ml-3 flex-shrink-0">
                                <span className="text-xs text-gray-400">
                                  {formattedDate}
                                </span>
                              </div>
                            </div>
                          </Link>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}