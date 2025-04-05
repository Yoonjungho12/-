"use client";

import React, { useEffect, useState, useRef } from "react";
import { usePathname, useRouter } from "next/navigation"; // ★ usePathname 추가
import Link from "next/link";
import Image from 'next/image';
import { supabase } from "../lib/supabaseF";

export default function NavBar() {
  const router = useRouter();
  const pathname = usePathname(); // ★ 현재 경로 확인

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [myNickname, setMyNickname] = useState("(닉네임 없음)");
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

    // 로그인 상태 변경 감지
    const { data: authListener } = supabase.auth.onAuthStateChange(
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
    );

    return () => {
      authListener?.subscription.unsubscribe();
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
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      setIsLoggedIn(false);
      router.push("/");
    }
  };

  // "나의활동" 클릭
  const handleMyActivityClick = async () => {
    if (!isLoggedIn) {
      alert("로그인을 해주세요");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
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
              className="w-[67px] h-auto -mt-4 md:w-[90px] md:-mt-6"
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
      <div className="mx-auto hidden w-full max-w-7xl px-6 pt-8 pb-4 md:flex">
        <div className="grid w-full grid-cols-3 items-center">
          {/* 왼쪽: 로고 (PC) */}
          <div className="flex justify-start">
            <Link href="/" className="flex items-center h-fit">
              <Image
                src="/logo/logo.png"
                alt="여기닷 로고"
                width={200}
                height={141}
                quality={100}
                priority
                className="w-[90px] h-auto -mt-5.5"
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
                    <Link href="/today" onClick={() => setShowMegaMenu(false)}>
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
  );
}