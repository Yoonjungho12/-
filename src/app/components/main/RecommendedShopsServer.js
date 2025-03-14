// 예: app/components/main/RecommendedShopsServer.jsx
// "use client"를 명시하지 않으면 서버 컴포넌트로 동작합니다.
import { supabase } from "@/lib/supabaseF";
import RecommendedShopsClient from "./RecommendedShopsClient";

export default async function RecommendedShopsServer() {

  const defaultTag = "라운지바";

  // (1) themes 테이블에서 name=defaultTag
  let { data: themeRows, error: themeError } = await supabase
    .from("themes")
    .select("id, name")
    .eq("name", defaultTag)
    .single();

  if (themeError) {
    console.error("Theme fetch error (SSR):", themeError);
  }

  // themeRows가 없다면
  if (!themeRows) {
    // 그냥 초기값만 세팅
    return (
      <RecommendedShopsClient
        initialTag={defaultTag}
        initialShops={[]} // 빈 배열
      />
    );
  }

  // (2) partnershipsubmit_themes에서 theme_id
  const themeId = themeRows.id;
  let { data: relRows, error: relError } = await supabase
    .from("partnershipsubmit_themes")
    .select("submit_id")
    .eq("theme_id", themeId);

  if (relError) {
    console.error("theme rel fetch error (SSR):", relError);
  }
  if (!relRows || relRows.length === 0) {
    return (
      <RecommendedShopsClient
        initialTag={defaultTag}
        initialShops={[]} 
      />
    );
  }

  // (3) partnershipsubmit에서 id in (...)
  const submitIds = relRows.map((r) => r.submit_id);
  let { data: subRows, error: subError } = await supabase
    .from("partnershipsubmit")
    .select("id, post_title, address, address_street, thumbnail_url, comment")
    .in("id", submitIds)
    .limit(4);

  if (subError) {
    console.error("partnershipsubmit fetch error (SSR):", subError);
  }
  if (!subRows || subRows.length === 0) {
    return (
      <RecommendedShopsClient
        initialTag={defaultTag}
        initialShops={[]} 
      />
    );
  }

  // (4) 최종 변환
  const initialShops = subRows.map((item) => ({
    id: item.id,
    imgSrc: `https://vejthvawsbsitttyiwzv.supabase.co/storage/v1/object/public/gunma/${item.thumbnail_url}`,
    title: item.post_title,
    address: item.address + " " + (item.address_street || ""),
    reviewCount: item.comment || 0,
  }));

  // (5) 클라이언트 컴포넌트로 props 전달
  return (
    <RecommendedShopsClient
      initialTag={defaultTag}
      initialShops={initialShops}
    />
  );
}