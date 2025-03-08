import { supabase } from "@/lib/supabaseE"; // 서비스 역할 키
import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const payload = await request.json();
    console.log("[DEBUG] Received payload:", payload);

    const {
      ad_type,
      region_id,
      sub_region_id,
      company_name,
      phone_number,
      manager_contact,
      parking_type,
      shop_type,
      sponsor,
      contact_method,
      greeting,
      event_info,
      address,
      address_street,
      near_building,
      open_hours,
      program_info,
      post_title,
      manager_desc,
      themes, 
      lat,
      lng,
    } = payload;

    // 필수 체크
    if (
      !ad_type ||
      !region_id ||
      !company_name ||
      !phone_number ||
      !manager_contact ||
      !parking_type ||
      !shop_type ||
      !address ||
       !address_street ||
      !open_hours ||
      !program_info ||
      !contact_method ||
      !greeting ||
      !event_info ||
      !post_title ||
      !manager_desc ||
      !Array.isArray(themes) ||
     themes.length === 0 ||
      lat == null ||
      lng == null
    ) {
      return NextResponse.json({ error: "필수 필드 누락" }, { status: 400 });
    }

    // 인증 토큰
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "인증 토큰이 필요합니다." }, { status: 401 });
    }

    // 토큰 -> 유저 정보
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "인증 실패" }, { status: 401 });
    }
    const user_id = userData.user.id;

    // partnershipsubmit Insert
    const insertPayload = {
      ad_type,
      region_id: parseInt(region_id, 10),
      sub_region_id: sub_region_id ? parseInt(sub_region_id, 10) : null,
      company_name,
      phone_number,
      manager_contact,
      parking_type,
      shop_type,
      sponsor: sponsor || null,
      contact_method,
      greeting,
      event_info,
      address,
      address_street,
      near_building: near_building || null,
      open_hours,
      program_info,
      post_title,
      manager_desc,
      user_id,
      // marker_position 제거
            lat: parseFloat(lat),
      lng: parseFloat(lng),
    };

    // 1) partnershipsubmit에 insert
    const { data: submitData, error: submitErr } = await supabase
      .from("partnershipsubmit")
      .insert([insertPayload])
      .select()
      .single();

    if (submitErr) {
      console.error("Submit Insert Error:", submitErr);
      return NextResponse.json({ error: submitErr.message }, { status: 400 });
    }

    // 2) 생성된 auto-increment id
    const newSubmitId = submitData.id;

    // 3) M:N: partnershipsubmit_themes
    for (const themeId of themes) {
      const tId = parseInt(themeId, 10);
      const { error: themeErr } = await supabase
        .from("partnershipsubmit_themes")
        .insert([{ submit_id: newSubmitId, theme_id: tId }]);

      if (themeErr) {
        console.error("Theme Insert Error:", themeErr);
        // 부분 실패 시 처리 (rollback 등은 별도 로직 필요)
      }
    }

    return NextResponse.json({
      success: true,
      partnership_id: newSubmitId,
    });
  } catch (err) {
    console.error("POST /api/partnership error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}