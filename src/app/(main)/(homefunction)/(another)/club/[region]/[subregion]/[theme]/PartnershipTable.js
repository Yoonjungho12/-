import { supabase } from "@/lib/supabaseE";
import PartnershipTableClient from "./PartnershipTable.client";
import Link from "next/link";
/** (1) 헬퍼 함수들 */
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

/** (2) 테마가 "전체"면 클럽(27) + 나이트클럽(28) 둘 다, 
 *       아니면 해당 themeId만 필터
 */
async function getThemeFilterId(themeName) {
  // "전체" → [27, 28]
  if (!themeName || themeName === "전체") {
    return [27, 28];
  }
  // 클럽 → 27, 나이트클럽 → 28
  // themes 테이블에서 name=themeName으로 가져올 수도 있지만,
  // 여기서는 "직접 매핑" 또는 DB에서 조회해서 만든 배열을 리턴.
  if (themeName === "클럽") return [27];
  if (themeName === "나이트클럽") return [28];

  // 혹시 테이블에 추가 확장성 고려한다면, 
  // "DB 조회" 해서 themeId를 찾고 배열 리턴도 가능.
  // 여기선 간단히 반환
  return [];
}

/** (3) 정렬 함수 (가격 낮은순, 조회수 높은순, VIP 우선) */
function sortPosts(posts, sortType) {
  if (!posts || posts.length === 0) return;

  posts.sort((a, b) => {
    const aVIP = a.ad_type === "VIP" || a.ad_type === "VIP+";
    const bVIP = b.ad_type === "VIP" || b.ad_type === "VIP+";

    // VIP 우선
    if (aVIP && !bVIP) return -1;
    if (!aVIP && bVIP) return 1;

    // 나머지 정렬
    const aPrice = getLowestPrice(a);
    const bPrice = getLowestPrice(b);
    const aViews = a.views || 0;
    const bViews = b.views || 0;

    switch (sortType) {
      case "priceAsc":
        return aPrice - bPrice; // 가격 낮은순
      case "viewsDesc":
        return bViews - aViews; // 조회수 높은순
      default:
        // 아무 것도 아니면 VIP 우선만
        return 0;
    }
  });
}

/** (4) 스타일 상수 */
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

/** 
 * (5) 메인 컴포넌트 (서버 컴포넌트)
 * theme 파라미터가 "전체"면 테마ID [27,28] 모두
 * 그 외 "클럽" => [27], "나이트클럽" => [28]
 */
export default async function PartnershipTable({
  searchParams,
  regionSlug,
  subregionSlug,
  themeName,
}) {
  // sort
  const sortParam = searchParams?.sort || "";

  // (A) region/subregion 찾기
  let regionId = null;
  let subRegionId = null;

  // ① subregion
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

  // ② region
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

  // (B) theme
  // "전체" => [27,28], "클럽" => [27], "나이트클럽" => [28]
  const themeIds = await getThemeFilterId(themeName);
  // 만약 themeIds.length===0 => 테마 없음 => 예)다른거
  // 여기서는 그냥 proceed

  // (C) partnershipsubmit 쿼리
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
      title_color,
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

  // themeIds가 있으면 .in("partnershipsubmit_themes.theme_id", themeIds)
  if (themeIds && themeIds.length > 0) {
    query = query.in("partnershipsubmit_themes.theme_id", themeIds);
  }
  query = query.eq("final_admitted", true);

  const { data: posts, error: postsErr } = await query;
  if (postsErr) {
    console.error("파트너십 목록 조회 오류:", postsErr.message);
    return <div>데이터 조회 에러 발생</div>;
  }

  // (D) 정렬
  sortPosts(posts, sortParam);

  if (!posts || posts.length === 0) {
    return (
      <div className="mt-4 text-center text-gray-600">
        <b>{regionSlug}</b> / <b>{subregionSlug}</b> / <b>{themeName}</b> 에 해당하는 업체가 없습니다.
      </div>
    );
  }

  // (E) 정렬 링크
  const baseUrl = `/club/${regionSlug}/${subregionSlug}/${themeName}`;

  // (F) 각 포스트에 displayPrice 추가
  const postsWithPrice = posts.map(post => ({
    ...post,
    displayPrice: formatPrice(getLowestPrice(post))
  }));

  return <PartnershipTableClient posts={postsWithPrice} baseUrl={baseUrl} sortParam={sortParam} />;
}