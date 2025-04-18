// app/components/main/NewArrivalsSectionServer.jsx
// "use client";  <-- 쓰지 않습니다: 서버 컴포넌트!

import { supabase } from "@/lib/supabaseE";
import NewArrivalsSectionClient from "./NewArrivalsClient";

// 간단한 가격 포맷 함수 (원한다면 사용)
function formatPrice(num) {
  if (!num) return "0원";
  return num.toLocaleString() + "원";
}

// ★ 서버 컴포넌트
export default async function NewArrivalsSectionServer() {
  // 1) 서버 사이드 데이터 Fetch
  const { data, error } = await supabase
    .from("partnershipsubmit")
    .select(`
      id,
      post_title,
      company_name,
      address,
      thumbnail_url,
      created_at
    `)
    .eq("final_admitted", true)
    .order("created_at", { ascending: false })
    .limit(4);

  console.log("Fetched data:", data);
  console.log("Error:", error);
  console.log("Storage URL:", process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL);

  // 에러 시 간단 처리
  if (error) {
    console.error("SSR fetch error:", error);
    return (
      <section className="w-full bg-white py-10">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-2 text-2xl font-bold text-gray-800">
            신규 입점 했어요
          </h2>
          <p className="text-red-500">데이터 로드 오류가 발생했습니다!</p>
        </div>
      </section>
    );
  }

  // 2) 데이터 매핑
  const shopCards = (data || []).map((item) => {
    const finalUrl = `${process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL}/${item.thumbnail_url}`;
    console.log("Final URL for item:", finalUrl);
  
    return {
      id: item.id,
      imgSrc: finalUrl,
      company_name: item.company_name || item.post_title,
      title: item.post_title || "제목 없음",
      address: item.address || "주소 미기재",
    };
  });

  console.log("Mapped shopCards:", shopCards);

  return <NewArrivalsSectionClient shopCards={shopCards} />;
}