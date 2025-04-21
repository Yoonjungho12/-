"use client";

import React, { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation"; // ★ usePathname 추가
import Link from "next/link";
import Image from 'next/image';
import { supabase } from "../lib/supabaseF";

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname(); // ★ 현재 경로 확인
  const [showPopup, setShowPopup] = useState(false); // 초기값을 false로 변경
  const [dontShowForWeek, setDontShowForWeek] = useState(false);
  const modalRef = useRef(null);

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [myNickname, setMyNickname] = useState("(닉네임 없음)");
  const refreshListenerRef = useRef(null);
  const authListenerRef = useRef(null);
  const [showMegaMenu, setShowMegaMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const menuRef = useRef(null);

  // 스크롤 참조
  const scrollLeft = () => {
    if (menuRef.current) {
      menuRef.current.scrollBy({ left: -200, behavior: "smooth" });
    }
  };
  const scrollRight = () => {
    if (menuRef.current) {
      menuRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  // 팝업 표시 여부 확인
  useEffect(() => {
    const popupHideUntil = localStorage.getItem('popupHideUntil');
    if (popupHideUntil) {
      const hideUntilDate = new Date(popupHideUntil);
      if (new Date() < hideUntilDate) {
        setShowPopup(false);
      } else {
        setShowPopup(true);
      }
    } else {
      setShowPopup(true);
    }
  }, []);

  useEffect(() => {
    const syncSessionBetweenTabs = async (e) => {
      if (e.key === 'supabase.auth.token') {
        const { data: { session } } = await supabase.auth.getSession();
        setIsLoggedIn(!!session);
        if (session?.user) {
          fetchMyProfile(session.user.id);
        } else {
          setMyNickname("");
        }
      }
    };

    window.addEventListener("storage", syncSessionBetweenTabs);
    return () => window.removeEventListener("storage", syncSessionBetweenTabs);
  }, []);

  // 모달 외부 클릭 처리
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        if (dontShowForWeek) {
          const nextWeek = new Date();
          nextWeek.setDate(nextWeek.getDate() + 7);
          localStorage.setItem('popupHideUntil', nextWeek.toISOString());
        }
        setShowPopup(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dontShowForWeek]);

  // --------------------------------------
  // (1) 로그인 상태 & 프로필 로드
  // --------------------------------------
  useEffect(() => {
    // 초기 로그인 상태 확인
    const checkAuthStatus = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        setIsLoggedIn(!!user);
        if (user) {
          fetchMyProfile(user.id);
        }
      } catch (err) {
        console.error("Auth check error:", err);
        setIsLoggedIn(false);
      }
    };

    checkAuthStatus();
    
    refreshListenerRef.current = supabase.auth.onAuthStateChange((event) => {
      if (event === 'TOKEN_REFRESH_FAILED') {
        console.warn("토큰 리프레시 실패 → 강제 로그아웃");
        supabase.auth.signOut().finally(() => {
          setIsLoggedIn(false);
          setMyNickname("");
          router.refresh(); // 상태 반영
        });
      }
    }).data;
    
    // 로그인 상태 변경 감지
    authListenerRef.current = supabase.auth.onAuthStateChange(
      async (event, session) => {
        const isAuthenticated = !!session?.user;
        setIsLoggedIn(isAuthenticated);
        
        if (isAuthenticated) {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              fetchMyProfile(user.id);
            }
          } catch (err) {
            console.error("Auth state change error:", err);
            setIsLoggedIn(false);
          }
        } else {
          setMyNickname("");
        }
      }
    ).data;

    return () => {
      authListenerRef.current?.subscription.unsubscribe();
      refreshListenerRef.current?.subscription.unsubscribe();
    };
  }, []);

  async function fetchMyProfile(userId) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("nickname")
        .eq("user_id", userId)
        .single();

      if (error) {
        // (A) row 없음
        if (error.details?.includes("0 rows")) {
          console.log("프로필이 없음 -> /socialSignUp 이동");
          router.push("/socialSignUp");
          return;
        }

        // (B) 진짜 오류 → 로그 남김 or 사용자에게 안내
        console.error("profiles 조회 에러:", error);
        setErrorMsg("프로필 로딩 중 오류가 발생했습니다.");
        return;
      }

      // 닉네임 설정
      setMyNickname(data?.nickname || "(닉네임 없음)");
    } catch (err) {
      // 예상치 못한 예외
      console.error("예기치 않은 오류:", err);
      setErrorMsg("알 수 없는 오류가 발생했습니다.");
    }
  }

  // --------------------------------------
  // (2) 로그아웃
  // --------------------------------------
  const handleLogout = async () => {
    console.log("🔒 로그아웃 요청됨");
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    console.log("📦 현재 세션:", sessionData);
    if (sessionError) console.error("❗ 세션 조회 에러:", sessionError);
    try {
      const { error: logoutError } = await supabase.auth.signOut();
      if (logoutError) {
        console.error("❗ 로그아웃 에러:", logoutError);
      } else {
        console.log("✅ 로그아웃 성공");
      }
    } catch (err) {
      console.warn("세션이 이미 만료되었거나 signOut 실패:", err);
    } finally {
      setIsLoggedIn(false);
      setMyNickname("");
      router.push("/");
    }
  };

  // "나의활동" 클릭
  const handleMyActivityClick = async () => {
    if (!isLoggedIn) {
      alert("로그인을 해주세요");
      return;
    }
    console.log("👤 나의 활동 클릭됨");
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    console.log("📦 현재 세션:", sessionData);
    if (sessionError) console.error("❗ 세션 조회 에러:", sessionError);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      console.log("유저 객체:", user);
      if (!user) {
        setIsLoggedIn(false);
        alert("로그인 상태를 확인할 수 없습니다. 다시 로그인해주세요.");
        return;
      }
      router.push("/mypage");
    } catch (err) {
      console.error("Auth check error:", err);
      setIsLoggedIn(false);
      alert("로그인 상태를 확인할 수 없습니다. 다시 로그인해주세요.");
    }
  };

  // 검색 창 → Enter 시 이동
  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      const query = e.target.value.trim();
      if (!query) return;
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  // 전체 카테고리 버튼
  const toggleMegaMenu = () => {
    setShowMegaMenu((prev) => !prev);
  };

  // 1:1 쪽지 아이콘
  const handleMessagesClick = async () => {
    if (!isLoggedIn) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoggedIn(false);
        alert("로그인 상태를 확인할 수 없습니다. 다시 로그인해주세요.");
        return;
      }
      router.push("/messages");
    } catch (err) {
      console.error("Auth check error:", err);
      setIsLoggedIn(false);
      alert("로그인 상태를 확인할 수 없습니다. 다시 로그인해주세요.");
    }
  };

  // --------------------------------------
  // (3) 읽지 않은 메시지 수 + Realtime 구독
  // --------------------------------------
  useEffect(() => {
    if (!isLoggedIn) {
      setUnreadCount(0);
      return;
    }

    const setupMessages = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoggedIn(false);
          return;
        }
        fetchUnreadCount(user.id);
        subscribeMessages(user.id);
      } catch (err) {
        console.error("Message setup error:", err);
        setIsLoggedIn(false);
      }
    };

    setupMessages();
  }, [isLoggedIn]);

  async function fetchUnreadCount(userId) {
    try {
      const { count, error } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("receiver_id", userId)
        .is("read_at", null);

      if (error) throw error;
      setUnreadCount(count || 0);
    } catch (err) {
      console.error("fetchUnreadCount error:", err);
      setUnreadCount(0);
    }
  }

  function subscribeMessages(userId) {
    const channel = supabase.channel("messages-nav-realtime");
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "messages" },
      () => {
        fetchUnreadCount(userId);
      }
    );
    channel.subscribe();
  }

  // --------------------------------------
  // (4) UI: 모바일은 "/" 경로일 때만 상단바 표시
  // --------------------------------------

  return (
    <>
      {/* 팝업 모달 */}
      {showPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
          <div ref={modalRef} className="relative bg-white rounded-lg overflow-hidden">
            <button
              onClick={() => {
                if (dontShowForWeek) {
                  const nextWeek = new Date();
                  nextWeek.setDate(nextWeek.getDate() + 7);
                  localStorage.setItem('popupHideUntil', nextWeek.toISOString());
                }
                setShowPopup(false);
              }}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <Image
              src="/logo/popup.jpeg"
              alt="팝업 이미지"
              width={0}
              height={0}
              sizes="(max-width: 768px) 90vw, 500px"
              className="w-full h-auto max-w-[100%] md:max-w-[500px]"
              priority
            />
            <div className="p-2 flex items-center">
              <input
                type="checkbox"
                id="dontShowForWeek"
                checked={dontShowForWeek}
                onChange={(e) => setDontShowForWeek(e.target.checked)}
                className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
              />
              <label htmlFor="dontShowForWeek" className="ml-2 text-sm text-gray-700">
                일주일 동안 보지 않기
              </label>
            </div>
          </div>
        </div>
      )}

      <header className="w-full bg-white fixed mt-0 z-50">
        {/* (A) 모바일 전용 상단바:
            pathname === "/" 이면 렌더링,
            아니면 null → 마운트 안 함
         */}
        {pathname === "/" ? (
          <div className="flex items-center pl-4 pr-4 pt-4 pb-3 md:hidden space-x-3">
            {/* 로고 (모바일) */}
            <Link href="/" className="flex items-center h-fit w-[98px] md:w-auto">
              <Image
                src="/logo/logo.png"
                alt="여기닷 로고"
                width={200}
                height={141}
                quality={100}
                priority
                className="w-[200px] h-[50px] object-cover object-[0_50%] md:w-[150px] md:h-[60px] md:object-contain"
              />
            </Link>

            {/* 검색창 (모바일) */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="검색"
                className="w-full rounded-full border border-orange-500 py-3 pl-4 pr-9 text-base
                           focus:outline-none focus:ring-1 focus:ring-red-400"
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
        ) : null}

        {/* (B) PC 해상도 상단바 */}
        <div className="mx-auto hidden w-full max-w-7xl px-6 pt-4 pb-4 md:flex">
          <div className="grid w-full grid-cols-3 items-center">
            {/* 왼쪽: 로고 (PC) */}
            <div className="flex justify-start">
              <Link href="/" className="flex items-center h-fit">
                <Image
                  src="/logo/logo.png"
                  alt="여기닷 로고"
                  width={600}
                  height={341}
                  quality={100}
                  priority
                  className="w-[150px] h-[60px] object-cover -mt-0"
                />
              </Link>
            </div>

            {/* 가운데: 검색창 (PC) */}
            <div className="flex justify-center">
              <div className="relative w-full max-w-md">
                <input
                  type="text"
                  placeholder="지역, 업종, 상호명을 검색하세요"
                  className="w-full rounded-full border border-orange-500
                             py-3 pl-6 pr-14 text-base focus:outline-none
                             focus:ring-2 focus:ring-red-400"
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
            </div>

            {/* 오른쪽 아이콘들 */}
            <div className="flex justify-end items-center space-x-7">
              {isLoggedIn ? (
                <>
                  {/* 로그아웃 */}
                  <div
                    className="flex cursor-pointer flex-col items-center text-gray-600 hover:text-orange-500"
                    onClick={handleLogout}
                  >
                    <img src="/icons/logout.svg" width={30} alt="로그인 아이콘" />
                    <span className="text-sm mt-">로그아웃</span>
                  </div>

                  {/* 나의활동 */}
                  <div
                    className="flex cursor-pointer flex-col items-center text-gray-600 hover:text-orange-500"
                    onClick={handleMyActivityClick}
                  >
                    <img src="/icons/history.svg" width={30} alt="로그인 아이콘" />
                    <span className="text-sm mt-">마이페이지</span>
                  </div>

                  {/* 1:1 쪽지 */}
                  <div
                    className="relative flex cursor-pointer flex-col items-center text-gray-600 hover:text-orange-500"
                    onClick={handleMessagesClick}
                  >
                    <img src="/icons/chat.svg" width={30} alt="쪽지함 아이콘" />
                    {unreadCount > 0 && (
                      <span
                        className="absolute -top-1 -right-2 bg-red-500 text-white 
                                   text-xs rounded-full w-5 h-5 flex items-center justify-center"
                      >
                        {unreadCount}
                      </span>
                    )}
                    <span className="text-sm mt-">1:1 쪽지</span>
                  </div>

                  {/* 제휴문의 */}
                  <div className="flex cursor-pointer flex-col items-center text-gray-600 hover:text-orange-500">
                    <Link href="/partnership" className="flex flex-col items-center">
                      <img src="/icons/paper.svg" width={30} alt="로그인 아이콘" />
                      <span className="text-sm mt-">제휴문의</span>
                    </Link>
                  </div>
                </>
              ) : (
                <>
                  {/* 비로그인 */}
                  <Link
                    href="/login"
                    className="flex cursor-pointer flex-col items-center text-gray-600 hover:text-orange-500"
                  >
                    <img src="/icons/log-in.svg" alt="로그인 아이콘" width={30} />
                    <span className="text-sm mt-">로그인</span>
                  </Link>

                  {/* 제휴문의 */}
                  <div className="flex cursor-pointer flex-col items-center text-gray-600 hover:text-orange-500">
                    <Link href="/partnership" className="flex flex-col items-center">
                      <img src="/icons/paper.svg" width={30} alt="로그인 아이콘" />
                      <span className="text-sm mt-">제휴문의</span>
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* (C) 하단 바 (카테고리 메뉴) */}
        <div className="relative rounded-t-xl border-t border-b border-gray-200">
          <div className="relative mx-auto max-w-7xl px-6 text-zinc-700">
            {/* (C-0) 모바일 화살표 */}
            <button
              className="absolute left-[0px] top-1/2 z-10 -translate-y-1/2 md:hidden"
              onClick={scrollLeft}
              aria-label="스크롤 왼쪽"
            >
              <svg
                className="h-6 w-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              className="absolute right-[0px] top-1/2 z-10 -translate-y-1/2 md:hidden"
              onClick={scrollRight}
              aria-label="스크롤 오른쪽"
            >
              <svg
                className="h-6 w-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* (C-1) 수평 스크롤 메뉴 */}
            <div
              ref={menuRef}
              className="hide-scrollbar flex items-center space-x-4 overflow-x-auto py-2 whitespace-nowrap"
            >
              <button
                className="hidden md:flex items-center space-x-1 hover:text-orange-500"
                onClick={toggleMegaMenu}
              >
                <span className="font-sm">전체 카테고리</span>
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

              <Link
                href="/board/전체/전체/전체"
                className="inline-block hover:text-orange-500 md:mx-5"
              >
                지역별 검색
              </Link>
              <Link
                href="/today/전체/전체/전체"
                className="inline-block hover:text-orange-500 md:mx-5"
              >
                실시간 인기 제휴점
              </Link>
              <Link href="/near-me" className="inline-block hover:text-orange-500 md:mx-5">
                내 주변 제휴점 찾기
              </Link>
              <Link
                href="/club/전체/전체/전체"
                className="inline-block hover:text-orange-500 md:mx-5"
              >
                나이트/클럽
              </Link>
              <Link href="/community" className="inline-block hover:text-orange-500 md:mx-5">
                커뮤니티
              </Link>
            </div>

            {/* MegaMenu (PC) */}
            <div
              className={`
                absolute left-0 top-full z-50 w-full border border-gray-200 bg-white shadow-xl rounded-b-xl
                transform transition-all duration-300 ease-in-out origin-top
                ${
                  showMegaMenu
                    ? "opacity-100 scale-100 pointer-events-auto translate-y-0"
                    : "opacity-0 scale-95 pointer-events-none -translate-y-2"
                }
              `}
            >
              <div className="mx-auto grid max-w-7xl grid-cols-4 gap-4 px-6 py-4">
                {/* (1) 테마 선택 */}
                <div>
                  <h2 className="mb-2 font-semibold text-orange-500">테마 선택</h2>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li>
                      <Link href="/board/전체/전체/바" onClick={() => setShowMegaMenu(false)}>
                        바
                      </Link>
                    </li>
                    <li>
                      <Link href="/board/전체/전체/클럽" onClick={() => setShowMegaMenu(false)}>
                        클럽
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/board/전체/전체/라운지바"
                        onClick={() => setShowMegaMenu(false)}
                      >
                        라운지바
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/board/전체/전체/헌팅포차"
                        onClick={() => setShowMegaMenu(false)}
                      >
                        헌팅포차
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/board/전체/전체/감성주점"
                        onClick={() => setShowMegaMenu(false)}
                      >
                        감성주점
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/board/전체/전체/나이트클럽"
                        onClick={() => setShowMegaMenu(false)}
                      >
                        나이트클럽
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/board/전체/전체/성인용품"
                        onClick={() => setShowMegaMenu(false)}
                      >
                        성인용품
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/board/전체/전체/룸카페"
                        onClick={() => setShowMegaMenu(false)}
                      >
                        룸카페
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/board/전체/전체/눈썹문신"
                        onClick={() => setShowMegaMenu(false)}
                      >
                        눈썹문신
                      </Link>
                    </li>
                    <li>
                      <Link href="/board/전체/전체/네일샵" onClick={() => setShowMegaMenu(false)}>
                        네일샵
                      </Link>
                    </li>
                    <li>
                      <Link href="/board/전체/전체/태닝샵" onClick={() => setShowMegaMenu(false)}>
                        태닝샵
                      </Link>
                    </li>
                    <li>
                      <Link href="/board/전체/전체/왁싱샵" onClick={() => setShowMegaMenu(false)}>
                        왁싱샵
                      </Link>
                    </li>
                    <li>
                      <Link href="/board/전체/전체/사주" onClick={() => setShowMegaMenu(false)}>
                        사주
                      </Link>
                    </li>
                    <li>
                      <Link href="/board/전체/전체/타로" onClick={() => setShowMegaMenu(false)}>
                        타로
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/board/전체/전체/애견펜션"
                        onClick={() => setShowMegaMenu(false)}
                      >
                        애견펜션
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/board/전체/전체/애견미용"
                        onClick={() => setShowMegaMenu(false)}
                      >
                        애견미용
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/board/전체/전체/아이폰-스냅"
                        onClick={() => setShowMegaMenu(false)}
                      >
                        아이폰-스냅
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/board/전체/전체/웨딩플래너"
                        onClick={() => setShowMegaMenu(false)}
                      >
                        웨딩플래너
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* (2) 지역 */}
                <div>
                  <h2 className="mb-2 font-semibold text-orange-500">지역</h2>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li>
                      <Link href="/today/전체/전체/전체" onClick={() => setShowMegaMenu(false)}>
                        전체
                      </Link>
                    </li>
                    <li>
                      <Link href="/today/경기/전체/전체" onClick={() => setShowMegaMenu(false)}>
                        경기
                      </Link>
                    </li>
                    <li>
                      <Link href="/today/서울/전체/전체" onClick={() => setShowMegaMenu(false)}>
                        서울
                      </Link>
                    </li>
                    <li>
                      <Link href="/today/강원/전체/전체" onClick={() => setShowMegaMenu(false)}>
                        강원
                      </Link>
                    </li>
                    <li>
                      <Link href="/today/인천/전체/전체" onClick={() => setShowMegaMenu(false)}>
                        인천
                      </Link>
                    </li>
                    <li>
                      <Link href="/today/충북/전체/전체" onClick={() => setShowMegaMenu(false)}>
                        충북
                      </Link>
                    </li>
                    <li>
                      <Link href="/today/대전/전체/전체" onClick={() => setShowMegaMenu(false)}>
                        대전
                      </Link>
                    </li>
                    <li>
                      <Link href="/today/충남/전체/전체" onClick={() => setShowMegaMenu(false)}>
                        충남
                      </Link>
                    </li>
                    <li>
                      <Link href="/today/세종/전체/전체" onClick={() => setShowMegaMenu(false)}>
                        세종
                      </Link>
                    </li>
                    <li>
                      <Link href="/today/전북/전체/전체" onClick={() => setShowMegaMenu(false)}>
                        전북
                      </Link>
                    </li>
                    <li>
                      <Link href="/today/광주/전체/전체" onClick={() => setShowMegaMenu(false)}>
                        광주
                      </Link>
                    </li>
                    <li>
                      <Link href="/today/전남/전체/전체" onClick={() => setShowMegaMenu(false)}>
                        전남
                      </Link>
                    </li>
                    <li>
                      <Link href="/today/대구/전체/전체" onClick={() => setShowMegaMenu(false)}>
                        대구
                      </Link>
                    </li>
                    <li>
                      <Link href="/today/경북/전체/전체" onClick={() => setShowMegaMenu(false)}>
                        경북
                      </Link>
                    </li>
                    <li>
                      <Link href="/today/울산/전체/전체" onClick={() => setShowMegaMenu(false)}>
                        울산
                      </Link>
                    </li>
                    <li>
                      <Link href="/today/경남/전체/전체" onClick={() => setShowMegaMenu(false)}>
                        경남
                      </Link>
                    </li>
                    <li>
                      <Link href="/today/부산/전체/전체" onClick={() => setShowMegaMenu(false)}>
                        부산
                      </Link>
                    </li>
                    <li>
                      <Link href="/today/제주/전체/전체" onClick={() => setShowMegaMenu(false)}>
                        제주
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* (3) 내주변 */}
                <div>
                  <h2 className="mb-2 font-semibold text-orange-500">내 주변 제휴점 찾기</h2>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li>
                      <Link href="/near-me" onClick={() => setShowMegaMenu(false)}>
                        내 주변 제휴점 찾기
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* (4) 커뮤니티 */}
                <div>
                  <h2 className="mb-2 font-semibold text-orange-500">커뮤니티</h2>
                  <ul className="space-y-1 text-sm text-gray-700">
                    <li>
                      <Link href="/community/board/공지사항" onClick={() => setShowMegaMenu(false)}>
                        공지사항
                      </Link>
                    </li>
                    <li>
                      <Link href="/community/board/가입인사" onClick={() => setShowMegaMenu(false)}>
                        가입인사
                      </Link>
                    </li>
                    <li>
                      <Link href="/community/board/방문후기" onClick={() => setShowMegaMenu(false)}>
                        방문후기
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/community/board/유머게시판"
                        onClick={() => setShowMegaMenu(false)}
                      >
                        유머게시판
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/community/board/자유게시판"
                        onClick={() => setShowMegaMenu(false)}
                      >
                        자유게시판
                      </Link>
                    </li>
                    <li>
                      <Link href="/community/board/질문답변" onClick={() => setShowMegaMenu(false)}>
                        질문답변
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/community/board/제휴업체 SNS 홍보"
                        onClick={() => setShowMegaMenu(false)}
                      >
                        제휴업체 SNS 홍보
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/community/board/맛집-핫플-데이트 코스 공유"
                        onClick={() => setShowMegaMenu(false)}
                      >
                        맛집/핫플/데이트 코스 공유
                      </Link>
                    </li>
                    <li>
                      <Link href="/community/board/패션 꿀팁" onClick={() => setShowMegaMenu(false)}>
                        패션 꿀팁
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/community/board/여성 조각 모임 (나이트&클럽&라운지)"
                        onClick={() => setShowMegaMenu(false)}
                      >
                        여성 조각 모임 (나이트&클럽&라운지)
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/community/board/남성 조각 모임 (나이트&클럽&라운지)"
                        onClick={() => setShowMegaMenu(false)}
                      >
                        남성 조각 모임 (나이트&클럽&라운지)
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}