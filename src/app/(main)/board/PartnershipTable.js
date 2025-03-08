// src/app/(main)/board/PartnershipTable.js (서버 컴포넌트)

import { supabase } from "../../lib/supabaseE";
import Link from "next/link";

// 슬러그 변환
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

const tdReviewStyle = {
  padding: "10px",
  border: "1px solid #eee",
  verticalAlign: "middle",
  textAlign: "center",
};

// VIP 배지 깜빡이는 스타일 (빨간 배경)
const vipBadgeBlinkStyle = {
  display: "inline-block",
  color: "#fff",
  backgroundColor: "#c23e2d",
  padding: "4px 8px",
  marginRight: "6px",
  borderRadius: "4px",
  fontWeight: "bold",
  // 깜빡이 2초 주기
  animation: "blink 2s infinite",
};

export default async function PartnershipTable({ regionSlug, themeName }) {
  // 1) regionId
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

  // 2) themeId
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

  // 3) M:N 쿼리
  let query = null;
  if (themeId) {
    query = supabase
      .from("partnershipsubmit")
      .select(`
        id,
        company_name,
        post_title,
        region_id,
        ad_type,
        comment,
        partnershipsubmit_themes!inner ( theme_id )
      `)
      .eq("partnershipsubmit_themes.theme_id", themeId);
  } else {
    query = supabase
      .from("partnershipsubmit")
      .select(`
        id,
        company_name,
        post_title,
        region_id,
        ad_type,
        comment,
        partnershipsubmit_themes!left ( theme_id )
      `);
  }

  if (regionId) {
    query = query.eq("region_id", regionId);
  }
  // 최종 승인된 게시글만
  query = query.eq("final_admitted", true);

  const { data: posts } = await query;

  return (
    <div className="w-full">
      <h2>파트너십 목록 (SSR + Supabase / M:N)</h2>
      <p>
        현재 지역: <b>{regionSlug}</b> / 테마: <b>{themeName}</b>
      </p>

      {(!posts || posts.length === 0) ? (
        <p>데이터가 없습니다.</p>
      ) : (
        <table style={tableStyle}>
          <thead style={theadStyle}>
            <tr>
              <th style={thStyle}>제목</th>
              <th style={thStyle}>리뷰수</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((item) => {
              const slug = createSlug(item.company_name);

              // ad_type이 VIP든 VIP+든 전부 배지 깜빡임
              let badge = null;
              if (item.ad_type === "VIP" || item.ad_type === "VIP+") {
                badge = <span style={vipBadgeBlinkStyle}>VIP</span>;
              }

              // 제목 기본 색: 검정
              let linkStyle = { display: "inline-block", color: "#333" };
              // ad_type === "VIP+" → 파란 글씨
              if (item.ad_type === "VIP+") {
                linkStyle.color = "#0066cc";
              }

              return (
                <tr key={item.id} style={trStyle}>
                  <td style={tdTitleStyle}>
                    {badge}
                    <Link href={`/board/details/${item.id}-${slug}`} style={linkStyle}>
                      {item.post_title}
                    </Link>
                  </td>
                  <td style={tdReviewStyle}>
                    {item.comment ? item.comment : 0}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* 깜빡이 keyframes 2초 간격 */}
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}