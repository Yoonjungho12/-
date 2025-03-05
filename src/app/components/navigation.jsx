"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseF";
import { useRouter } from "next/navigation";

// ★ Next.js의 dynamic import
import dynamic from "next/dynamic";

/**
 * MessagePopup을 동적 import로 스플리팅
 * - ssr: false → 서버사이드 렌더링 시에는 비워두고, 클라이언트 단에서만 import
 */
const MessagePopupLazy = dynamic(() => import("./MessagePopup"), {
  ssr: false,
});

export default function NavBar() {
  const router = useRouter();

  const [session, setSession] = useState(null);
  const [showMsgPopup, setShowMsgPopup] = useState(false);

  // 읽지 않은 쪽지 개수, 내 닉네임
  const [unreadCount, setUnreadCount] = useState(0);
  const [myNickname, setMyNickname] = useState("(닉네임 없음)");

  // --- 마운트 시에 세션 로드 ---
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        fetchMyProfile(data.session.user.id);
        fetchUnreadCount(data.session.user.id);
      }
    });

    // 세션 변화 감지
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        if (newSession?.user?.id) {
          fetchMyProfile(newSession.user.id);
          fetchUnreadCount(newSession.user.id);
        } else {
          setMyNickname("");
          setUnreadCount(0);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // 로그인 여부
  const isLoggedIn = !!session;

  // 내 닉네임
  async function fetchMyProfile(userId) {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("nickname")
        .eq("user_id", userId)
        .single();
      setMyNickname(data?.nickname || "(닉네임 없음)");
    } catch (err) {
      console.error("프로필 오류:", err);
      setMyNickname("(오류)");
    }
  }

  // 읽지 않은 쪽지개수
  async function fetchUnreadCount(userId) {
    try {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .match({ receiver_id: userId })
        .is("read_at", null);
      setUnreadCount(data?.length || 0);
    } catch (err) {
      console.error("unreadCount 오류:", err);
    }
  }

  // 로그아웃
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  // 쪽지 아이콘
  const handleMessageIconClick = () => {
    if (!session?.user?.id) {
      alert("로그인 필요");
      return;
    }
    // showMsgPopup 토글
    setShowMsgPopup((prev) => !prev);
    // 버튼 눌렀을 때만 MessagePopupLazy가 실제로 로드됨
  };

  return (
    <header className="w-full border-b border-gray-200 bg-white">
      {/* 상단 바 (PC 해상도) */}
      <div className="mx-auto hidden max-w-7xl items-center justify-between px-6 py-3 md:flex">
        {/* 로고 영역 */}
        <Link href="/">
          <div className="flex items-center space-x-2 text-2xl font-bold text-red-500">
            <span>VIP info</span>
            <span className="text-base font-normal text-green-600">VIP 건마</span>
          </div>
        </Link>

        {/* 검색창 */}
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="지역, 업종, 상호명을 검색하세요"
            className="w-full rounded-full border border-red-300 py-3 pl-6 pr-14 text-base
                       focus:outline-none focus:ring-2 focus:ring-red-400"
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

        {/* 오른쪽 아이콘들 */}
        <div className="flex items-center space-x-7">
          {isLoggedIn ? (
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
                    d="M15.75 9V5.25A2.25 2.25 0
                       0013.5 3h-7.5A2.25 2.25 0
                       003.75 5.25v13.5A2.25 2.25
                       0 006 21h7.5a2.25 2.25
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
                       011.414 1.414L16.414 13l2.293 2.293
                       a1 1 0 01-1.414 1.414
                       l-2.293-2.293-2.293 2.293
                       a1 1 0 01-1.414-1.414
                       L13 13l-2.293-2.293
                       a1 1 0 011.414-1.414
                       L14 11.586l2.293-2.293z"
                  />
                </svg>
                <span className="text-sm">나의활동</span>
              </div>

              {/* 1:1 쪽지 아이콘 */}
              <div className="relative flex cursor-pointer flex-col items-center text-gray-600 hover:text-red-500">
                <svg
                  onClick={handleMessageIconClick}
                  className="mb-1.5 h-7 w-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 8l7.89
                       5.26a3 3 0 003.22 0
                       L22 8m-9 13H7
                       a2 2 0 01-2-2V5
                       a2 2 0 012-2
                       h10a2 2 0 012 2
                       v14a2 2 0
                       01-2 2
                       h-2"
                  />
                </svg>
                <span className="text-sm">1:1 쪽지</span>

                {/* 읽지 않은 쪽지 개수 배지 */}
                {unreadCount > 0 && (
                  <div
                    className="absolute -top-2 -right-2 flex h-5 w-5
                               items-center justify-center rounded-full bg-red-600
                               text-[10px] font-bold text-white"
                  >
                    {unreadCount}
                  </div>
                )}

                {/* 동적 import한 MessagePopupLazy → showMsgPopup가 true일 때만 로드 */}
                {showMsgPopup && (
                  <MessagePopupLazy
                    onClose={() => setShowMsgPopup(false)}
                    myId={session.user.id}
                    myNickname={myNickname}
                    unreadCount={unreadCount}
                    setUnreadCount={setUnreadCount}
                  />
                )}
              </div>

              {/* 제휴문의 */}
              <div className="flex cursor-pointer flex-col items-center text-gray-600 hover:text-red-500">
                <Link href="/partnership" className="flex flex-col items-center">
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
                      d="M3 8l7.89
                         5.26a3 3 0
                         003.22 0
                         L22 8m-9 13H7
                         a2 2 0
                         01-2-2V5
                         a2 2 0 012-2
                         h10a2 2 0
                         012 2v14
                         a2 2 0
                         01-2 2
                         h-2"
                    />
                  </svg>
                  <span className="text-sm">제휴문의</span>
                </Link>
              </div>
            </>
          ) : (
            <>
              {/* 비로그인 */}
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
                       0 0013.5 3h-7.5A2.25
                       2.25 0 003.75 5.25
                       v13.5A2.25 2.25 0
                       006 21h7.5a2.25
                       2.25 0
                       002.25-2.25V15"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 9l6 3-6 3V9z"
                  />
                </svg>
                <span className="text-sm">로그인</span>
              </Link>

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
                    d="M12 8c1.657
                       0 3 .843
                       3 1.882v4.235
                       c0 1.04-1.343
                       1.883-3 1.883
                       s-3-.843
                       -3-1.883
                       v-4.235
                       C9 8.843
                       10.343 8
                       12 8z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.293
                       9.293a1 1
                       0 011.414
                       1.414L16.414
                       13l2.293
                       2.293a1 1
                       0 01-1.414
                       1.414l-2.293
                       -2.293-2.293
                       2.293a1 1
                       0 01-1.414
                       -1.414L13
                       13l-2.293
                       -2.293a1 1
                       0 011.414
                       -1.414L14
                       11.586l
                       2.293-2.293z"
                  />
                </svg>
                <span className="text-sm">나의활동</span>
              </div>

              <div className="flex cursor-pointer flex-col items-center text-gray-600 hover:text-red-500">
                <Link href="/partnership" className="flex flex-col items-center">
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
                      d="M3 8l7.89
                         5.26a3 3
                         0
                         003.22 0
                         L22 8
                         m-9 13H7
                         a2 2 0
                         01-2-2V5
                         a2 2 0 012-2
                         h10a2 2
                         0
                         012 2v14
                         a2 2
                         0
                         01-2 2
                         h-2"
                    />
                  </svg>
                  <span className="text-sm">제휴문의</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 하단 바 (카테고리 메뉴) */}
      <div className="border-t border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center px-6 py-2 space-x-4">
          {/* 전체 카테고리 버튼 (드롭다운 등 구현 가능) */}
          <button className="flex items-center space-x-1 text-gray-700 hover:text-red-500">
            <span className="font-medium">전체 카테고리</span>
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* 메뉴 항목들 */}
          <Link href="/board/전체/전체" className="text-gray-700 hover:text-red-500">
            지역별 샵
          </Link>
          <Link href="/board" className="text-gray-700 hover:text-red-500">
            출근부
          </Link>
          <Link href="/near-me" className="text-gray-700 hover:text-red-500">
            내주변
          </Link>
          <Link href="/home-care" className="text-gray-700 hover:text-red-500">
            홈케어
          </Link>
          <Link href="/community" className="text-gray-700 hover:text-red-500">
            커뮤니티
          </Link>
        </div>
      </div>
    </header>
  );
}