import { supabase } from "@/lib/supabaseE";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import DetailClient from "./DetailClient";
import DetailClientMobile from "./DetailClientMobile";

export const dynamic = "force-dynamic";

function isMobileUserAgent(userAgent) {
  return /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry/i.test(userAgent);
}

export default async function DetailPage({ params: paramsPromise }) {
  // ⬇︎ params가 Promise 형태이므로 풀어서 써야 합니다.
  const params = await paramsPromise;

  if (!params || !params.id) {
    notFound();
  }
  const slug = params.id;
  const splitted = slug.split("-");
  const numericId = splitted[0];
  if (!numericId) {
    notFound();
  }

  // 1) Supabase에서 데이터 가져오기
  const { data: row, error } = await supabase
    .from("partnershipsubmit")
    .select("*")
    .eq("id", numericId)
    .single();

  if (error || !row) {
    notFound();
  }

  // 2) 이미지 목록 조회
  const { data: images, error: imgErr } = await supabase
    .from("partnershipsubmit_images")
    .select("image_url")
    .eq("submit_id", numericId);

  // (headers()도 await 해야 합니다)
  const requestHeaders = await headers();
  const userAgent = requestHeaders.get("user-agent") || "";
  const isMobile = isMobileUserAgent(userAgent);

  if (isMobile) {
    return (
      <DetailClientMobile
        row={row}
        images={images || []}
        numericId={numericId}
      />
    );
  } else {
    return (
      <DetailClient
        row={row}
        images={images || []}
        numericId={numericId}
      />
    );
  }
}