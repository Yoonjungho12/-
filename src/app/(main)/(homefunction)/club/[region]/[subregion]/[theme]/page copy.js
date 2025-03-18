// src/app/(main)/board/[region]/[subregion]/[theme]/page.js

import RegionSelectorSSR from "./RegionSelector";
import PartnershipTable from "../PartnershipTable";

/**
 * (1) 메타데이터를 동적으로 생성
 *  - params, searchParams를 받아 원하는 메타태그, OG태그 등을 구성
 */
export async function generateMetadata({ params:a, searchParams:b}) {
  // { region, subregion, theme } from params
  const params = await a;
  const searchParams = await b;
  const { region, subregion, theme } = params;

  // 한글/특수문자 퍼센트 인코딩 되어있다면 decode
  const regionDecoded = decodeURIComponent(region);
  const subregionDecoded = decodeURIComponent(subregion);
  const themeDecoded = decodeURIComponent(theme);

  // 원하는 대로 메타 정보 생성
  const pageTitle = `여기닷 ${regionDecoded} ${subregionDecoded} ${themeDecoded} 추천 및 마사지 정보`;
  const pageDesc = `${regionDecoded} ${subregionDecoded} 지역의 ${themeDecoded} 업소 정보 및 리뷰를 확인하세요!`;

  return {
    title: pageTitle,
    description: pageDesc,
    openGraph: {
      title: pageTitle,
      description: pageDesc,
      url: `https://example.com/board/${region}/${subregion}/${theme}?sort=${searchParams?.sort || ""}`,
    },
  };
}

/**
 * (2) 페이지 컴포넌트
 *  - 서버 컴포넌트에서 params, searchParams를 모두 받을 수 있음
 */
export default async function BoardPage({ params:a, searchParams:b }) {
  // 동적 라우트 파라미터
  const params = await a;
  const searchParams = await b;
  const { region, subregion, theme } = params;

  // 퍼센트 인코딩된 한글을 디코딩
  const regionDecoded = decodeURIComponent(region);
  const subregionDecoded = decodeURIComponent(subregion);
  const themeDecoded = decodeURIComponent(theme);

  // 디버그 로그 (서버 콘솔)

  // (A) 상단 헤더
  return (
    <div className="mx-auto w-full max-w-7xl md:px-4">
      <div className="flex items-center mt-5 mb-3">
        <svg
          className="w-5 h-5 mr-2 text-gray-600 text-base"
          fill="currentColor"
          viewBox="0 0 18 18"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M9 2L2 7v9h5V9h4v7h5V7L9 2z" />
        </svg>
        <h2 className="text-base font-bold text-gray-700">
          지역별 샵 &gt; {regionDecoded} &gt; {subregionDecoded}
        </h2>
      </div>

      {/* (B) SSR 지역/테마 표 */}
      <RegionSelectorSSR
        regionSlug={regionDecoded}
        subregionSlug={subregionDecoded}
        themeName={themeDecoded}
      />

      {/* (C) 파트너십 테이블에 searchParams 포함하여 전달 */}
      <PartnershipTable
        searchParams={searchParams}        // 추가!
        regionSlug={regionDecoded}
        subregionSlug={subregionDecoded}
        themeName={themeDecoded}
      />
    </div>
  );
}