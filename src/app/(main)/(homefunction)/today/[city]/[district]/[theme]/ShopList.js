// app/today/[city]/[district]/[theme]/ShopList.js
// 서버 컴포넌트(SSR)용 코드 (Next.js 13+)

export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabaseE";
import Image from "next/image";
import Link from "next/link";

/** (A) Slug 생성 함수 **/
function createSlug(text) {
  if (typeof text !== "string" || text.trim() === "") {
    return "no-slug";
  }
  const slug = text
    .trim()
    // 공백 -> "-"
    .replace(/\s+/g, "-")
    // 한글, 영문, 숫자, 하이픈 제외한 문자는 제거
    .replace(/[^ㄱ-ㅎ가-힣a-zA-Z0-9-]/g, "")
    .toLowerCase();
  return slug || "no-slug";
}

// 특정 지역명 치환
function rewriteSpecialProvince(original) {
  switch (original) {
    case "제주":
      return "제주특별자치도";
    case "세종":
      return "세종특별자치시";
    case "강원":
      return "강원특별자치도";
    // 필요시 다른 지역도 추가
    default:
      return original;
  }
}

export default async function ShopList({ city, district, theme }) {
  // 1) 검색어 조합
  const queryParts = [];
  if (city !== "전체") {
    queryParts.push(rewriteSpecialProvince(city));
  }
  if (district !== "전체") {
    queryParts.push(rewriteSpecialProvince(district));
  }
  if (theme !== "전체") {
    queryParts.push(rewriteSpecialProvince(theme));
  }

  const searchString = queryParts.join(" ");

  let data = [];
  let error = null;

  // 2) Supabase에서 DB 조회
  if (searchString.trim()) {
    // 검색어가 있으면 => textSearch
    const res = await supabase
      .from("partnershipsubmit")
      .select(`
        id,
        final_admitted,
        post_title,
        company_name,
        address,
        address_street,
        shop_type,
        comment,
        greeting,
        thumbnail_url,
        partnershipsubmit_themes (
          themes ( id, name )
        )
      `)
      .eq("final_admitted", true)
      .textSearch("search_tsv", searchString, {
        type: "websearch",
        config: "simple",
      });

    data = res.data || [];
    error = res.error;
  } else {
    // 전부 "전체" => 전체 목록 (final_admitted = true만)
    const res = await supabase
      .from("partnershipsubmit")
      .select(`
        id,
        final_admitted,
        post_title,
        company_name,
        address,
        address_street,
        shop_type,
        comment,
        greeting,
        thumbnail_url,
        partnershipsubmit_themes (
          themes ( id, name )
        )
      `)
      .eq("final_admitted", true)
      .limit(50);

    data = res.data || [];
    error = res.error;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl py-4 text-red-600">
        DB 오류: {error.message}
      </div>
    );
  }

  // 3) 카드 형태 UI로 렌더링 (모바일=세로, 데스크톱=가로)
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h2 className="text-2xl font-bold mb-4">
        {searchString || "전체"} 검색결과
      </h2>

      {data.length === 0 ? (
        <p>검색 결과가 없습니다!</p>
      ) : (
        <div className="space-y-6">
          {data.map((item) => {
            // 썸네일 URL
            const imageUrl = `https://vejthvawsbsitttyiwzv.supabase.co/storage/v1/object/public/gunma/${item.thumbnail_url}`;

            // 상세페이지 링크
            const slug = createSlug(item.company_name || item.post_title || "");
            const detailUrl = `/board/details/${item.id}-${slug}`;

            // 테마 목록
            const themeList = item.partnershipsubmit_themes || [];

            return (
              <Link
                key={item.id}
                href={detailUrl}
                className="
                  block
                  flex flex-col md:flex-row
                  items-stretch
                  p-4
                  rounded-lg
                  overflow-hidden
                  hover:bg-gray-100
                  transition-colors
                "
              >
                {/* (1) 이미지 컨테이너: 모바일 w-full h-48, md에서 373×217 */}
                <div className="relative w-full h-48 mb-3 md:mb-0 md:w-[373px] md:h-[217px] flex-shrink-0">
                  <Image
                    src={imageUrl}
                    alt={item.company_name || "썸네일"}
                    fill
                    className="object-cover rounded-xl"
                  />
                </div>

                {/* (2) 오른쪽 텍스트 영역 */}
                <div className="flex-1 px-4 py-2">
                  {/* 업체명 */}
                  <h3 className="text-lg font-semibold mb-1">
                    {item.company_name || item.post_title}
                  </h3>

                  {/* 주소 + 리뷰 */}
                  <div className="flex items-center text-sm text-gray-600 mb-1 gap-3">
                    {/* 주소 */}
                    <div className="flex items-center gap-1">
                      <svg
                        className="w-4 h-4 text-gray-500"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 11c1.656 0
                             3-1.344
                             3-3s-1.344-3
                             -3-3-3
                             1.344-3
                             3 1.344
                             3 3
                             3z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19.5 9.5c0
                             7.168-7.5
                             11-7.5
                             11s-7.5-3.832
                             -7.5-11a7.5
                             7.5 0
                             1115
                             0z"
                        />
                      </svg>
                      <span>
                        {item.address || item.address_street || "주소 없음"}
                      </span>
                    </div>
                    {/* 리뷰수 */}
                    <div className="text-gray-500">
                      리뷰 {item.comment ?? 0}
                    </div>
                  </div>

                  {/* 소개(greeting 등) */}
                  <p className="text-sm text-gray-800">
                    {item.greeting || ""}
                  </p>

                  {/* 해시태그(테마) */}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {themeList.map((pt) => (
                      <span
                        key={pt.themes.id}
                        className="rounded-full border border-gray-300 px-2 py-1 text-xs text-gray-600"
                      >
                        #{pt.themes.name}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}