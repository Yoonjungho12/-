// /app/api/deleteUser/route.js
import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseE";

export async function POST(request) {
  try {
    const body = await request.json();
    const { user_id } = body;
    if (!user_id) {
      return NextResponse.json({ error: "user_id가 없습니다." }, { status: 400 });
    }

    // 1) Auth 계정 삭제
    const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(user_id);
    if (deleteAuthError) {
      console.error("Auth 유저 삭제 에러:", deleteAuthError);
      return NextResponse.json({ error: deleteAuthError.message }, { status: 400 });
    }

    // 2) profiles 테이블 삭제
    const { error: deleteProfileError } = await supabase
      .from("profiles")
      .delete()
      .eq("user_id", user_id);

    if (deleteProfileError) {
      console.error("profiles 테이블 삭제 에러:", deleteProfileError);
      return NextResponse.json({ error: deleteProfileError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    console.error("회원탈퇴 API 오류:", err);
    return NextResponse.json({ error: "서버 오류" }, { status: 500 });
  }
}