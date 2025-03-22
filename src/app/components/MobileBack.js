"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseF";

/**
 * MobileTopBar (원래 MobileBack.js 안에 있던 것)
 *
 * - "/" 경로면 컴포넌트 자체를 렌더링하지 않음 (null 반환)
 * - /board/*, /today/*, /near-me, /club/*, /community*, /messages, etc. 각자 맞는 타이틀 표시
 * - /messages/[senderId]이면 Supabase에서 닉네임 로딩
 * - 검색창 열고 닫기: 슬라이드 애니메이션
 * - 한글 IME(조합) 문제 해결
 */
export default function MobileTopBar({ title = "" }) {
  // ─────────────────────────────────────────
  // (1) 훅은 항상 최상단에서 호출
  // ─────────────────────────────────────────
  const router = useRouter();
  const pathname = usePathname();

  // 검색 관련 상태
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isComposing, setIsComposing] = useState(false);

  // /messages/[senderId]에서 쓰일 닉네임
  const [senderNickname, setSenderNickname] = useState("");

  // pathname 세그먼트
  const segments = pathname.split("/").filter(Boolean);

  // ─────────────────────────────────────────
  // (2) Supabase로 /messages/[senderId]의 닉네임 로딩
  // ─────────────────────────────────────────
  useEffect(() => {
    if (segments[0] === "messages" && segments[1]) {
      const fetchNickname = async () => {
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
      fetchNickname();
    }
  }, [segments]);

  // ─────────────────────────────────────────
  // (3) "/" 경로일 때는 여기서 일단 훅을 모두 호출하고,
  //     마지막에 UI를 숨김(return null)
  // ─────────────────────────────────────────
  if (pathname === "/") {
    return null; // 훅은 이미 호출됐으므로 규칙 위반X
  }

  // ─────────────────────────────────────────
  // (4) 경로별 타이틀 정하기
  // ─────────────────────────────────────────
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
  // (5) 뒤로가기 버튼
  // ─────────────────────────────────────────
  const handleBack = () => {
    router.back();
  };

  // ─────────────────────────────────────────
  // (6) 검색창 열고 닫기
  // ─────────────────────────────────────────
  const handleSearchToggle = () => {
    if (showSearch) {
      // 닫을 때 검색어 초기화
      setSearchTerm("");
      setIsComposing(false);
    }
    setShowSearch((prev) => !prev);
  };

  // 검색 확정
  const handleSearchConfirm = () => {
    const query = searchTerm.trim();
    if (!query) return;
    router.push(`/search?q=${encodeURIComponent(query)}`);
    setShowSearch(false);
    setSearchTerm("");
    setIsComposing(false);
  };

  // Enter키 (IME 완료 상태에서만)
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !isComposing) {
      handleSearchConfirm();
    }
  };

  // IME 조합 이벤트
  const handleComposition = (e) => {
    if (e.type === "compositionstart") {
      setIsComposing(true);
    } else if (e.type === "compositionend") {
      setIsComposing(false);
      setSearchTerm(e.target.value);
    }
  };

  // onChange
  const handleChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // ─────────────────────────────────────────
  // (7) 최종 렌더링
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
      {/* (왼쪽) 뒤로가기 아이콘 */}
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

      {/* (가운데) 타이틀 + 검색창 겹치기 */}
      <div className="relative flex-1 h-8 mx-2 overflow-hidden">
        {/* 타이틀 */}
        <h1
          className="
            absolute top-0 left-0 w-full h-full
            flex items-center justify-center
            text-base font-medium
            transition-transform duration-300
          "
          style={{
            transform: showSearch ? "translateX(-100%)" : "translateX(0)",
          }}
        >
          {dynamicTitle}
        </h1>

        {/* 검색창 */}
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
            transform: showSearch ? "translateX(0)" : "translateX(100%)",
          }}
        />
      </div>

      {/* (오른쪽) 검색 열기/확정 아이콘 */}
      {showSearch ? (
        <button onClick={handleSearchConfirm} aria-label="검색 확정" className="p-1 ml-2">
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
        <button onClick={handleSearchToggle} aria-label="검색 열기" className="p-1 ml-2">
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