'use client';
import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import {supabase} from '../lib/supabaseF';
import { useRouter } from "next/navigation";
export default function LoginPage() {
  // 폼 상태
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 에러 메시지 (예: 계정 오류 정보)
  const [errorMessage, setErrorMessage] = useState('');
  const router = useRouter();
  // 로그인 버튼 클릭 시
  const handleLogin = async () => {
    setErrorMessage(''); // 초기화
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setErrorMessage(error.message);
        return;
      }
      // 로그인 성공 시 페이지 이동 등 처리
   
      // 예: 라우터로 메인 페이지 이동, etc.
      router.push('/');
    } catch (err) {
      setErrorMessage(err.message || '로그인 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-100 flex items-center justify-center">
      {/* 흰색 박스 */}
      <div className="w-full max-w-sm rounded-md bg-white p-6 shadow">
        {/* 로고 영역 */}
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-red-500">
            VIP info
            <span className="ml-1 text-base font-normal text-green-600">
              VIP 건마
            </span>
          </h1>
        </div>

        {/* 입력 폼 */}
        <div className="space-y-4">
          {/* 아이디(이메일) 입력 */}
          <input
            type="text"
            placeholder="아이디"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          {/* 비밀번호 입력 */}
          <input
            type="password"
            placeholder="비밀번호"
            className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* 계정 오류 정보 (빨간색 문구) */}
          {errorMessage && (
            <div className="flex items-center text-xs text-red-500">
              {/* 예시 아이콘 (느낌표 등) */}
              <svg
                className="mr-1 h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.506 0 
                     2.598-1.445 2.076-2.88l-2.928-8A2 2 0 0016.07 
                     6H7.93a2 2 0 00-1.9 1.37l-2.928 8c-.522 
                     1.435.57 2.88 2.076 2.88z"
                />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 아이디/비밀번호 찾기 */}
          <div className="flex justify-end">
            <button className="text-xs text-gray-500 hover:text-red-500">
              아이디/비밀번호 찾기
            </button>
          </div>

          {/* 로그인 버튼 */}
          <button
            className="w-full rounded bg-red-500 py-2 text-sm font-medium text-white hover:bg-red-600"
            onClick={handleLogin}
          >
            로그인
          </button>

          {/* 소셜 로그인 (네이버 / 카카오) */}
          <div className="flex items-center justify-center space-x-3">
            <button className="flex items-center space-x-1 rounded bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700">
              {/* 네이버 아이콘 (예시) */}
              <svg
                className="h-4 w-4"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M0 0h24v24H0z" fill="none" />
                <path d="M3 3h18v18H3V3z" />
              </svg>
              <span>네이버 로그인</span>
            </button>
            <button className="flex items-center space-x-1 rounded bg-yellow-300 px-3 py-2 text-sm font-medium text-gray-800 hover:bg-yellow-400">
              {/* 카카오 아이콘 (예시) */}
              <svg
                className="h-4 w-4"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M0 0h24v24H0z" fill="none" />
                <path d="M3 3h18v18H3V3z" />
              </svg>
              <span>카카오 로그인</span>
            </button>
          </div>

          {/* 간편 계정 가입 */}
  <div className="mt-2 text-center">
  <Link href="/signup" className="text-sm text-red-500 hover:underline">
    간편 계정 가입
  </Link>
</div>
        </div>
      </div>
    </div>
  );
}