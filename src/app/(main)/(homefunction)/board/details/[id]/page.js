"use server";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabaseE"; // 혹은 supabaseF, 사용하시는 경로에 맞춰주세요
import DetailClient from "./DetailClient";
import DetailClientMobile from "./DetailClientMobile";

// (1) 메타데이터 설정 함수
export async function generateMetadata({ params }) {
  // (A) 동적 파라미터가 Promise 형태이므로 먼저 풀어줍니다.
  const realParams = await params;
  if (!realParams || !realParams.id) {
    return {};
  }

  // (B) "123-슬러그" 형식에서 맨 앞 숫자만 추출
  const splitted = realParams.id.split("-");
  const numericId = splitted[0];
  if (!numericId) {
    return {};
  }

  // (C) partnershipsubmit 단일 레코드 조회
  const { data: row, error } = await supabase
    .from("partnershipsubmit")
    .select("*")
    .eq("id", numericId)
    .single();

  if (error || !row) {
    return {};
  }

  // (E) title, description 생성
  const companyName = row.company_name || "상세 페이지";
  // 공백과 하이픈 사이 간격을 좀 더 자연스럽게
  const pageTitle = companyName.trim() + " - 여기닷";
  // 회사명 + 추가 문구 사이에 공백 추가
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

// (2) 실제 페이지 컴포넌트
export default async function DetailPage({ params: paramsPromise }) {
  // (A) 파라미터 Promise 해제
  const params = await paramsPromise;
  if (!params || !params.id) {
    notFound();
  }

  // (B) "123-블라블라" 형식 → "123"
  const slug = params.id;
  const splitted = slug.split("-");
  const numericId = splitted[0];
  if (!numericId) {
    notFound();
  }

  // (C) partnershipsubmit의 단일 레코드 조회
  const { data: row, error: rowErr } = await supabase
    .from("partnershipsubmit")
    .select("*")
    .eq("id", numericId)
    .single();

  if (rowErr || !row) {
    notFound();
  }

  // (D) 이미지 목록 조회
  const { data: images, error: imgErr } = await supabase
    .from("partnershipsubmit_images")
    .select("image_url")
    .eq("submit_id", numericId);

  // (E) User-Agent 검사 (모바일/PC 분기)
  const requestHeaders = await headers();
  const userAgent = requestHeaders.get("user-agent") || "";

  function isMobileUserAgent(ua) {
    return /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry/i.test(ua);
  }

  const isMobile = isMobileUserAgent(userAgent);

  // (F) 렌더링 분기
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