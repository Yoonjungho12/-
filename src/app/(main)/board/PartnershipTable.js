// src/app/(main)/board/PartnershipTable.js (서버 컴포넌트)
import { supabase } from "../../lib/supabaseE";
import Link from "next/link";

// 커스텀 슬러그 생성 함수 (입력값이 없거나 빈 문자열일 경우 기본값 반환)
function createSlug(text) {
  if (typeof text !== "string" || text.trim() === "") {
    return "no-slug";
  }
  const slug = text
    .trim()
    .replace(/\s+/g, '-') // 연속 공백을 하이픈으로 변환
    .replace(/[^ㄱ-ㅎ가-힣a-zA-Z0-9\-]/g, '') // 한글, 영문, 숫자, 하이픈 이외 제거
    .toLowerCase();
  return slug || "no-slug"; // 빈 문자열이면 기본값 반환
}

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
  
  // 최종 승인된 게시글만 (final_admitted=true)
  query = query.eq("final_admitted", true);

  const { data: posts, error: postError } = await query;
  if (postError) {
    console.error("postError:", postError);
  }

  return (
    <div style={{ padding: "1rem" }}>
      <h2>파트너십 목록 (SSR + supabase / M:N)</h2>
      <p>
        현재 지역: <b>{regionSlug}</b> / 테마: <b>{themeName}</b>
      </p>

      {!posts || posts.length === 0 ? (
        <p>데이터가 없습니다.</p>
      ) : (
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #ccc" }}>
              <th style={{ textAlign: "left", padding: "8px" }}>Post Title</th>
            </tr>
          </thead>
          <tbody>
            {posts.map((item) => {
              // company_name을 기반으로 슬러그 생성
              const slug = createSlug(item.company_name);
              return (
                <tr key={item.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: "8px" }}>
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