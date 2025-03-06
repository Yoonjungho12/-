// src/app/(main)/board/PartnershipTable.js (서버 컴포넌트)
import { supabase } from "../../lib/supabaseE";
import Link from "next/link";

// 커스텀 슬러그 생성 함수
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

// ★ 테이블 스타일들
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
  backgroundColor: "#fff5f0", // 살짝 피치색
};

const tdStyle = {
  padding: "10px",
  border: "1px solid #eee",
  verticalAlign: "middle",
};

const leftCellStyle = {
  ...tdStyle,
  width: "60px",
  textAlign: "center",
  fontWeight: "bold",
  color: "#fff",
  backgroundColor: "#c23e2d", // 진한 빨색 배경 (VIP)
  border: "1px solid #c23e2d",
};

export default async function PartnershipTable({ regionSlug, themeName }) {
  // 1) regionId 찾기
  let regionId = null;
  if (regionSlug !== "전체") {
    const { data: regionRow, error: regionErr } = await supabase
      .from("regions")
      .select("*")
      .eq("region_slug", regionSlug)
      .single();
    if (regionErr) {
      console.error("regionErr:", regionErr);
    } else if (regionRow) {
      regionId = regionRow.id;
    }
  }

  // 2) themeId 찾기
  let themeId = null;
  if (themeName !== "전체") {
    const { data: themeRow, error: themeErr } = await supabase
      .from("themes")
      .select("*")
      .eq("name", themeName)
      .single();
    if (themeErr) {
      console.error("themeErr:", themeErr);
    } else if (themeRow) {
      themeId = themeRow.id;
    }
  }

  // 3) partnershipsubmit + partnershipsubmit_themes (M:N)
  let query = null;
  if (themeId) {
    query = supabase
      .from("partnershipsubmit")
      .select(
        `
          id,
          company_name,
          post_title,
          region_id,
          partnershipsubmit_themes!inner (
            theme_id
          )
        `
      )
      .eq("partnershipsubmit_themes.theme_id", themeId);
  } else {
    query = supabase
      .from("partnershipsubmit")
      .select(
        `
          id,
          company_name,
          post_title,
          region_id,
          partnershipsubmit_themes!left (
            theme_id
          )
        `
      );
  }

  if (regionId) {
    query = query.eq("region_id", regionId);
  }

  // 최종 승인된 게시글만
  query = query.eq("final_admitted", true);

  const { data: posts, error: postError } = await query;
  if (postError) {
    console.error("postError:", postError);
  }

  return (
    <div className="w-full"style={{ padding: "1rem" }}>
      <h2>파트너십 목록 (SSR + supabase / M:N)</h2>
      <p>
        현재 지역: <b>{regionSlug}</b> / 테마: <b>{themeName}</b>
      </p>

      {/* 데이터 없을 때 */}
      {!posts || posts.length === 0 ? (
        <p>데이터가 없습니다.</p>
      ) : (
        <table style={tableStyle}>
          <thead style={theadStyle}>
            <tr>
              <th style={thStyle}>구분</th>
              <th style={thStyle}>제목</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((item) => {
              const slug = createSlug(item.company_name);

              return (
                <tr key={item.id} style={trStyle}>
                  {/* 왼쪽 VIP 셀 */}
                  <td style={leftCellStyle}>VIP</td>

                  {/* 오른쪽 제목 셀 */}
                  <td style={tdStyle}>
                    <Link href={`/board/details/${item.id}-${slug}`}>
                      {item.post_title}
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}