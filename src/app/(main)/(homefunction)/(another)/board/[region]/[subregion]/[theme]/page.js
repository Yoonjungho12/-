// src/app/(main)/board/[region]/[subregion]/[theme]/page.js

import RegionSelectorSSR from "../../../RegionSelectorSSR";
import PartnershipTable from "./PartnershipTable";
import REGIONS from "../../../REGIONS";

/* -----------------------------------------------------
   (0) 테마별 메타 정보 (title + description)
   - {region}은 generateMetadata에서 치환됩니다.
   - 모든 키(바, 클럽, 라운지바 등) + "전체" 포함
------------------------------------------------------ */
const themeMetaMap = {
  "전체": {
    title: "{region} 전체 업소 추천 | 모든 샵 정보 - 여기닷",
    description: "{region} 지역의 모든 업소 정보와 리뷰를 한눈에 확인하세요!"
  },
  "바": {
    title: "{region} 바(BAR) 추천 | {region} 인기 바 정보 - 여기닷",
    description:
      "{region}의 인기 바(BAR)를 찾고 계신다면, 여기닷에서 내 주변의 다양한 바를 비교해 보세요. 제휴사의 분위기, 인기 메뉴, 위치 등 유용한 정보를 제공하여 원하는 {region}의 바를 쉽게 선택할 수 있도록 도와드립니다. 인기 바의 특징을 한눈에 보고, 합리적인 선택을 할 수 있도록 안내합니다."
  },
  "클럽": {
    title: "{region} 클럽 추천 | {region}의 인기 클럽 정보 - 여기닷",
    description:
      "{region} 클럽을 찾고 계신다면, 여기닷에서 내 주변의 인기 클럽을 비교해 보세요. 웨이터와 MD의 인지도, 제휴사의 가격 등 다양한 정보를 제공하여 원하는 {region}의 클럽을 쉽게 찾을 수 있습니다. 인기 클럽의 특징을 한눈에 보고, 이용자가 합리적인 선택을 할 수 있도록 안내해 드립니다."
  },
  "라운지바": {
    title: "{region} 라운지바 추천 | {region} 내주변 인기 바 정보 - 여기닷",
    description:
      "{region} 라운지바를 찾고 계신다면, 여기닷에서 내 주변의 다양한 바를 비교해 보세요. 분위기, 인기 메뉴, 위치 등 다양한 정보를 제공하여 원하는 {region}의 라운지바를 쉽게 선택할 수 있습니다. 인기 바의 특징을 한눈에 보고, 최고의 선택을 할 수 있도록 안내합니다."
  },
  "헌팅포차": {
    title: "{region} 헌팅포차 추천 | 가장 인기 있는 헌팅포차 정보 - 여기닷",
    description:
      "{region} 헌팅포차를 찾고 계신다면, 여기닷에서 내 주변의 인기 헌팅포차를 비교해 보세요. 위치, 추천 메뉴, 분위기 등 다양한 정보를 제공하여 원하는 헌팅포차를 손쉽게 찾을 수 있습니다. {region}에서 가장 핫한 헌팅포차들의 특징을 한눈에 확인하고, 이용자가 자신에게 딱 맞는 헌팅포차를 선택할 수 있도록 돕습니다."
  },
  "감성주점": {
    title: "{region} 감성주점 추천 | {region} 내 주변 인기 감성주점 정보 - 여기닷",
    description:
      "{region}의 인기 감성주점들을 찾고 계신다면, 여기닷에서 내 주변의 다양한 감성주점을 비교해 보세요. 분위기, 메뉴, 위치 등 유용한 정보를 제공하여 원하는 감성주점을 쉽게 선택할 수 있습니다. 인기 있는 감성주점의 특징을 한눈에 보고, 최선의 선택을 도와드립니다."
  },
  "나이트클럽": {
    title: "{region} 나이트클럽 인기 순위 | {region}나이트 정보 - 여기닷",
    description:
      "{region}나이트클럽을 찾고 계신다면, 여기닷에서 내 주변의 인기 있는 {region}나이트를 한눈에 비교해 보세요. 웨이터 및 MD 추천, 나이트 위치 등 다양한 정보를 제공해 여러분이 원하는 정보를 쉽게 찾을 수 있도록 도와드립니다."
  },
  "성인용품": {
    title: "{region} 성인용품 | 성인용품 전문 쇼핑몰 - 여기닷",
    description:
      "{region}에서 다양한 성인용품을 찾고 계신다면, 여기닷에서 인기 있는 성인 기기와 액세서리를 손쉽게 찾아보세요. 안전한 쇼핑을 위해 신뢰할 수 있는 품질의 제품만을 엄선하여 제공하며, 성인용 기구에 대한 자세한 정보를 제공해 주기 때문에 고객님이 원하는 제품을 빠르고 정확하게 선택할 수 있습니다. 모든 제품은 성인 인증을 거쳐 안전하게 이용하실 수 있습니다."
  },
  "룸카페": {
    title: "{region}룸카페 추천 | {region} 내 주변 24시 카페 정보 - 여기닷",
    description:
      "{region}룸카페를 찾고 계신다면, 여기닷에서 내 주변의 인기 있는 24시 카페와 룸카페를 비교해 보세요. 카페의 분위기, 위치, 인기 메뉴 등 다양한 정보를 제공하여 원하는 {region}의 룸카페를 쉽게 선택할 수 있습니다. {region}의 인기 룸카페와 24시 카페의 특징을 한눈에 보고, 최선의 선택을 할 수 있도록 도와드립니다."
  },
  "눈썹문신": {
    title: "{region} 반영구 눈썹문신 추천 | 전문가 시술, 가격 비교 - 여기닷",
    description:
      "{region}에서 전문적인 반영구 눈썹문신 시술을 원하시나요? 여기닷에서는 내 주변의 인기 있는 눈썹문신 전문가를 비교해 보세요. 시술 방법, 가격, 후기 등 다양한 정보를 제공하여 원하는 결과를 얻을 수 있도록 도와드립니다."
  },
  "네일샵": {
    title: "{region} 네일샵 추천 | {region} 내 주변 네일아트 정보 - 여기닷",
    description:
      "{region}에서 인기 있는 네일샵을 찾고 계신가요? 여기닷에서 내 주변의 다양한 네일샵과 네일아트 매장을 비교해 보세요. 위치, 가격, 서비스 등을 종합적으로 제공하여 원하는 {region}의 네일샵을 쉽게 찾을 수 있습니다. 세심한 서비스와 최신 트렌드를 반영한 네일아트를 한눈에 확인하고, 만족스러운 선택을 할 수 있도록 도와드릴게요."
  },
  "태닝샵": {
    title: "{region} 태닝샵 추천 | 태닝오일, 태닝크림 등 다양한 서비스 정보 - 여기닷",
    description:
      "{region}에서 태닝샵을 찾고 계신다면, 여기닷에서 내 주변의 태닝샵과 태닝오일, 태닝크림 등의 다양한 서비스를 비교해 보세요. 위치, 가격, 제품 정보 등 유용한 정보를 제공하여 원하는 {region}의 태닝샵을 쉽게 선택할 수 있습니다."
  },
  "왁싱샵": {
    title: "{region} 왁싱샵 추천 | 인기 있는 왁싱 서비스 정보 - 여기닷",
    description:
      "{region}의 인기 있는 왁싱샵을 찾고 계시다면, 여기닷에서 내 주변의 다양한 왁싱샵을 비교해 보세요. 제모 크림, 왁싱 스트립, 소프트 왁스 등 다양한 제품과 서비스를 제공하는 왁싱샵을 쉽게 찾을 수 있습니다. 왁싱 전문가의 맞춤형 관리로 매끄럽고 깨끗한 피부를 경험하세요."
  },
  "사주": {
    title: "{region} 사주 잘하는 곳 추천 | {region} 사주 카페 & 역술인 정보 - 여기닷",
    description:
      "{region} 사주를 잘 보는 곳을 찾고 계신가요? 여기닷에서는 {region} 내 인기 있는 사주 카페와 경험 많은 역술인들을 한눈에 비교할 수 있습니다. 위치, 상담 방식, 가격 등 다양한 정보를 제공하여 여러분이 원하는 스타일의 사주를 쉽게 선택할 수 있도록 도와드립니다. 신뢰할 수 있는 전문가들의 상세한 정보와 고객 후기를 통해 최적의 선택을 하세요."
  },
  "타로": {
    title: "{region} 타로 잘 보는 곳 추천 | {region} 내 주변 타로카페 정보 - 여기닷",
    description:
      "{region}에서 타로를 잘 보는 곳을 찾고 계신가요? 여기닷에서는 {region} 주변의 다양한 타로카페와 전문가들을 비교해 볼 수 있습니다. 위치, 상담 방식, 가격 등 유용한 정보를 제공하여 원하는 타로 상담을 쉽게 선택할 수 있도록 도와드립니다. 경험 많은 타로 리더들과 신뢰할 수 있는 후기를 통해 최적의 선택을 하세요."
  },
  "애견펜션": {
    title: "{region} 애견펜션 & 애견동반 풀빌라 추천 | 반려동물과 함께하는 완벽한 공간 - 여기닷",
    description:
      "{region} 주변 애견펜션과 애견동반 풀빌라를 찾고 계신가요? 여기닷에서 반려동물과 함께할 수 있는 다양한 애견펜션과 풀빌라를 비교해 보세요. 위치, 시설, 가격 등 유용한 정보를 제공하여 최적의 휴식지 선택을 도와드립니다. 애견과 함께 특별한 여행을 계획해 보세요!"
  },
  "애견미용": {
    title: "{region} 애견미용 추천 | 반려동물 미용 서비스 정보 - 여기닷",
    description:
      "{region} 애견미용 서비스를 찾고 계신가요? 여기닷에서는 {region} 주변 다양한 애견미용샵과 전문가들을 비교할 수 있습니다. 위치, 서비스 내용, 가격 등 유용한 정보를 제공하여 원하는 미용 서비스를 쉽게 선택할 수 있도록 도와드립니다. 신뢰할 수 있는 후기를 참고해 최고의 선택을 해보세요."
  },
  "아이폰스냅": {
    title: "{region}아이폰스냅 전문가 추천 | 본식스냅, 웨딩촬영, 야외스냅, DVD 촬영 - 여기닷",
    description:
      "{region}아이폰스냅, 본식스냅, 웨딩촬영, 야외스냅, DVD 촬영 전문가를 찾고 계신가요? 요즘 많이 찾는 인기업체들의 다양한 촬영 서비스를 비교해 보실 수 있습니다. 가격, 촬영 스타일, 후기를 참고하여 여러분의 특별한 순간을 완벽하게 담아낼 전문가를 쉽게 선택하세요."
  },
  "웨딩플래너": {
    title: "{region} 웨딩플래너 추천 | 스드메 인기 웨딩 서비스 정보 - 여기닷",
    description:
      "{region}에서 웨딩플래너를 찾고 계신가요? 여기닷에서는 인기 있는 {region} 웨딩플래너와 스드메(스튜디오, 드레스, 메이크업) 서비스를 비교할 수 있습니다. 맞춤형 웨딩 플래닝, 가격, 고객 후기 등을 통해 여러분이 원하는 웨딩 서비스를 쉽게 선택할 수 있도록 도와드립니다. 인기 웨딩플래너의 추천과 함께 완벽한 결혼식을 준비해 보세요."
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
export async function generateMetadata({ params: a, searchParams: b }) {
  const params = await a;
  const searchParams = await b;
  const { region, subregion, theme } = params;

  // 1) 퍼센트 인코딩을 풀어준다.
  const regionDecoded = decodeURIComponent(region); // 예: "인천-부천-부평"
  const themeDecoded = decodeURIComponent(theme);   // 예: "바"

  // 2) 하이픈 -> 슬래시 치환
  const regionName = convertSlugToSlash(regionDecoded);

  console.log("===== [DEBUG] generateMetadata Params =====");
  console.log("region:", region, "=> regionDecoded:", regionDecoded, "=> regionName:", regionName);
  console.log("subregion:", subregion, "(not used in meta)");
  console.log("theme:", theme, "=> themeDecoded:", themeDecoded);

  // 3) themeMetaMap에서 해당 테마 정보 가져오기
  const metaObj = themeMetaMap[themeDecoded];
  console.log("[DEBUG] metaObj:", metaObj);

  // 4) 매핑이 없으면 fallback
  if (!metaObj) {
    console.log("[DEBUG] Fallback triggered!");
    const fallbackTitle = `${regionName} ${themeDecoded} 추천 및 정보 - 여기닷`;
    const fallbackDesc = `${regionName}의 ${themeDecoded} 업소 정보 및 리뷰를 확인하세요!`;
    return {
      title: fallbackTitle,
      description: fallbackDesc,
      openGraph: {
        title: fallbackTitle,
        description: fallbackDesc,
        url: `https://example.com/board/${region}/${subregion}/${theme}?sort=${searchParams?.sort || ""}`
      }
    };
  }

  // 5) {region} 치환 → regionName
  const replacedTitle = metaObj.title.replace(/{region}/g, regionName);
  const replacedDesc = metaObj.description.replace(/{region}/g, regionName);

  console.log("[DEBUG] replacedTitle:", replacedTitle);
  console.log("[DEBUG] replacedDesc :", replacedDesc);

  return {
    title: replacedTitle,
    description: replacedDesc,
    openGraph: {
      title: replacedTitle,
      description: replacedDesc,
      url: `https://example.com/board/${region}/${subregion}/${theme}?sort=${searchParams?.sort || ""}`
    }
  };
}

/* -----------------------------------------------------
   (2) 페이지 컴포넌트
   - subregion은 필요 없으니 메타태그에 안 쓰고,
     굳이 UI에 표시도 안 해도 됨(필요 시만 사용)
------------------------------------------------------ */
export default async function BoardPage({ params: a, searchParams: b }) {
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

  // 실사용 UI
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
        {/* 
          * 필요 없다면 subregionDecoded 부분은 빼셔도 됩니다.
          * 일단 예시로 아래처럼 표시 
        */}
        <h2 className="text-base font-bold text-gray-700">
          지역별 샵 &gt; {regionName} &gt; {subregionDecoded}
        </h2>
      </div>

      {/* SSR 지역/테마 표 (원하실 경우만 사용) */}
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