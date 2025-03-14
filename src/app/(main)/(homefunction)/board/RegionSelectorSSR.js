"use client";

import Link from "next/link";
import ThemeSelectorMobile from "./ThemeSelectorMobile"; // 모바일 전용 (클라이언트 컴포넌트)

/**
 * RegionSelectorSSR
 * - PC: table(6칸 or 7칸) 레이아웃
 * - 모바일: 3칸 Flex로 정렬
 * - regionSlug / themeName 파라미터에 따라 선택 상태 표시
 * - 지역/테마 전부 하드코딩
 */

// 1) 지역 목록
const REGIONS = [
  // 상위 지역
  { id: 1,  name: "강남/서초/송파", parent_id: null, sort_order: 1,  region_slug: "강남-서초-송파" },
  { id: 2,  name: "서울",          parent_id: null, sort_order: 2,  region_slug: "서울" },
  { id: 3,  name: "수원/동탄/용인/화성/평택/오산", parent_id: null, sort_order: 3,  region_slug: "수원-동탄-용인-화성-평택-오산" },
  { id: 4,  name: "분당/성남/위례/경기광주/하남", parent_id: null, sort_order: 4,  region_slug: "분당-성남-위례-경기광주-하남" },
  { id: 5,  name: "인천/부천/부평", parent_id: null, sort_order: 5,  region_slug: "인천-부천-부평" },
  { id: 6,  name: "안양/군포/시흥/의왕", parent_id: null, sort_order: 6,  region_slug: "안양-군포-시흥-의왕" },
  { id: 7,  name: "일산/김포/파주/고양", parent_id: null, sort_order: 7,  region_slug: "일산-김포-파주-고양" },
  { id: 8,  name: "의정부/구리/남양주/포천/동두천", parent_id: null, sort_order: 8,  region_slug: "의정부-구리-남양주-포천-동두천" },
  { id: 9,  name: "대전/천안/세종/충청/강원", parent_id: null, sort_order: 9,  region_slug: "대전-천안-세종-충청-강원" },
  { id: 10, name: "부산/대구/울산/경상도/전라도/광주", parent_id: null, sort_order: 10, region_slug: "부산-대구-울산-경상도-전라도-광주" },
  { id: 11, name: "제주도", parent_id: null, sort_order: 11, region_slug: "제주도" },

  // 하위 지역 (생략 없이 전부 하드코딩)
  { id: 13, name: "강남구", parent_id: 1, sort_order: 1, region_slug: "강남구" },
  // ... 이하 전부 유지 ...
  { id: 97, name: "서귀포시", parent_id: 11, sort_order: 2, region_slug: "서귀포시" },
];

// 2) 테마 목록
const THEMES = [
  { id: 0,  name: "전체",       sort_order: 0 },
  { id: 1,  name: "신규업체",   sort_order: 1 },
  { id: 19, name: "눈썹문신",   sort_order: 19 },
  { id: 20, name: "애견펜션",   sort_order: 20 },
  { id: 21, name: "사주",      sort_order: 21 },
  { id: 22, name: "타로",      sort_order: 22 },
  { id: 23, name: "아이폰-스냅", sort_order: 23 },
  { id: 24, name: "웨딩플래너", sort_order: 24 },
  { id: 25, name: "룸카페",    sort_order: 25 },
  { id: 26, name: "성인용품",  sort_order: 26 },
  { id: 27, name: "클럽",     sort_order: 27 },
  { id: 28, name: "나이트클럽", sort_order: 28 },
  { id: 29, name: "네일샵",   sort_order: 29 },
  { id: 30, name: "애견미용", sort_order: 30 },
  { id: 31, name: "태닝샵",   sort_order: 31 },
  { id: 32, name: "왁싱샵",   sort_order: 32 },
  { id: 33, name: "라운지바", sort_order: 33 },
  { id: 34, name: "헌팅포차", sort_order: 34 },
  { id: 35, name: "바",      sort_order: 35 },
  { id: 36, name: "감성주점", sort_order: 36 },
].sort((a, b) => a.sort_order - b.sort_order);

// 3) chunkArray
function chunkArray(array, size) {
  const result = [];
  for (let i = 0; i < array.length; i += size) {
    result.push(array.slice(i, i + size));
  }
  return result;
}

export default function RegionSelectorSSR({ regionSlug, themeName }) {
  // ────────────────────────────────────────────────────
  // A) regionSlug 분석
  // ────────────────────────────────────────────────────
  let selectedParentId = 0;
  let selectedChildId = 0;
  if (regionSlug === "전체") {
    selectedParentId = 0;
    selectedChildId = 0;
  } else {
    const matched = REGIONS.find((r) => r.region_slug === regionSlug);
    if (matched) {
      if (matched.parent_id === null) {
        selectedParentId = matched.id;
        selectedChildId = 0;
      } else {
        selectedParentId = matched.parent_id;
        selectedChildId = matched.id;
      }
    }
  }

  // B) 상위 지역 목록 + "전체"
  const parentItems = [
    { id: 0, name: "전체", parent_id: null, region_slug: "전체" },
    ...REGIONS.filter((r) => r.parent_id === null),
  ];

  // C) 하위 지역 목록 + "전체"
  let childItems = [];
  if (selectedParentId !== 0) {
    const parentObj = REGIONS.find((r) => r.id === selectedParentId);
    if (parentObj) {
      const children = REGIONS
        .filter((r) => r.parent_id === parentObj.id)
        .sort((a, b) => a.sort_order - b.sort_order);
      childItems = [
        {
          id: 0,
          name: "전체",
          parent_id: parentObj.id,
          region_slug: parentObj.region_slug,
        },
        ...children,
      ];
    }
  }

  // D) themeName 분석
  let selectedThemeIds = [];
  if (themeName === "전체") {
    selectedThemeIds = [0];
  } else {
    const matchedT = THEMES.find((t) => t.name === themeName);
    if (matchedT) {
      selectedThemeIds = [matchedT.id];
    } else {
      selectedThemeIds = [0];
    }
  }

  // ────────────────────────────────────────────────────
  // E) 스타일
  // ────────────────────────────────────────────────────
  // 테이블에는 border가 없고, 각 td에만 border-bottom, border-right
  const tableStyle = {
    width: "100%",
    borderCollapse: "separate",
    borderSpacing: 0,
    marginBottom: "1rem",
  };
  // 셀은 partial border → 아래/오른쪽만 표시
  function getTdStyle(isSelected) {
    return {
      borderBottom: "1px solid #ddd",
      borderRight: "1px solid #ddd",
      padding: "8px",
      cursor: "pointer",
      backgroundColor: isSelected ? "#f9665e" : "#fff",
      color: isSelected ? "#fff" : "#333",
      textAlign: "center",
      verticalAlign: "middle",
    };
  }

  // ────────────────────────────────────────────────────
  // F) 렌더링
  // ────────────────────────────────────────────────────
  return (
    <div>
      {/* 상단 헤더 */}
      <div className="flex flex-col md:flex-row items-center mt-3 md:mt-10 mb-3">
        <h2 className="font-bold text-xl mr-3">지역별 업체 선택</h2>
        <p className="text-base text-gray-600 m-0 p-0">
          인기있는 지역들을 보기쉽게 모아놨어요!
        </p>
      </div>

      {/* (1) 상위 지역 (6칸) */}
      <table className="region-table" style={tableStyle}>
        <tbody>
          {chunkArray(parentItems, 6).map((row, idx) => (
            <tr key={idx}>
              {row.map((item) => {
                const isSelected = selectedParentId === item.id;
                const href = `/board/${item.region_slug}/${themeName}`;
                return (
                  <td key={item.id} style={getTdStyle(isSelected)}>
                    <Link
                      className="text-sm"
                      href={href}
                      style={{ display: "block" }}
                    >
                      {item.name}
                    </Link>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* (2) 하위 지역 (7칸) */}
      {selectedParentId !== 0 && childItems.length > 0 && (
        <table className="region-table" style={tableStyle}>
          <tbody>
            {chunkArray(childItems, 7).map((row, idx) => (
              <tr key={idx}>
                {row.map((child) => {
                  const isSelected = selectedChildId === child.id;
                  const href = `/board/${child.region_slug}/${themeName}`;
                  return (
                    <td key={child.id} style={getTdStyle(isSelected)}>
                      <Link
                        className="text-sm"
                        href={href}
                        style={{ display: "block" }}
                      >
                        {child.name}
                      </Link>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* (3) PC 테마 */}
      <div className="pc-theme">
        <div className="flex flex-col md:flex-row items-center mt-10 mb-3">
          <h2 className="text-xl font-bold mr-3">테마별 업체 선택</h2>
          <p className="text-base text-gray-600 m-0 p-0">
            원하는 테마를 골라보세요!
          </p>
        </div>

        <table className="region-table" style={tableStyle}>
          <tbody>
            {chunkArray(THEMES, 9).map((row, rowIdx) => (
              <tr key={rowIdx}>
                {row.map((th) => {
                  const isSelected = selectedThemeIds.includes(th.id);
                  const href = `/board/${regionSlug}/${th.name}`;
                  return (
                    <td key={th.id} style={getTdStyle(isSelected)}>
                      <Link
                        className="text-sm"
                        href={href}
                        style={{ display: "block" }}
                      >
                        {th.name}
                      </Link>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* (4) 모바일 테마 (Client) */}
      <div className="mobile-theme" style={{ marginTop: "2rem" }}>
        <ThemeSelectorMobile
          regionSlug={regionSlug}
          themeName={themeName}
          selectedThemeIds={selectedThemeIds}
          allThemes={THEMES}
        />
      </div>

      {/* (5) 미디어 쿼리 */}
      <style jsx>{`
        /* PC 에선 pc-theme 보이고 mobile-theme 숨김 */
        @media (min-width: 769px) {
          .pc-theme {
            display: block;
          }
          .mobile-theme {
            display: none;
          }
        }
        /* 모바일에서는 pc-theme 숨기고 mobile-theme 보임 */
        @media (max-width: 768px) {
          .pc-theme {
            display: none;
          }
          .mobile-theme {
            display: block;
          }
        }

        /* 모바일: 3열 Flex */
        @media (max-width: 768px) {
          .region-table {
            display: flex;
            flex-wrap: wrap;
          }
          .region-table tbody,
          .region-table tr {
            display: flex;
            flex-wrap: wrap;
            margin: 0;
            padding: 0;
          }
          .region-table td {
            /* 한 행에 3칸씩 */
            flex: 0 0 33.3333%;
            box-sizing: border-box;

            /* 수직중앙 (vertical-align 대신) */
            display: flex;
            align-items: center;
            justify-content: center;

            /* 폰트, 패딩 축소 */
            font-size: 12px;
            padding: 6px;

            /* partial border 유지 */
            border-bottom: 1px solid #ddd;
            border-right: 1px solid #ddd;
          }
        }
      `}</style>
    </div>
  );
}