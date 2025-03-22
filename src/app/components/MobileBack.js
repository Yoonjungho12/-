"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseF";

/**
 * MobileTopBar
 * - 루트("/") 경로에서는 컴포넌트 자체를 렌더링하지 않음
 * - 검색창 열고 닫기 슬라이드 애니메이션
 * - 한글 IME 문제 해결
 * - /board/* => "지역별 업체 선택"
 *   /today/* => "실시간 인기 업체"
 *   /near-me => "내 주변 업체 찾기"
 *   /club/* => "나이트/클럽"
 *   /community* => "커뮤니티"
 *   /messages => "1:1 채팅"
 *   /messages/[senderId] => 해당 user_id의 닉네임
 *   (이때, Supabase로 프로필 닉네임 조회)
 *   나머지는 title 미표시
 */
export default function MobileTopBar({ title = "" }) {
  const router = useRouter();
  const pathname = usePathname();

  // ─────────────────────────────────────────
  // 1) Hooks (최상위 호출, 문제 없음)
  // ─────────────────────────────────────────
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isComposing, setIsComposing] = useState(false);

  // (A) /messages/[senderId] 전용 닉네임 상태
  const [senderNickname, setSenderNickname] = useState("");

  // ─────────────────────────────────────────
  // 2) pathname === "/"이면 컴포넌트 자체 렌더링 안 함
  // ─────────────────────────────────────────
  if (pathname === "/") {
    return null;
  }

  // ─────────────────────────────────────────
  // 3) 경로 기반 타이틀 매핑
  // ─────────────────────────────────────────
  const segments = pathname.split("/").filter(Boolean); // "" 제거
  let dynamicTitle = "";

  if (segments[0] === "board") {
    dynamicTitle = "지역별 업체 선택";
  } else if (segments[0] === "today") {
    dynamicTitle = "실시간 인기 업체";
  } else if (pathname === "/near-me") {
    dynamicTitle = "내 주변 업체 찾기";
  } else if (segments[0] === "club") {
    dynamicTitle = "나이트/클럽";
  } else if (segments[0] === "community") {
    dynamicTitle = "커뮤니티";
  } else if (segments[0] === "messages") {
    // /messages/[senderId]
    if (segments.length === 1) {
      // /messages
      dynamicTitle = "1:1 채팅";
    } else {
      // /messages/[senderId]
      dynamicTitle = senderNickname || "상대방";
    }
  } else if (segments[0] === "mypage") {
    dynamicTitle = "마이페이지";
  } else if (segments[0] === "all") {
    dynamicTitle = "전체 카테고리";
  }

  // ─────────────────────────────────────────
  // 4) /messages/[senderId] → Supabase에서 프로필 닉네임 로딩
  // ─────────────────────────────────────────
  useEffect(() => {
    if (segments[0] === "messages" && segments[1]) {
      const fetchSenderNickname = async () => {
        try {
          const { data, error } = await supabase
            .from("profiles")
            .select("nickname")
            .eq("user_id", segments[1])
            .single();

          if (!error && data?.nickname) {
            setSenderNickname(data.nickname);
          } else {
            setSenderNickname("알 수 없는 유저");
          }
        } catch (err) {
          console.error("sender nickname fetch error:", err);
          setSenderNickname("오류");
        }
      };
      fetchSenderNickname();
    }
  }, [segments]);

  // ─────────────────────────────────────────
  // 5) 뒤로가기
  // ─────────────────────────────────────────
  const handleBack = () => {
    router.back();
  };

  // ─────────────────────────────────────────
  // 6) 검색창 열고 닫기
  // ─────────────────────────────────────────
  const handleSearchToggle = () => {
    if (showSearch) {
      // 이미 열려 있다면(닫는 시점) => 상태 초기화
      setSearchTerm("");
      setIsComposing(false);
    }
    setShowSearch((prev) => !prev);
  };

  // (E) 검색 확정
  const handleSearchConfirm = () => {
    const query = searchTerm.trim();
    if (!query) return;
    router.push(`/search?q=${encodeURIComponent(query)}`);
    setShowSearch(false);
    setSearchTerm("");
    setIsComposing(false);
  };

  // (F) Enter 키 (IME 확정 상태에서만)
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !isComposing) {
      handleSearchConfirm();
    }
  };

  // (G) 한글 IME 조합 이벤트
  const handleComposition = (e) => {
    if (e.type === "compositionstart") {
      setIsComposing(true);
    } else if (e.type === "compositionend") {
      setIsComposing(false);
      setSearchTerm(e.target.value);
    }
  };

  // (H) onChange
  const handleChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // ─────────────────────────────────────────
  // 7) 최종 렌더링
  // ─────────────────────────────────────────
  return (
    <div
      className="
        fixed top-0 left-0 right-0 z-50
        flex items-center
        px-4 py-3
        bg-white
        border-b border-gray-200
      "
      style={{ height: "56px" }}
    >
      {/* (a) 왼쪽 아이콘 (뒤로가기) */}
      <button onClick={handleBack} aria-label="뒤로가기" className="p-1 mr-2">
        <svg
          width="24"
          height="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="20" y1="12" x2="4" y2="12" />
          <polyline points="10 18 4 12 10 6" />
        </svg>
      </button>

      {/* (b) 중앙 영역: 타이틀 + 검색창 겹치기 */}
      <div className="relative flex-1 h-8 mx-2 overflow-hidden">
        {/* (i) 타이틀 */}
        <h1
          className="
            absolute top-0 left-0 w-full h-full
            flex items-center justify-center
            text-base font-medium
            transition-transform duration-300
          "
          style={{
            // 검색창 열릴 때 타이틀 왼쪽(-100%)으로 이동
            transform: showSearch ? "translateX(-100%)" : "translateX(0)",
          }}
        >
          {dynamicTitle}
        </h1>

        {/* (ii) 검색창 */}
        <input
          type="text"
          value={searchTerm}
          onChange={handleChange}
          onCompositionStart={handleComposition}
          onCompositionUpdate={handleComposition}
          onCompositionEnd={handleComposition}
          onKeyDown={handleKeyDown}
          placeholder="검색어를 입력하세요"
          className="
            absolute top-0 left-0
            w-full h-full
            rounded-full
            border border-gray-300
            px-3 text-sm
            focus:outline-none
            focus:border-red-400
            transition-transform duration-300
          "
          style={{
            // 검색창 열릴 때 0%, 닫힐 때 100%
            transform: showSearch ? "translateX(0)" : "translateX(100%)",
          }}
        />
      </div>

      {/* (c) 오른쪽 아이콘 (검색 열기 / 검색 확정) */}
      {showSearch ? (
        <button
          onClick={handleSearchConfirm}
          aria-label="검색 확정"
          className="p-1 ml-2"
        >
          <svg
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
      ) : (
        <button
          onClick={handleSearchToggle}
          aria-label="검색 열기"
          className="p-1 ml-2"
        >
          <svg
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </button>
      )}
    </div>
  );
}