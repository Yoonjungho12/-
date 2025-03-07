// /app/search/page.js
import { supabase } from "@/lib/supabaseE";
import Image from "next/image";

export default async function SearchPage({ searchParams }) {
  const query = searchParams.q || "";

  if (!query) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">검색어가 없습니다.</h1>
        <p>검색어를 입력해주세요.</p>
      </div>
    );
  }

  const { data, error } = await supabase
    .from("partnershipsubmit")
    .select(`
      id,
      company_name,
      address,
      comment,
      greeting,
      thumbnail_url,
      partnershipsubmit_themes (
        themes (
          id,
          name
        )
      )
    `)
    .textSearch("search_tsv", query, {
      type: "websearch",
      config: "english",
    });

  if (error) {
    console.error("검색 에러:", error);
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">검색 오류</h1>
        <p>{error.message}</p>
      </div>
    );
  }

  // 결과 UI
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">{query} 검색결과</h1>

      <div className="space-y-6">
        {data?.map((item) => {
          // 썸네일 이미지 경로
          const imageUrl = `https://vejthvawsbsitttyiwzv.supabase.co/storage/v1/object/public/gunma//${item.thumbnail_url}`;
          // 테마(해시태그)
          const themeList = item.partnershipsubmit_themes || [];

          return (
            <div
              key={item.id}
              // 카드 높이를 217px으로 고정해, 이미지와 동일한 높이를 유지
              // items-stretch로 좌우가 같은 높이가 되게 함
              className="
                flex flex-col md:flex-row
                items-stretch
                bg-gray-100
                p-4
                rounded-lg
               
                overflow-hidden
              "
            >
              {/* 왼쪽 썸네일 영역 */}
              <div className="w-[373px] h-[217px] relative flex-shrink-0">
                <Image
                  src={imageUrl}
                  alt={item.company_name}
                  width={373}
                  height={217}
                  className="object-cover w-full h-full rounded-xl"
                />
              </div>

              {/* 오른쪽 텍스트 영역 */}
              <div className="flex-1 px-4 py-2">
                <h2 className="text-lg font-semibold mb-1">
                  {item.company_name}
                </h2>

                {/* 주소 + 리뷰 (나란히) */}
                <div className="flex items-center text-sm text-gray-600 mb-1 gap-3">
                  {/* 주소 아이콘 + 텍스트 */}
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

                  {/* 리뷰 */}
                  <div className="text-gray-500">
                    리뷰 {item.comment ?? 0}
                  </div>
                </div>

                {/* 인사말(소개) */}
                <p className="text-sm text-gray-800">
                  {item.greeting}
                </p>

                {/* 해시태그 목록 */}
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
            </div>
          );
        })}
      </div>
    </div>
  );
}