"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// 자식 지역 카테고리(구·군) 목록
import {
  서울, 인천, 대전, 세종, 광주, 대구, 울산,
  부산, 경기, 강원, 충북, 충남, 전북, 전남,
  경북, 경남, 제주,
} from "./region";

// 시·도 목록
const regionTabs = [
  "전체",
  "서울","인천","대전","세종","광주","대구","울산","부산",
  "경기","강원","충북","충남","전북","전남","경북","경남","제주",
];

// 테마 목록
const themeList = ["전체", "스웨디시", "아로마", "타이", "커플", "건식"];

/**
 * (수정된 요구사항)
 * - SSR 시엔 항상 닫힘( false )으로 렌더링 -> Hydration mismatch 방지
 * - 클라이언트 마운트 후:
 *    1) 모바일( <768px )이면 기본 닫힘
 *    2) 데스크톱( >=768px )이면 district === '전체'일 경우 열림, 아니면 닫힘
 * - 시·도 버튼 클릭 시 district=전체 => 필터 열림
 * - 구·군 = 전체 → 필터 열림 / 아니면 닫힘
 * - 사용자는 언제든 toggle
 */
export default function ClientUI({ city, district, theme }) {
  const router = useRouter();

  // ---------------------------------------------
  // (A) SSR 시엔 항상 false -> 서버/클라 일치
  // ---------------------------------------------
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // ---------------------------------------------
  // (B) 컴포넌트 마운트 후(클라이언트)에서만
  //     화면 크기 & district에 따라 열림/닫힘 결정
  // ---------------------------------------------
  useEffect(() => {
    // 1) 모바일( <768px )이면 기본 닫힘
    const isMobile = window.innerWidth < 768;

    // 2) 데스크톱( >=768px )이면
    //    district === "전체"면 열고, 아니면 닫기
    if (!isMobile) {
      if (district === "전체") {
        setIsFilterOpen(true);
      } else {
        setIsFilterOpen(false);
      }
    } else {
      // 모바일은 항상 닫힘(사용자가 토글로 열 수 있음)
      setIsFilterOpen(false);
    }
  }, [district]);

  // ---------------------------------------------------
  // (C) 각종 핸들러
  // ---------------------------------------------------
  function handleToggleFilter() {
    setIsFilterOpen(!isFilterOpen);
  }

  function handleSelectCity(cityName) {
    // 시·도 선택 => 구·군,테마=전체
    router.push(`/today/${cityName}/전체/전체`);
  }

  function handleSelectDistrict(districtName) {
    router.push(`/today/${city}/${districtName}/전체`);
  }

  function handleSelectTheme(themeName) {
    router.push(`/today/${city}/${district}/${themeName}`);
  }

  // ---------------------------------------------------
  // (D) 시·도별 구·군 목록
  // ---------------------------------------------------
  let districtsData = ["전체"];
  switch (city) {
    case "서울": districtsData = 서울; break;
    case "인천": districtsData = 인천; break;
    case "대전": districtsData = 대전; break;
    case "세종": districtsData = 세종; break;
    case "광주": districtsData = 광주; break;
    case "대구": districtsData = 대구; break;
    case "울산": districtsData = 울산; break;
    case "부산": districtsData = 부산; break;
    case "경기": districtsData = 경기; break;
    case "강원": districtsData = 강원; break;
    case "충북": districtsData = 충북; break;
    case "충남": districtsData = 충남; break;
    case "전북": districtsData = 전북; break;
    case "전남": districtsData = 전남; break;
    case "경북": districtsData = 경북; break;
    case "경남": districtsData = 경남; break;
    case "제주": districtsData = 제주; break;
    default:
      districtsData = ["전체"];
  }

  // ---------------------------------------------------
  // (E) 렌더
  // ---------------------------------------------------
  return (
    <div>
      {/* 상단 영역 */}
      <div className="bg-gray-700 px-4 py-8 text-white">
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="text-2xl font-bold">
            실시간 업데이트 되는 관리사님들을 확인해 보세요!
          </h1>
          <p className="mt-2 text-gray-200">
            지쳐있던 몸과 마음을 힐링시켜드릴 관리사님들이 지금 기다리고 있습니다
          </p>
        </div>

        {/* 상단 버튼들 */}
        <div className="mx-auto mt-6 flex max-w-5xl items-center justify-center gap-3">
          <button
            onClick={() => alert("지역검색 버튼 클릭!")}
            className="rounded-md bg-orange-500 px-4 py-2 text-white hover:bg-orange-600"
          >
            지역검색
          </button>

          {/* 시·도 토글 버튼 */}
          <button
            onClick={handleToggleFilter}
            className="flex items-center gap-1 rounded-md bg-gray-300 px-4 py-2 text-gray-800 hover:bg-gray-400"
          >
            {city} {district}
          </button>

          <button
            onClick={() => alert("테마 선택 모달 (예시)")}
            className="flex items-center gap-1 rounded-md bg-gray-300 px-4 py-2 text-gray-800 hover:bg-gray-400"
          >
            테마: {theme}
          </button>
        </div>

        {/* 검색창 */}
        <div className="mx-auto mt-4 flex max-w-lg items-center justify-center">
          <input
            type="text"
            placeholder="지역명 검색 (예: 송파, 역삼)"
            className="w-full rounded-l-md border-2 border-r-0 border-gray-300 px-3 py-2 text-gray-700 focus:outline-none"
          />
          <button className="rounded-r-md border-2 border-gray-300 bg-white px-3 py-2 hover:bg-gray-100">
            🔍
          </button>
        </div>
      </div>

      {/* (F) 필터 열기/닫기 */}
      {isFilterOpen && (
        <div className="w-full bg-white py-6">
          <div className="mx-auto max-w-5xl">
            {/* 테이블 헤더 */}
            <div className="mb-2 flex items-center border-b border-gray-200 px-4 pb-2">
              <div className="mr-8 text-lg font-semibold text-gray-600">시·도</div>
              <div className="text-lg font-semibold text-gray-600">구·군</div>
            </div>

            <div className="grid grid-cols-10 gap-4">
              {/* 왼쪽 시·도 목록 */}
              <div className="col-span-2 border-r border-gray-200">
                <div className="max-h-60 overflow-y-auto">
                  {regionTabs.map((cityItem) => (
                    <div
                      key={cityItem}
                      onClick={() => handleSelectCity(cityItem)}
                      className={`cursor-pointer px-4 py-2 hover:bg-orange-50 ${
                        city === cityItem ? "bg-orange-100" : ""
                      }`}
                    >
                      {cityItem}
                    </div>
                  ))}
                </div>
              </div>

              {/* 오른쪽 구·군 목록 */}
              <div className="col-span-8 max-h-60 overflow-y-auto px-2">
                <div className="grid grid-cols-6 gap-2">
                  {districtsData.map((dist) => (
                    <div
                      key={dist}
                      onClick={() => handleSelectDistrict(dist)}
                      className={`cursor-pointer py-1 px-2 hover:bg-orange-50 ${
                        district === dist ? "bg-orange-100" : ""
                      }`}
                    >
                      {dist}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 테마 목록 */}
            <div className="mt-6 border-t border-gray-200 pt-4">
              <h4 className="mb-2 text-lg font-semibold text-gray-600">테마</h4>
              <div className="flex flex-wrap gap-2">
                {themeList.map((th) => (
                  <div
                    key={th}
                    onClick={() => handleSelectTheme(th)}
                    className={`cursor-pointer rounded-full border px-4 py-1 hover:bg-orange-50 ${
                      theme === th ? "bg-orange-100 border-orange-400" : ""
                    }`}
                  >
                    {th}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}