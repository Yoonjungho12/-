import { supabase } from "@/lib/supabaseE";
import { notFound } from "next/navigation";
import DetailClient from "./DetailClient";

export const dynamic = "force-dynamic";

// Next.js 13 이후 버전 기준
export default async function DetailPage({ params: paramsPromise }) {
  // paramsPromise 사용 시 반드시 await 처리
  const params = await paramsPromise;

  // URL 파라미터 확인
  if (!params || !params.id) {
    notFound();
  }

  // 예: "13-강남1인샵" 형태 → 앞의 숫자가 DB의 id
  const slug = params.id;
  const splitted = slug.split("-");
  const numericId = splitted[0];

  if (!numericId) {
    notFound();
  }

  // partnershipsubmit 테이블에서 해당 ID 레코드 조회
  const { data: row, error } = await supabase
    .from("partnershipsubmit")
    .select("*")
    .eq("id", numericId)
    .single();

  if (error || !row) {
    notFound();
  }

  // 이미지 목록 조회
  const { data: images, error: imgErr } = await supabase
    .from("partnershipsubmit_images")
    .select("image_url")
    .eq("submit_id", numericId);

  if (imgErr) {
    console.error("이미지 목록 조회 오류:", imgErr);
  }

  // 클라이언트 컴포넌트로 데이터 전달
  return <DetailClient row={row} images={images || []} numericId={numericId} />;
}