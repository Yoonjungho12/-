"use client";
import React, { useState, useEffect } from "react";

// SSR 데이터를 가져오는 함수 (동일)
export async function getServerSideProps() {
  const shopCards = [
    {
      id: 1,
      imgSrc: "/images/sample1.jpg",
      title: "강남-엠케날스웨디시",
      address: "서울 강남구 역삼동 804",
      reviewCount: 4,
      originPrice: 140000,
      discount: 15,
      price: 120000,
    },
    {
      id: 2,
      imgSrc: "/images/sample2.jpg",
      title: "청담-아리아테라피",
      address: "서울 강남구 청담동 54-9",
      reviewCount: 71,
      originPrice: 120000,
      discount: 17,
      price: 100000,
    },
    {
      id: 3,
      imgSrc: "/images/sample3.jpg",
      title: "성수-1인샵 아린",
      address: "서울 성동구 성수동2가",
      reviewCount: 243,
      originPrice: 100000,
      discount: 10,
      price: 90000,
    },
    {
      id: 4,
      imgSrc: "/images/sample4.jpg",
      title: "구로-에스테라피",
      address: "서울 구로구 구로동 182-13",
      reviewCount: 143,
      originPrice: 120000,
      discount: 17,
      price: 100000,
    },
    {
      id: 5,
      imgSrc: "/images/sample5.jpg",
      title: "강남-스파엔( SPA N )",
      address: "서울 강남구 역삼동 669-9",
      reviewCount: 86,
      originPrice: 120000,
      discount: 9,
      price: 110000,
    },
    {
      id: 6,
      imgSrc: "/images/sample6.jpg",
      title: "양천-소울스웨디시",
      address: "서울 양천구 목동 606-13",
      reviewCount: 303,
      originPrice: 70000,
      discount: 22,
      price: 55000,
    },
    {
      id: 7,
      imgSrc: "/images/sample7.jpg",
      title: "송파-코리아",
      address: "서울 송파구 방이동",
      reviewCount: 217,
      originPrice: 100000,
      discount: 20,
      price: 80000,
    },
    {
      id: 8,
      imgSrc: "/images/sample8.jpg",
      title: "강남-아파트스파",
      address: "서울 강남구 신사동 585-1",
      reviewCount: 21,
      originPrice: 110000,
      discount: 19,
      price: 90000,
    },
  ];

  return {
    props: { shopCards },
  };
}

export default function PopularShops({ shopCards = [] }) {
  // 17개 지역 목록 (동일)
  const regionTabs = [
    "서울","인천","대전","세종","광주","대구","울산","부산",
    "경기","강원","충북","충남","전북","전남","경북","경남","제주",
  ];

  // (1) 화면 크기에 따라 다르게 탭을 보여주기 위해 showCount를 동적으로 관리
  const [showCount, setShowCount] = useState(11);

  // (2) 화면 크기에 따라 showCount를 바꿔주는 로직 (원하시는 브레이크포인트/개수로 조절하세요!)
  useEffect(() => {
    function handleResize() {
      const w = window.innerWidth;
      if (w < 640) {
        // 모바일 (tailwind sm 미만)
        setShowCount(5);
      } else if (w < 768) {
        // sm ~ md
        setShowCount(7);
      } else if (w < 1024) {
        // md ~ lg
        setShowCount(9);
      } else {
        // lg 이상
        setShowCount(11);
      }
    }
    window.addEventListener("resize", handleResize);
    handleResize(); // 초기 실행
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // (3) 현재 시작 인덱스, 선택된 지역
  const [startIndex, setStartIndex] = useState(0);
  const [selectedRegion, setSelectedRegion] = useState(null);

  // (4) startIndex부터 showCount개를 순환하며 가져온 배열
  const visibleTabs = [];
  for (let i = 0; i < showCount; i++) {
    const tabIndex = (startIndex + i) % regionTabs.length;
    visibleTabs.push(regionTabs[tabIndex]);
  }

  // (5) 화살표 버튼 로직 (이전/다음)
  const handlePrev = () => {
    setStartIndex((prev) => (prev - 1 + regionTabs.length) % regionTabs.length);
  };
  const handleNext = () => {
    setStartIndex((prev) => (prev + 1) % regionTabs.length);
  };

  // ───────────────────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────────────────
  return (
    <div className="w-full bg-white">
      {/* 상단 제목 영역 */}
      <div className="mx-auto max-w-5xl px-4 pt-8">
        <h2 className="text-center text-2xl font-bold">
          건마 1인샵 스웨디시 마사지 인기 순위
          <span className="ml-2 text-red-600" aria-hidden="true">
            ❤️
          </span>
        </h2>
        <p className="mt-2 text-center text-gray-700">
          실시간 많은 회원들이 보고있는 업체를 소개합니다
        </p>
      </div>

      {/* 
        지역 탭 (오른쪽 이미지를 원하는 스타일로 구현)
        1) 버튼+탭+버튼을 한 줄로 쭉 연결하여 사각형처럼 보이게
        2) 탭이 선택되면 빨간색 배경, 아니면 회색 
      */}
      <div className="mx-auto mt-6 max-w-5xl px-4">
        <div className="flex items-stretch overflow-hidden rounded border border-gray-300 shadow-sm">
          {/* 왼쪽 화살표 버튼 */}
          <button
            onClick={handlePrev}
            aria-label="이전 지역"
            className="flex items-center justify-center px-3 border-r border-gray-300
                       bg-white text-gray-700 hover:bg-red-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* 중앙 탭 목록 (가로로 쭉) */}
          <ul className="flex flex-1">
            {visibleTabs.map((region, idx) => {
              const isSelected = selectedRegion === region;
              return (
                <li key={idx} className="flex-1">
                  <button
                    onClick={() => setSelectedRegion(region)}
                    aria-label={`${region} 지역 선택`}
                    className={
                      isSelected
                        ? "block w-full h-full bg-red-600 px-4 py-2 text-center text-white hover:bg-red-700"
                        : "block w-full h-full bg-gray-100 px-4 py-2 text-center text-gray-700 hover:bg-gray-200"
                    }
                  >
                    {region}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* 오른쪽 화살표 버튼 */}
          <button
            onClick={handleNext}
            aria-label="다음 지역"
            className="flex items-center justify-center px-3 border-l border-gray-300
                       bg-white text-gray-700 hover:bg-red-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* 카드 그리드 (동일) */}
      <div className="mx-auto mt-6 grid max-w-5xl grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {shopCards.map((shop) => (
          <div
            key={shop.id}
            className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm
                       focus-within:ring-2 focus-within:ring-blue-500"
          >
            <div className="aspect-w-4 aspect-h-3 w-full overflow-hidden bg-gray-200">
              <img
                src={shop.imgSrc}
                alt={`${shop.title} 대표 이미지`}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="mb-1 text-base font-semibold text-gray-900">
                {shop.title}
              </h3>
              <p className="text-sm text-gray-600">{shop.address}</p>
              <p className="mt-0.5 text-xs text-gray-500">리뷰 {shop.reviewCount}</p>
              <div className="mt-2">
                <p className="text-xs text-gray-400 line-through">
                  {shop.originPrice.toLocaleString()}원
                </p>
                <div className="flex items-baseline space-x-1">
                  <span className="inline-block rounded bg-red-100 px-1 py-0.5 text-xs text-red-600">
                    {shop.discount}%
                  </span>
                  <p className="text-sm font-bold text-gray-900">
                    {shop.price.toLocaleString()}원
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 더보기 버튼 (동일) */}
      <div className="mx-auto mt-6 max-w-5xl px-4 pb-8 text-center">
        <button
          className="rounded border border-gray-400 px-6 py-2 text-sm font-medium text-gray-800
                     hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-400"
          aria-label="더 많은 목록 보기"
        >
          더보기 +
        </button>
      </div>
    </div>
  );
}