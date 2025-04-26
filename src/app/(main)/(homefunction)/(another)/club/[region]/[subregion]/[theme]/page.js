// src/app/(main)/(homefunction)/(another)/club/[region]/[subregion]/[theme]/page.js

import RegionSelectorSSR from "./RegionSelector";
import PartnershipTable from "./PartnershipTable";

/* -----------------------------------------------------
   (0) 테마별 메타 정보 (title + description)
   - {region}은 generateMetadata에서 치환됩니다.
   - 클럽과 나이트클럽 테마만 포함
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
 *     "인천-부천-부평" => "인천/부천/부평"
 */
function convertSlugToSlash(str) {
  return str.replace(/-/g, "/");
}

/* -----------------------------------------------------
   (1) 메타데이터를 동적으로 생성
   - subregion은 메타 태그에 포함 X
   - theme에 따라 다른 title, description 적용
   - regionDecoded => regionName(= 슬래시 치환) => {region} 치환
------------------------------------------------------ */
export async function generateMetadata({ params }) {
  const { region: rawRegion, subregion: rawSubregion, theme: rawTheme } = await params;
  
  const region = rawRegion ? decodeURIComponent(rawRegion) : "전체";
  const subregion = rawSubregion ? decodeURIComponent(rawSubregion) : "전체";
  const theme = rawTheme ? decodeURIComponent(rawTheme) : "전체";

  // 전체/전체/전체 경우의 특별 처리
  if (region === "전체" && subregion === "전체" && theme === "전체") {
    return {
      title: "나이트클럽, 가장 많이 찾는 클럽 순위 - 여기닷",
      description: "나이트클럽, 클럽을 찾으신다면 여기닷에서 찾으세요! 서울, 경기, 인천, 대전, 천안, 세종, 충청, 강원 부산, 대구 울산, 경상도, 전라도, 광주, 제주도 등 모든 지역별 가장 저렴하고 인기 있는 나이트와 클럽, 웨이터, MD의 인지도 부분을 모두 비교 분석하여 소비자에게 가장 합리적이고 정확한 대한민국 모든 나이트클럽을 찾을 수 있도록 도와드립니다.",
      openGraph: {
        title: "나이트클럽, 가장 많이 찾는 클럽 순위 - 여기닷",
        description: "나이트클럽, 클럽을 찾으신다면 여기닷에서 찾으세요! 서울, 경기, 인천, 대전, 천안, 세종, 충청, 강원 부산, 대구 울산, 경상도, 전라도, 광주, 제주도 등 모든 지역별 가장 저렴하고 인기 있는 나이트와 클럽, 웨이터, MD의 인지도 부분을 모두 비교 분석하여 소비자에게 가장 합리적이고 정확한 대한민국 모든 나이트클럽을 찾을 수 있도록 도와드립니다.",
        url: `https://yeogidot.com/club/${rawRegion}/${rawSubregion}/${rawTheme}`
      }
    };
  }

  // regionName 결정 로직
  let regionName = "";
  if (subregion !== "전체") {
    regionName = subregion;
  } else {
    regionName = region;
  }

  // themeMap에서 테마 객체 찾기
  const themeObj = themeMetaMap[theme];

  // 만약 themeObj가 없으면 fallback
  if (!themeObj) {
    const fallbackTitle = `${regionName} ${theme} 정보 - 여기닷`;
    const fallbackDesc = `${regionName}의 ${theme} 업체 정보 및 리뷰를 확인하세요!`;
    return {
      title: fallbackTitle,
      description: fallbackDesc,
      openGraph: {
        title: fallbackTitle,
        description: fallbackDesc,
        url: `https://yeogidot.com/club/${rawRegion}/${rawSubregion}/${rawTheme}`
      }
    };
  }

  // 있으면 "{region}" 플레이스홀더를 실제 지역명으로 교체
  const replacedTitle = themeObj.title.replace(/\{region\}/g, regionName);
  const replacedDesc = themeObj.description.replace(/\{region\}/g, regionName);

  return {
    title: replacedTitle,
    description: replacedDesc,
    openGraph: {
      title: replacedTitle,
      description: replacedDesc,
      url: `https://yeogidot.com/club/${rawRegion}/${rawSubregion}/${rawTheme}`
    }
  };
}

/* -----------------------------------------------------
   (2) 페이지 컴포넌트
   - subregion은 필요 없으니 메타태그에 안 쓰고,
     굳이 UI에 표시도 안 해도 됨(필요 시만 사용)
------------------------------------------------------ */
export default async function BoardPage({ params:a, searchParams:b }) {
  const params = await a;
  const searchParams = await b;
  const { region, subregion, theme } = params;

  // 퍼센트 인코딩 풀기
  const regionDecoded = decodeURIComponent(region);
  const subregionDecoded = decodeURIComponent(subregion);
  const themeDecoded = decodeURIComponent(theme);

  // 하이픈 -> 슬래시 치환
  const regionName = convertSlugToSlash(regionDecoded);

  console.log("===== [DEBUG] BoardPage Params =====");
  console.log("region:", region, "=> regionDecoded:", regionDecoded, "=> regionName:", regionName);
  console.log("subregion:", subregion, "=> subregionDecoded:", subregionDecoded);
  console.log("theme:", theme, "=> themeDecoded:", themeDecoded);

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