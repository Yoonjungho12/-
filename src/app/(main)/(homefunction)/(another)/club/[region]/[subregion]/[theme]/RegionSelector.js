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

  // ─────────────────────────────────────────────────────
  // 5) 렌더링
  // ─────────────────────────────────────────────────────
  return (
    <div className="w-full px-4 md:px-0">
      <div className="flex flex-col md:flex-row items-center justify-between mt-3 md:mt-10 mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent hide-on-mobile">
            지역별 클럽 선택
          </h2>
          <div className="hidden md:block h-6 w-px bg-gray-200 mx-2"></div>
          <p className="text-base text-gray-500 hide-on-mobile">
            인기있는 클럽들을 지역별로 모아놨어요!
          </p>
        </div>
      </div>

      {regionSlug === "전체" && (
        <div className="region-grid-container gap-3 mb-4">
          {mainRegionItems.map((item) => {
            const isSelected = item.id === selectedParentId;
            const href = `/club/${item.region_slug}/전체/${themeName || "전체"}`;
            return renderCell(item, isSelected, href);
          })}
        </div>
      )}

      {regionSlug !== "전체" && (
        <>
          {subregionItems.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">상위 지역을 먼저 선택해주세요.</p>
            </div>
          ) : (
            <div className="region-grid-container gap-3 mb-4">
              {subregionItems.map((child) => {
                const isSelected = child.id === selectedSubregionId;
                const href = `/club/${regionSlug}/${child.region_slug}/${themeName || "전체"}`;
                return renderCell(child, isSelected, href);
              })}
            </div>
          )}
        </>
      )}

      <div className="pc-theme mt-8">
        <h3 className="text-xl font-bold mb-4 bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          테마 선택
        </h3>
        <div className="theme-grid-container gap-3 mb-4">
          {THEMES.map((th) => {
            const isSelected = selectedThemeIds.includes(th.id);
            const href = `/club/${regionSlug || "전체"}/${subregionSlug || "전체"}/${th.name}`;
            return renderCell(th, isSelected, href);
          })}
        </div>
      </div>

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