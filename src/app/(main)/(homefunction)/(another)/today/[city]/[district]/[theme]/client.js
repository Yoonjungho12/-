"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// 자식 지역 카테고리(구·군) 목록
import {
  서울, 인천, 대전, 세종, 광주, 대구, 울산,
  부산, 경기, 강원, 충북, 충남, 전북, 전남,
  경북, 경남, 제주,
} from "./region";

// 시·도 목록을 객체 배열로 변경
const REGIONS = [
  { id: 0, name: "전체" },
  { id: 1, name: "서울" },
  { id: 2, name: "인천" },
  { id: 3, name: "대전" },
  { id: 4, name: "세종" },
  { id: 5, name: "광주" },
  { id: 6, name: "대구" },
  { id: 7, name: "울산" },
  { id: 8, name: "부산" },
  { id: 9, name: "경기" },
  { id: 10, name: "강원" },
  { id: 11, name: "충북" },
  { id: 12, name: "충남" },
  { id: 13, name: "전북" },
  { id: 14, name: "전남" },
  { id: 15, name: "경북" },
  { id: 16, name: "경남" },
  { id: 17, name: "제주" },
];

// 테마 목록 추가
const THEMES = [
  { id: 0,  name: "전체",       sort_order: 0 },
  { id: 1,  name: "신규업체",   sort_order: 1 },
  { id: 19, name: "눈썹문신",   sort_order: 19 },
  { id: 20, name: "애견펜션",   sort_order: 20 },
  { id: 21, name: "사주",       sort_order: 21 },
  { id: 22, name: "타로",       sort_order: 22 },
  { id: 23, name: "아이폰-스냅", sort_order: 23 },
  { id: 24, name: "웨딩플래너", sort_order: 24 },
  { id: 25, name: "룸카페",     sort_order: 25 },
  { id: 26, name: "성인용품",   sort_order: 26 },
  { id: 27, name: "클럽",       sort_order: 27 },
  { id: 28, name: "나이트클럽", sort_order: 28 },
  { id: 29, name: "네일샵",     sort_order: 29 },
  { id: 30, name: "애견미용",   sort_order: 30 },
  { id: 31, name: "태닝샵",     sort_order: 31 },
  { id: 32, name: "왁싱샵",     sort_order: 32 },
  { id: 33, name: "라운지바",   sort_order: 33 },
  { id: 34, name: "헌팅포차",   sort_order: 34 },
  { id: 35, name: "바",        sort_order: 35 },
  { id: 36, name: "감성주점",   sort_order: 36 },
].sort((a, b) => a.sort_order - b.sort_order);

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

  // 초기 렌더링 여부를 추적하는 state 추가
  const [isInitialRender, setIsInitialRender] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);

  useEffect(() => {
    // 컴포넌트 마운트 시 초기 상태 설정
    const isMobile = window.innerWidth < 768;
    if (!isMobile) {
      if (district === "전체" && city !== "전체") {
        setIsFilterOpen(true);
      } else {
        setIsFilterOpen(false);
      }
    } else {
      setIsFilterOpen(false);
    }
    
    // 약간의 지연 후 초기 렌더링 상태를 false로 변경
    const timer = setTimeout(() => {
      setIsInitialRender(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [district, city]);

  // ---------------------------------------------------
  // (C) 각종 핸들러
  // ---------------------------------------------------
  function handleToggleFilter() {
    setIsFilterOpen(!isFilterOpen);
  }

  function handleToggleTheme() {
    setIsThemeOpen(!isThemeOpen);
  }

  function handleSelectCity(cityName) {
    // theme이 undefined인 경우 "전체"로 설정
    const currentTheme = theme || "전체";
    router.push(`/today/${cityName}/전체/${currentTheme}`);
  }

  function handleSelectDistrict(districtName) {
    // theme이 undefined인 경우 "전체"로 설정
    const currentTheme = theme || "전체";
    router.push(`/today/${city}/${districtName}/${currentTheme}`);
  }

  function handleSelectTheme(themeName) {
    router.push(`/today/${city}/${district}/${themeName}`);
  }

  // ---------------------------------------------------
  // (D) 시·도별 구·군 목록
  // ---------------------------------------------------
  let districtsData = [{ id: 0, name: "전체" }];
  switch (city) {
    case "서울": districtsData = 서울.map((name, idx) => ({ id: idx + 1, name })); break;
    case "인천": districtsData = 인천.map((name, idx) => ({ id: idx + 1, name })); break;
    case "대전": districtsData = 대전.map((name, idx) => ({ id: idx + 1, name })); break;
    case "세종": districtsData = 세종.map((name, idx) => ({ id: idx + 1, name })); break;
    case "광주": districtsData = 광주.map((name, idx) => ({ id: idx + 1, name })); break;
    case "대구": districtsData = 대구.map((name, idx) => ({ id: idx + 1, name })); break;
    case "울산": districtsData = 울산.map((name, idx) => ({ id: idx + 1, name })); break;
    case "부산": districtsData = 부산.map((name, idx) => ({ id: idx + 1, name })); break;
    case "경기": districtsData = 경기.map((name, idx) => ({ id: idx + 1, name })); break;
    case "강원": districtsData = 강원.map((name, idx) => ({ id: idx + 1, name })); break;
    case "충북": districtsData = 충북.map((name, idx) => ({ id: idx + 1, name })); break;
    case "충남": districtsData = 충남.map((name, idx) => ({ id: idx + 1, name })); break;
    case "전북": districtsData = 전북.map((name, idx) => ({ id: idx + 1, name })); break;
    case "전남": districtsData = 전남.map((name, idx) => ({ id: idx + 1, name })); break;
    case "경북": districtsData = 경북.map((name, idx) => ({ id: idx + 1, name })); break;
    case "경남": districtsData = 경남.map((name, idx) => ({ id: idx + 1, name })); break;
    case "제주": districtsData = 제주.map((name, idx) => ({ id: idx + 1, name })); break;
    default:
      districtsData = [{ id: 0, name: "전체" }];
  }

  // ---------------------------------------------------
  // (E) 렌더
  // ---------------------------------------------------
  return (
    <div className="bg-gray-50">
      {/* 상단 영역 */}
      <div className="relative bg-white shadow-sm">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <div className="text-center">
            <h1 className="text-2xl font-medium text-gray-900">
              실시간 업데이트되는 업체 정보
            </h1>
            <p className="mt-2 text-gray-500">
              최신 트렌드를 반영한 업체 정보가 실시간으로 업데이트됩니다
            </p>
          </div>

          {/* 검색창 */}
          <div className="mx-auto mt-4 max-w-2xl">
            <div className="relative">
              <input
                type="text"
                placeholder="지역명 검색 (예: 송파, 역삼)"
                className="w-full rounded-full border-0 bg-gray-100 px-6 py-4 text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:text-gray-400 focus:ring-2 focus:ring-orange-500"
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-orange-500 p-2.5 text-white transition-colors hover:bg-orange-600">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>

          {/* 필터 버튼들 */}
          <div className="mx-auto mt-6 flex max-w-2xl items-center justify-center gap-3">
            <button
              onClick={handleToggleFilter}
              className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-gray-700 ring-1 ring-gray-200 transition-all hover:bg-gray-50"
            >
              <span>{city} {district}</span>
              <svg className={`h-4 w-4 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            <button
              onClick={handleToggleTheme}
              className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-gray-700 ring-1 ring-gray-200 transition-all hover:bg-gray-50"
            >
              <span>테마: {theme}</span>
              <svg className={`h-4 w-4 transition-transform ${isThemeOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>

          {/* 테마 선택 영역 */}
          <div className={`mx-auto mt-3 max-w-4xl overflow-hidden transition-all duration-300 ease-in-out ${
            isThemeOpen ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className="max-h-[200px] overflow-y-auto px-4">
              <div className="flex flex-wrap justify-center gap-2">
                {THEMES.map((th) => (
                  <button
                    key={th.id}
                    onClick={() => {
                      handleSelectTheme(th.name);
                      setIsThemeOpen(false);
                    }}
                    className={`rounded-full px-4 py-2 text-sm transition-all ${
                      theme === th.name 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {th.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 필터 영역 */}
      <div className={`w-full bg-white border-t border-gray-100 ${
        isInitialRender 
          ? isFilterOpen ? 'h-[400px] opacity-100' : 'h-0 opacity-0 overflow-hidden'
          : `transition-all duration-300 ease-in-out ${
              isFilterOpen ? 'h-[400px] opacity-100' : 'h-0 opacity-0 overflow-hidden'
            }`
      }`}>
        <div className="mx-auto max-w-6xl h-full py-6 px-4">
          <div className="flex gap-12 h-full">
            {/* 왼쪽 시·도 목록 */}
            <div className="w-48 h-full">
              <h3 className="mb-3 text-sm font-medium text-gray-500">시·도</h3>
              <div className="h-[calc(100%-2rem)] overflow-y-auto pr-2 space-y-1">
                {REGIONS.map((region) => (
                  <button
                    key={region.id}
                    onClick={() => handleSelectCity(region.name)}
                    className={`w-full rounded-lg px-4 py-2 text-left text-sm transition-all ${
                      city === region.name 
                        ? "bg-orange-500 text-white" 
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {region.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 오른쪽 구·군 목록 */}
            <div className="flex-1 h-full">
              <h3 className="mb-3 text-sm font-medium text-gray-500">구·군</h3>
              <div className="h-[calc(100%-2rem)] overflow-y-auto pr-2">
                <div className="grid grid-cols-6 gap-2">
                  {districtsData.map((dist) => (
                    <button
                      key={dist.id}
                      onClick={() => handleSelectDistrict(dist.name)}
                      className={`rounded-lg py-2 px-3 text-sm transition-all ${
                        district === dist.name 
                          ? "bg-orange-500 text-white" 
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {dist.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}