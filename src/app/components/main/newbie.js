"use client";
import React from "react";

// 클라이언트 컴포넌트
export default function NewArrivalsSection() {
  // 예시 데이터
  const shopCards = [
    {
      id: 1,
      imgSrc: "/images/spa1.jpg",
      title: "양산-우유테라피",
      address: "경상남도 양산시 물금읍 가촌리 1298-1",
      originalPrice: 170000,
      discount: 12,
      price: 150000,
    },
    {
      id: 2,
      imgSrc: "/images/spa2.jpg",
      title: "강서-에스파(양천항교역)",
      address: "서울 강서구 등촌동 745",
      originalPrice: 90000,
      discount: 23,
      price: 70000,
    },
    {
      id: 3,
      imgSrc: "/images/spa3.jpg",
      title: "일산-라온스웨디시",
      address: "경기 고양시 일산동구 백석동 1288-2",
      originalPrice: 140000,
      discount: 15,
      price: 120000,
    },
    {
      id: 4,
      imgSrc: "/images/spa4.jpg",
      title: "구미-1인샵 럭스",
      address: "경북 구미시 인의동 1001-7",
      originalPrice: 160000,
      discount: 13,
      price: 140000,
    },
  ];

  // 편의상 `toLocaleString()`으로 숫자 3자리마다 콤마 추가
  function formatPrice(num) {
    return num.toLocaleString() + "원";
  }

  return (
    <section className="w-full bg-white py-10">
      <div className="mx-auto max-w-5xl px-4">
        {/* 섹션 헤딩 */}
        <h2 className="mb-2 text-2xl font-bold text-gray-800">
          신규 입점 했어요
        </h2>
        <p className="mb-6 text-gray-500">
          VIP인포의 새로운 스웨디시 샵을 만나보세요!
        </p>

        {/* 카드 목록 → 4개씩 한 줄에 */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {shopCards.map((shop) => (
            <div
              key={shop.id}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow"
            >
              {/* 이미지 영역 */}
              <div className="h-48 w-full overflow-hidden rounded-t-xl">
                <img
                  src={shop.imgSrc}
                  alt={shop.title}
                  className="h-full w-full object-cover"
                />
              </div>

              {/* 내용영역 */}
              <div className="p-4">
                <h3 className="mb-1 text-base font-semibold text-gray-800">
                  {shop.title}
                </h3>
                <p className="text-sm text-gray-600">{shop.address}</p>

                {/* 원가격 (취소선) */}
                <p className="mt-2 text-xs text-gray-400 line-through">
                  {formatPrice(shop.originalPrice)}
                </p>

                {/* 할인 + 최종가격 */}
                <div className="mt-1 flex items-baseline space-x-2">
                  <span className="inline-block rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
                    {shop.discount}%
                  </span>
                  <p className="text-sm font-bold text-gray-900">
                    {formatPrice(shop.price)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 하단 '더보기' 버튼 */}
        <div className="mt-8 text-center">
          <button className="rounded border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
            더보기 +
          </button>
        </div>
      </div>
    </section>
  );
}