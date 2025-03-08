"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; // 페이지 이동용
import { supabase } from "@/lib/supabaseF"; // 이미 설정된 Supabase 클라이언트

export default function MyMobileUI() {
  const router = useRouter();

  // 로그인 세션, nickname
  const [session, setSession] = useState(null);
  const [nickname, setNickname] = useState("...");

  // 아코디언: "region" / "chulgeun" / "community" / null
  // 기본값 "region" → “지역별 샵”이 처음에 열려 있음
  const [openDropdown, setOpenDropdown] = useState("region");

  // (1) 세션 / nickname 불러오기
  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) console.error("Session Error:", sessionError);

      setSession(session);

      // 로그인된 경우 → profiles.nickname
      if (session?.user) {
        const userId = session.user.id;
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("nickname")
          .eq("user_id", userId)
          .single();
        if (!profileError && profile?.nickname) {
          setNickname(profile.nickname);
        }
      }
    };
    fetchUser();
  }, []);

  // (2) 로그인 상태
  const isLoggedIn = !!session?.user;

  // (3) 로그아웃 / 로그인 / 회원가입
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout Error:", error);
      return;
    }
    setSession(null); // 세션 제거
  };
  const handleLogin = () => {
    router.push("/login");
  };
  const handleSignup = () => {
    router.push("/signup");
  };

  // (4) 아코디언 토글
  function toggleDropdown(menuName) {
    setOpenDropdown((prev) => (prev === menuName ? null : menuName));
  }

  // (5) 메뉴 데이터
  const regionLinks = [
    { href: "/board/강남-서초-송파/전체", label: "강남/서초/송파" },
    { href: "/board/서울/전체", label: "서울" },
    {
      href: "/board/수원-동탄-용인-화성-평택-오산/전체",
      label: "수원/동탄/용인/화성/평택/오산",
    },
    {
      href: "/board/분당-성남-위례-경기광주-하남/전체",
      label: "분당/성남/위례/경기광주/하남",
    },
    {
      href: "/board/안양-군포-시흥-의왕/전체",
      label: "안양/광명/안산/군포/시흥/의왕",
    },
    { href: "/board/인천-부천-부평/전체", label: "인천/부천/부평" },
    { href: "/board/일산-김포-파주-고양/전체", label: "고양/일산/김포/파주" },
    {
      href: "/board/의정부-구리-남양주-포천-동두천/전체",
      label: "의정부/구리/남양주/포천/동두천",
    },
    {
      href: "/board/대전-천안-세종-충청-강원/전체",
      label: "대전/천안/세종/충청/강원",
    },
    {
      href: "/board/부산-대구-울산-경상도-전라도-광주/전체",
      label: "부산/대구/울산/경상도/전라도/광주",
    },
    { href: "/board/제주도/전체", label: "제주도" },
    { href: "/board/홈케어-방문관리/전체", label: "홈케어/방문관리" },
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
  const communityLinks = [
    { label: "자유게시판", href: "/community/free" },
    { label: "질문답변", href: "/community/qna" },
  ];

  return (
    // 상단 네비가 60px라고 가정 → 여기서 margin-top을 주어 본문이 가려지지 않게 함
    <div className="max-w-[600px] mx-auto p-4 text-base text-gray-700 leading-relaxed mt-[60px]">
      {/* 상단 프로필 영역 */}
      <div className="flex items-center justify-between mb-4">
        {isLoggedIn ? (
          // 로그인 O
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-gray-500" />
            <span className="font-semibold text-lg">{nickname}</span>
          </div>
        ) : (
          // 로그인 X
          <div className="text-lg text-gray-600 font-semibold">로그인을 해주세요</div>
        )}

        {/* 오른쪽 */}
        {isLoggedIn ? (
          <div className="space-x-3 text-gray-600">
            <button className="hover:underline" onClick={handleLogout}>
              로그아웃
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            <button
              onClick={handleLogin}
              className="text-sm px-2 py-1 border border-gray-300 rounded"
            >
              로그인
            </button>
            <button
              onClick={() => router.push("/signup")}
              className="text-sm px-2 py-1 border border-gray-300 rounded"
            >
              회원가입
            </button>
          </div>
        )}
      </div>

      <hr className="mb-2" />

      {/* 지역별 샵 */}
      <Accordion
        title="지역별 샵"
        titleClass="text-red-500 font-semibold"
        isOpen={openDropdown === "region"}
        onToggle={() => toggleDropdown("region")}
      >
        <ul className="space-y-1">
          {regionLinks.map((r) => (
            <li key={r.href}>
              <Link href={r.href} className="block hover:underline">
                {r.label}
              </Link>
            </li>
          ))}
        </ul>
      </Accordion>

      {/* 출근부 / 내주변 / 홈케어 / 커뮤니티 */}
      <div className="space-y-2 mt-2">
        <Accordion
          title="출근부"
          isOpen={openDropdown === "chulgeun"}
          onToggle={() => toggleDropdown("chulgeun")}
        >
          <ul className="space-y-1">
            {chulgeunRegions.map((item) => (
              <li key={item.label}>
                <Link href={item.href} className="block hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </Accordion>

        <Link
          href="/near-me"
          className="block w-full p-3 bg-gray-100 text-left rounded"
        >
          내주변
        </Link>

        <Link
          href="/board/홈케어-방문관리/전체"
          className="block w-full p-3 bg-gray-100 text-left rounded"
        >
          홈케어
        </Link>

        <Accordion
          title="커뮤니티"
          isOpen={openDropdown === "community"}
          onToggle={() => toggleDropdown("community")}
        >
          <ul className="space-y-1">
            {communityLinks.map((item) => (
              <li key={item.label}>
                <Link href={item.href} className="block hover:underline">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </Accordion>
      </div>
    </div>
  );
}

/**
 * 재사용 가능한 Accordion 컴포넌트
 */
function Accordion({ title, titleClass = "", isOpen, onToggle, children }) {
  return (
    <div className="transition-all">
      <button
        onClick={onToggle}
        className="w-full p-3 bg-gray-100 text-left rounded flex justify-between items-center"
      >
        <span className={titleClass}>{title}</span>
        <span>{isOpen ? "▲" : "▼"}</span>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out bg-gray-50 rounded mt-1 px-3 ${
          isOpen ? "max-h-[500px] py-2" : "max-h-0 py-0"
        }`}
      >
        {children}
      </div>
    </div>
  );
}