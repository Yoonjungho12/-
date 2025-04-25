// src/app/(main)/(homefunction)/(another)/club/[region]/[subregion]/[theme]/page.js

import RegionSelectorSSR from "./RegionSelector";
import PartnershipTable from "./PartnershipTable";

/* -----------------------------------------------------
   (0) 테마별 메타 정보 (title + description)
   - {region}은 generateMetadata에서 치환됩니다.
------------------------------------------------------ */
const themeMetaMap = {
  "클럽": {
    title: "{region} 클럽 추천 | {region}의 인기 클럽 정보 - 여기닷",
    description:
      "{region} 클럽을 찾고 계신다면, 여기닷에서 내 주변의 인기 클럽을 비교해 보세요. 웨이터와 MD의 인지도, 제휴사의 가격 등 다양한 정보를 제공하여 원하는 {region}의 클럽을 쉽게 찾을 수 있습니다. 인기 클럽의 특징을 한눈에 보고, 이용자가 합리적인 선택을 할 수 있도록 안내해 드립니다."
  },
  "나이트클럽": {
    title: "{region} 나이트클럽 인기 순위 | {region}나이트 정보 - 여기닷",
    description:
      "{region}나이트클럽을 찾고 계신다면, 여기닷에서 내 주변의 인기 있는 {region}나이트를 한눈에 비교해 보세요. 웨이터 및 MD 추천, 나이트 위치 등 다양한 정보를 제공해 여러분이 원하는 정보를 쉽게 찾을 수 있도록 도와드립니다."
  }
};

/**
 * (A) "하이픈 -> 슬래시" 단순 치환
 */
function convertSlugToSlash(str) {
  return str.replace(/-/g, "/");
}

/**
 * (1) 메타데이터를 동적으로 생성
 */
export async function generateMetadata({ params:a, searchParams:b}) {
  const params = await a;
  const searchParams = await b;
  const { region, subregion, theme } = params;

  // 1) 퍼센트 인코딩을 풀어준다
  const regionDecoded = decodeURIComponent(region);
  const themeDecoded = decodeURIComponent(theme);

  // 2) 하이픈 -> 슬래시 치환
  const regionName = convertSlugToSlash(regionDecoded);

  // 3) themeMetaMap에서 해당 테마 정보 가져오기
  const metaObj = themeMetaMap[themeDecoded];

  // 4) 매핑이 없으면 fallback
  if (!metaObj) {
    const fallbackTitle = `${regionName} ${themeDecoded} 추천 및 정보 - 여기닷`;
    const fallbackDesc = `${regionName}의 ${themeDecoded} 업소 정보 및 리뷰를 확인하세요!`;
    return {
      title: fallbackTitle,
      description: fallbackDesc,
      openGraph: {
        title: fallbackTitle,
        description: fallbackDesc,
        url: `https://yeogidot.com/club/${region}/${subregion}/${theme}?sort=${searchParams?.sort || ""}`,
        type: 'website',
        siteName: '여기닷'
      }
    };
  }

  // 5) {region} 치환 → regionName
  const replacedTitle = metaObj.title.replace(/{region}/g, regionName);
  const replacedDesc = metaObj.description.replace(/{region}/g, regionName);

  return {
    title: replacedTitle,
    description: replacedDesc,
    openGraph: {
      title: replacedTitle,
      description: replacedDesc,
      url: `https://yeogidot.com/club/${region}/${subregion}/${theme}?sort=${searchParams?.sort || ""}`,
      type: 'website',
      siteName: '여기닷'
    }
  };
}

/**
 * (2) 페이지 컴포넌트
 */
export default async function BoardPage({ params:a, searchParams:b }) {
  const params = await a;
  const searchParams = await b;
  const { region, subregion, theme } = params;

  // 퍼센트 인코딩된 한글을 디코딩
  const regionDecoded = decodeURIComponent(region);
  const subregionDecoded = decodeURIComponent(subregion);
  const themeDecoded = decodeURIComponent(theme);

  // 하이픈 -> 슬래시 치환
  const regionName = convertSlugToSlash(regionDecoded);

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
          지역별 샵 &gt; {regionName} &gt; {subregionDecoded}
        </h2>
      </div>

      {/* SSR 지역/테마 표 */}
      <RegionSelectorSSR
        regionSlug={regionDecoded}
        subregionSlug={subregionDecoded}
        themeName={themeDecoded}
      />

      {/* 파트너십 테이블 */}
      <PartnershipTable
        searchParams={searchParams}
        regionSlug={regionDecoded}
        subregionSlug={subregionDecoded}
        themeName={themeDecoded}
      />
    </div>
  );
}