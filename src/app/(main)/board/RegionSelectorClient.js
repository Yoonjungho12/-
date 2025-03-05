"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseF";
import { useRouter } from "next/navigation";

export default function RegionSelectorClient({ regionSlug, themeName }) {
  const router = useRouter();

  // 로딩 상태
  const [isLoadingTopItems, setIsLoadingTopItems] = useState(false);
  const [isLoadingThemes, setIsLoadingThemes] = useState(false);

  // 상위·하위 지역git branch -M main
  const [topItems, setTopItems] = useState([]);
  const [childItems, setChildItems] = useState([]);
  const [selectedParentId, setSelectedParentId] = useState(null);
  const [selectedChildId, setSelectedChildId] = useState(null);

  // 테마
  const [themes, setThemes] = useState([]);
  const [selectedThemeIds, setSelectedThemeIds] = useState([]);

  // ----------------------------------
  // 초기 로드
  // ----------------------------------
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

  // ----------------------------------
  // DB fetch: 상위 지역
  // ----------------------------------
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
        const allItem = { id: 0, name: "전체", region_slug: "전체" };
        setTopItems([allItem, ...items]);
      }
    } catch (err) {
      console.error("Unexpected error in fetchTopRegions:", err);
    }
  }

  // ----------------------------------
  // DB fetch: 테마
  // ----------------------------------
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
        const allTheme = { id: 0, name: "전체" };
        setThemes([allTheme, ...items]);
      }
    } catch (err) {
      console.error("Unexpected error in fetchThemes:", err);
    }
  }

  // ----------------------------------
  // regionSlug / themeName 변경 시
  // ----------------------------------
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

  // ----------------------------------
  // region_slug → 상위 or 하위 구분
  // ----------------------------------
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

  // ----------------------------------
  // themeName → themes.id
  // ----------------------------------
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

  // ----------------------------------
  // 클릭 → 라우팅
  // ----------------------------------
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

  // ----------------------------------
  // 스타일
  // ----------------------------------
  const containerStyle = {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    marginTop: "1rem",
  };

  const buttonBaseStyle = {
    flex: "1",
    minWidth: "80px",
    padding: "8px 12px",
    borderRadius: "4px",
    border: "1px solid #ccc",
    cursor: "pointer",
    textAlign: "center",
    backgroundColor: "#fff",
  };

  function getButtonStyle(isSelected) {
    return {
      ...buttonBaseStyle,
      backgroundColor: isSelected ? "#f9665e" : "#fff",
      color: isSelected ? "#fff" : "#333",
    };
  }

  // ----------------------------------
  // 스켈레톤: Shimmer 애니메이션
  // ----------------------------------
  // 1) 공통 스타일
  const skeletonButtonStyle = {
    ...buttonBaseStyle,
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#eee",
    color: "transparent", // 텍스트 안 보이게
  };

  // 2) 실제로 움직이는 배경을 위한 스타일 (자식 div)
  const skeletonShimmerStyle = {
    width: "100%",
    height: "100%",
    background: "linear-gradient(to right, #eee 8%, #ddd 18%, #eee 33%)",
    backgroundSize: "800px 100px",
    animation: "skeleton-loading 1.3s infinite linear",
  };

  function SkeletonBox({ count = 4 }) {
    return (
      <div style={containerStyle}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} style={skeletonButtonStyle}>
            {/* 가짜 텍스트로 크기 확보 */}
            {"길이가조금길은가짜텍스트"}
            {/* Shimmer 레이어 */}
            <div style={skeletonShimmerStyle}></div>
          </div>
        ))}
      </div>
    );
  }

  // ----------------------------------
  // 렌더링
  // ----------------------------------
  return (
    <div style={{ padding: "1rem" }}>
      {/* 전역 CSS 애니메이션 정의 */}
      <style jsx global>{`
        @keyframes skeleton-loading {
          0% {
            background-position: -800px 0;
          }
          100% {
            background-position: 800px 0;
          }
        }
      `}</style>

      {/* 지역별 샵 선택 */}
      <h2>지역별 샵 선택</h2>
      <p style={{ color: "#666", marginBottom: "1rem" }}>
        인기있는 지역들을 보기쉽게 모아봤어요!
      </p>

      {/* 상위 지역 */}
      <div style={containerStyle}>
        {isLoadingTopItems ? (
          <SkeletonBox count={5} />
        ) : topItems.length === 0 ? (
          <p style={{ flex: "1" }}>상위 지역이 없습니다.</p>
        ) : (
          topItems.map((item) => {
            const isSelected = selectedParentId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleParentClick(item.id)}
                style={getButtonStyle(isSelected)}
              >
                {item.name}
              </button>
            );
          })
        )}
      </div>

      {/* 지역 세부지역 */}
      <div style={{ marginTop: "1rem" }}>
        {selectedParentId !== null ? (
          <>
            <h3>지역 세부지역</h3>
            {selectedParentId === 0 ? (
              <p>전체를 선택하셨습니다. 하위 지역 없음</p>
            ) : childItems.length === 0 ? (
              <p>하위 지역이 없습니다.</p>
            ) : (
              <div style={containerStyle}>
                {childItems.map((child) => {
                  const isChildSelected = selectedChildId === child.id;
                  return (
                    <button
                      key={child.id}
                      onClick={() => handleChildClick(child.id)}
                      style={getButtonStyle(isChildSelected)}
                    >
                      {child.name}
                    </button>
                  );
                })}
              </div>
            )}
          </>
        ) : (
          <p style={{ marginTop: "1rem" }}>
            상위 지역을 먼저 선택해주세요.
          </p>
        )}
      </div>

      {/* 테마별 샵 선택 */}
      <div style={{ marginTop: "2rem" }}>
        <h2>테마별 샵 선택</h2>
        <p style={{ color: "#666", marginBottom: "1rem" }}>
          테마를 선택 해보세요!
        </p>
        <div style={containerStyle}>
          {isLoadingThemes ? (
            <SkeletonBox count={7} />
          ) : themes.length === 0 ? (
            <p style={{ flex: "1" }}>테마가 없습니다.</p>
          ) : (
            themes.map((theme) => {
              const isSelected = selectedThemeIds.includes(theme.id);
              return (
                <button
                  key={theme.id}
                  onClick={() => handleThemeClick(theme.id)}
                  style={getButtonStyle(isSelected)}
                >
                  {theme.name}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}