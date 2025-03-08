import { supabase } from "@/lib/supabaseE"; // 서비스 역할 키
import { NextResponse } from "next/server";

/** POST: 새 파트너십 신청서 등록 */
export async function POST(request) {
  try {
    const payload = await request.json();
    console.log("[DEBUG] Received payload (POST):", payload);

    const { ad_type, region_id, sub_region_id, company_name, phone_number, manager_contact, parking_type, shop_type, sponsor, contact_method, greeting, event_info, address, address_street, near_building, open_hours, program_info, post_title, manager_desc, themes, lat, lng } = payload;

    // 필수 체크
    if (!ad_type || !region_id || !company_name || !phone_number || !manager_contact || !parking_type || !shop_type || !address || !address_street || !open_hours || !program_info || !contact_method || !greeting || !event_info || !post_title || !manager_desc || !Array.isArray(themes) || themes.length === 0 || lat == null || lng == null) {
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

/** PUT: 기존 파트너십 신청서 수정 */
export async function PUT(request) {
  try {
    const { searchParams } = new URL(request.url);
    const submitId = searchParams.get("id"); // ex) ?id=123
    if (!submitId) {
      return NextResponse.json({ error: "id 파라미터 필요" }, { status: 400 });
    }

    const payload = await request.json();
    console.log("[DEBUG] Received payload (PUT):", payload);

    const { ad_type, region_id, sub_region_id, company_name, phone_number, manager_contact, parking_type, shop_type, sponsor, contact_method, greeting, event_info, address, address_street, near_building, open_hours, program_info, post_title, manager_desc, themes, lat, lng } = payload;

    // 필수 체크
    if (!ad_type || !region_id || !company_name || !phone_number || !manager_contact || !parking_type || !shop_type || !address || !address_street || !open_hours || !program_info || !contact_method || !greeting || !event_info || !post_title || !manager_desc || !Array.isArray(themes) || themes.length === 0 || lat == null || lng == null) {
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

    // (1) 해당 submitId의 user_id가 현재 로그인한 user_id와 같은지 확인(권한)
    const { data: targetSubmit, error: targetErr } = await supabase
      .from("partnershipsubmit")
      .select("user_id")
      .eq("id", submitId)
      .single();

    if (targetErr || !targetSubmit) {
      return NextResponse.json({ error: "수정 대상 신청서가 존재하지 않음" }, { status: 404 });
    }
    if (targetSubmit.user_id !== user_id) {
      return NextResponse.json({ error: "본인 신청서만 수정 가능" }, { status: 403 });
    }

    // (2) 수정할 payload 구성
    const updatePayload = {
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
      lat: parseFloat(lat),
      lng: parseFloat(lng),
    };

    // (3) partnershipsubmit 수정
    const { error: updateErr } = await supabase
      .from("partnershipsubmit")
      .update(updatePayload)
      .eq("id", submitId);

    if (updateErr) {
      console.error("Submit Update Error:", updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 400 });
    }

    // (4) 테마 재설정 위해 기존 연결 삭제
    const { error: delErr } = await supabase
      .from("partnershipsubmit_themes")
      .delete()
      .eq("submit_id", submitId);

    if (delErr) {
      console.error("Theme Delete Error:", delErr);
      // 부분 실패 시 처리 등 필요할 수도
    }

    // (5) 새 테마 관계 Insert
    for (const themeId of themes) {
      const tId = parseInt(themeId, 10);
      const { error: themeErr } = await supabase
        .from("partnershipsubmit_themes")
        .insert([{ submit_id: parseInt(submitId), theme_id: tId }]);
      if (themeErr) {
        console.error("Theme Insert Error:", themeErr);
        // 부분 실패 시 처리 필요
      }
    }

    return NextResponse.json({
      success: true,
      updated_id: parseInt(submitId),
    });
  } catch (err) {
    console.error("PUT /api/partnership error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}