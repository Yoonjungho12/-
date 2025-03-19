// app/components/main/MainoneServer.jsx

import { supabase } from "@/lib/supabaseE";
import MainoneClient from "./MainoneClient";

// 특정 지역명 치환 함수 (서버 컴포넌트 쪽에도 동일 로직)
function rewriteSpecialProvince(original) {
  switch (original) {
    case "제주":
      return "제주특별자치도";
    case "세종":
      return "세종특별자치시";
    case "강원":
      return "강원특별자치도";
    case "전북":
      return "전북특별자치도";
    default:
      return original;
  }
}

// ★ 서버 컴포넌트
// Next.js 13 App Router에서는 기본적으로 "use client"가 없으면 서버 컴포넌트로 인식
export default async function MainoneServer() {
  // (1) 기본 지역 "서울"
  const defaultRegion = "서울";
  const replaced = rewriteSpecialProvince(defaultRegion);

  // (2) 서버 사이드 Fetch
  const { data, error } = await supabase
    .from("partnershipsubmit")
    .select(`
      id,
      final_admitted,
      post_title,
      company_name,
      address,
      address_street,
      comment,
      greeting,
      thumbnail_url,
      partnershipsubmit_themes (
        themes (
          id,
          name
        )
      )
    `)
    .eq("final_admitted", true)
    .textSearch("search_tsv", replaced, {
      type: "websearch",
      config: "simple",
    });

  if (error) {
    console.error("[MainoneServer] DB fetch error:", error);
  }

  const sliced = (data || []).slice(0, 8);

  // (3) 클라이언트 컴포넌트(MainoneClient)에 넘겨주기
  return (
    <MainoneClient
      initialRegion={defaultRegion}
      initialData={sliced}
    />
  );
}