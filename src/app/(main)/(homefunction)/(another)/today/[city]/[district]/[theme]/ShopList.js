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
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-10 text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {searchString || "전체"} 검색결과
        </h2>
        <div className="mt-2 inline-flex items-center gap-2 text-sm text-gray-600">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            총 {data.length}개의 검색결과
          </span>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <svg className="w-16 h-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-gray-500 text-lg">검색 결과가 없습니다!</p>
          <p className="text-gray-400 text-sm mt-2">다른 검색어로 시도해보세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.map((item) => {
            const imageUrl = `${process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL}/${item.thumbnail_url}`;
            const slug = createSlug(item.company_name || item.post_title || "");
            const detailUrl = `/board/details/${item.id}-${slug}`;
            const themeList = item.partnershipsubmit_themes || [];

            return (
              <Link
                key={item.id}
                href={detailUrl}
                className="group relative bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
              >
                <div className="flex flex-col">
                  {/* 이미지 영역 */}
                  <div className="relative w-full h-[200px] flex-shrink-0">
                    <Image
                      src={imageUrl}
                      alt={item.company_name || "썸네일"}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  {/* 컨텐츠 영역 */}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between">
                      <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-orange-500 transition-colors line-clamp-1">
                        {item.company_name || item.post_title}
                      </h3>
                    </div>

                    {/* 주소 + 리뷰 */}
                    <div className="flex items-center text-xs text-gray-600 mb-3 gap-3">
                      <div className="flex items-center gap-1.5 flex-1">
                        <svg className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">
                          {item.address || item.address_street || "주소 없음"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0 text-gray-500">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                        </svg>
                        리뷰 {item.comment ?? 0}
                      </div>
                    </div>

                    {/* 소개 텍스트 */}
                    <p className="text-gray-600 text-xs line-clamp-2 mb-4 min-h-[2rem]">
                      {item.greeting || ""}
                    </p>

                    {/* 해시태그 */}
                    <div className="flex flex-wrap gap-1.5">
                      {themeList.map((pt) => (
                        <span
                          key={pt.themes.id}
                          className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-orange-50 text-orange-600"
                        >
                          #{pt.themes.name}
                        </span>
                      ))}
                    </div>
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