"use server";

import { supabase } from "@/lib/supabaseE";
import Image from "next/image";

// 가격 포맷
function formatPrice(num) {
  if (!num || isNaN(num)) return "가격없음";
  return Number(num).toLocaleString() + "원";
}

export default async function SearchPage({ searchParams: params }) {
  const searchParams = await params;
  const query = searchParams?.q || "";

  if (!query) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">검색어가 없습니다.</h1>
        <p>검색어를 입력해주세요.</p>
      </div>
    );
  }

  /**
   * 1) 한글, 영문 상관없이, 작은따옴표 ' 가 들어가면 PostgreSQL에서는 ''(두 개)로 치환해야 함
   * 2) "서울" 같은 한글은 문제가 안 되지만, 만약 query="I'm" 같은 경우를 대비해 전부 이스케이프
   */
  const safeQuery = query.replace(/'/g, "''");

  /**
   * 2) websearch_to_tsquery('english', '...') 내부에
   *    '...${safeQuery}...' 대신 문자열 합치기로 처리
   *
   *    최종적으로:
   *      websearch_to_tsquery('english', '''서울''')  <-- Postgres 식
   *    가 되어야 "서울"이 한글이든 뭐든 파싱됨
   */
  const { data, error } = await supabase
    .from("partnershipsubmit")
    .select(`
      id,
      final_admitted,
      company_name,
      address,
      comment,
      greeting,
      thumbnail_url,
      partnershipsubmit_themes ( themes ( id, name ) ),
      sections ( courses (price) )
    `)
    .eq("final_admitted", true)
    .textSearch("search_tsv", query, {
      type: "websearch",
      config: "english",
    })
    .order("search_tsv", { ascending: false })
    .limit(50);

  if (error) {
    console.error("검색 에러:", error);
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">검색 오류</h1>
        <p>{error.message}</p>
      </div>
    );
  }

  // 렌더링
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">{query} 검색결과</h1>

      <div className="space-y-6">
        {data?.map((item) => {
          // 썸네일 URL
          const imageUrl = `https://vejthvawsbsitttyiwzv.supabase.co/storage/v1/object/public/gunma/${item.thumbnail_url}`;
          const themeList = item.partnershipsubmit_themes || [];

          // 최저가 계산
          let lowestPrice = null;
          if (item.sections?.length) {
            item.sections.forEach((sec) => {
              if (sec.courses?.length) {
                sec.courses.forEach((c) => {
                  if (lowestPrice === null || (c.price && c.price < lowestPrice)) {
                    lowestPrice = c.price;
                  }
                });
              }
            });
          }

          return (
            <a
              key={item.id}
              href={`/board/details/${item.id}`}
              className="
                block
                flex flex-col md:flex-row
                items-stretch
             
                p-4
                rounded-lg
                overflow-hidden
                hover:bg-gray-200
                transition-colors
                mb-0
                md:mb-4
              "
            >
              {/* (1) 이미지 컨테이너: 모바일 w-full h-48, md에서 373x217 */}
              <div className="relative w-full h-48 mb-3 md:mb-0 md:w-[373px] md:h-[217px] flex-shrink-0">
                <Image
                  src={imageUrl}
                  alt={item.company_name}
                  fill
                  className="object-cover rounded-xl"
                />
              </div>

              {/* (2) 오른쪽 텍스트 */}
              <div className="flex-1 px-4 py-2">
                <h2 className="text-lg font-semibold mb-1">{item.company_name}</h2>

                {/* 주소 + 리뷰수 */}
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
                    <span>{item.address || "주소 정보 없음"}</span>
                  </div>

                  {/* 리뷰수 */}
                  <div className="text-gray-500">리뷰 {item.comment ?? 0}</div>
                </div>

                {/* 최저가 */}
                <div className="text-sm text-red-600 font-semibold mb-1">
                  최저가: {lowestPrice ? formatPrice(lowestPrice) : "가격없음"}
                </div>

                {/* 인사말 */}
                <p className="text-sm text-gray-800">{item.greeting}</p>

                {/* 테마 태그 */}
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
            </a>
          );
        })}
      </div>
    </div>
  );
}