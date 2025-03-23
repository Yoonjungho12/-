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
    <div className="max-w-[600px] mx-auto p-4 text-base text-gray-700 leading-relaxed">
      {/* 상단: 프로필 영역 */}
      <div className="flex items-center justify-between mb-4">
        {/* 왼쪽: 프로필 or "로그인을 해주세요" */}
        {isLoggedIn ? (
          <div className="flex items-center space-x-3">
            {/* 임시 아바타 */}
            <div className="w-12 h-12 rounded-full bg-gray-500" />
            <span className="font-semibold text-lg">{nickname}</span>
          </div>
        ) : (
          <div className="text-lg text-gray-600 font-semibold">로그인을 해주세요</div>
        )}

        {/* 오른쪽: 정보수정/로그아웃 or 로그인/회원가입 */}
        {isLoggedIn ? (
          <div className="space-x-3 text-gray-600">
            <button onClick={handleEditNickname} className="hover:underline">
              정보수정
            </button>
            <button onClick={handleLogout} className="hover:underline">
              로그아웃
            </button>
          </div>
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={handleLogin}
              className="text-sm px-2 py-1 border border-gray-300 rounded"
            >
              로그인
            </button>
            <button
              onClick={handleSignup}
              className="text-sm px-2 py-1 border border-gray-300 rounded"
            >
              회원가입
            </button>
          </div>
        )}
      </div>

      {/* 닉네임 수정모드 UI */}
      {isEditingNickname && (
        <div className="mb-4">
          <input
            type="text"
            value={editNicknameInput}
            onChange={(e) => setEditNicknameInput(e.target.value)}
            className="w-48 border border-gray-300 rounded px-2 py-1 mr-2"
          />
          <button
            onClick={handleUpdateNickname}
            className="bg-green-500 text-white px-3 py-1 rounded mr-2"
          >
            변경
          </button>
          <button
            onClick={handleCancelEdit}
            className="bg-gray-300 text-gray-700 px-3 py-1 rounded"
          >
            취소
          </button>
        </div>
      )}

      <hr className="mb-2" />

      {/* 아코디언: 지역별 검색 */}
      <Accordion
        title="지역별 검색"
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

      {/* 실시간 인기 업체 */}
      <div className="space-y-2 mt-2">
        <Accordion
          title="실시간 인기 업체"
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
          내 주변 업체 찾기
        </Link>

        <Link
          href="/club/전체/전체/전체"
          className="block w-full p-3 bg-gray-100 text-left rounded"
        >
          클럽/나이트클럽
        </Link>

        {/* boards 테이블에서 불러온 커뮤니티 목록 */}
        <Accordion
          title="커뮤니티"
          titleClass=""
          isOpen={openDropdown === "community"}
          onToggle={() => toggleDropdown("community")}
        >
          <ul className="space-y-1">
            {communityBoards.length === 0 ? (
              <li className="text-sm text-gray-500">등록된 커뮤니티가 없습니다.</li>
            ) : (
              communityBoards.map((board) => (
                <li key={board.name}>
                  {/* Link 예: /community/board/자유게시판 */}
                  <Link
                    href={`/community/board/${board.name}`}
                    className="block hover:underline"
                  >
                    {board.name}
                  </Link>
                </li>
              ))
            )}
          </ul>
        </Accordion>
      </div>

      {/* 구분선 */}
      <hr className="my-4" />

      {/* 고객센터 */}
      <div>
        <div className="text-lg font-semibold mb-1">고객센터</div>
        <div className="text-sm leading-5">
          <div>평일 오전 9:30~18:00</div>
          <div>0504-1361-3000 (문자문의)</div>
          <div>카톡 1:1상담 입점문의</div>
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
    <div className="transition-all">
      <button
        onClick={onToggle}
        className="w-full p-3 bg-gray-100 text-left rounded flex justify-between items-center"
      >
        <span className={titleClass}>{title}</span>
        <span>{isOpen ? "▲" : "▼"}</span>
      </button>

      {/* 여기서 max-h를 크게 잡으면 길어도 잘리지 않음 */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out bg-gray-50 rounded mt-1 px-3 ${
          isOpen ? "max-h-[9999px] py-2" : "max-h-0 py-0"
        }`}
      >
        {children}
      </div>
    </div>
  );
}