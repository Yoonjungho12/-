"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseF";

// 간단한 가격 포맷 함수 (사용하신다면)
function formatPrice(num) {
  if (!num) return "0원";
  return num.toLocaleString() + "원";
}

export default function NewArrivalsSection() {
  const [shopCards, setShopCards] = useState([]);

  // 마운트 시점에 fetchLatestShops 한 번 호출
  useEffect(() => {
    fetchLatestShops();
  }, []);

  async function fetchLatestShops() {
    try {
      // 1) partnershipsubmit 테이블에서 final_admitted=true 인 것만,
      // created_at 내림차순, 상위 4개
      let { data, error } = await supabase
        .from("partnershipsubmit")
        .select(`
          id,
          post_title,
          address,
          thumbnail_url,
          created_at
        `)
        .eq("final_admitted", true)      // ★ final_admitted=true 필터
        .order("created_at", { ascending: false })
        .limit(4);

      if (error) {
        console.error("fetchLatestShops error:", error);
        return;
      }

      // 2) 데이터 매핑
      const mapped = (data || []).map((item) => ({
        id: item.id,
        imgSrc: `https://vejthvawsbsitttyiwzv.supabase.co/storage/v1/object/public/gunma/${item.thumbnail_url}`,
        title: item.post_title || "제목 없음",
        address: item.address || "주소 미기재",
        // 추후 price/discount 등이 필요하다면 여기서 추가
      }));

      setShopCards(mapped);
    } catch (err) {
      console.error("fetchLatestShops unknown error:", err);
    }
  }

  return (
    <section className="w-full bg-white py-10">
      <div className="mx-auto max-w-5xl px-4">
        {/* 섹션 헤더 */}
        <h2 className="mb-2 text-2xl font-bold text-gray-800">
          신규 입점 했어요
        </h2>
        <p className="mb-6 text-gray-500">
          VIP인포의 새로운 스웨디시 샵을 만나보세요!
        </p>

        {/* 4개 카드 그리드 */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {shopCards.map((shop) => (
            <div
              key={shop.id}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow"
            >
              {/* 이미지 */}
              <div className="h-48 w-full overflow-hidden rounded-t-xl">
                <Image
                  src={shop.imgSrc} 
                  alt={shop.title}
                  width={400}
                  height={300}
                  style={{ objectFit: "cover" }}
                  // 외부 도메인(supabase.co) 사용 시, next.config.js에 domains 설정 필요
                />
              </div>

              {/* 텍스트 영역 */}
              <div className="p-4">
                <h3 className="mb-1 text-base font-semibold text-gray-800">
                  {shop.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {shop.address}
                </p>

                {/* 만약 price가 있다면 이런 식으로 추가
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