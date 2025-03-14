// app/components/main/NewArrivalsSectionServer.jsx
// "use client";  <-- 쓰지 않습니다: 서버 컴포넌트!

import { supabase } from "@/lib/supabaseF"; // or supabaseE, depending on your setup
import Image from "next/image";

// 간단한 가격 포맷 함수 (원한다면 사용)
function formatPrice(num) {
  if (!num) return "0원";
  return num.toLocaleString() + "원";
}

// ★ 서버 컴포넌트
export default async function NewArrivalsSectionServer() {
  // 1) 서버 사이드 데이터 Fetch
  const { data, error } = await supabase
    .from("partnershipsubmit")
    .select(`
      id,
      post_title,
      address,
      thumbnail_url,
      created_at
    `)
    .eq("final_admitted", true)
    .order("created_at", { ascending: false })
    .limit(4);

  // 에러 시 간단 처리
  if (error) {
    console.error("SSR fetch error:", error);
    return (
      <section className="w-full bg-white py-10">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-2 text-2xl font-bold text-gray-800">
            신규 입점 했어요
          </h2>
          <p className="text-red-500">데이터 로드 오류가 발생했습니다!</p>
        </div>
      </section>
    );
  }

  // 2) 데이터 매핑
  const shopCards = (data || []).map((item) => ({
    id: item.id,
    imgSrc: `https://vejthvawsbsitttyiwzv.supabase.co/storage/v1/object/public/gunma/${item.thumbnail_url}`,
    title: item.post_title || "제목 없음",
    address: item.address || "주소 미기재",
    // 필요하다면 price/discount 등 추가
  }));

  // 3) JSX 반환
  return (
    <section className="w-full bg-white py-10">
      <div className="mx-auto max-w-7xl px-4">
        {/* 섹션 헤더 */}
        <h2 className="mb-2 text-2xl font-bold text-gray-800">
 
 	
신규 제휴업체
        </h2>
        <p className="mb-6 text-gray-500">
 
 	
여기닷에 등록한 신규 입점업체를 만나보세요!
        </p>

        {/* (A) 모바일 슬라이드 + (B) 데스크톱 그리드 */}
        <div>
          {/* (A) 모바일 슬라이더 (<640px) */}
          <div className="block sm:hidden px-2">
            <div
              className="
                flex
                overflow-x-auto
                gap-6
                snap-x snap-mandatory
              "
              style={{ scrollBehavior: "smooth" }}
            >
              {shopCards.map((shop) => (
                <div
                  key={shop.id}
                  className="
                    shrink-0
                    w-[260px]
                    snap-start
                    overflow-hidden
                    rounded-xl border border-gray-200
                    bg-white shadow
                  "
                >
                  {/* 이미지 영역 (240×130 예시) */}
                  <div className="w-[240px] h-[130px] mx-auto mt-3 overflow-hidden rounded-xl">
                    <Image
                      src={shop.imgSrc}
                      alt={shop.title}
                      width={240}
                      height={130}
                      style={{ objectFit: "cover" }}
                      quality={70}
                      sizes="240px"
                      className="rounded-xl"
                    />
                  </div>

                  {/* 텍스트 영역 */}
                  <div className="p-4 w-[260px] box-border">
                    <h3 className="mb-1 text-base font-semibold text-gray-800">
                      {shop.title}
                    </h3>
                    <p className="text-sm text-gray-600">{shop.address}</p>

                    {/* 
                    예: price
                    <p className="mt-2 text-xs text-gray-400 line-through">
                      {formatPrice(shop.originalPrice)}
                    </p>
                    <div className="mt-1 flex items-baseline space-x-2">
                      <span className="inline-block rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
                        {shop.discount}%
                      </span>
                      <p className="text-sm font-bold text-gray-900">
                        {formatPrice(shop.price)}
                      </p>
                    </div>
                    */}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* (B) 데스크톱 그리드 (≥640px) */}
          <div className="hidden sm:grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
            {shopCards.map((shop) => (
              <div
                key={shop.id}
                className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow"
              >
                {/* 이미지 영역 */}
                <div className="h-[153px] w-[263px] mx-auto mt-4 overflow-hidden rounded-xl">
                  <Image
                    src={shop.imgSrc}
                    alt={shop.title}
                    width={263}
                    height={153}
                    style={{ objectFit: "cover" }}
                    quality={70}
                  />
                </div>
                {/* 텍스트 영역 */}
                <div className="p-4">
                  <h3 className="mb-1 text-base font-semibold text-gray-800">
                    {shop.title}
                  </h3>
                  <p className="text-sm text-gray-600">{shop.address}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* '더보기' 버튼 */}
        <div className="mt-8 text-center">
          <button className="rounded border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
            더보기 +
          </button>
        </div>
      </div>
    </section>
  );
}