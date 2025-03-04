'use client'; // Next.js 13 app 디렉토리에서 클라이언트 컴포넌트로 사용 시 필요
import React from 'react';

export default function RecommendedShops() {
  // 예시 카드 데이터
  const shops = [
    {
      id: 1,
      imgSrc: '/images/spa1.jpg',
      title: '봉천-스웨디시테라피',
      desc: '서울 관악구 봉천동 123-4',
    },
    {
      id: 2,
      imgSrc: '/images/spa2.jpg',
      title: '역삼-아로마스파',
      desc: '서울 강남구 역삼동 567-8',
    },
    {
      id: 3,
      imgSrc: '/images/spa3.jpg',
      title: '종로-커플마사지샵',
      desc: '서울 종로구 종로1가 9-1',
    },
    {
      id: 4,
      imgSrc: '/images/spa4.jpg',
      title: '광진-힐링스웨디시',
      desc: '서울 광진구 화양동 42-2',
    },
    {
      id: 5,
      imgSrc: '/images/spa5.jpg',
      title: '강남-럭셔리테라피',
      desc: '서울 강남구 논현동 333-1',
    },
  ];

  return (
    <section className="w-full bg-gray-100 py-10">
      <div className="mx-auto max-w-5xl px-4">
        {/* 상단 제목/부제 */}
        <h2 className="text-center text-2xl font-bold">
          회원님을 위한 취향별 마사지샵 추천
        </h2>
        <p className="mt-2 text-center text-gray-500">
          회원님 취향에 꼭 맞는 업체를 추천해드려요!
        </p>

        {/* 탭 메뉴 */}
        <div className="mt-6 flex justify-center space-x-4">
          {/* 선택된 탭(예: 스웨디시) */}
          <button className="rounded-full bg-red-500 px-4 py-2 text-white hover:bg-red-600">
            스웨디시
          </button>
          <button className="rounded-full border border-gray-300 px-4 py-2 text-gray-600 hover:bg-gray-100">
            건식
          </button>
          <button className="rounded-full border border-gray-300 px-4 py-2 text-gray-600 hover:bg-gray-100">
            아로마
          </button>
          <button className="rounded-full border border-gray-300 px-4 py-2 text-gray-600 hover:bg-gray-100">
            서비스샵
          </button>
          <button className="rounded-full border border-gray-300 px-4 py-2 text-gray-600 hover:bg-gray-100">
            타이
          </button>
        </div>

        {/* 카드 목록 (가로 스크롤) */}
        <div className="mt-8 flex space-x-4 overflow-x-auto px-1">
          {shops.map((shop) => (
            <div
              key={shop.id}
              className="w-64 flex-shrink-0 rounded-xl bg-white p-4 shadow"
            >
              {/* 이미지 영역 */}
              <div className="h-40 w-full overflow-hidden rounded-lg bg-gray-200">
                <img
                  src={shop.imgSrc}
                  alt={shop.title}
                  className="h-full w-full object-cover"
                />
              </div>

              {/* 카드 텍스트 */}
              <h3 className="mt-3 text-base font-semibold text-gray-800">
                {shop.title}
              </h3>
              <p className="mt-1 text-sm text-gray-500">{shop.desc}</p>
            </div>
          ))}
        </div>

        {/* 더보기 버튼 */}
        <div className="mt-6 text-center">
          <button className="rounded border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
            더보기 +
          </button>
        </div>
      </div>
    </section>
  );
}