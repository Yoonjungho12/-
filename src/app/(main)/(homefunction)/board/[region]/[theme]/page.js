// src/app/(main)/board/[region]/[theme]/page.js

import RegionSelectorSSR from "../../RegionSelectorSSR";
import PartnershipTable from "../../PartnershipTable";

// (1) 메타데이터를 동적으로 생성하는 함수
export async function generateMetadata({ params }) {
  // ① URL 파라미터 "region", "theme"가 URL 인코딩된 상태이므로 디코딩
  const awaitedParams = await params;
  const regionDecoded = decodeURIComponent(awaitedParams.region);
  const themeDecoded = decodeURIComponent(awaitedParams.theme);

  // ② 원하는 title, description 등 메타 정보 구성
  const pageTitle = `여기닷 ${regionDecoded} - 여기닷/${themeDecoded} 정보`;
  const pageDesc = `${regionDecoded} 지역의 ${themeDecoded} 업소 정보 및 리뷰를 확인하세요.`;

  return {
    title: pageTitle,
    description: pageDesc,
    openGraph: {
      title: pageTitle,
      description: pageDesc,
      url: `https://example.com/board/${regionDecoded}/${themeDecoded}`, 
      // images: [ ... ]  // 필요시 이미지 설정
    },
    // twitter: { ... }, // 필요시 트위터 카드 설정
  };
}

/**
 * Next.js 13+ App Router에서 "[region]/[theme]" 형태로 들어오는
 * 동적 라우트 파라미터를 사용하는 페이지 서버 컴포넌트입니다.
 */
export default async function BoardPage(ctx) {
  // (2) 동적 파라미터: ctx.params는 Promise 형태이므로 우선 await
  const awaitedParams = await ctx.params; 
  // awaitedParams는 예: { region: "%EC%9D%B8%EC%B2%9C", theme: "%EC%8A%A4%EC%9B%A8%EB%94%94%EC%8B%9C" }

  // (3) 실제 한글로 보이도록 decodeURIComponent 처리
  const regionDecoded = decodeURIComponent(awaitedParams.region);
  const themeDecoded = decodeURIComponent(awaitedParams.theme);

  return (
    <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-center">
      {/* SSR 지역/테마 표 */}
      <RegionSelectorSSR regionSlug={regionDecoded} themeName={themeDecoded} />

      {/* 파트너십 테이블 (원하는 region/theme를 props로 넘겨 사용) */}
      <PartnershipTable regionSlug={regionDecoded} themeName={themeDecoded} />
    </div>
  );
}