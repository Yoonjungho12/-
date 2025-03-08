// 예: app/today/[city]/[district]/[theme]/page.js
// 서버 컴포넌트. 여기서 URL 파라미터를 디코딩하고, ClientUI로 넘겨줍니다.

import ClientUI from "./client";

export default async function TodayPage({ params: paramsPromise }) {
  // Next.js 15 (가정): params가 Promise 형태이므로 await 필요
  const { city: rawCity, district: rawDistrict, theme: rawTheme } = await paramsPromise;
  
  // 혹시 undefined일 수도 있으니 안전하게 처리
  const city = rawCity ? decodeURIComponent(rawCity) : "전체";
  const district = rawDistrict ? decodeURIComponent(rawDistrict) : "전체";
  const theme = rawTheme ? decodeURIComponent(rawTheme) : "전체";

  // 서버에서 SSR하는 추가 영역
  // (여기서는 단순히 "검색어 없음" 문구만 예시로 넣은 상태)
  return (
    <div className="w-full">
      {/* 클라이언트 상호작용 UI를 담당하는 컴포넌트 */}
      <ClientUI city={city} district={district} theme={theme} />

      {/* 서버에서 렌더링하는 추가 내용 (예시) */}
      <div className="mx-auto max-w-5xl py-8 px-4">
        <h2 className="text-xl font-semibold">SSR 예시: 검색어 없음</h2>
        <p className="mt-2 text-gray-600">
          이 영역은 서버 컴포넌트에서 렌더링된 부분입니다.
        </p>
      </div>
    </div>
  );
}