// PartnershipTable.server.jsx
import { supabase } from "@/lib/supabaseE";
import Link from "next/link";
import PartnershipRow from "./PartnershipRow.client"; 
// ↑ 클라이언트 컴포넌트 임포트

///////////////////////////////////////////////
// 1. 헬퍼 함수들
///////////////////////////////////////////////
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

/** 정렬: VIP 우선 + (가격 낮은순, 조회수 높은순) */
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
        return 0;
    }
  });
}

///////////////////////////////////////////////
// 2. 서버 컴포넌트
///////////////////////////////////////////////
export default async function PartnershipTable({
  searchParams,
  regionSlug,
  subregionSlug,
  themeName,
}) {
  // (A) 정렬 파라미터
  const sortParam = searchParams?.sort || "";

  // (B) 지역 ID 탐색
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

  // (C) 테마 ID 탐색
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

  // (D) DB 조회
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
      <div className="mt-4">
        <b>{regionSlug}</b> / <b>{subregionSlug}</b> / <b>{themeName}</b> 에 해당하는 업체가 없습니다.
      </div>
    );
  }

  // (F) 정렬 링크
  const baseUrl = `/board/${regionSlug}/${subregionSlug}/${themeName}`;

  // (G) 렌더링
  return (
    <div className="w-full mt-4">
      {/* 정렬 옵션 링크 */}
      <div className="mb-6 flex items-center justify-center gap-6 text-sm font-medium bg-white rounded-full shadow-sm py-3 px-6">
        <Link
          href={baseUrl}
          className={!sortParam 
            ? "text-orange-500 font-bold relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-orange-500" 
            : "text-gray-500 hover:text-gray-700 transition-colors"}
        >
          기본
        </Link>
        <div className="w-1 h-1 rounded-full bg-gray-200" />
        <Link
          href={`${baseUrl}?sort=priceAsc`}
          className={sortParam === "priceAsc" 
            ? "text-orange-500 font-bold relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-orange-500" 
            : "text-gray-500 hover:text-gray-700 transition-colors"}
        >
          가격 낮은순
        </Link>
        <div className="w-1 h-1 rounded-full bg-gray-200" />
        <Link
          href={`${baseUrl}?sort=viewsDesc`}
          className={sortParam === "viewsDesc" 
            ? "text-orange-500 font-bold relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-orange-500" 
            : "text-gray-500 hover:text-gray-700 transition-colors"}
        >
          조회수 높은순
        </Link>
      </div>

      {/* Tailwind 테이블 */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="table-fixed w-full text-sm border-separate border-spacing-0">
          <colgroup>
            <col className="w-[55%]" />
            <col className="w-[15%]" />
            <col className="w-[15%]" />
            <col className="w-[15%]" />
          </colgroup>
          <thead>
            <tr className="bg-gray-50">
              <th className="py-4 px-6 text-left text-gray-600 font-medium desktop-only border-b border-gray-100">
                제목
              </th>
              <th className="py-4 px-6 text-center text-gray-600 font-medium desktop-only border-b border-gray-100">
                최저가
              </th>
              <th className="py-4 px-6 text-center text-gray-600 font-medium desktop-only border-b border-gray-100">
                조회수
              </th>
              <th className="py-4 px-6 text-center text-gray-600 font-medium desktop-only border-b border-gray-100">
                리뷰수
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {posts.map((item) => {
              const priceNum = getLowestPrice(item);
              const displayPrice = priceNum > 0 ? formatPrice(priceNum) : "가격 없음";
              const mobileInfo = `조회수 ${Number(item.views || 0).toLocaleString()} / 리뷰 ${
                item.comment || 0
              } / 최저가 ${displayPrice}`;
              const slug = createSlug(item.company_name);

              return (
                <PartnershipRow
                  key={item.id}
                  item={item}
                  displayPrice={displayPrice}
                  mobileInfo={mobileInfo}
                  slug={slug}
                />
              );
            })}
          </tbody>
        </table>
      </div>

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

        .PartnershipTable tr:hover {
          background-color: #fff8f6;
          transition: background-color 0.2s ease;
        }

        .PartnershipTable tr:last-child td {
          border-bottom: none;
        }

        .PartnershipTable td, .PartnershipTable th {
          transition: all 0.2s ease;
        }

        .PartnershipTable tr:hover td {
          background-color: #fff8f6;
        }
      `}</style>
    </div>
  );
}