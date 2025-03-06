import { supabase } from "@/lib/supabaseE";
import { notFound } from "next/navigation";
import DetailClient from "./DetailClient";

export const dynamic = "force-dynamic";

// Next.js 15에서 params가 Promise라 가정
export default async function DetailPage({ params: paramsPromise }) {
  // 1) 반드시 await!
  const params = await paramsPromise;

  // 2) 슬러그 파싱 (예: "13-강남1인샵")
  if (!params || !params.id) {
    notFound();
  }
  const slug = params.id;
  const splitted = slug.split("-");
  const numericId = splitted[0];

  if (!numericId) {
    notFound();
  }

  // 3) Supabase에서 데이터 가져오기
  const { data: row, error } = await supabase
    .from("partnershipsubmit")
    .select("*")
    .eq("id", numericId)
    .single();

  if (error || !row) {
    notFound();
  }

  // 4) 이미지 목록 조회
  const { data: images, error: imgErr } = await supabase
    .from("partnershipsubmit_images")
    .select("image_url")
    .eq("submit_id", numericId);

  if (imgErr) {
    console.error("이미지 목록 조회 오류:", imgErr);
  }

  // 5) 클라이언트 컴포넌트로 데이터 전달
  return <DetailClient row={row} images={images || []} />;
}