"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * MobileTopBar
 * - 검색창 펼칠 때 오른쪽→왼쪽 슬라이드
 * - 닫을 때 왼쪽→오른쪽 슬라이드
 * - 한글 IME 문제 해결 (조합 중에도 타이핑 반영)
 * - 포커스 시 전체 테두리에 표시되는 링
 */
export default function MobileTopBar({ title = "" }) {
  const router = useRouter();

  // (A) 검색창 열림/닫힘
  const [showSearch, setShowSearch] = useState(false);
  // (B) 검색 입력값
  const [searchTerm, setSearchTerm] = useState("");
  // (C) 한글 입력(IME) 중인지 여부
  const [isComposing, setIsComposing] = useState(false);

  // (1) 뒤로가기
  const handleBack = () => {
    router.back();
  };

  // (2) 검색창 열고 닫기
  const handleSearchToggle = () => {
    // 이미 열려 있으면(닫히는 시점) → 입력값 초기화
    if (showSearch) {
      setSearchTerm("");
      setIsComposing(false);
    }
    setShowSearch((prev) => !prev);
  };

  // (3) 검색 확정
  const handleSearchConfirm = () => {
    const query = searchTerm.trim();
    if (!query) return;

    router.push(`/search?q=${encodeURIComponent(query)}`);
    // 검색 후 닫기
    setShowSearch(false);
    setSearchTerm("");
    setIsComposing(false);
  };

  // (4) 엔터키
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !isComposing) {
      handleSearchConfirm();
    }
  };

  // (5) IME 조합 이벤트
  const handleComposition = (e) => {
    if (e.type === "compositionstart") {
      setIsComposing(true);
    } else if (e.type === "compositionend") {
      setIsComposing(false);
      // 조합 끝난 뒤 최종값 반영
      setSearchTerm(e.target.value);
    }
  };

  // (6) onChange
  const handleChange = (e) => {
    // 조합 중에도 임시로 표시
    setSearchTerm(e.target.value);
  };

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
      {/* 왼쪽 아이콘 (뒤로가기) */}
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

      {/* 중앙 영역: 타이틀+검색창 겹치기 */}
      <div className="relative flex-1 h-8 mx-2 overflow-hidden">
        {/* (a) 타이틀 */}
        <h1
          className="
            absolute top-0 left-0 w-full h-full
            flex items-center justify-center
            text-base font-medium
            transition-transform duration-300
          "
          style={{
            // 검색창 열릴 때 왼쪽으로 사라짐
            transform: showSearch ? "translateX(-100%)" : "translateX(0)",
          }}
        >
          {title}
        </h1>

        {/* (b) 검색창 */}
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

            /* 포커스링: 전체 테두리를 감싸도록 */
            focus:outline-none
    
            focus:border-red-400
            
            focus:ring-offset-white

            /* 부드러운 슬라이드 아웃/인 */
            transition-transform duration-300
          "
          style={{
            // 검색창 열릴 때 오른쪽→왼쪽 (0), 닫힐 때 왼쪽→오른쪽(100%)
            transform: showSearch ? "translateX(0)" : "translateX(100%)",
          }}
        />
      </div>

      {/* 오른쪽 아이콘 (검색 or 검색확정) */}
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