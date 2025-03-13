"use server";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabaseE"; // 혹은 supabaseF, 파일 경로 맞추세요
import DetailClient from "./DetailClient";
import DetailClientMobile from "./DetailClientMobile";

// (1) 메타데이터 설정 함수 (선택사항: SEO 필요 시)
export async function generateMetadata({ params }) {
  // (A) Promise 형태의 params 사용
  const realParams = await params;
  if (!realParams || !realParams.id) {
    return {};
  }

  // (B) id 분해
  const splitted = realParams.id.split("-");
  const numericId = splitted[0];
  if (!numericId) {
    return {};
  }

  // (C) DB 조회
  const { data: row, error } = await supabase
    .from("partnershipsubmit")
    .select("*")
    .eq("id", numericId)
    .single();

  if (error || !row) {
    return {};
  }

  // (D) 메타태그 동적 설정 예시
  let pageTitle = row.company_name ? row.company_name : "상세 페이지";
  let description = row.greeting ? row.greeting.slice(0, 100) : "업체 상세 설명";

  // 샵 타입에 따라 title/description 세팅
  if (row.shop_type?.includes("나이트클럽")) {
    pageTitle = `나이트클럽 - ${row.company_name}`;
    description = `${row.company_name} (나이트클럽) 상세 정보!`;
  } else if (row.shop_type?.includes("클럽")) {
    pageTitle = `클럽 - ${row.company_name}`;
    description = `${row.company_name} (클럽) 상세 정보!`;
  }

  return {
    title: pageTitle,
    description,
    openGraph: {
      title: pageTitle,
      description,
      // images: [{ url: "..." }],
    },
  };
}

// (2) 페이지 컴포넌트
export default async function DetailPage({ params: paramsPromise }) {
  // (A) 동적 파라미터 Promise → 실제 객체로 풀어주기
  const params = await paramsPromise;

  if (!params || !params.id) {
    notFound();
  }

  // (B) slug 분리 (예: "123-슬러그명")
  const slug = params.id;
  const splitted = slug.split("-");
  const numericId = splitted[0];
  if (!numericId) {
    notFound();
  }

  // (C) Supabase에서 데이터 가져오기
  const { data: row, error: rowErr } = await supabase
    .from("partnershipsubmit")
    .select("*")
    .eq("id", numericId)
    .single();

  if (rowErr || !row) {
    notFound();
  }

  // (D) 이미지 목록
  const { data: images, error: imgErr } = await supabase
    .from("partnershipsubmit_images")
    .select("image_url")
    .eq("submit_id", numericId);

  // (E) User-Agent 검사 (headers())
  const requestHeaders = await headers();
  const userAgent = requestHeaders.get("user-agent") || "";
  function isMobileUserAgent(ua) {
    return /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry/i.test(ua);
  }
  const isMobile = isMobileUserAgent(userAgent);

  // (F) PC/모바일 분기 렌더링
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