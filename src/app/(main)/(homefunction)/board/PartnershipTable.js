// src/app/(main)/board/PartnershipTable.js (서버 컴포넌트)

import { supabase } from "@/lib/supabaseE";
import Link from "next/link";

/** slug 변환 */
function createSlug(text) {
  if (typeof text !== "string" || text.trim() === "") {
    return "no-slug";
  }
  const slug = text
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^ㄱ-ㅎ가-힣a-zA-Z0-9-]/g, "")
    .toLowerCase();
  return slug || "no-slug";
}

/** 가격 포맷 (3자리 콤마 + “원”) */
function formatPrice(num) {
  if (!num || isNaN(num)) return "0원";
  return Number(num).toLocaleString() + "원";
}

// ─────────────────────────────────────────────
// 테이블/셀 스타일
// ─────────────────────────────────────────────
const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
};

const theadStyle = {
  backgroundColor: "#f0f0f0",
};

const thStyle = {
  padding: "10px",
  border: "1px solid #ccc",
  textAlign: "center",
};

const trStyle = {
  backgroundColor: "#fff5f0",
};

const tdTitleStyle = {
  padding: "10px",
  border: "1px solid #eee",
  verticalAlign: "middle",
};

const tdCenterStyle = {
  padding: "10px",
  border: "1px solid #eee",
  verticalAlign: "middle",
  textAlign: "center",
};

// VIP 배지 깜빡이는 스타일 (글씨만 깜빡)
const vipBadgeBlinkStyle = {
  display: "inline-block",
  color: "#fff",
  backgroundColor: "#c23e2d",
  padding: "4px 8px",
  marginRight: "6px",
  borderRadius: "4px",
  fontWeight: "bold",
  animation: "textBlink 2s infinite",
};

export default async function PartnershipTable({ regionSlug, themeName }) {
  // ─────────────────────────────────────────
  // 디버그 모드
  // ─────────────────────────────────────────
  const debug = true;
  if (debug) {
    console.log("[PartnershipTable Debug] props:", { regionSlug, themeName });
  }

  // (1) regionId
  let regionId = null;
  let regionRowError = null;
  if (regionSlug !== "전체") {
    const { data: regionRow, error: regErr } = await supabase
      .from("regions")
      .select("*")
      .eq("region_slug", regionSlug)
      .single();

    regionRowError = regErr;
    if (regionRow) {
      regionId = regionRow.id;
    }
  }

  // (2) themeId
  let themeId = null;
  let themeRowError = null;
  if (themeName !== "전체") {
    const { data: themeRow, error: thErr } = await supabase
      .from("themes")
      .select("*")
      .eq("name", themeName)
      .single();

    themeRowError = thErr;
    if (themeRow) {
      themeId = themeRow.id;
    }
  }

  if (debug) {
    console.log("[PartnershipTable Debug] regionRowError:", regionRowError);
    console.log("[PartnershipTable Debug] themeRowError:", themeRowError);
    console.log("[PartnershipTable Debug] Determined regionId:", regionId, "themeId:", themeId);
  }

  // (3) M:N 쿼리 (★Inner Join★)
  //   - partnershipsubmit_themes!inner(theme_id)
  //   - theme_id 필터 시, 매칭되지 않는 레코드는 제외됨
  let query = supabase.from("partnershipsubmit").select(`
    id,
    company_name,
    post_title,
    region_id,
    ad_type,
    comment,
    views,
    partnershipsubmit_themes!inner(theme_id),
    sections (
      courses (
        price
      )
    )
  `);

  // ────────────── 의사 SQL/REST 디버그 문자열 생성 ──────────────
  let debugQueryString = "SELECT id, company_name, post_title, ... FROM partnershipsubmit\nWHERE final_admitted = true";
  
  // region 필터
  if (regionId) {
    query = query.eq("region_id", regionId);
    debugQueryString += `\n  AND region_id = ${regionId}`;
  }

  // theme 필터 (M:N)
  if (themeId) {
    query = query.eq("partnershipsubmit_themes.theme_id", themeId);
    debugQueryString += `\n  AND partnershipsubmit_themes.theme_id = ${themeId}`;
  }

  // 승인된 게시글만
  query = query.eq("final_admitted", true);
  // 이미 debugQueryString에 final_admitted = true가 들어가 있으므로 추가X

  if (debug) {
    console.log("[PartnershipTable Debug] About to run query with conditions:");
    console.log(debugQueryString); // 우리가 만든 "의사쿼리" 
    console.log(`[PartnershipTable Debug] RegionID: ${regionId}, ThemeID: ${themeId}`);
  }

  // (4) 데이터 가져오기
  const { data: posts, error } = await query;

  if (debug) {
    if (error) {
      console.log("[PartnershipTable Debug] Query error:", error.message);
    } else {
      console.log("[PartnershipTable Debug] Query result count:", posts?.length);
      console.log("[PartnershipTable Debug] Query result data:", posts);
    }
  }
  if (error) {
    console.error("파트너십 목록 조회 오류:", error.message);
    return <div>데이터 조회 에러 발생</div>;
  }

  // (5) 렌더링
  return (
    <div className="w-full">
      {!posts || posts.length === 0 ? (
        <>  <b>{regionSlug}</b>/<b>{themeName}</b>에 해당하는 없체가 없습니다.</>
      ) : (
        <table style={tableStyle}>
          <thead style={theadStyle}>
            <tr>
              <th style={thStyle}>제목</th>
              <th style={thStyle}>최저가</th>
              <th style={thStyle}>조회수</th>
              <th style={thStyle}>리뷰수</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((item) => {
              const slug = createSlug(item.company_name);

              // VIP 배지
              let badge = null;
              if (item.ad_type === "VIP" || item.ad_type === "VIP+") {
                badge = <span style={vipBadgeBlinkStyle}>VIP</span>;
              }

              // 링크 스타일
              let linkStyle = {
                display: "inline-block",
                color: "#333",
              };
              if (item.ad_type === "VIP+") {
                linkStyle.color = "#0066cc";
              }

              // 최저가 계산
              let displayPrice = "가격 없음";
              let lowestPrice = null;
              if (item.sections && item.sections.length > 0) {
                item.sections.forEach(section => {
                  if (section.courses && section.courses.length > 0) {
                    section.courses.forEach(course => {
                      if (lowestPrice === null || course.price < lowestPrice) {
                        lowestPrice = course.price;
                      }
                    });
                  }
                });
              }
              if (lowestPrice !== null && lowestPrice > 0) {
                displayPrice = formatPrice(lowestPrice);
              }

              return (
                <tr key={item.id} style={trStyle}>
                  <td style={tdTitleStyle}>
                    {badge}
                    <Link href={`/board/details/${item.id}-${slug}`} style={linkStyle}>
                      {item.post_title}
                    </Link>
                  </td>
                  <td style={tdCenterStyle}>{displayPrice}</td>
                  <td style={tdCenterStyle}>{item.views || 0}</td>
                  <td style={tdCenterStyle}>{item.comment || 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <style>{`
        @keyframes textBlink {
          0%, 100% { color: #fff; }
          50% { color: #c23e2d; }
        }
      `}</style>
    </div>
  );
}