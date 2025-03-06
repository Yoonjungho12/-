"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseF";
import { useRouter } from "next/navigation";

// 부모 컨테이너 스타일 (가운데 정렬 + 최대폭)
const outerStyle = {
  maxWidth: "1000px", // 원하는 대로 조정 (예: 1000px)
  margin: "0 auto",   // 수평 가운데 정렬
};

// 테이블 스타일 (폭 100%, 칼럼 균등 분배)
const tableStyle = {
  width: "100%",
  tableLayout: "fixed",  // ★ 고정 테이블 레이아웃
  borderCollapse: "collapse",
  marginBottom: "1rem",
};

// td 스타일: 선택되면 배경/글자색 변경
function getTdStyle(isSelected) {
  return {
    border: "1px solid #ddd",
    padding: "8px",
    cursor: "pointer",
    backgroundColor: isSelected ? "#f9665e" : "#fff",
    color: isSelected ? "#fff" : "#333",
    textAlign: "center",
    verticalAlign: "middle",
  };
}

// 스켈레톤 (테이블)
function SkeletonTable({ columnCount = 7, rowCount = 2 }) {
  const rows = Array.from({ length: rowCount }, (_, rowIdx) => {
    const cells = Array.from({ length: columnCount }, (_, cellIdx) => (
      <td
        key={cellIdx}
        style={{
          border: "1px solid #ddd",
          padding: "8px",
          backgroundColor: "#eee",
          textAlign: "center",
          verticalAlign: "middle",
        }}
      />
    ));
    return <tr key={rowIdx}>{cells}</tr>;
  });
  return (
    <table style={tableStyle}>
      <tbody>{rows}</tbody>
    </table>
  );
}

export default function RegionSelectorClient({ regionSlug, themeName }) {
  const router = useRouter();

  // 로딩 상태
  const [isLoadingTopItems, setIsLoadingTopItems] = useState(false);
  const [isLoadingThemes, setIsLoadingThemes] = useState(false);

  // 상위·하위 지역
  const [topItems, setTopItems] = useState([]);
  const [childItems, setChildItems] = useState([]);
  const [selectedParentId, setSelectedParentId] = useState(null);
  const [selectedChildId, setSelectedChildId] = useState(null);

  // 테마
  const [themes, setThemes] = useState([]);
  const [selectedThemeIds, setSelectedThemeIds] = useState([]);

  // ─────────────────────────────────────────────────────────
  // 1) 초기 로드
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    setIsLoadingTopItems(true);
    fetchTopRegions().finally(() => {
      setIsLoadingTopItems(false);
    });

    setIsLoadingThemes(true);
    fetchThemes().finally(() => {
      setIsLoadingThemes(false);
    });
  }, []);

  async function fetchTopRegions() {
    try {
      const { data, error } = await supabase
        .from("regions")
        .select("id, name, region_slug, parent_id")
        .is("parent_id", null);

      if (error) {
        console.error("Error fetching top regions:", error);
      } else {
        const items = data || [];
        // '전체' 추가
        const allItem = { id: 0, name: "전체", region_slug: "전체" };
        setTopItems([allItem, ...items]);
      }
    } catch (err) {
      console.error("Unexpected error in fetchTopRegions:", err);
    }
  }

  async function fetchThemes() {
    try {
      const { data, error } = await supabase
        .from("themes")
        .select("id, name")
        .order("id", { ascending: true });

      if (error) {
        console.error("Error fetching themes:", error);
      } else {
        const items = data || [];
        // '전체' 추가
        const allTheme = { id: 0, name: "전체" };
        setThemes([allTheme, ...items]);
      }
    } catch (err) {
      console.error("Unexpected error in fetchThemes:", err);
    }
  }

  // ─────────────────────────────────────────────────────────
  // 2) regionSlug / themeName 변경 시
  // ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!regionSlug || !themeName) return;
    if (!topItems.length || !themes.length) return;

    // 지역
    if (regionSlug === "전체") {
      setSelectedParentId(0);
      setChildItems([]);
      setSelectedChildId(0);
    } else {
      fetchRegionBySlug(regionSlug);
    }

    // 테마
    if (themeName === "전체") {
      setSelectedThemeIds([0]);
    } else {
      fetchThemeByName(themeName);
    }
  }, [regionSlug, themeName, topItems, themes]);

  async function fetchRegionBySlug(slug) {
    try {
      const { data: regionRow, error } = await supabase
        .from("regions")
        .select("*")
        .eq("region_slug", slug)
        .single();
      if (error) {
        console.error("region_slug 조회 실패:", error);
        return;
      }
      if (!regionRow) return;

      if (regionRow.parent_id === null) {
        // 상위 지역
        setSelectedParentId(regionRow.id);

        // 하위 목록
        const { data: childData } = await supabase
          .from("regions")
          .select("id, name, region_slug, parent_id")
          .eq("parent_id", regionRow.id);

        const allChildItem = {
          id: 0,
          name: "전체",
          region_slug: regionRow.region_slug,
          parent_id: regionRow.id,
        };
        setChildItems([allChildItem, ...(childData || [])]);
        setSelectedChildId(0);
      } else {
        // 하위 지역
        setSelectedParentId(regionRow.parent_id);

        const { data: childData } = await supabase
          .from("regions")
          .select("id, name, region_slug, parent_id")
          .eq("parent_id", regionRow.parent_id);

        // 상위 slug 찾기
        const { data: parentRow } = await supabase
          .from("regions")
          .select("*")
          .eq("id", regionRow.parent_id)
          .single();
        let parentSlug = parentRow ? parentRow.region_slug : "전체";

        const allChildItem = {
          id: 0,
          name: "전체",
          region_slug: parentSlug,
          parent_id: regionRow.parent_id,
        };
        setChildItems([allChildItem, ...(childData || [])]);
        setSelectedChildId(regionRow.id);
      }
    } catch (err) {
      console.error("fetchRegionBySlug 오류:", err);
    }
  }

  async function fetchThemeByName(name) {
    try {
      const { data: themeRow, error } = await supabase
        .from("themes")
        .select("*")
        .eq("name", name)
        .single();
      if (error) {
        console.error("themeName 조회 실패:", error);
        return;
      }
      if (!themeRow) return;
      setSelectedThemeIds([themeRow.id]);
    } catch (err) {
      console.error("fetchThemeByName 오류:", err);
    }
  }

  // ─────────────────────────────────────────────────────────
  // 3) 셀 클릭 → 라우팅
  // ─────────────────────────────────────────────────────────
  function handleParentClick(parentId) {
    if (parentId === 0) {
      router.push(`/board/전체/${themeName}`);
      return;
    }
    const clickedItem = topItems.find((item) => item.id === parentId);
    if (!clickedItem) return;
    router.push(`/board/${clickedItem.region_slug}/${themeName}`);
  }

  function handleChildClick(childId) {
    if (childId === 0) {
      const child = childItems.find((c) => c.id === 0);
      if (!child) return;
      router.push(`/board/${child.region_slug}/전체`);
      return;
    }
    const child = childItems.find((c) => c.id === childId);
    if (!child) return;
    router.push(`/board/${child.region_slug}/${themeName}`);
  }

  function handleThemeClick(themeId) {
    if (themeId === 0) {
      router.push(`/board/${regionSlug}/전체`);
      return;
    }
    const themeItem = themes.find((t) => t.id === themeId);
    if (!themeItem) return;
    router.push(`/board/${regionSlug}/${themeItem.name}`);
  }

  // ─────────────────────────────────────────────────────────
  // 4) N개씩 나누기
  // ─────────────────────────────────────────────────────────
  function chunkArray(array, size) {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  }

  // ─────────────────────────────────────────────────────────
  // 5) 렌더링
  // ─────────────────────────────────────────────────────────
  return (
    <div style={outerStyle}>
      {/* 상단 제목 */}
      <h2 style={{ textAlign: "center" }}>지역별 샵 선택</h2>
      <p style={{ color: "#666", marginBottom: "1rem", textAlign: "center" }}>
        인기있는 지역들을 보기쉽게 모아봤어요!
      </p>

      {/* ── 상위 지역: 7개 칼럼 ── */}
      {isLoadingTopItems ? (
        <SkeletonTable columnCount={7} rowCount={2} />
      ) : topItems.length === 0 ? (
        <p style={{ textAlign: "center" }}>상위 지역이 없습니다.</p>
      ) : (
        <table style={tableStyle}>
          <tbody>
            {chunkArray(topItems, 7).map((rowItems, rowIdx) => (
              <tr key={rowIdx}>
                {rowItems.map((item) => {
                  const isSelected = selectedParentId === item.id;
                  return (
                    <td
                      key={item.id}
                      style={getTdStyle(isSelected)}
                      onClick={() => handleParentClick(item.id)}
                    >
                      {item.name}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ── 세부 지역: 7개 칼럼 ── */}
      <div style={{ marginBottom: "2rem" }}>
        {selectedParentId !== null && (
          <>
        
            {selectedParentId === 0 ? (
              <p style={{ textAlign: "center" }}>
            
              </p>
            ) : childItems.length === 0 ? (
              <p style={{ textAlign: "center" }}>하위 지역이 없습니다.</p>
            ) : (
                
              <table style={tableStyle}>
                <tbody>
                  {chunkArray(childItems, 7).map((rowItems, rowIdx) => (
                    <tr key={rowIdx}>
                      {rowItems.map((child) => {
                        const isChildSelected = selectedChildId === child.id;
                        return (
                          <td
                            key={child.id}
                            style={getTdStyle(isChildSelected)}
                            onClick={() => handleChildClick(child.id)}
                          >
                            {child.name}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>

      {/* ── 테마별 샵 선택: 10개 칼럼 ── */}
      <h2 style={{ textAlign: "center" }}>테마별 샵 선택</h2>
      <p style={{ color: "#666", marginBottom: "1rem", textAlign: "center" }}>
        테마를 선택 해보세요!
      </p>
      {isLoadingThemes ? (
        <SkeletonTable columnCount={10} rowCount={2} />
      ) : themes.length === 0 ? (
        <p style={{ textAlign: "center" }}>테마가 없습니다.</p>
      ) : (
        <table style={tableStyle}>
          <tbody>
            {chunkArray(themes, 10).map((rowItems, rowIdx) => (
              <tr key={rowIdx}>
                {rowItems.map((theme) => {
                  const isSelected = selectedThemeIds.includes(theme.id);
                  return (
                    <td
                      key={theme.id}
                      style={getTdStyle(isSelected)}
                      onClick={() => handleThemeClick(theme.id)}
                    >
                      {theme.name}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}