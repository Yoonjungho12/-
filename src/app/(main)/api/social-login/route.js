// app/api/social-login/route.js
import { supabase } from "@/lib/supabaseE";
import { NextResponse } from "next/server";

// 이 라우트는 예시상 GET으로 구현
export async function GET(request) {
  // (1) 쿼리 파라미터에서 provider 꺼냄 (kakao, google 등)
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get("provider");

  // (2) 실제 배포 도메인을 서버에서만 관리 (예: process.env.CALL_BACK_URL)
  //     개발/프로덕션 분기는 NODE_ENV로 판단 가능
  const callbackBaseUrl =
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000"
      : process.env.CALL_BACK_URL // 예: "https://my-cool.vercel.app"

  // (3) Supabase OAuth URL 발급
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      // 콜백 URL(서버 라우트)
      redirectTo: `${callbackBaseUrl}/auth/callback?provider=${provider}`,
       authorizationUrlParams: { response_type: 'code' },
    },
  });

  // 에러 시 처리
  if (error || !data?.url) {
    console.error("소셜 로그인 URL 발급 실패:", error);
    return NextResponse.json({ error: error.message || "URL 발급 실패" }, { status: 500 });
  }

  // (4) 클라이언트에 URL 반환
  return NextResponse.json({ url: data.url });
}