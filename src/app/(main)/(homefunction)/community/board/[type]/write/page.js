"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';

// 1) Supabase 클라이언트 생성
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 테마 목록 상수
const THEMES = [
  { id: 0,  name: "전체",         sort_order: 0 },
  { id: 1,  name: "신규업체",     sort_order: 1 },
  { id: 19, name: "눈썹문신",     sort_order: 19 },
  { id: 20, name: "애견펜션",     sort_order: 20 },
  { id: 21, name: "사주",        sort_order: 21 },
  { id: 22, name: "타로",        sort_order: 22 },
  { id: 23, name: "아이폰-스냅",   sort_order: 23 },
  { id: 24, name: "웨딩플래너",   sort_order: 24 },
  { id: 25, name: "룸카페",      sort_order: 25 },
  { id: 26, name: "성인용품",    sort_order: 26 },
  { id: 27, name: "클럽",       sort_order: 27 },
  { id: 28, name: "나이트클럽",   sort_order: 28 },
  { id: 29, name: "네일샵",     sort_order: 29 },
  { id: 30, name: "애견미용",   sort_order: 30 },
  { id: 31, name: "태닝샵",     sort_order: 31 },
  { id: 32, name: "왁싱샵",     sort_order: 32 },
  { id: 33, name: "라운지바",   sort_order: 33 },
  { id: 34, name: "헌팅포차",   sort_order: 34 },
  { id: 35, name: "바",        sort_order: 35 },
  { id: 36, name: "감성주점",   sort_order: 36 },
];

export default function WritePage() {
  const router = useRouter();
  const { type } = useParams();
  const decodedType = decodeURIComponent(type || '');

  // 로그인된 사용자 ID를 저장할 상태
  const [userId, setUserId] = useState(null);

  // 글 제목, 내용 상태
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // 테마 선택 상태 (기본값: THEMES[0].id)
  const [theme, setTheme] = useState(THEMES[0].id);

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
        console.log('로그인이 필요합니다!');
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

      // 3) posts 테이블에 데이터 삽입 (theme_id에 선택한 theme 값 저장)
      const { data, error } = await supabase.from('posts').insert({
        board_id: boardTitle.id,
        user_id: userId,
        title: title,
        content: content,
        theme_id: theme,
      });

      if (error) {
        console.error('게시글 저장 오류:', error);
        alert('게시글 저장 중 오류가 발생했습니다!');
        return;
      }

      alert('글이 성공적으로 저장되었습니다!');
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
          {/* 테마 선택 */}
          {boardTitle.name === '방문후기' && (
            <tr className="border-b border-gray-300">
              <td className="w-24 p-2 bg-gray-100 align-middle">테마</td>
              <td className="p-2">
                <select
                  className="w-full border p-2 text-sm"
                  value={theme}
                  onChange={(e) => setTheme(Number(e.target.value))}
                >
                  {THEMES.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          )}
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