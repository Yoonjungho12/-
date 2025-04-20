"use client";

import Link from "next/link";
import ThemeSelectorMobile from "./ThemeSelectorMobile";
import { REGIONS } from "./REGIONS";

/** (1) 테마 목록 */
const THEMES = [
  { id: 0,  name: "전체",       sort_order: 0 },
  { id: 1,  name: "신규업체",   sort_order: 1 },
  { id: 19, name: "눈썹문신",   sort_order: 19 },
  { id: 20, name: "애견펜션",   sort_order: 20 },
  { id: 21, name: "사주",       sort_order: 21 },
  { id: 22, name: "타로",       sort_order: 22 },
  { id: 23, name: "아이폰-스냅", sort_order: 23 },
  { id: 24, name: "웨딩플래너", sort_order: 24 },
  { id: 25, name: "룸카페",     sort_order: 25 },
  { id: 26, name: "성인용품",   sort_order: 26 },
  { id: 27, name: "클럽",       sort_order: 27 },
  { id: 28, name: "나이트클럽", sort_order: 28 },
  { id: 29, name: "네일샵",     sort_order: 29 },
  { id: 30, name: "애견미용",   sort_order: 30 },
  { id: 31, name: "태닝샵",     sort_order: 31 },
  { id: 32, name: "왁싱샵",     sort_order: 32 },
  { id: 33, name: "라운지바",   sort_order: 33 },
  { id: 34, name: "헌팅포차",   sort_order: 34 },
  { id: 35, name: "바",        sort_order: 35 },
  { id: 36, name: "감성주점",   sort_order: 36 },
].sort((a, b) => a.sort_order - b.sort_order);

/**
 * RegionSelectorSSR
 * 
 * Props:
 *  - regionSlug: 상위 지역 슬러그("전체","강남-서초"... 등)
 *  - subregionSlug: 하위 지역 슬러그("전체","역삼동"... 등)
 *  - themeName: 테마("전체","클럽","사주",...)
 *
 * 로직:
 *  1) "전체"라면 상위 지역 목록만 보여주기
 *  2) 상위 지역이 선택된 상태면, 해당 parent_id에 속한 하위 지역 목록 표시
 *  3) 테마( THEMES )를 PC/모바일 구분해서 표시
 *
 * "선택된" 항목은 bg-gradient-to-r from-red-400 to-orange-400 text-white
 *  - 그 외 항목은 bg-gray-100 text-gray-600
 */
export default function RegionSelectorSSR({
  regionSlug,
  subregionSlug,
  themeName,
}) {
  // ───────────────────────────────────────────
  // (A) 상위 지역 로직
  // ───────────────────────────────────────────
  let selectedParentId = 0;
  if (regionSlug !== "전체") {
    // region_slug === "강남-서초" etc... => find
    const foundMain = REGIONS.find(
      (r) => r.parent_id === null && r.region_slug === regionSlug
    );
    if (foundMain) {
      selectedParentId = foundMain.id;
    }
  }

  // 상위 지역 리스트: "전체" + parent_id===null
  const mainRegionItems = [
    { id: 0, name: "전체", parent_id: null, region_slug: "전체" },
    ...REGIONS.filter((r) => r.parent_id === null),
  ];

  // ───────────────────────────────────────────
  // (B) 하위 지역 로직
  // ───────────────────────────────────────────
  let selectedSubregionId = 0;
  let subregionItems = [];
  if (selectedParentId !== 0) {
    // "전체" child
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

    // 현재 subregionSlug와 매칭되는 아이템
    const foundChild = subregionItems.find(
      (child) => child.region_slug === subregionSlug
    );
    if (foundChild) {
      selectedSubregionId = foundChild.id;
    }
  }

  // ───────────────────────────────────────────
  // (C) 테마 로직
  // ───────────────────────────────────────────
  let selectedThemeIds = [];
  if (themeName === "전체") {
    selectedThemeIds = [0];
  } else {
    const foundT = THEMES.find((t) => t.name === themeName);
    selectedThemeIds = foundT ? [foundT.id] : [0];
  }

  // ───────────────────────────────────────────
  // (D) 렌더 함수: 한 칸씩 그려주는 함수
  // ───────────────────────────────────────────
  function renderCell(item, isSelected, linkHref) {
    return (
      <Link key={item.id} href={linkHref} className="transform transition-all duration-200 hover:scale-[1.02]">
        <div className={`
          region-cell relative overflow-hidden rounded-xl shadow-sm
          ${isSelected 
            ? "bg-gradient-to-r from-rose-500 to-orange-400 text-white font-medium"
            : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-100"
          }
          ${item.name === "전체" ? "font-medium" : ""}
        `}>
          <div className="relative z-10 py-3 px-4">
            {item.name}
          </div>
          {isSelected && (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)]" />
          )}
        </div>
      </Link>
    );
  }

  // ───────────────────────────────────────────
  // (E) 렌더링
  // ───────────────────────────────────────────
  return (
    <div className="w-full px-4 md:px-0">
      <div className="flex flex-col md:flex-row items-center justify-between mt-3 md:mt-10 mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent hide-on-mobile">
            지역별 업체 선택
          </h2>
          <div className="hidden md:block h-6 w-px bg-gray-200 mx-2"></div>
          <p className="text-base text-gray-500 hide-on-mobile">
            인기있는 지역들을 보기쉽게 모아놨어요!
          </p>
        </div>
      </div>

      {/* 모바일 헤더 추가 */}
      <div className="block md:hidden mb-3">
        <h3 className="text-lg font-bold text-gray-900">
          {regionSlug === "전체" ? "지역 선택" : "상세 지역"}
        </h3>
      </div>

      {/* (1) 상위 지역 */}
      {regionSlug === "전체" && (
        <div className="region-grid-container mb-4">
          {mainRegionItems.map((item) => {
            const isSelected = item.id === selectedParentId;
            const href = `/board/${item.region_slug}/전체/${themeName || "전체"}`;
            return renderCell(item, isSelected, href);
          })}
        </div>
      )}

      {/* (2) 하위 지역 */}
      {regionSlug !== "전체" && (
        <>
          {subregionItems.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">상위 지역을 먼저 선택해주세요.</p>
            </div>
          ) : (
            <div className="region-grid-container mb-4">
              {subregionItems.map((child) => {
                const isSelected = child.id === selectedSubregionId;
                const href = `/board/${regionSlug}/${child.region_slug}/${themeName || "전체"}`;
                return renderCell(child, isSelected, href);
              })}
            </div>
          )}
        </>
      )}

      {/* (3) 테마 (PC용) */}
      <div className="pc-theme mt-8">
        <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          테마 선택
        </h3>
        <div className="theme-grid-container mb-4">
          {THEMES.map((th) => {
            const isSelected = selectedThemeIds.includes(th.id);
            const href = `/board/${regionSlug || "전체"}/${subregionSlug || "전체"}/${th.name}`;
            return renderCell(th, isSelected, href);
          })}
        </div>
      </div>

      {/* (4) 모바일 테마 */}
      <div className="mobile-theme mt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-gray-900">테마 선택</h3>
        </div>
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