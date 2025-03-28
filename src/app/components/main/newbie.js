// app/components/main/NewArrivalsSectionServer.jsx
// "use client";  <-- 쓰지 않습니다: 서버 컴포넌트!

import { supabase } from "@/lib/supabaseF"; // or supabaseE, depending on your setup
import Image from "next/image";
import Link from "next/link";

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
    imgSrc: `${process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL}/${item.thumbnail_url}`,
    title: item.post_title || "제목 없음",
    address: item.address || "주소 미기재",
  }));

  // 3) JSX 반환
  return (
    <section className="w-full bg-white py-10 flex flex-col items-center">
      <div className="w-full px-4">
        {/* 섹션 헤더 */}
        <h2 className="mb-2 text-xl md:text-2xl font-bold text-gray-800 text-center">
          신규 제휴 파트너
        </h2>
        <p className="mb-6 text-gray-500 text-center">
          여기닷에 등록한 신규 제휴사를 만나보세요!
        </p>

        {/* (A) 모바일 슬라이드 + (B) 데스크톱 그리드 */}
        <div className="max-w-7xl mx-auto hide-scrollbar">
          {/* (A) 모바일 슬라이더 (<640px) */}
          <div className="block sm:hidden px-2">
            <div
              className="
                flex
                overflow-x-auto
                gap-6
                snap-x snap-mandatory
                hide-scrollbar
              "
              style={{ scrollBehavior: "smooth" }}
            >
              {shopCards.map((shop) => (
                <div
                  key={shop.id}
                  className="
                    shrink-0
                    w-[270px]
                    snap-start
                    overflow-hidden
                    rounded-xl
                    border border-gray-200
                    bg-white
                    shadow-xl
                    
                  "
                >
                  {/* 
                    (1) 모바일 이미지 래퍼 
                    -> overflow-hidden + rounded-xl 
                  */}
                  <div className="w-[240px] h-[130px] mx-auto mt-3 overflow-hidden rounded-xl flex ">
                    <Image
                      src={shop.imgSrc}
                      alt={shop.title}
                      width={240}
                      height={130}
                      style={{ objectFit: "cover" }}
                      quality={70}
                      sizes="240px"
                    />
                  </div>

                  {/* 텍스트 영역 */}
                  <div className="p-4 w-[260px] box-border">
                    <h3 className="mb-1 text-base font-semibold text-gray-800">
                      {shop.title}
                    </h3>
                    <p className="text-sm text-gray-600">{shop.address}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* (B) 데스크톱 그리드 (≥640px) */}
          <div className="hidden sm:grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ">
            {shopCards.map((shop) => (
              <div
                key={shop.id}
                className="
                  block
                  overflow-hidden
                  rounded-xl
                  border border-gray-200
                  bg-white
                  shadow-xl
                  focus-within:ring-2 focus-within:ring-blue-500
                    w-[290px]
                "
              >
                {/* 
                  (2) 데스크톱 이미지 래퍼 
                  -> overflow-hidden + rounded-xl 
                */}
                <div className="h-[153px] w-[263px] overflow-hidden mx-auto mt-3 rounded-xl flex ">
                  <Image
                    src={shop.imgSrc}
                    alt={shop.title}
                    width={263}
                    height={153}
                    style={{ objectFit: "cover" }}
                    quality={70}
                  />
                </div>

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
      </div>

      {/* '더보기' 버튼 */}
      <Link
        href={"/board/전체/전체"}
        className="mt-15 rounded border-[0.5px] border-gray-500 px-5 py-2 text-gray-500"
      >
        더보기 +
      </Link>
    </section>
  );
}