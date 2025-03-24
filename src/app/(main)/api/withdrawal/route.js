import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseE";

export async function POST(req) {
  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json(
        { message: "Missing userId" },
        { status: 400 }
      );
    }

    // 1) profiles row 삭제
    const { error: profileErr } = await supabase
      .from("profiles")
      .delete()
      .eq("user_id", userId);

    if (profileErr) {
      return NextResponse.json(
        { message: `프로필 삭제 실패: ${profileErr.message}` },
        { status: 400 }
      );
    }

    // 2) Auth user 삭제
    const { error: userErr } = await supabase.auth.admin.deleteUser(userId);

    if (userErr) {
      return NextResponse.json(
        { message: `유저 삭제 실패: ${userErr.message}` },
        { status: 400 }
      );
    }

    // 성공
    return NextResponse.json({ message: "탈퇴 완료" }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { message: err.message || "서버 오류" },
      { status: 500 }
    );
  }
}