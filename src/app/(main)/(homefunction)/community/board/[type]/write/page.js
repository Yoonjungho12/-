'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

// 1) Supabase 클라이언트 생성
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function WritePage() {
  const router = useRouter();
  const { type } = useParams();
  const decodedType = decodeURIComponent(type || '');

  // 로그인된 사용자 ID를 저장할 상태
  const [userId, setUserId] = useState(null);

  // 글 제목, 내용 상태
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // 게시판 타입별 ID와 이름 매핑
  let boardTitle = { name: '', id: 0 };
  switch (decodedType) {
    case '공지사항':
      boardTitle = { name: '공지사항', id: 1 };
      break;
    case '가입인사':
      boardTitle = { name: '가입인사', id: 2 };
      break;
    case '방문후기':
      boardTitle = { name: '방문후기', id: 3 };
      break;
    case '자유게시판':
      boardTitle = { name: '자유게시판', id: 4 };
      break;
    case '유머게시판':
      boardTitle = { name: '유머게시판', id: 5 };
      break;
    case '질문답변':
      boardTitle = { name: '질문답변', id: 6 };
      break;
    case '제휴업체':
      boardTitle = { name: '제휴업체 SNS', id: 7 };
      break;
    case '코스공유':
      boardTitle = { name: '맛집/핫플/데이트 코스 공유', id: 8 };
      break;
    default:
      boardTitle = { name: '알 수 없는 게시판', id: -1 };
      break;
  }

  // 2) 컴포넌트 마운트 시점에 세션(로그인 유저 ID) 로드
  useEffect(() => {
    async function fetchSession() {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error('세션 불러오기 오류:', error);
        return;
      }
      const currentUserId = data.session?.user?.id;
      if (!currentUserId) {
        // 로그인 안 된 경우 처리
        console.log('로그인 안 됨!');
      } else {
        console.log('로그인 사용자 ID:', currentUserId);
        setUserId(currentUserId);
      }
    }
    fetchSession();
  }, []);

  // "글 저장" 버튼 클릭
  const handleSave = async () => {
    try {
      // userId가 아직 없으면 로그인 필요
      if (!userId) {
        alert('로그인이 필요합니다!');
        return;
      }

      // 3) posts 테이블에 데이터 삽입
      const { data, error } = await supabase.from('posts').insert({
        board_id: boardTitle.id,
        user_id: userId,
        title: title,
        content: content,
      });

      if (error) {
        console.error('게시글 저장 오류:', error);
        alert('게시글 저장 중 오류가 발생했습니다!');
        return;
      }

      alert('글이 성공적으로 저장되었습니다!');
      // ex) router.push(`/community/board/${type}`) 등으로 이동
      router.push('/community');
    } catch (err) {
      console.error('에러 발생:', err);
      alert('알 수 없는 오류가 발생했습니다!');
    }
  };

  // "목록" 버튼 클릭
  const handleList = () => {
    router.push('/community');
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* 게시판 이름 표기 */}
      <h2 className="mb-3 mt-3 md:mb-5">
        커뮤니티 {'>'} {boardTitle.name}
      </h2>

      <h1 className="text-xl font-bold mb-4">글쓰기</h1>

      <table className="w-full border-t border-b border-gray-300 mb-4 text-sm">
        <tbody>
          <tr className="border-b border-gray-300">
            <td className="w-24 p-2 bg-gray-100 align-middle">제목</td>
            <td className="p-2">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border p-2 text-sm"
                placeholder="제목을 입력하세요"
              />
            </td>
          </tr>
          <tr>
            <td className="w-24 p-2 bg-gray-100 align-top">내용</td>
            <td className="p-2">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full border p-2 text-sm"
                rows={10}
                placeholder="내용을 입력하세요"
              />
            </td>
          </tr>
        </tbody>
      </table>

      <div className="flex gap-2 justify-end">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
        >
          작성
        </button>
        <button
          onClick={handleList}
          className="px-4 py-2 bg-gray-300 text-sm rounded hover:bg-gray-400"
        >
          목록
        </button>
      </div>
    </div>
  );
}