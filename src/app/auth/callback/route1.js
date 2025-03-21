
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseE";

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);

  // 1) 어떤 소셜 로그인이었는지 (kakao, google 등)
  const provider = searchParams.get("provider");
  console.log("provider:", provider);
  // 2) code
  const code = searchParams.get("code");
  if (!code) {
    console.error("코드가 없습니다 - provider:", provider);
    return NextResponse.redirect(`${origin}/auth/error`);
  }

  // 3) Supabase 세션 교환
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    console.error("exchangeCodeForSession 에러:", error);
    return NextResponse.redirect(`${origin}/auth/error`);
  }

  // 4) user data
  const user = data.session.user;
  const userId = user.id;
  const email = user.email || user.user_metadata?.email;

  // nickname 기본값
  let nickname = null;

  // 5) 공급자별로 nickname 결정 로직
  if (provider === "kakao") {
    // 카카오는 보통 user.user_metadata?.nickname 에 닉네임이 담겨옴
    nickname = user.user_metadata?.nickname || "(카카오사용자)";
  } else if (provider === "google") {
    // 구글은 nickname 필드가 없을 가능성이 큼
    // 예) user_metadata?.name, user_metadata?.full_name, user_metadata?.given_name 등
    nickname = user.user_metadata?.name
      || user.user_metadata?.full_name
      || user.user_metadata?.given_name
      || "(구글사용자)";
  } else {
    // 기타 다른 provider도 있을 수 있음
    nickname = user.user_metadata?.nickname || "(소셜사용자)";
  }

  console.log("소셜 로그인 provider:", provider);
  console.log("user:", user);
  console.log("nickname:", nickname);

  // 6) DB upsert
  // profiles 테이블: (user_id, email, nickname 등)
  const { error: upsertError } = await supabase
    .from("profiles")
    .upsert({
      user_id: userId,
      email,
      nickname,
    });

  if (upsertError) {
    console.error("profiles upsert 에러:", upsertError);
    return NextResponse.redirect(`${origin}/auth/error`);
  }

  // 7) 최종적으로 홈(/)으로 이동
  return NextResponse.redirect(`${origin}/`);
}