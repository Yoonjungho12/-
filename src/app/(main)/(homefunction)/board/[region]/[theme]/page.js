// src/app/(main)/board/[region]/[theme]/page.js

import RegionSelectorSSR from "../../RegionSelectorSSR";
import PartnershipTable from "../../PartnershipTable";

/**
 * 이 파일은 Next.js 15+ (app router)에서 사용하는
 * 동적 라우트 "[region]/[theme]"를 위한 서버 컴포넌트입니다.
 *
 * - Next.js 15부터 "params"가 Promise 형태가 되어, 구조분해 전에 await가 필요
 * - 아래 예시에서는 params를 우선 await 해서 { region, theme }를 꺼내옵니다.
 */
export default async function BoardPage(ctx) {
  // 1) 동적 파라미터가 Promise 형태이므로, 우선 await
  const awaitedParams = await ctx.params;
  // 이제 awaitedParams는 { region: string, theme: string } 형태로 사용 가능
  const { region, theme } = awaitedParams;

  // 2) 디코딩 (한글 슬러그가 %EC... 로 보이지 않게)
  const regionDecoded = decodeURIComponent(region);
  const themeDecoded = decodeURIComponent(theme);

  return (
    <>


      <div className="max-w-[1200px] mx-auto flex flex-col justify-center items-center">
        {/* ─ SSR 지역/테마 표 렌더링 (RegionSelectorSSR) ─ */}
        <RegionSelectorSSR
          regionSlug={regionDecoded}
          themeName={themeDecoded}
        />

        {/* ─ 파트너십 테이블 (원하는 지역/테마를 props로 넘김) ─ */}
        <PartnershipTable
          regionSlug={regionDecoded}
          themeName={themeDecoded}
        />
      </div>


    </>
  );
}