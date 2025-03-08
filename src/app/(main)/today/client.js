"use client";
import { useState } from "react";

// region.js의 모든 지역 배열을 불러온다고 가정 (경로는 실제 파일 위치에 맞게 수정)
import {
  서울,
  인천,
  대전,
  세종,
  광주,
  대구,
  울산,
  부산,
  경기,
  강원,
  충북,
  충남,
  전북,
  전남,
  경북,
  경남,
  제주,
} from "./region"; 

// 왼쪽 탭(시·도) 목록
const regionTabs = [
  "서울",
  "인천",
  "대전",
  "세종",
  "광주",
  "대구",
  "울산",
  "부산",
  "경기",
  "강원",
  "충북",
  "충남",
  "전북",
  "전남",
  "경북",
  "경남",
  "제주",
];

// 테마 목록(필터)
const themeList = ["스웨디시", "아로마", "타이", "커플", "건식"];

export default function ClientUI() {
  // 선택 상태
  const [selectedRegion, setSelectedRegion] = useState("전체");
  const [selectedTheme, setSelectedTheme] = useState("전체");

  // 토글 (열림/닫힘)
  const [showRegionList, setShowRegionList] = useState(false);
  const [showThemeList, setShowThemeList] = useState(false);

  // 검색창
  const [searchInput, setSearchInput] = useState("");

  // 이벤트 핸들러들
  const handleRegionSearchClick = () => {
    alert("지역검색 버튼 클릭!");
  };

  const handleToggleRegion = () => {
    setShowRegionList(!showRegionList);
    setShowThemeList(false);  // 테마 목록은 닫음
  };

  const handleToggleTheme = () => {
    setShowThemeList(!showThemeList);
    setShowRegionList(false); // 시·도 목록은 닫음
  };

  // 시·도 선택 시 => 원래는 setShowRegionList(false)로 닫았지만 제거함
  const handleSelectRegion = (region) => {
    setSelectedRegion(region);
    // setShowRegionList(false);  // 제거: 선택해도 닫히지 않도록
  };

  // 테마 선택 시 => 현재는 테마 선택 후 닫기 원하면 제거
  const handleSelectTheme = (theme) => {
    setSelectedTheme(theme);
    setShowThemeList(false);  // 테마는 선택하면 닫히도록 유지
  };

  // 오른쪽 시·군 목록 로직
  let rightSideAreas = [];
  if (selectedRegion === "전체") {
    rightSideAreas = ["전체"];
  } else {
    switch (selectedRegion) {
      case "서울":
        rightSideAreas = 서울;
        break;
      case "인천":
        rightSideAreas = 인천;
        break;
      case "대전":
        rightSideAreas = 대전;
        break;
      case "세종":
        rightSideAreas = 세종;
        break;
      case "광주":
        rightSideAreas = 광주;
        break;
      case "대구":
        rightSideAreas = 대구;
        break;
      case "울산":
        rightSideAreas = 울산;
        break;
      case "부산":
        rightSideAreas = 부산;
        break;
      case "경기":
        rightSideAreas = 경기;
        break;
      case "강원":
        rightSideAreas = 강원;
        break;
      case "충북":
        rightSideAreas = 충북;
        break;
      case "충남":
        rightSideAreas = 충남;
        break;
      case "전북":
        rightSideAreas = 전북;
        break;
      case "전남":
        rightSideAreas = 전남;
        break;
      case "경북":
        rightSideAreas = 경북;
        break;
      case "경남":
        rightSideAreas = 경남;
        break;
      case "제주":
        rightSideAreas = 제주;
        break;
      default:
        rightSideAreas = ["전체"];
    }
  }

  return (
    <div>
      {/* 상단 회색 영역 */}
      <div className="bg-gray-700 px-4 py-8 text-white">
        <div className="mx-auto max-w-5xl text-center">
          <h1 className="text-2xl font-bold">
            실시간 업데이트 되는 관리자님들을 확인해 보세요!
          </h1>
          <p className="mt-2 text-gray-200">
            지쳐있던 몸과 마음을 힐링시켜드릴 관리자님들이 지금 기다리고 있습니다
          </p>
        </div>

        {/* 버튼 3개 */}
        <div className="mx-auto mt-6 flex max-w-5xl items-center justify-center gap-3">
          {/* (1) 지역검색 (빨간색) */}
          <button
            onClick={handleRegionSearchClick}
            className="rounded-md bg-red-500 px-4 py-2 text-white hover:bg-red-600"
          >
            지역검색
          </button>

          {/* (2) 위치아이콘 + 선택된 시도 */}
          <button
            onClick={handleToggleRegion}
            className="flex items-center gap-1 rounded-md bg-gray-300 px-4 py-2 text-gray-800 hover:bg-gray-400"
          >
            {/* 위치 아이콘 */}
            <svg
              className="h-5 w-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.657 16.657L13.414 12.414m0 
                   0a5 5 0 117.071-7.07 5 
                   5 0 01-7.07 7.07zm0 
                   0L9.878 9.878"
              />
            </svg>
            {selectedRegion}
            <svg
              className="h-4 w-4 text-gray-600"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              {showRegionList ? (
                // 위쪽 화살표
                <path d="M5.23 7.21a.75.75 
                   0 011.06.02L10 
                   11.188l3.71-3.96a.75.75 
                   0 111.08 1.04l-4.24 
                   4.52a.75.75 
                   0 01-1.08 0l-4.24-4.52a.75.75 
                   0 01.02-1.06z" />
              ) : (
                // 아래쪽 화살표
                <path d="M14.77 7.21a.75.75 
                   0 00-1.06.02L10
                   11.188l-3.71-3.96a.75.75
                   0 00-1.08 1.04l4.24
                   4.52a.75.75
                   0 001.08 0l4.24-4.52a.75.75
                   0 00-.02-1.06z" />
              )}
            </svg>
          </button>

          {/* (3) 필터아이콘 + 선택된테마 */}
          <button
            onClick={handleToggleTheme}
            className="flex items-center gap-1 rounded-md bg-gray-300 px-4 py-2 text-gray-800 hover:bg-gray-400"
          >
            <svg
              className="h-5 w-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 4a2 2 0 
                   012-2h3.28a2 2 0 
                   011.414.586l1.828 1.828A2 2 0 
                   0012.536 5H19a2 
                   2 0 012 
                   2v2m-2 
                   10a2 2 0 
                   01-2 2H7a2 2 0 
                   01-2-2m0-5h.01"
              />
            </svg>
            {selectedTheme}
            <svg
              className="h-4 w-4 text-gray-600"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              {showThemeList ? (
                <path d="M5.23 7.21a.75.75
                   0 011.06.02L10
                   11.188l3.71-3.96a.75.75
                   0 111.08 1.04l-4.24
                   4.52a.75.75
                   0 01-1.08 0l-4.24-4.52a.75.75
                   0 01.02-1.06z" />
              ) : (
                <path d="M14.77 7.21a.75.75
                   0 00-1.06.02L10
                   11.188l-3.71-3.96a.75.75
                   0 00-1.08 1.04l4.24
                   4.52a.75.75
                   0 001.08 0l4.24-4.52a.75.75
                   0 00-.02-1.06z" />
              )}
            </svg>
          </button>
        </div>

        {/* 검색창 */}
        <div className="mx-auto mt-4 flex max-w-lg items-center justify-center">
          <input
            type="text"
            placeholder="지역명 검색 (ex: 송파, 역삼)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-l-md border-2 border-r-0 border-gray-300 px-3 py-2 text-gray-700 focus:outline-none"
          />
          <button className="rounded-r-md border-2 border-gray-300 bg-white px-3 py-2 hover:bg-gray-100">
            <svg
              className="h-5 w-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11 5a7 7 0 
                   00-7 7 7 7 0 
                   0011.02 5.896l4.392
                   4.392a1 1 0
                   001.414-1.414l-4.392-4.392A7
                   7 0 0011 5z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* 테이블: showRegionList 또는 showThemeList가 true일 때 노출 */}
      {(showRegionList || showThemeList) && (
        <div className="w-full bg-white py-6">
          <div className="mx-auto max-w-5xl">
            {/* 테이블 헤더 (시·도 / 시·군) */}
            <div className="mb-2 flex items-center border-b border-gray-200 px-4 pb-2">
              <div className="text-lg font-semibold text-gray-600">시·도</div>
              <div className="text-lg font-semibold text-gray-600">시·군</div>
            </div>

            {/* grid-cols-10으로 2:8 분할 */}
            <div className="grid grid-cols-10 gap-4">
              {/* 왼쪽 (시·도): col-span-2 */}
              <div className="col-span-2 border-r border-gray-200">
                <div className="max-h-[400px] overflow-y-auto">
                  {/* 전체 */}
                  <div
                    className={`cursor-pointer px-4 py-2 hover:bg-red-50 ${
                      selectedRegion === "전체" ? "bg-red-100" : ""
                    }`}
                    onClick={() => handleSelectRegion("전체")}
                  >
                    전체
                  </div>
                  {/* 실제 시·도 목록 */}
                  {regionTabs.map((region) => (
                    <div
                      key={region}
                      className={`cursor-pointer px-4 py-2 hover:bg-red-50 ${
                        selectedRegion === region ? "bg-red-100" : ""
                      }`}
                      onClick={() => handleSelectRegion(region)}
                    >
                      {region}
                    </div>
                  ))}
                </div>
              </div>

              {/* 오른쪽 (시·군): col-span-8 */}
              <div className="col-span-8 max-h-[400px] overflow-y-auto px-2">
                {/* 7칸짜리 그리드, 필요 시 조절 */}
                <div className="grid grid-cols-7 gap-x-4 gap-y-2">
                  {rightSideAreas.map((area, idx) => (
                    <div
                      key={idx}
                      className="cursor-pointer py-1 px-2 hover:bg-red-50"
                    >
                      {area}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}