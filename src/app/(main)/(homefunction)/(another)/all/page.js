"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseF";

/**
 * 1) 세션/닉네임 로직
 * 2) 아코디언(지역별 검색, 실시간 인기 업체, 커뮤니티)
 * 3) boards 테이블에서 커뮤니티 목록 동적 로딩
 * 4) 고객센터
 * 
 * "가고싶다" 로직은 모두 제거한 버전
 */
export default function MyMobileUI() {
  const router = useRouter();

  // ------------------------------------------------------------------------
  // [A] 로그인 세션 & 닉네임
  // ------------------------------------------------------------------------
  const [session, setSession] = useState(null);
  const [nickname, setNickname] = useState("...");

  // 닉네임 수정 모드
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [editNicknameInput, setEditNicknameInput] = useState("");

  // ------------------------------------------------------------------------
  // [B] 아코디언: "region" / "chulgeun" / "community" / null
  // ------------------------------------------------------------------------
  const [openDropdown, setOpenDropdown] = useState("region");
  // 기본값: 지역별 검색이 열려 있음

  // ------------------------------------------------------------------------
  // (1) 세션 / 닉네임 불러오기
  // ------------------------------------------------------------------------
  useEffect(() => {
    async function fetchUser() {
      // 세션 가져오기
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) console.error("Session Error:", sessionError);

      setSession(session);

      // 로그인된 경우 프로필 닉네임 불러오기
      if (session?.user) {
        try {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("nickname")
            .eq("user_id", session.user.id)
            .single();

          if (profileError) {
            console.error("Profile Error:", profileError);
          } else if (profile?.nickname) {
            setNickname(profile.nickname);
          }
        } catch (err) {
          console.error("Unknown Error:", err);
        }
      }
    }
    fetchUser();
  }, []);

  // 로그인 여부
  const isLoggedIn = !!session?.user;

  // ------------------------------------------------------------------------
  // (2) 로그인/로그아웃/회원가입
  // ------------------------------------------------------------------------
  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout Error:", error);
      return;
    }
    setSession(null);
  }

  function handleLogin() {
    router.push("/login");
  }

  function handleSignup() {
    router.push("/signup");
  }

  // ------------------------------------------------------------------------
  // (3) 닉네임 수정
  // ------------------------------------------------------------------------
  function handleEditNickname() {
    setEditNicknameInput(nickname);
    setIsEditingNickname(true);
  }

  async function handleUpdateNickname() {
    if (!session?.user?.id) {
      alert("로그인이 필요합니다.");
      return;
    }
    const newNick = editNicknameInput.trim();
    if (!newNick) {
      alert("닉네임은 비어있을 수 없습니다.");
      return;
    }

    // DB 업데이트
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ nickname: newNick })
        .eq("user_id", session.user.id);

      if (error) {
        console.error("Nickname Update Error:", error);
        alert("닉네임 변경 실패!");
        return;
      }
      setNickname(newNick);
      setIsEditingNickname(false);
      alert("닉네임이 변경되었습니다!");
    } catch (err) {
      console.error("Unknown Error:", err);
      alert("오류가 발생했습니다.");
    }
  }

  function handleCancelEdit() {
    setIsEditingNickname(false);
    setEditNicknameInput("");
  }

  // ------------------------------------------------------------------------
  // (4) 아코디언 토글
  // ------------------------------------------------------------------------
  function toggleDropdown(menuName) {
    setOpenDropdown((prev) => (prev === menuName ? null : menuName));
  }

  // ------------------------------------------------------------------------
  // (5) 메뉴 데이터 (지역별 검색, 실시간 인기 업체)
  // ------------------------------------------------------------------------
  const regionLinks = [
    { href: "/board/강남-서초-송파/전체/전체", label: "강남/서초/송파" },
    { href: "/board/서울/전체/전체", label: "서울" },
    {
      href: "/board/수원-동탄-용인-화성-평택-오산/전체/전체",
      label: "수원/동탄/용인/화성/평택/오산",
    },
    {
      href: "/board/분당-성남-위례-경기광주-하남/전체/전체",
      label: "분당/성남/위례/경기광주/하남",
    },
    {
      href: "/board/안양-군포-시흥-의왕/전체/전체",
      label: "안양/광명/안산/군포/시흥/의왕",
    },
    { href: "/board/인천-부천-부평/전체/전체", label: "인천/부천/부평" },
    { href: "/board/일산-김포-파주-고양/전체/전체", label: "고양/일산/김포/파주" },
    {
      href: "/board/의정부-구리-남양주-포천-동두천/전체/전체",
      label: "의정부/구리/남양주/포천/동두천",
    },
    {
      href: "/board/대전-천안-세종-충청-강원/전체/전체",
      label: "대전/천안/세종/충청/강원",
    },
    {
      href: "/board/부산-대구-울산-경상도-전라도-광주/전체/전체",
      label: "부산/대구/울산/경상도/전라도/광주",
    },
    { href: "/board/제주도/전체/전체", label: "제주도" },
  ];

  const chulgeunRegions = [
    { label: "전체", href: "/today/전체/전체/전체" },
    { label: "서울", href: "/today/서울/전체/전체" },
    { label: "인천", href: "/today/인천/전체/전체" },
    { label: "대전", href: "/today/대전/전체/전체" },
    { label: "세종", href: "/today/세종/전체/전체" },
    { label: "광주", href: "/today/광주/전체/전체" },
    { label: "대구", href: "/today/대구/전체/전체" },
    { label: "울산", href: "/today/울산/전체/전체" },
    { label: "부산", href: "/today/부산/전체/전체" },
    { label: "경기", href: "/today/경기/전체/전체" },
    { label: "강원", href: "/today/강원/전체/전체" },
    { label: "충북", href: "/today/충북/전체/전체" },
    { label: "충남", href: "/today/충남/전체/전체" },
    { label: "전북", href: "/today/전북/전체/전체" },
    { label: "전남", href: "/today/전남/전체/전체" },
    { label: "경북", href: "/today/경북/전체/전체" },
    { label: "경남", href: "/today/경남/전체/전체" },
    { label: "제주", href: "/today/제주/전체/전체" },
  ];

  // ------------------------------------------------------------------------
  // (6) boards 테이블에서 커뮤니티 목록 가져오기
  // ------------------------------------------------------------------------
  const [communityBoards, setCommunityBoards] = useState([]);

  useEffect(() => {
    async function fetchCommunityBoards() {
      try {
        // boards 테이블에서 name을 조회
        const { data, error } = await supabase.from("boards").select("name");
        if (error) {
          console.error("Error fetching community boards:", error);
          return;
        }
        setCommunityBoards(data || []);
      } catch (err) {
        console.error("Unknown error:", err);
      }
    }
    fetchCommunityBoards();
  }, []);

  // ------------------------------------------------------------------------
  // [D] 최종 UI 렌더링
  // ------------------------------------------------------------------------
  return (
    <div className="max-w-[600px] mx-auto bg-gray-50/30 min-h-screen">
      {/* 상단: 프로필 영역 */}
      <div className="bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] mb-4">
        <div className="p-6">
          {isLoggedIn ? (
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-xl font-medium text-white shadow-lg">
                {nickname[0]}
              </div>
              <div className="flex-1">
                <span className="font-bold text-xl text-gray-900">{nickname}</span>
                <div className="flex gap-2 mt-3">
                  <button onClick={handleEditNickname} className="px-4 py-2 text-sm bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 transition-all">
                    정보수정
                  </button>
                  <button onClick={handleLogout} className="px-4 py-2 text-sm bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 transition-all">
                    로그아웃
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="text-xl font-bold text-gray-900">로그인을 해주세요</div>
              <div className="flex gap-2">
                <button onClick={handleLogin} className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-all shadow-sm">
                  로그인
                </button>
                <button onClick={handleSignup} className="flex-1 px-4 py-2.5 bg-gray-50 text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition-all">
                  회원가입
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 닉네임 수정모드 UI */}
      {isEditingNickname && (
        <div className="mx-4 mb-4">
          <div className="bg-white p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <input
              type="text"
              value={editNicknameInput}
              onChange={(e) => setEditNicknameInput(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange-500 outline-none mb-3"
              placeholder="새로운 닉네임"
            />
            <div className="flex gap-2">
              <button onClick={handleUpdateNickname} className="flex-1 px-4 py-2.5 bg-orange-500 text-white rounded-xl font-medium hover:bg-orange-600 transition-all">
                변경
              </button>
              <button onClick={handleCancelEdit} className="flex-1 px-4 py-2.5 bg-gray-50 text-gray-700 rounded-xl font-medium hover:bg-gray-100 transition-all">
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3 px-4">
        {/* 아코디언: 지역별 검색 */}
        <Accordion
          title="지역별 검색"
          titleClass="text-gray-900 font-bold text-lg"
          isOpen={openDropdown === "region"}
          onToggle={() => toggleDropdown("region")}
        >
          <div className="p-2">
            <div className="grid grid-cols-2 gap-2">
              {regionLinks.map((r) => (
                <Link 
                  key={r.href} 
                  href={r.href}
                  className="p-3 bg-white rounded-xl hover:bg-orange-50 transition-all text-gray-600 hover:text-orange-500"
                >
                  {r.label}
                </Link>
              ))}
            </div>
          </div>
        </Accordion>

        {/* 실시간 인기 업체 */}
        <Accordion
          title="실시간 인기 업체"
          titleClass="text-gray-900 font-bold text-lg"
          isOpen={openDropdown === "chulgeun"}
          onToggle={() => toggleDropdown("chulgeun")}
        >
          <div className="p-2">
            <div className="grid grid-cols-3 gap-2">
              {chulgeunRegions.map((item) => (
                <Link 
                  key={item.label} 
                  href={item.href}
                  className="p-3 bg-white rounded-xl text-center hover:bg-orange-50 transition-all text-gray-600 hover:text-orange-500"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </Accordion>

        <Link 
          href="/near-me" 
          className="block p-5 bg-white rounded-2xl font-medium hover:bg-orange-50 transition-all group shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
        >
          <div className="flex items-center justify-between">
            <span className="text-gray-900 group-hover:text-orange-500 transition-colors">내 주변 업체 찾기</span>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        <Link 
          href="/club/전체/전체/전체" 
          className="block p-5 bg-white rounded-2xl font-medium hover:bg-orange-50 transition-all group shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
        >
          <div className="flex items-center justify-between">
            <span className="text-gray-900 group-hover:text-orange-500 transition-colors">클럽/나이트클럽</span>
            <svg className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </Link>

        {/* 커뮤니티 */}
        <Accordion
          title="커뮤니티"
          titleClass="text-gray-900 font-bold text-lg"
          isOpen={openDropdown === "community"}
          onToggle={() => toggleDropdown("community")}
        >
          <div className="p-2">
            {communityBoards.length === 0 ? (
              <div className="p-4 text-center text-gray-500">등록된 커뮤니티가 없습니다.</div>
            ) : (
              <div className="space-y-2">
                {communityBoards.map((board) => (
                  <Link 
                    key={board.name} 
                    href={`/community/board/${board.name}`}
                    className="block p-3 bg-white rounded-xl hover:bg-orange-50 transition-all text-gray-600 hover:text-orange-500"
                  >
                    {board.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </Accordion>
      </div>

      {/* 고객센터 */}
      <div className="mt-6 mx-4 mb-4">
        <div className="bg-white p-6 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="text-xl font-bold text-gray-900 mb-4">고객센터</div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-gray-600">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <span>평일 오전 9:30~18:00</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </div>
              <span>010-2117-7392</span>
            </div>
            <a 
              href="https://open.kakao.com/o/sF0jBaqh" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="flex items-center gap-3 text-gray-600 hover:text-orange-500 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <span>카톡 1:1상담 입점문의</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 아코디언 컴포넌트
 * - max-h를 크게 잡아서 긴 목록도 잘리지 않게 처리
 */
function Accordion({ title, titleClass = "", isOpen, onToggle, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
      <button
        onClick={onToggle}
        className="w-full p-5 text-left flex justify-between items-center"
      >
        <span className={titleClass}>{title}</span>
        <svg 
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <div
        className={`overflow-hidden transition-all duration-200 ease-in-out ${
          isOpen ? "max-h-[9999px] border-t border-gray-100" : "max-h-0"
        }`}
      >
        {children}
      </div>
    </div>
  );
}