"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseF";

/**
 * MobileTopBar
 * 
 * - "/" 경로에서는 이 컴포넌트를 렌더링하지 않음.
 * - 검색창 열기/닫기 시, title을 왼쪽 -100%로 밀어내는 애니메이션.
 * - /messages/[senderId] 일 경우, Supabase로 해당 프로필(user_id)의 닉네임 조회 후 표시.
 * - 나머지는 경로 세그먼트에 따라 dynamicTitle을 설정.
 */
export default function MobileTopBar({ title = "" }) {
  const router = useRouter();
  const pathname = usePathname();

  // ─────────────────────────────────────────
  // (1) 최상위 Hooks: useState, useEffect 등
  // ─────────────────────────────────────────
  const [showSearch, setShowSearch] = useState(false); 
  const [searchTerm, setSearchTerm] = useState("");
  const [isComposing, setIsComposing] = useState(false);

  // 메시지용 닉네임: /messages/[senderId]에서 Supabase로 불러옴
  const [senderNickname, setSenderNickname] = useState("");

  // ─────────────────────────────────────────
  // (2) "/"면 컴포넌트 자체를 null 반환
  //    (Hook 호출은 이미 위에서 되어 있으니 안전)
  // ─────────────────────────────────────────
  if (pathname === "/") {
    return null;
  }

  // ─────────────────────────────────────────
  // (3) 경로 세그먼트에 따라 중앙 타이틀 설정
  // ─────────────────────────────────────────
  const segments = pathname.split("/").filter(Boolean);
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
      dynamicTitle = "1:1 채팅";
    } else {
      dynamicTitle = senderNickname || "상대방";
    }
  } else if (segments[0] === "mypage") {
    dynamicTitle = "마이페이지";
  } else if (segments[0] === "all") {
    dynamicTitle = "전체 카테고리";
  }

  // ─────────────────────────────────────────
  // (4) /messages/[senderId] → Supabase로 닉네임 로딩
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
  // (5) 뒤로가기
  // ─────────────────────────────────────────
  const handleBack = () => {
    router.back();
  };

  // ─────────────────────────────────────────
  // (6) 검색창 열고 닫기 (슬라이드)
  // ─────────────────────────────────────────
  const handleSearchToggle = () => {
    if (showSearch) {
      // 닫을 시에는 검색어를 리셋
      setSearchTerm("");
      setIsComposing(false);
    }
    setShowSearch(!showSearch);
  };

  // 검색 확정 → "/search?q=..." 이동
  const handleSearchConfirm = () => {
    const query = searchTerm.trim();
    if (!query) return;
    router.push(`/search?q=${encodeURIComponent(query)}`);
    setShowSearch(false);
    setSearchTerm("");
    setIsComposing(false);
  };

  // (F) Enter키(IME 완료 시)
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !isComposing) {
      handleSearchConfirm();
    }
  };

  // (G) 한글 IME 조합
  const handleComposition = (e) => {
    if (e.type === "compositionstart") {
      setIsComposing(true);
    } else if (e.type === "compositionend") {
      setIsComposing(false);
      setSearchTerm(e.target.value);
    }
  };

  // (H) 일반 onChange
  const handleChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // ─────────────────────────────────────────
  // (7) 렌더링
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
      {/* 왼쪽 아이콘: 뒤로가기 */}
      <button
        onClick={handleBack}
        aria-label="뒤로가기"
        className="p-1 mr-2"
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
          <line x1="20" y1="12" x2="4" y2="12" />
          <polyline points="10 18 4 12 10 6" />
        </svg>
      </button>

      {/* 중앙 영역: 타이틀 + 검색창 겹치기 */}
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
            // 검색창 열릴 때 => 타이틀을 왼쪽(-100%)으로 이동
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
            // 검색창 열리면 → 0%, 닫히면 → 100%
            transform: showSearch ? "translateX(0)" : "translateX(100%)",
          }}
        />
      </div>

      {/* (c) 오른쪽 아이콘 (검색 열기/검색 확정) */}
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