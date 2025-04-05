"use server";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabaseE"; // 혹은 supabaseF
import DetailClient from "./DetailClient";
import DetailClientMobile from "./DetailClientMobile";

/**
 * (1) 메타데이터 설정 함수 (generateMetadata)
 *  기존 내용 그대로 유지하면서, 필요 없는 부분은 없으니 그대로 둡니다.
 */
export async function generateMetadata({ params: Paramas }) {
  // (기존 내용 동일)
  const params = await Paramas;
  if (!params?.id) return {};
  const splitted = params.id.split("-");
  const numericId = splitted[0];
  if (!numericId) return {};

  const { data: row, error } = await supabase
    .from("partnershipsubmit")
    .select("*")
    .eq("id", numericId)
    .single();
  if (error || !row) return {};

  const companyName = row.company_name || "상세 페이지";
  const pageTitle = `${companyName.trim()} - 여기닷`;
  const description = `${companyName.trim()} 가장 인기있는 웨이터를 찾고 계신가요!? 여기닷을 방문하시면~~~`;

  return {
    title: pageTitle,
    description,
    openGraph: {
      title: pageTitle,
      description,
    },
  };
}

/**
 * (2) 실제 상세 페이지 컴포넌트
 */
export default async function DetailPage({ params: Params }) {
  // A. 파라미터 검사
  const params = await Params;
  if (!params?.id) {
    notFound();
  }
  const splitted = params.id.split("-");
  const numericId = splitted[0];
  if (!numericId) {
    notFound();
  }

  // B. DB에서 partnershipsubmit 단일 조회
  const { data: row, error: rowErr } = await supabase
    .from("partnershipsubmit")
    .select("*")
    .eq("id", numericId)
    .single();
  if (rowErr || !row) {
    notFound();
  }

  // C. 이미지 목록 조회
  const { data: images, error: imgErr } = await supabase
    .from("partnershipsubmit_images")
    .select("image_url")
    .eq("submit_id", numericId);

  // D. Headers - user-agent (여기가 중요)
  //   => 반드시 await headers()
  const requestHeaders = await headers();
  const userAgent = requestHeaders.get("user-agent") || "";

  function isMobileUserAgent(ua) {
    return /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry/i.test(ua);
  }
  const isMobile = isMobileUserAgent(userAgent);

  // E. 모바일/PC 분기 렌더링
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