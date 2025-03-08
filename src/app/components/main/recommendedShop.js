"use client";
import React from "react";

export default function RecommendedShops() {
  // 예시 카드 데이터 (샘플)
  const shops = [
    {
      id: 1,
      imgSrc: "/images/spa1.jpg",
      title: "강서-수테라피",
      address: "서울 강서구 마곡동 757-5",
      reviewCount: 345,
    },
    {
      id: 2,
      imgSrc: "/images/spa2.jpg",
      title: "관악-더썸테라피",
      address: "서울 관악구 봉천동 856-1",
      reviewCount: 264,
    },
    {
      id: 3,
      imgSrc: "/images/spa3.jpg",
      title: "광주-엔젤스웨디시",
      address: "광주 서구 쌍촌동 869-9",
      reviewCount: 43,
    },
    {
      id: 4,
      imgSrc: "/images/spa4.jpg",
      title: "영등포-리즈테라피",
      address: "서울 영등포구 당산동1가 284-1",
      reviewCount: 120,
    },
    {
      id: 5,
      imgSrc: "/images/spa5.jpg",
      title: "중랑-휴테라피",
      address: "서울 중랑구 면목동 222-3",
      reviewCount: 78,
    },
  ];

  // 칩(태그) 예시
  const tags = ["스웨디시", "1인샵", "로미로미", "타이마사지", "사우나/스파", "왁싱"];
  const selectedTag = "스웨디시"; // 예: 현재 “스웨디시”가 선택된 상태

  return (
    <section className="w-full bg-white py-10">
      {/* 상단 구분선 + 타이틀/부제 */}
      <div className="mx-auto max-w-5xl px-4">
        {/* 가로 라인 */}
        <hr className="mb-6 border-black" />

        <div className="text-center">
          <h2 className="mb-2 text-2xl font-bold">
            회원님을 위한 취향별 마사지샵 추천
          </h2>
          <p className="text-gray-600">
            회원님의 취향을 고려해서 테마별로 보여드릴게요!
          </p>
        </div>

        {/* 칩(태그) 목록 */}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {tags.map((tag) => {
            const isSelected = tag === selectedTag;
            return (
              <button
                key={tag}
                className={
                  isSelected
                    ? "rounded-full bg-red-500 px-4 py-2 text-white hover:bg-red-600"
                    : "rounded-full border border-gray-300 px-4 py-2 text-gray-600 hover:bg-gray-100"
                }
              >
                {tag}
              </button>
            );
          })}
        </div>

        {/* 카드 목록 (그리드) */}
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {shops.map((shop) => (
            <div
              key={shop.id}
              className="relative h-72 w-full overflow-hidden rounded-xl shadow"
            >
              {/* 배경 이미지 */}
              <img
                src={shop.imgSrc}
                alt={shop.title}
                className="absolute h-full w-full object-cover"
              />

              {/* 반투명 오버레이 (약간 어둡게) */}
              <div className="absolute inset-0 bg-black bg-opacity-20"></div>

              {/* 카드 텍스트: 왼쪽 위 + 왼쪽 아래 */}
              {/* 왼쪽 위에 타이틀 */}
              <div className="absolute top-3 left-3">
                <h3 className="text-base font-semibold text-white">
                  {shop.title}
                </h3>
              </div>

              {/* 왼쪽 아래에 주소 + 리뷰 */}
              <div className="absolute bottom-3 left-3 text-sm text-white">
                <p>{shop.address}</p>
                <p>리뷰 {shop.reviewCount}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}