import React from 'react';

// SSR 데이터를 가져오는 함수
export async function getServerSideProps() {
  const shopCards = [
    {
      id: 1,
      imgSrc: '/images/sample1.jpg',
      title: '강남-엠케날스웨디시',
      address: '서울 강남구 역삼동 804',
      reviewCount: 4,
      originPrice: 140000,
      discount: 15,
      price: 120000,
    },
    {
      id: 2,
      imgSrc: '/images/sample2.jpg',
      title: '청담-아리아테라피',
      address: '서울 강남구 청담동 54-9',
      reviewCount: 71,
      originPrice: 120000,
      discount: 17,
      price: 100000,
    },
    {
      id: 3,
      imgSrc: '/images/sample3.jpg',
      title: '성수-1인샵 아린',
      address: '서울 성동구 성수동2가',
      reviewCount: 243,
      originPrice: 100000,
      discount: 10,
      price: 90000,
    },
    {
      id: 4,
      imgSrc: '/images/sample4.jpg',
      title: '구로-에스테라피',
      address: '서울 구로구 구로동 182-13',
      reviewCount: 143,
      originPrice: 120000,
      discount: 17,
      price: 100000,
    },
    {
      id: 5,
      imgSrc: '/images/sample5.jpg',
      title: '강남-스파엔( SPA N )',
      address: '서울 강남구 역삼동 669-9',
      reviewCount: 86,
      originPrice: 120000,
      discount: 9,
      price: 110000,
    },
    {
      id: 6,
      imgSrc: '/images/sample6.jpg',
      title: '양천-소울스웨디시',
      address: '서울 양천구 목동 606-13',
      reviewCount: 303,
      originPrice: 70000,
      discount: 22,
      price: 55000,
    },
    {
      id: 7,
      imgSrc: '/images/sample7.jpg',
      title: '송파-코리아',
      address: '서울 송파구 방이동',
      reviewCount: 217,
      originPrice: 100000,
      discount: 20,
      price: 80000,
    },
    {
      id: 8,
      imgSrc: '/images/sample8.jpg',
      title: '강남-아파트스파',
      address: '서울 강남구 신사동 585-1',
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
  return (
    <div className="w-full bg-white">
      {/* 상단 제목 영역 */}
      <div className="mx-auto max-w-5xl px-4 pt-8">
        <h2 className="text-center text-2xl font-bold">
          건마 1인샵 스웨디시 마사지 인기 순위
          <span className="ml-2 text-red-500">❤️</span>
        </h2>
        <p className="mt-2 text-center text-gray-500">
          실시간 많은 회원들이 보고있는 업체를 소개합니다
        </p>
      </div>

      {/* 지역 탭 (화살표 + 서울, 인천, 대전, …) */}
      <div className="mx-auto mt-6 flex max-w-5xl items-center space-x-2 px-4">
        <button className="rounded-full bg-red-500 p-2 text-white hover:bg-red-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <ul className="flex flex-wrap items-center space-x-2 text-sm font-medium">
          <li>
            <button className="rounded-full bg-red-500 px-4 py-2 text-white hover:bg-red-600">
              서울
            </button>
          </li>
          <li>
            <button className="rounded-full border border-gray-300 px-4 py-2 text-gray-600 hover:bg-gray-100">
              인천
            </button>
          </li>
          <li>
            <button className="rounded-full border border-gray-300 px-4 py-2 text-gray-600 hover:bg-gray-100">
              대전
            </button>
          </li>
          <li>
            <button className="rounded-full border border-gray-300 px-4 py-2 text-gray-600 hover:bg-gray-100">
              세종
            </button>
          </li>
          <li>
            <button className="rounded-full border border-gray-300 px-4 py-2 text-gray-600 hover:bg-gray-100">
              광주
            </button>
          </li>
          <li>
            <button className="rounded-full border border-gray-300 px-4 py-2 text-gray-600 hover:bg-gray-100">
              대구
            </button>
          </li>
          <li>
            <button className="rounded-full border border-gray-300 px-4 py-2 text-gray-600 hover:bg-gray-100">
              울산
            </button>
          </li>
          <li>
            <button className="rounded-full border border-gray-300 px-4 py-2 text-gray-600 hover:bg-gray-100">
              부산
            </button>
          </li>
          <li>
            <button className="rounded-full border border-gray-300 px-4 py-2 text-gray-600 hover:bg-gray-100">
              경기
            </button>
          </li>
          <li>
            <button className="rounded-full border border-gray-300 px-4 py-2 text-gray-600 hover:bg-gray-100">
              강원
            </button>
          </li>
          <li>
            <button className="rounded-full border border-gray-300 px-4 py-2 text-gray-600 hover:bg-gray-100">
              충북
            </button>
          </li>
        </ul>

        <button className="ml-auto rounded-full bg-gray-200 p-2 text-gray-500 hover:bg-gray-300">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* 카드 그리드 */}
      <div className="mx-auto mt-6 grid max-w-5xl grid-cols-1 gap-4 px-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {shopCards.map((shop) => (
          <div
            key={shop.id}
            className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
          >
            <div className="aspect-w-4 aspect-h-3 w-full overflow-hidden bg-gray-100">
              <img
                src={shop.imgSrc}
                alt={shop.title}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="p-4">
              <h3 className="mb-1 text-base font-semibold text-gray-900">
                {shop.title}
              </h3>
              <p className="text-sm text-gray-500">{shop.address}</p>
              <p className="mt-0.5 text-xs text-gray-400">리뷰 {shop.reviewCount}</p>
              <div className="mt-2">
                <p className="text-xs text-gray-400 line-through">
                  {shop.originPrice.toLocaleString()}원
                </p>
                <div className="flex items-baseline space-x-1">
                  <span className="inline-block rounded bg-red-100 px-1 py-0.5 text-xs text-red-500">
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

      {/* 더보기 버튼 */}
      <div className="mx-auto mt-6 max-w-5xl px-4 pb-8 text-center">
        <button className="rounded border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
          더보기 +
        </button>
      </div>
    </div>
  );
}