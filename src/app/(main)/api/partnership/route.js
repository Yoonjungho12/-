import { supabase } from "@/lib/supabaseE"; // 서비스 역할 키
import { NextResponse } from "next/server";

/** 
 * "동(숫자optional)가" → ["효자","효자동"] 등으로 분리하는 부함수
 */
function parseOneToken(token) {
  const reDongGa = /^(.+?)동(\d*)가$/;
  const match = token.match(reDongGa);

  if (match) {
    const prefix = match[1]; // 예: "효자"
    const prefixPlusDong = prefix + "동"; // 예: "효자동"
    return [prefix, prefixPlusDong];
  }

  // 일반 접미어
  const suffixes = [
    "특별자치도", "광역시", "특별시", "자치도", "시", "군", "구", "동",
  ];

  for (const sfx of suffixes) {
    if (token.endsWith(sfx)) {
      const removed = token.slice(0, token.length - sfx.length);
      return [removed];
    }
  }

  return [token];
}

/** 
 * 주소 -> 공백Split -> 분해 -> Flatten -> Join
 */
function destructAddress(original) {
  if (!original) return "";
  const rawTokens = original.split(/\s+/).filter(Boolean);

  let resultTokens = [];
  for (const t of rawTokens) {
    const sub = parseOneToken(t);
    resultTokens.push(...sub);
  }
  return resultTokens.join(" ").trim();
}

/** POST: 새 파트너십 신청서 등록 */
export async function POST(request) {
  try {
    const payload = await request.json();
    console.log("[DEBUG] Received payload (POST):", payload);

    const {
      ad_type,
      region_id,
      sub_region_id,
      company_name,
      phone_number,
      manager_contact,
      parking_type,
      contact_method,
      greeting,
      event_info,
      address,
      address_street,
      near_building,
      open_hours,
      program_info,
      post_title,
      themes,     // Array of themeId
      lat,
      lng,
      holiday,    // nullable
      isMaster    // 조건에 따라 true이면 자동 승인 처리 (클라이언트에서 전달)
    } = payload;

    // 필수 체크
    if (
      !region_id ||
      !company_name ||
      !phone_number ||
      !manager_contact ||
      !parking_type ||
      !address ||
      !address_street ||
      !open_hours ||
      !program_info ||
      !contact_method ||
      !greeting ||
      !event_info ||
      !post_title ||
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

    // 유저 인증
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "인증 실패" }, { status: 401 });
    }
    const user_id = userData.user.id;

    // 1) address 분해
    const destructed_address = destructAddress(address);

    // 2) themes 테이블에서 name 조회 후 theme_text 만들기
    const { data: themeRows, error: themeErr } = await supabase
      .from("themes")
      .select("name")
      .in("id", themes);
    if (themeErr) {
      console.error("Theme name fetch error:", themeErr);
      return NextResponse.json({ error: themeErr.message }, { status: 400 });
    }
    const themeNames = themeRows.map(r => r.name);
    const theme_text = themeNames.join(", ");

    // 3) Insert payload 구성
    const insertPayload = {
      ad_type,
      region_id: parseInt(region_id, 10),
      sub_region_id: sub_region_id ? parseInt(sub_region_id, 10) : null,
      company_name,
      phone_number,
      manager_contact,
      parking_type,
      contact_method,
      greeting,
      event_info,
      address,                 // 원본 주소
      address_street,
      near_building: near_building || null,
      open_hours,
      program_info,
      post_title,
      user_id,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      holiday: holiday || null, // nullable
      destructed_address,
      theme_text,
    };

    // 만약 isMaster가 true이면 자동 승인 및 최종승인 처리
    if (isMaster === true) {
      insertPayload.is_admitted = true;
      insertPayload.final_admitted = true;
    }

    // 4) partnershipsubmit Insert
    const { data: submitData, error: submitErr } = await supabase
      .from("partnershipsubmit")
      .insert([insertPayload])
      .select("id, ad_type, region_id, sub_region_id, company_name, phone_number, manager_contact, parking_type, contact_method, greeting, event_info, address, address_street, near_building, open_hours, program_info, post_title, user_id, lat, lng, holiday, destructed_address, theme_text, is_admitted, final_admitted")
      .single();
    if (submitErr) {
      console.error("Submit Insert Error:", submitErr);
      return NextResponse.json({ error: submitErr.message }, { status: 400 });
    }
    const newSubmitId = submitData.id;

    // 5) M:N bridging: partnershipsubmit_themes 삽입
    for (const themeId of themes) {
      const tId = parseInt(themeId, 10);
      const { error: themeBridgeErr } = await supabase
        .from("partnershipsubmit_themes")
        .insert([{ submit_id: newSubmitId, theme_id: tId }]);
      if (themeBridgeErr) {
        console.error("Theme bridging insert error:", themeBridgeErr);
        // 필요시 롤백 또는 부분 실패 처리
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
    // 1) id 파라미터 체크
    const { searchParams } = new URL(request.url);
    const submitId = searchParams.get("id");
    if (!submitId) {
      return NextResponse.json({ error: "id 파라미터 필요" }, { status: 400 });
    }

    // 2) payload
    const payload = await request.json();
    console.log("[DEBUG] Received payload (PUT):", payload);

    const {
      ad_type,
      region_id,
      sub_region_id,
      company_name,
      phone_number,
      manager_contact,
      parking_type,
      contact_method,
      greeting,
      event_info,
      address,
      address_street,
      near_building,
      open_hours,
      program_info,
      post_title,
      themes,   // Array of themeId
      lat,
      lng,
      holiday,  // nullable
      isMaster, // 클라이언트에서 전달된 isMaster 값
    } = payload;

    // 필수 체크
    if (
      !region_id ||
      !company_name ||
      !phone_number ||
      !manager_contact ||
      !parking_type ||
      !address ||
      !address_street ||
      !open_hours ||
      !program_info ||
      !contact_method ||
      !greeting ||
      !event_info ||
      !post_title ||
      !Array.isArray(themes) ||
      themes.length === 0 ||
      lat == null ||
      lng == null
    ) {
      return NextResponse.json({ error: "필수 필드 누락" }, { status: 400 });
    }

    // 3) 인증 토큰
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "인증 토큰이 필요합니다." }, { status: 401 });
    }
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return NextResponse.json({ error: "인증 실패" }, { status: 401 });
    }
    const user_id = userData.user.id;

    // 4) 권한 체크
    const { data: targetSubmit, error: targetErr } = await supabase
      .from("partnershipsubmit")
      .select("user_id")
      .eq("id", submitId)
      .single();
    if (targetErr || !targetSubmit) {
      return NextResponse.json({ error: "수정 대상 없음" }, { status: 404 });
    }
    if (targetSubmit.user_id !== user_id) {
      return NextResponse.json({ error: "본인 신청서만 수정 가능" }, { status: 403 });
    }

    // 5) address 분해
    const destructed_address = destructAddress(address);

    // 6) theme_text 조합
    const { data: themeRows, error: themeErr } = await supabase
      .from("themes")
      .select("name")
      .in("id", themes);
    if (themeErr) {
      console.error("Theme name fetch error:", themeErr);
      return NextResponse.json({ error: themeErr.message }, { status: 400 });
    }
    const themeNames = themeRows.map(r => r.name);
    const theme_text = themeNames.join(", ");

    // 7) update payload 구성
    const updatePayload = {
      ad_type,
      region_id: parseInt(region_id, 10),
      sub_region_id: sub_region_id ? parseInt(sub_region_id, 10) : null,
      company_name,
      phone_number,
      manager_contact,
      parking_type,
      contact_method,
      greeting,
      event_info,
      address,
      address_street,
      near_building: near_building || null,
      open_hours,
      program_info,
      post_title,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      holiday: holiday || null,
      destructed_address,
      theme_text,
    };

    // 만약 isMaster가 true이면 자동 승인 및 최종승인 처리
    if (isMaster === true) {
      updatePayload.is_admitted = true;
      updatePayload.final_admitted = true;
    }

    // 8) update 실행
    const { error: updateErr } = await supabase
      .from("partnershipsubmit")
      .update(updatePayload)
      .eq("id", submitId);
    if (updateErr) {
      console.error("Submit Update Error:", updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 400 });
    }

    // 9) 테마 재설정
    const { error: delErr } = await supabase
      .from("partnershipsubmit_themes")
      .delete()
      .eq("submit_id", submitId);
    if (delErr) {
      console.error("Theme Delete Error:", delErr);
      // 부분 실패 시 처리 필요
    }
    for (const themeId of themes) {
      const tId = parseInt(themeId, 10);
      const { error: themeBridgeErr } = await supabase
        .from("partnershipsubmit_themes")
        .insert([{ submit_id: parseInt(submitId, 10), theme_id: tId }]);
      if (themeBridgeErr) {
        console.error("Theme Insert Error:", themeBridgeErr);
        // 부분 실패 시 처리 필요
      }
    }

    return NextResponse.json({
      success: true,
      updated_id: parseInt(submitId, 10),
    });
  } catch (err) {
    console.error("PUT /api/partnership error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}