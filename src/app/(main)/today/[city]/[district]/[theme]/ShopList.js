// 서버 컴포넌트 표시 (Next.js 13+ SSR)
export const dynamic = "force-dynamic"; 

import { supabase } from "@/lib/supabaseE";


export default async function ShopList({ city, district, theme }) {
  // 1) 검색어 조합
  const queryParts = [];
  if (city !== "전체") queryParts.push(city);
  if (district !== "전체") queryParts.push(district);
  if (theme !== "전체") queryParts.push(theme);

  // 예) ["서울", "강남구"] => "서울 강남구"
  const searchString = queryParts.join(" ");

  let data = [];
  let error = null;

  if (searchString.trim()) {
    // 2) Supabase textSearch
    //    config: "simple" → 한글로 "서울" 등 검색 시 에러 없이 동작
    const res = await supabase
      .from("partnershipsubmit")
      .select("*")
      .textSearch("search_tsv", searchString, {
        type: "websearch",
        config: "simple", 
      });

    data = res.data || [];
    error = res.error;
  } else {
    // city/district/theme가 전부 "전체"면 → 전체 목록(예: 50개)
    const res = await supabase
      .from("partnershipsubmit")
      .select("*")
      .limit(50);
    data = res.data || [];
    error = res.error;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl py-4 text-red-600">
        DB오류: {error.message}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl py-4">
      <h2 className="text-lg font-bold mb-3">ShopList 결과 (SSR)</h2>
      {data.length === 0 ? (
        <p>검색 결과가 없습니다!</p>
      ) : (
        <ul className="space-y-2">
          {data.map((row) => (
            <li key={row.id} className="border p-2 rounded">
              <div className="font-semibold">{row.post_title}</div>
              <div className="text-sm text-gray-600">
                {row.address} / {row.address_street} / {row.shop_type}
              </div>
              {/* 필요한 정보 더 표시해도 됨 */}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}