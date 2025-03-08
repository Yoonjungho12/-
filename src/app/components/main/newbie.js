// app/components/main/NewArrivalsSectionServer.jsx (예시 파일명)
// 폴더 구조와 파일명은 상황에 맞게 수정하세요.
// "use client"를 빼고, 서버 컴포넌트로 작성합니다.

import { supabase } from "@/lib/supabaseE";
import Image from "next/image";

// 간단한 가격 포맷 함수 (사용하신다면)
function formatPrice(num) {
  if (!num) return "0원";
  return num.toLocaleString() + "원";
}

// ★ 서버 컴포넌트 (Next.js 13)
// - "use client"가 없으면 기본적으로 서버 컴포넌트로 인식
export default async function NewArrivalsSection() {
  // 1) Supabase에서 데이터 서버 사이드로 Fetch
  let { data, error } = await supabase
    .from("partnershipsubmit")
    .select(`
      id,
      post_title,
      address,
      thumbnail_url,
      created_at
    `)
    .eq("final_admitted", true) // ★ final_admitted=true 필터
    .order("created_at", { ascending: false })
    .limit(4);

  // 에러 핸들링 (필요하다면 UI 처리 가능)
  if (error) {
    console.error("SSR fetch error:", error);
    // 원하는 에러 UI를 반환하거나, 빈 상태 반환
    return (
      <section className="w-full bg-white py-10">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="mb-2 text-2xl font-bold text-gray-800">
            신규 입점 했어요
          </h2>
          <p className="text-red-500">데이터 로드 오류가 발생했습니다!</p>
        </div>
      </section>
    );
  }

  // 2) 데이터 매핑
  const shopCards = (data || []).map((item) => ({
    id: item.id,
    imgSrc: `https://vejthvawsbsitttyiwzv.supabase.co/storage/v1/object/public/gunma/${item.thumbnail_url}`,
    title: item.post_title || "제목 없음",
    address: item.address || "주소 미기재",
    // 추후 price/discount 등이 필요하다면 여기에 추가
  }));

  // 3) JSX(HTML) 반환 → 서버가 이걸 렌더링해 브라우저에게 전달
  return (
    <section className="w-full bg-white py-10">
      <div className="mx-auto max-w-5xl px-4">
        {/* 섹션 헤더 */}
        <h2 className="mb-2 text-2xl font-bold text-gray-800">
          신규 입점 했어요
        </h2>
        <p className="mb-6 text-gray-500">
          VIP인포의 새로운 스웨디시 샵을 만나보세요!
        </p>

        {/* 4개 카드 그리드 */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {shopCards.map((shop) => (
            <div
              key={shop.id}
              className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow"
            >
              {/* 이미지 영역 */}
              <div className="h-48 w-full overflow-hidden rounded-t-xl">
                <Image
                  src={shop.imgSrc}
                  alt={shop.title}
                  width={400}
                  height={300}
                  style={{ objectFit: "cover" }}
                  quality={70}
                  // loading="eager" 등을 쓰고 싶다면 여기에
                />
              </div>

              {/* 텍스트 영역 */}
              <div className="p-4">
                <h3 className="mb-1 text-base font-semibold text-gray-800">
                  {shop.title}
                </h3>
                <p className="text-sm text-gray-600">{shop.address}</p>

                {/* 가격 등이 필요하다면
                <p className="mt-2 text-xs text-gray-400 line-through">
                  {formatPrice(shop.originalPrice)}
                </p>
                <div className="mt-1 flex items-baseline space-x-2">
                  <span className="inline-block rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
                    {shop.discount}%
                  </span>
                  <p className="text-sm font-bold text-gray-900">
                    {formatPrice(shop.price)}
                  </p>
                </div>
                */}
              </div>
            </div>
          ))}
        </div>

        {/* '더보기' 버튼 */}
        <div className="mt-8 text-center">
          <button className="rounded border border-gray-300 px-6 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100">
            더보기 +
          </button>
        </div>
      </div>
    </section>
  );
}