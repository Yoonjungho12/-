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
  // (1) regionId
  let regionId = null;
  if (regionSlug !== "전체") {
    const { data: regionRow } = await supabase
      .from("regions")
      .select("*")
      .eq("region_slug", regionSlug)
      .single();

    if (regionRow) {
      regionId = regionRow.id;
    }
  }

  // (2) themeId
  let themeId = null;
  if (themeName !== "전체") {
    const { data: themeRow } = await supabase
      .from("themes")
      .select("*")
      .eq("name", themeName)
      .single();

    if (themeRow) {
      themeId = themeRow.id;
    }
  }

  // (3) M:N 쿼리 + Subselect(최저가)
  //  - 주석 없이 작성
  let query = supabase.from("partnershipsubmit").select(`
    id,
    company_name,
    post_title,
    region_id,
    ad_type,
    comment,
    views,
    partnershipsubmit_themes!left(theme_id),
    sections (
      courses (
        price
      )
    )
  `);

  // region 필터
  if (regionId) {
    query = query.eq("region_id", regionId);
  }

  // theme 필터
  if (themeId) {
    query = themeId
      ? query.eq("partnershipsubmit_themes.theme_id", themeId)
      : query;

  }

  // 승인된 게시글만
  query = query.eq("final_admitted", true);

  // (4) 데이터 가져오기
  const { data: posts, error } = await query;
  if (error) {
    console.error("파트너십 목록 조회 오류:", error.message);
    return <div>데이터 조회 에러 발생</div>;
  }

  // (5) 렌더링
  return (
    <div className="w-full">
      <h2>파트너십 목록 (SSR + Supabase / M:N)</h2>
      <p>
        현재 지역: <b>{regionSlug}</b> / 테마: <b>{themeName}</b>
      </p>

      {!posts || posts.length === 0 ? (
        <p>데이터가 없습니다.</p>
      ) : (
        <table style={tableStyle}>
          <thead style={theadStyle}>
            <tr>
              <th style={thStyle}>제목</th>
              {/* 최저가 칼럼 추가 */}
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

              // 제목 색상
              let linkStyle = {
                display: "inline-block",
                color: "#333",
              };
              if (item.ad_type === "VIP+") {
                linkStyle.color = "#0066cc";
              }

              // 최저가가 null이면 "가격 없음"
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
                  {/* (A) 제목 */}
                  <td style={tdTitleStyle}>
                    {badge}
                    <Link href={`/board/details/${item.id}-${slug}`} style={linkStyle}>
                      {item.post_title}
                    </Link>
                  </td>

                  {/* (B) 최저가 */}
                  <td style={tdCenterStyle}>{displayPrice}</td>

                  {/* (C) 조회수 */}
                  <td style={tdCenterStyle}>
                    {item.views || 0}
                  </td>

                  {/* (D) 리뷰수 */}
                  <td style={tdCenterStyle}>
                    {item.comment ? item.comment : 0}
                  </td>
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