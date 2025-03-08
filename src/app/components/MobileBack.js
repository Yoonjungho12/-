"use client";

import { useRouter } from "next/navigation";

/**
 * MobileTopBar (고정된 상단 바)
 * - 왼쪽: 뒤로가기 아이콘
 * - 가운데: 타이틀
 * - 오른쪽: 검색 아이콘
 * - 완전 고정 (fixed)
 */
export default function MobileTopBar({ title = "" }) {
  const router = useRouter();

  // 뒤로가기
  const handleBack = () => {
    router.back();
  };

  // 검색
  const handleSearch = () => {
    alert("검색 아이콘 클릭! 원하는 동작을 추가하세요.");
    // router.push("/search");
  };

  return (
    <div
      className="
        fixed top-0 left-0 right-0 z-50
        flex items-center justify-between
        px-4 py-3
        bg-white
        border-b border-gray-200
      "
      style={{ height: "56px" }}
    >
      {/* 왼쪽 아이콘 */}
      <button onClick={handleBack} aria-label="뒤로가기" className="p-1">
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

      {/* 중앙 타이틀 */}
      <h1 className="text-base font-medium flex-1 text-center">{title}</h1>

      {/* 오른쪽 아이콘 */}
      <button onClick={handleSearch} aria-label="검색" className="p-1">
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
    </div>
  );
}