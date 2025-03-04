"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import {supabase} from "../lib/supabaseF";
import { useRouter } from "next/router";
export default function NavBar() {
  const [session, setSession] = useState(null);
    const router = useRouter();
  useEffect(() => {
    // 현재 세션 가져오기
    const currentSession = supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    // 세션 변경 감지 (로그인/로그아웃 시)
    const {
      data: authListener,
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    // cleanup
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // session이 있으면 로그인 상태, 없으면 비로그인 상태
  const isLoggedIn = !!session;

  // 로그아웃 처리
const handleLogout = async () => {
  await supabase.auth.signOut();

  // 라우터 이동 (원하면)
  router.push('/');
};

  return (
    <header className="w-full border-b border-gray-200 bg-white">
      {/* 상단 가로줄 (PC) */}
      <div className="mx-auto hidden max-w-7xl items-center justify-between px-6 py-3 md:flex">
        {/* 왼쪽 로고 */}
        <div className="flex items-center space-x-2 text-2xl font-bold text-red-500">
          <span>VIP info</span>
          <span className="text-base font-normal text-green-600">VIP 건마</span>
        </div>

        {/* 가운데 검색창 */}
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="지역, 업종, 상호명 검색하세요"
            className="w-full rounded-full border border-red-300 py-3 pl-6 pr-14 text-base focus:outline-none focus:ring-2 focus:ring-red-400"
          />
          {/* 돋보기 아이콘 */}
          <svg
            className="absolute right-4 top-1/2 h-6 w-6 -translate-y-1/2 text-red-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>

        {/* 오른쪽 아이콘들 */}
        <div className="flex items-center space-x-7">
          {isLoggedIn ? (
            /* 로그인 후 UI */
            <>
              {/* 로그아웃 아이콘 */}
              <div
                className="flex cursor-pointer flex-col items-center text-gray-600 hover:text-red-500"
                onClick={handleLogout}
              >
                <svg
                  className="mb-1.5 h-7 w-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0013.5 
                      3h-7.5A2.25 2.25 0 003.75 5.25v13.5
                      A2.25 2.25 0 006 21h7.5a2.25 2.25
                      0 002.25-2.25V15"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 9l6 3-6 3V9z"
                  />
                </svg>
                <span className="text-sm">로그아웃</span>
              </div>

              {/* 나의활동 */}
              <div className="flex cursor-pointer flex-col items-center text-gray-600 hover:text-red-500">
                <svg
                  className="mb-1.5 h-7 w-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8c1.657 0 3 .843 3 1.882
                      v4.235c0 1.04-1.343 1.883-3 1.883
                      s-3-.843-3-1.883v-4.235
                      C9 8.843 10.343 8 12 8z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.293 9.293a1 1 0 
                      011.414 1.414L16.414 
                      13l2.293 2.293a1 1 0 
                      01-1.414 1.414l-2.293
                      -2.293-2.293 2.293a1 1
                      0 01-1.414-1.414L13 13
                      l-2.293-2.293a1 1 0 
                      011.414-1.414L14 
                      11.586l2.293-2.293z"
                  />
                </svg>
                <span className="text-sm">나의활동</span>
              </div>

              {/* 1:1 쪽지 (0) */}
              <div className="relative flex cursor-pointer flex-col items-center text-gray-600 hover:text-red-500">
                <svg
                  className="mb-1.5 h-7 w-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 8l7.89 5.26a3 3 0 
                      003.22 0L22 8m-9 13H7a2 2 0
                      01-2-2V5a2 2 0 012-2h10
                      a2 2 0 012 2v14a2 2 0
                      01-2 2h-2"
                  />
                </svg>
                <span className="text-sm">1:1 쪽지</span>
                {/* 배지 (0) */}
                <div className="absolute top-[-8px] right-[-8px] flex h-4 w-4 items-center justify-center rounded-full bg-gray-700 text-[10px] font-bold text-white">
                  0
                </div>
              </div>

              {/* 제휴문의 */}
              <div className="flex cursor-pointer flex-col items-center text-gray-600 hover:text-red-500">
                           <Link
                href="/partnership"
                className="flex cursor-pointer flex-col items-center text-gray-600 hover:text-red-500"
              >
                <svg
                  className="mb-1.5 h-7 w-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 8l7.89 5.26a3 3 0 
                      003.22 0L22 8m-9 13H7
                      a2 2 0 01-2-2V5a2 2
                      0 012-2h10a2 2 0
                      012 2v14a2 2 0 
                      01-2 2h-2"
                  />
                </svg>
                <span className="text-sm">제휴문의</span>
                </Link>
              </div>
            </>
          ) : (
            /* 로그인 전 UI */
            <>
              {/* 로그인 아이콘 */}
              <Link
                href="/login"
                className="flex cursor-pointer flex-col items-center text-gray-600 hover:text-red-500"
              >
                <svg
                  className="mb-1.5 h-7 w-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 9V5.25A2.25 2.25
                      0 0013.5 3h-7.5A2.25 2.25
                      0 003.75 5.25v13.5A2.25
                      2.25 0 006 21h7.5a2.25 
                      2.25 0 002.25-2.25V15"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 9l6 3-6 3V9z"
                  />
                </svg>
                <span className="text-sm">로그인</span>
              </Link>

              {/* 나의활동 */}
              <div className="flex cursor-pointer flex-col items-center text-gray-600 hover:text-red-500">
                <svg
                  className="mb-1.5 h-7 w-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8c1.657 0 3 .843 3 1.882
                      v4.235c0 1.04-1.343 
                      1.883-3 1.883s-3-.843
                      -3-1.883v-4.235
                      C9 8.843 10.343 8 12 8z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.293 9.293a1
                      1 0 011.414 
                      1.414L16.414 13l2.293
                      2.293a1 1 0 
                      01-1.414 1.414
                      l-2.293-2.293
                      -2.293 2.293
                      a1 1 0 
                      01-1.414-1.414
                      L13 13l
                      -2.293-2.293
                      a1 1 0 
                      011.414-1.414
                      L14 11.586l
                      2.293-2.293z"
                  />
                </svg>
                <span className="text-sm">나의활동</span>
              </div>

              {/* 제휴문의 */}
              <div className="flex cursor-pointer flex-col items-center text-gray-600 hover:text-red-500">
                 <Link
                href="/partnership"
                className="flex cursor-pointer flex-col items-center text-gray-600 hover:text-red-500"
              >
                <svg
                  className="mb-1.5 h-7 w-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 8l7.89 5.26
                      a3 3 0 003.22 0L22
                      8m-9 13H7a2 2 0
                      01-2-2V5a2 2 0
                      012-2h10a2 2 0
                      012 2v14a2 2 0
                      01-2 2h-2"
                  />
                </svg>
                <span className="text-sm">제휴문의</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      {/* PC 전용 두 번째 줄(메뉴 바) */}
      <div className="mx-auto hidden max-w-7xl items-center justify-between px-6 py-3 md:flex">
        {/* 왼쪽 메뉴 */}
        <ul className="flex items-center space-x-6 text-base font-medium text-gray-700">
          <li className="cursor-pointer hover:text-red-500">전체 카테고리</li>
          <li className="cursor-pointer hover:text-red-500">지역별 샵</li>
          <li className="cursor-pointer hover:text-red-500">출근부</li>
          <li className="cursor-pointer hover:text-red-500">내주변</li>
          <li className="cursor-pointer hover:text-red-500">홈케어</li>
          <li className="cursor-pointer hover:text-red-500">커뮤니티</li>
        </ul>

        {/* 오른쪽 메뉴 */}
        <ul className="flex items-center space-x-6 text-base font-medium text-gray-700">
          <li className="cursor-pointer hover:text-red-500">로그인</li>
          <li className="cursor-pointer hover:text-red-500">회원가입</li>
        </ul>
      </div>

      {/* 모바일 전용 (md:hidden) */}
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between px-6 py-3 md:hidden">
        {/* 로고 */}
        <div className="flex items-center space-x-2 text-2xl font-bold text-red-500">
          <span>VIP info</span>
          <span className="text-base font-normal text-green-600">VIP 건마</span>
        </div>

        {/* 검색창 */}
        <div className="relative mt-2 w-full max-w-md sm:mt-0 sm:flex-grow-0">
          <input
            type="text"
            placeholder="지역, 업종, 상호명 검색하세요"
            className="w-full rounded-full border border-red-300 py-3 pl-6 pr-14 text-base focus:outline-none focus:ring-2 focus:ring-red-400"
          />
          <svg
            className="absolute right-4 top-1/2 h-6 w-6 -translate-y-1/2 text-red-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
      </div>

      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-start gap-6 px-6 py-3 text-base font-medium text-gray-700 md:hidden">
        <span className="cursor-pointer hover:text-red-500">지역별 샵</span>
        <span className="cursor-pointer hover:text-red-500">출근부</span>
        <span className="cursor-pointer hover:text-red-500">내주변</span>
        <span className="cursor-pointer hover:text-red-500">홈케어</span>
        <span className="cursor-pointer hover:text-red-500">커뮤니티</span>
      </nav>
    </header>
  );
}