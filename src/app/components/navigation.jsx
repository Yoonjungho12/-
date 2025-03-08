"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseF";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// 1) 쪽지 팝업 (동적 import)
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

  // 메가메뉴 열고 닫기
  const [showMegaMenu, setShowMegaMenu] = useState(false);

  // 로그인 여부
  const isLoggedIn = !!session;

  // ─────────────────────────────────────────────────────
  // 세션 & 프로필 로드
  // ─────────────────────────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        fetchMyProfile(data.session.user.id);
        fetchUnreadCount(data.session.user.id);
      }
    });
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  const handleMessageIconClick = () => {
    if (!session?.user?.id) {
      alert("로그인 필요");
      return;
    }
    setShowMsgPopup((prev) => !prev);
  };

  // 메가메뉴
  const toggleMegaMenu = () => {
    setShowMegaMenu((prev) => !prev);
  };

  // 검색 창 → Enter 시 /search?q=... 로 라우팅
  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      const query = e.target.value.trim();
      if (!query) return;
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  // ─────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────
  return (
    <header className="w-full border-b border-gray-200 bg-white">
      {/*
        (A) 모바일 전용 상단바
        - md:hidden : md 사이즈 미만에서만 보임
        - 로고 + 넓은 검색창 (space-x-3로 로고와 검색창 사이 띄움)
      */}
      <div className="flex items-center px-4 py-3 md:hidden space-x-3">
        {/* 로고 */}
        <Link href="/">
          <div className="flex items-center space-x-1 mr-10 ml-3 text-xl font-bold text-red-500">
            <span>여기닷</span>
          </div>
        </Link>

        {/* 검색창 */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="검색"
            className="
              w-full rounded-full border border-red-300
              py-3 pl-4 pr-9
              text-base
              focus:outline-none focus:ring-2 focus:ring-red-400
            "
            onKeyDown={handleSearchKeyDown}
          />
          <svg
            className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-red-400"
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

      {/*
        (B) PC 해상도 상단바
        - hidden md:flex : md 이상에서만 보임
        - 로고 + 검색창 + 오른쪽 아이콘들
      */}
      <div className="mx-auto hidden max-w-7xl items-center justify-between px-6 py-3 md:flex">
        {/* 로고 영역 */}
        <Link href="/">
          <div className="flex items-center space-x-2 text-2xl font-bold text-red-500">
            <span>여기닷</span>
          </div>
        </Link>

        {/* 검색창 */}
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="지역, 업종, 상호명을 검색하세요"
            className="w-full rounded-full border border-red-300 py-3 pl-6 pr-14 text-base
                       focus:outline-none focus:ring-2 focus:ring-red-400"
            onKeyDown={handleSearchKeyDown}
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
                    d="M15.75 9V5.25A2.25
                       2.25 0
                       0013.5 3h-7.5A2.25
                       2.25 0
                       003.75 5.25v13.5A2.25
                       2.25 0
                       006
                       21h7.5a2.25
                       2.25 0
                       002.25-2.25V15"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 9l6
                       3-6
                       3V9z"
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
                    d="M12 8c1.657 0
                       3 .843
                       3 1.882v4.235c0
                       1.04-1.343
                       1.883-3
                       1.883s-3
                       -.843-3
                       -1.883v-4.235
                       C9
                       8.843
                       10.343
                       8 12
                       8z"
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
                       -1.414
                       L13
                       13l-2.293
                       -2.293a1 1
                       0 011.414
                       -1.414
                       L14
                       11.586l2.293
                       -2.293z"
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
                       5.26a3 3
                       0 003.22
                       0L22 8m-9
                       13H7a2
                       2 0
                       01-2-2V5
                       a2 2 0
                       012-2h10a2
                       2 0
                       012
                       2v14a2
                       2 0
                       01-2
                       2h-2"
                  />
                </svg>
                <span className="text-sm">1:1 쪽지</span>
                {unreadCount > 0 && (
                  <div
                    className="absolute -top-2 -right-2 flex
                               h-5 w-5 items-center justify-center
                               rounded-full bg-red-600 text-[10px]
                               font-bold text-white"
                  >
                    {unreadCount}
                  </div>
                )}
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
                      d="M3
                         8l7.89
                         5.26a3
                         3 0
                         003.22
                         0L22
                         8m-9
                         13H7a2
                         2 0
                         01-2
                         -2V5a2
                         2 0
                         012
                         -2h10a2
                         2 0
                         012
                         2v14a2
                         2 0
                         01-2
                         2h-2"
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
                    d="M15.75
                       9V5.25A2.25
                       2.25 0
                       0013.5
                       3h-7.5A2.25
                       2.25 0
                       003.75
                       5.25v13.5A2.25
                       2.25 0
                       006
                       21h7.5a2.25
                       2.25 0
                       002.25
                       -2.25V15"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9
                       9l6 3-6 3V9z"
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
                    d="M12
                       8c1.657
                       0 3 .843
                       3 1.882v4.235
                       c0 1.04-1.343
                       1.883-3
                       1.883s-3
                       -.843-3
                       -1.883v-4.235
                       C9
                       8.843
                       10.343
                       8 12
                       8z"
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
                       -1.414
                       L14
                       11.586l2.293
                       -2.293z"
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
                      d="M3
                         8l7.89
                         5.26a3 3
                         0 003.22
                         0L22
                         8m-9
                         13H7a2
                         2 0
                         01-2
                         -2V5a2
                         2 0
                         012
                         -2h10a2
                         2 0
                         012
                         2v14a2
                         2 0
                         01-2
                         2h-2"
                    />
                  </svg>
                  <span className="text-sm">제휴문의</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 
        하단 바 (카테고리 메뉴) 
        ※ 여기서 모바일/PC 구분 없이 다 보이게 하고, 
          "전체 카테고리" 버튼만 모바일에서 숨김
      */}
      <div className="border-t border-gray-200 bg-white">
        <div className="relative mx-auto flex max-w-7xl items-center space-x-4 px-6 py-2">
          {/* 전체 카테고리 버튼 (모바일에선 숨김, md 이상에서만 표시) */}
          <button
            className="hidden md:flex items-center space-x-1 text-gray-700 hover:text-red-500"
            onClick={toggleMegaMenu}
          >
            <span className="font-medium">전체 카테고리</span>
            <svg
              className={`h-4 w-4 transition-transform ${
                showMegaMenu ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* 이 아래 링크들은 모바일에서도 계속 보이게 유지 */}
          <Link href="/board/전체/전체" className="text-gray-700 hover:text-red-500">
            지역별 샵
          </Link>
          <Link
            href="/today/전체/전체/전체"
            className="text-gray-700 hover:text-red-500"
          >
            출근부
          </Link>
          <Link href="/near-me" className="text-gray-700 hover:text-red-500">
            내주변
          </Link>
          <Link
            href="/board/홈케어-방문관리/전체"
            className="text-gray-700 hover:text-red-500"
          >
            홈케어
          </Link>
          <Link href="/community" className="text-gray-700 hover:text-red-500">
            커뮤니티
          </Link>

          {/* MegaMenu (PC용) */}
          {showMegaMenu && (
            <div
              className="absolute left-0 top-full z-50 mt-2 w-full border
                         border-gray-200 bg-white shadow-lg"
            >
              <div className="mx-auto grid max-w-7xl grid-cols-4 gap-4 px-6 py-4">
                {/* 예: 지역별 샵 */}
                <div>
                  <h2 className="mb-2 font-semibold text-red-500">지역별 샵</h2>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li>
                      <Link
                        href="/board/강남-서초-송파/전체"
                        onClick={() => setShowMegaMenu(false)}
                      >
                        강남/서초/송파
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/board/서울/전체"
                        onClick={() => setShowMegaMenu(false)}
                      >
                        서울
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/board/수원-동탄-용인-화성-평택-오산/전체"
                        onClick={() => setShowMegaMenu(false)}
                      >
                        수원/동탄/용인/화성/평택/오산
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/board/분당-성남-위례-경기광주-하남/전체"
                        onClick={() => setShowMegaMenu(false)}
                      >
                        분당/성남/위례/경기광주/하남
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/board/안양-군포-시흥-의왕/전체"
                        onClick={() => setShowMegaMenu(false)}
                      >
                        안양/광명/안산/군포/시흥/의왕
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/board/인천-부천-부평/전체"
                        onClick={() => setShowMegaMenu(false)}
                      >
                        인천/부천/부평
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/board/일산-김포-파주-고양/전체"
                        onClick={() => setShowMegaMenu(false)}
                      >
                        고양/일산/김포/파주
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/board/의정부-구리-남양주-포천-동두천/전체"
                        onClick={() => setShowMegaMenu(false)}
                      >
                        의정부/구리/남양주/포천/동두천
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/board/대전-천안-세종-충청-강원/전체"
                        onClick={() => setShowMegaMenu(false)}
                      >
                        대전/천안/세종/충청/강원
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/board/부산-대구-울산-경상도-전라도-광주/전체"
                        onClick={() => setShowMegaMenu(false)}
                      >
                        부산/대구/울산/경상도/전라도/광주
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/board/제주도/전체"
                        onClick={() => setShowMegaMenu(false)}
                      >
                        제주도
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/board/홈케어-방문관리/전체"
                        onClick={() => setShowMegaMenu(false)}
                      >
                        홈케어/방문관리
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* 출근부 */}
                <div>
                  <h2 className="mb-2 font-semibold text-red-500">출근부</h2>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li>
                      <Link
                        href="/today"
                        onClick={() => setShowMegaMenu(false)}
                      >
                        전체
                      </Link>
                    </li>
                    <li>경기</li>
                    <li>서울</li>
                    <li>강원</li>
                    <li>인천</li>
                    <li>충북</li>
                    <li>대전</li>
                    <li>충남</li>
                    <li>세종</li>
                    <li>전북</li>
                    <li>광주</li>
                    <li>전남</li>
                    <li>대구</li>
                    <li>경북</li>
                    <li>울산</li>
                    <li>경남</li>
                    <li>부산</li>
                    <li>제주</li>
                  </ul>
                </div>

                {/* 내주변 */}
                <div>
                  <h2 className="mb-2 font-semibold text-red-500">내주변</h2>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li>
                      <Link
                        href="/near-me"
                        onClick={() => setShowMegaMenu(false)}
                      >
                        내주변
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* 커뮤니티 */}
                <div>
                  <h2 className="mb-2 font-semibold text-red-500">커뮤니티</h2>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li>공지사항</li>
                    <li>이벤트</li>
                    <li>SNS</li>
                    <li>아쉬워요</li>
                    <li>매니저찾기</li>
                    <li>익명게시판</li>
                    <li>중고거래</li>
                    <li>임대/매매</li>
                    <li>예약/콜대행</li>
                    <li>오류/건의</li>
                    <li>마사지정보</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}