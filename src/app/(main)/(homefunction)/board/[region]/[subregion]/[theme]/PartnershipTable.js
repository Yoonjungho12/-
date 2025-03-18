
import React from "react";
import { supabase } from "@/lib/supabaseE";
import Link from "next/link";

// (1) 헬퍼 함수
function createSlug(text) {
  if (typeof text !== "string" || text.trim() === "") return "no-slug";
  const slug = text
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^ㄱ-ㅎ가-힣a-zA-Z0-9-]/g, "")
    .toLowerCase();
  return slug || "no-slug";
}

function formatPrice(num) {
  if (!num || isNaN(num)) return "0원";
  return Number(num).toLocaleString() + "원";
}

function getLowestPrice(item) {
  let lowestPrice = null;
  if (item.sections && item.sections.length > 0) {
    item.sections.forEach((section) => {
      if (section.courses && section.courses.length > 0) {
        section.courses.forEach((course) => {
          if (lowestPrice === null || course.price < lowestPrice) {
            lowestPrice = course.price;
          }
        });
      }
    });
  }
  return lowestPrice || 0;
}

/** (2) sortPosts : "가격 높은 순(priceDesc)" & "조회수 낮은 순(viewsAsc)" 제거 */
function sortPosts(posts, sortType) {
  if (!posts || posts.length === 0) return;

  posts.sort((a, b) => {
    const aVIP = a.ad_type === "VIP" || a.ad_type === "VIP+";
    const bVIP = b.ad_type === "VIP" || b.ad_type === "VIP+";

    // (1) VIP 우선
    if (aVIP && !bVIP) return -1;
    if (!aVIP && bVIP) return 1;

    // (2) views, price
    const aPrice = getLowestPrice(a);
    const bPrice = getLowestPrice(b);
    const aViews = a.views || 0;
    const bViews = b.views || 0;

    switch (sortType) {
      case "priceAsc":
        return aPrice - bPrice;
      case "viewsDesc":
        return bViews - aViews;
      default:
        // 그 외 or ''
        return 0; // VIP 우선만
    }
  });
}

// (3) 테이블 스타일
const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
};
const thStyle = {
  padding: "8px",
  border: "1px solid #ccc",
  textAlign: "center",
  whiteSpace: "nowrap",
};
const tdStyle = {
  padding: "8px",
  border: "1px solid #eee",
  verticalAlign: "middle",
};
const titleCellStyle = {
  ...tdStyle,
  maxWidth: "500px",
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};
const vipTrStyle = { backgroundColor: "#fff5f0" };
const baseTrStyle = { backgroundColor: "#ffffff" };
const vipBadgeStyle = {
  display: "inline-block",
  color: "#fff",
  backgroundColor: "#c23e2d",
  padding: "4px 6px",
  marginRight: "6px",
  borderRadius: "4px",
  fontWeight: "bold",
  fontSize: "12px",
  animation: "textBlink 2s infinite",
};
const normalBadgeStyle = {
  display: "inline-block",
  color: "#fff",
  backgroundColor: "#b196c1",
  padding: "4px 6px",
  marginRight: "6px",
  borderRadius: "4px",
  fontWeight: "bold",
  fontSize: "12px",
};
const rightCellStyle = { ...tdStyle, textAlign: "center" };
const mobileInfoStyle = {
  display: "none",
  fontSize: "12px",
  color: "#888",
  marginTop: "4px",
};

/** (4) 메인 컴포넌트 (서버 컴포넌트) */
export default async function PartnershipTable({
  searchParams,
  regionSlug,
  subregionSlug,
  themeName,
}) {
  // (A) 정렬 파라미터
  const sortParam = searchParams?.sort || "";

  // (B) region/subregion 찾기
  let regionId = null;
  let subRegionId = null;

  if (subregionSlug && subregionSlug !== "전체") {
    const { data: subRow, error: subErr } = await supabase
      .from("regions")
      .select("*")
      .eq("region_slug", subregionSlug)
      .maybeSingle();
    if (subErr) {
      console.error("하위 지역 조회 오류:", subErr.message);
    } else if (subRow) {
      subRegionId = subRow.id;
    }
  }

  if (!subRegionId && regionSlug && regionSlug !== "전체") {
    const { data: mainRow, error: mainErr } = await supabase
      .from("regions")
      .select("*")
      .eq("region_slug", regionSlug)
      .maybeSingle();
    if (mainErr) {
      console.error("상위 지역 조회 오류:", mainErr.message);
    } else if (mainRow) {
      regionId = mainRow.id;
    }
  }

  // (C) theme 찾기
  let themeId = null;
  if (themeName && themeName !== "전체") {
    const { data: themeRow, error: themeErr } = await supabase
      .from("themes")
      .select("*")
      .eq("name", themeName)
      .maybeSingle();

    if (themeErr) {
      console.error("테마 조회 오류:", themeErr.message);
    } else if (themeRow) {
      themeId = themeRow.id;
    }
  }

  // (D) partnershipsubmit 조회
  let query = supabase
    .from("partnershipsubmit")
    .select(`
      id,
      company_name,
      post_title,
      region_id,
      sub_region_id,
      ad_type,
      comment,
      views,
      final_admitted,
      partnershipsubmit_themes!inner(theme_id),
      sections (
        courses ( price )
      )
    `);

  if (subRegionId) {
    query = query.eq("sub_region_id", subRegionId);
  } else if (regionId) {
    query = query.eq("region_id", regionId);
  }
  if (themeId) {
    query = query.eq("partnershipsubmit_themes.theme_id", themeId);
  }
  query = query.eq("final_admitted", true);

  const { data: posts, error: postsErr } = await query;
  if (postsErr) {
    console.error("파트너십 목록 조회 오류:", postsErr.message);
    return <div>데이터 조회 에러 발생</div>;
  }

  // (E) 정렬
  sortPosts(posts, sortParam);

  if (!posts || posts.length === 0) {
    return (
      <div style={{ marginTop: "1rem" }}>
        <b>{regionSlug}</b> / <b>{subregionSlug}</b> / <b>{themeName}</b>
        에 해당하는 업체가 없습니다.
      </div>
    );
  }

  // (F) 정렬 링크 (가격 높은순, 조회수 낮은순 제거)
  const baseUrl = `/board/${regionSlug}/${subregionSlug}/${themeName}`;

  return (
    <div className="w-full" style={{ marginTop: "1rem" }}>
      <div
        style={{
          marginBottom: "1rem",
          display: "flex",
          gap: "16px",
          fontSize: "14px",
        }}
      >
        {/* 기본 */}
        <Link
          href={baseUrl}
          style={{
            color: !sortParam ? "#000" : "#666",
            fontWeight: !sortParam ? "bold" : "normal",
          }}
        >
          기본
        </Link>
        <span style={{ color: "#ccc" }}>|</span>

        {/* 가격 낮은 순 */}
        <Link
          href={`${baseUrl}?sort=priceAsc`}
          style={{
            color: sortParam === "priceAsc" ? "#000" : "#666",
            fontWeight: sortParam === "priceAsc" ? "bold" : "normal",
          }}
        >
          가격 낮은순
        </Link>

        <span style={{ color: "#ccc" }}>|</span>

        {/* 조회수 높은 순 */}
        <Link
          href={`${baseUrl}?sort=viewsDesc`}
          style={{
            color: sortParam === "viewsDesc" ? "#000" : "#666",
            fontWeight: sortParam === "viewsDesc" ? "bold" : "normal",
          }}
        >
          조회수 높은순
        </Link>
      </div>

      <table style={tableStyle} className="text-sm PartnershipTable">
        <thead>
          <tr>
            <th style={thStyle} className="desktop-only">
              제목
            </th>
            <th style={thStyle} className="desktop-only">
              최저가
            </th>
            <th style={thStyle} className="desktop-only">
              조회수
            </th>
            <th style={thStyle} className="desktop-only">
              리뷰수
            </th>
          </tr>
        </thead>
        <tbody>
          {posts.map((item) => {
            const isVIP = item.ad_type === "VIP" || item.ad_type === "VIP+";
            const rowStyle = isVIP ? vipTrStyle : baseTrStyle;

            const priceNum = getLowestPrice(item);
            const displayPrice =
              priceNum > 0 ? formatPrice(priceNum) : "가격 없음";

            const mobileInfo = `조회수 ${Number(
              item.views || 0
            ).toLocaleString()} / 리뷰 ${item.comment || 0} / 최저가 ${
              displayPrice
            }`;

            const slug = createSlug(item.company_name);

            return (
              <tr key={item.id} style={rowStyle}>
                {/* 제목 셀 */}
                <td style={titleCellStyle}>
                  {isVIP ? (
                    <span style={vipBadgeStyle} className="badge-desktop">
                      VIP
                    </span>
                  ) : (
                    <span style={normalBadgeStyle} className="badge-desktop">
                      일반
                    </span>
                  )}
                  <Link
                    href={`/board/details/${item.id}-${slug}`}
                    style={{
                      display: "inline-block",
                      color:
                        isVIP && item.ad_type === "VIP+" ? "#0066cc" : "#333",
                      maxWidth: "80%",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      verticalAlign: "middle",
                    }}
                  >
                    {item.post_title}
                  </Link>
                  <div className="mobile-info" style={mobileInfoStyle}>
                    {mobileInfo}
                  </div>
                </td>

                {/* 최저가 */}
                <td style={rightCellStyle} className="desktop-only">
                  {displayPrice}
                </td>

                {/* 조회수 */}
                <td style={rightCellStyle} className="desktop-only">
                  {Number(item.views || 0).toLocaleString()}
                </td>

                {/* 리뷰수 */}
                <td style={rightCellStyle} className="desktop-only">
                  {item.comment || 0}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      <style>{`
        @keyframes textBlink {
          0%, 100% { color: #fff; }
          50% { color: #c23e2d; }
        }
        @media (max-width: 640px) {
          .desktop-only {
            display: none !important;
          }
          .badge-desktop {
            display: none !important;
          }
          .mobile-info {
            display: block !important; 
          }
        }
      `}</style>
    </div>
  );
}