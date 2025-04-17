"use client";

import Link from "next/link";
import ThemeSelectorMobile from "./ThemeSelectorMobile";
import { REGIONS } from "../../../../board/REGIONS";

// (1) 테마 목록 (기존과 동일)
const THEMES = [
  { id: 0,  name: "전체",       sort_order: 0 },
  { id: 27, name: "클럽",       sort_order: 27 },
  { id: 28, name: "나이트클럽", sort_order: 28 },
].sort((a, b) => a.sort_order - b.sort_order);

export default function RegionSelectorSSR({
  regionSlug,
  subregionSlug,
  themeName,
}) {
  // ─────────────────────────────────────────────────────
  // 1) 상위 지역
  // ─────────────────────────────────────────────────────
  let selectedParentId = 0;
  if (regionSlug !== "전체") {
    const foundMain = REGIONS.find(
      (r) => r.parent_id === null && r.region_slug === regionSlug
    );
    if (foundMain) selectedParentId = foundMain.id;
  }

  const mainRegionItems = [
    { id: 0, name: "전체", parent_id: null, region_slug: "전체" },
    ...REGIONS.filter((r) => r.parent_id === null),
  ];

  // ─────────────────────────────────────────────────────
  // 2) 하위 지역
  // ─────────────────────────────────────────────────────
  let selectedSubregionId = 0;
  let subregionItems = [];
  if (selectedParentId !== 0) {
    const allChild = {
      id: 0,
      name: "전체",
      parent_id: selectedParentId,
      region_slug: "전체",
    };
    const children = REGIONS
      .filter((r) => r.parent_id === selectedParentId)
      .sort((a, b) => a.sort_order - b.sort_order);

    subregionItems = [allChild, ...children];

    const foundChild = subregionItems.find(
      (child) => child.region_slug === subregionSlug
    );
    if (foundChild) {
      selectedSubregionId = foundChild.id;
    }
  }

  // ─────────────────────────────────────────────────────
  // 3) 테마 선택
  // ─────────────────────────────────────────────────────
  let selectedThemeIds = [];
  if (themeName === "전체") {
    selectedThemeIds = [0];
  } else {
    const foundT = THEMES.find((t) => t.name === themeName);
    selectedThemeIds = foundT ? [foundT.id] : [0];
  }

  // ─────────────────────────────────────────────────────
  // 4) 렌더 함수
  // ─────────────────────────────────────────────────────
  function renderCell(item, isSelected, linkHref) {
    // 공통 스타일
    const baseClass =
      "region-cell flex items-center justify-center text-xs md:text-sm px-3 py-2 cursor-pointer";

    // 선택된 경우 그라데이션
    const selectedClass =
      "bg-gradient-to-r from-orange-400 to-red-400 text-white font-bold";

    // 비선택 항목은 회색 배경
    const normalClass = "bg-gray-100 text-gray-600 hover:bg-gray-200";

    return (
      <Link key={item.id} href={linkHref}>
        <div className={`${baseClass} ${isSelected ? selectedClass : normalClass}`}>
          {item.name}
        </div>
      </Link>
    );
  }

  // ─────────────────────────────────────────────────────
  // 5) 렌더링
  // ─────────────────────────────────────────────────────
  return (
    <div className="w-full">
      {/* (A) 상단 안내 (PC 전용) */}
      <div className="flex flex-col md:flex-row items-center mt-3 md:mt-10 mb-3">
        <h2 className="font-bold text-xl mr-3 hide-on-mobile">
          지역별 업체 선택
        </h2>
        <p className="text-base text-gray-600 m-0 p-0 hide-on-mobile">
          인기있는 지역들을 보기쉽게 모아놨어요!
        </p>
      </div>

      {/* (B) 상위 지역 */}
      {regionSlug === "전체" && (
        <div className="region-grid-container mb-2">
          {mainRegionItems.map((item) => {
            const isSelected = item.id === selectedParentId;
            const href = `/club/${item.region_slug}/전체/${themeName || "전체"}`;
            return renderCell(item, isSelected, href);
          })}
        </div>
      )}

      {/* (C) 하위 지역 */}
      {regionSlug !== "전체" && (
        <>
          {subregionItems.length === 0 ? (
            <p className="text-sm text-gray-500 mb-2">
              상위 지역을 먼저 선택해주세요.
            </p>
          ) : (
            <div className="region-grid-container mb-2">
              {subregionItems.map((child) => {
                const isSelected = child.id === selectedSubregionId;
                const href = `/club/${regionSlug}/${child.region_slug}/${
                  themeName || "전체"
                }`;
                return renderCell(child, isSelected, href);
              })}
            </div>
          )}
        </>
      )}

      {/* (D) 테마 (PC/모바일) */}
      <div className="pc-theme mt-6">
        <h3 className="text-md font-bold mb-1">테마 선택</h3>
        <div className="theme-grid-container mb-2">
          {THEMES.map((th) => {
            const isSelected = selectedThemeIds.includes(th.id);
            const href = `/club/${regionSlug || "전체"}/${
              subregionSlug || "전체"
            }/${th.name}`;
            return renderCell(th, isSelected, href);
          })}
        </div>
      </div>

      {/* 모바일 테마 */}
      <div className="mobile-theme mt-3">
        <ThemeSelectorMobile
          regionSlug={regionSlug}
          subregionSlug={subregionSlug}
          themeName={themeName}
          selectedThemeIds={selectedThemeIds}
          allThemes={THEMES}
        />
      </div>
    </div>
  );
}