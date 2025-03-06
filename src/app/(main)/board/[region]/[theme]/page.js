// src/app/(main)/board/[region]/[theme]/page.js
import RegionSelectorClient from "../../RegionSelectorClient";
import PartnershipTable from "../../PartnershipTable";
export default async function BoardPage(ctx) {
  // 1) 동적 파라미터를 비동기로 받아오기
  const { region, theme } = await ctx.params;

  // 2) 수동으로 디코딩
  const regionDecoded = decodeURIComponent(region);
  const themeDecoded = decodeURIComponent(theme);

  return (
    <>
    <div className="flex flex-col items-center w-full">
    <RegionSelectorClient
      regionSlug={regionDecoded} // "전체" (진짜 한글)
      themeName={themeDecoded}   // "전체" (진짜 한글)
    />
    <PartnershipTable
      regionSlug={regionDecoded} // "전체" (진짜 한글)
      themeName={themeDecoded}   // "전체" (진짜 한글)
    />  

    </div>
    </>
  );
}