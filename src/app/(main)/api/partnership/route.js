import { supabase } from "@/lib/supabaseE"; // 서비스 역할 키
import { NextResponse } from "next/server";

/** 
 * "동(숫자optional)가" → ["효자", "효자동"] 등으로 분리하는 부함수
 */
function parseOneToken(token) {
  const reDongGa = /^(.+?)동(\d*)가$/;
  const match = token.match(reDongGa);
  if (match) {
    const prefix = match[1]; // 예: "효자"
    const prefixPlusDong = prefix + "동"; // 예: "효자동"
    return [prefix, prefixPlusDong];
  }
  const suffixes = ["특별자치도", "광역시", "특별시", "자치도", "시", "군", "구", "동"];
  for (const sfx of suffixes) {
    if (token.endsWith(sfx)) {
      const removed = token.slice(0, token.length - sfx.length);
      return [removed];
    }
  }
  return [token];
}

/** 
 * 주소를 공백으로 분할한 후, 각 토큰을 분해하여 평탄화한 후 재조합
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

/**
 * POST: 새 파트너십 신청서 등록
 * 이미지(upload)는 전부 프론트에서 처리하므로 서버는 텍스트만 처리
 */
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
      themes,  // Array of themeId
      lat,
      lng,
      holiday, // nullable
      isMaster, // 마스터 모드 여부 (true이면 자동 승인 처리)
      title_color,  // title_color 추가

      // 아래는 모두 제거 (프론트에서 업로드하므로 서버에서는 처리 X)
      // thumbnail_image,
      // multi_images
    } = payload;

    // 필수 필드 체크
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

    // 인증 토큰 체크
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

    // 주소 분해
    const destructed_address = destructAddress(address);

    // 테마 이름 조회 및 theme_text 생성
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

    // Insert payload 구성 (이미지 필드 제거)
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
      address, // 원본 주소
      address_street,
      near_building: near_building || null,
      open_hours,
      program_info,
      post_title,
      user_id,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      holiday: holiday || null,
      destructed_address,
      theme_text,
      title_color: payload.title_color,  // title_color 추가
    };

    // 마스터 모드이면 자동 승인 처리
    if (isMaster === true) {
      insertPayload.is_admitted = true;
      insertPayload.final_admitted = true;
    }

    // partnershipsubmit Insert
    const { data: submitData, error: submitErr } = await supabase
      .from("partnershipsubmit")
      .insert([insertPayload])
      .select("*")
      .single();
    if (submitErr) {
      console.error("Submit Insert Error:", submitErr);
      return NextResponse.json({ error: submitErr.message }, { status: 400 });
    }

    const newSubmitId = submitData.id;

    // M:N bridging: partnershipsubmit_themes 삽입
    for (const themeId of themes) {
      const tId = parseInt(themeId, 10);
      const { error: themeBridgeErr } = await supabase
        .from("partnershipsubmit_themes")
        .insert([{ submit_id: newSubmitId, theme_id: tId }]);
      if (themeBridgeErr) {
        console.error("Theme bridging insert error:", themeBridgeErr);
      }
    }

    // 클라이언트가 기대하는 { id: newSubmitId } 형태로 응답
    return NextResponse.json({
      success: true,
      id: newSubmitId,
    });
  } catch (err) {
    console.error("POST /api/partnership error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * PUT: 기존 파트너십 신청서 수정
 * 이 역시 이미지 부분은 제거 (프론트에서 알아서 처리)
 */
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
      themes,     // Array of themeId
      lat,
      lng,
      holiday,    // nullable
      isMaster,   // 클라이언트에서 전달된 isMaster 값
      title_color,  // title_color 추가

      // 이미지 필드는 서버에서 처리 X (프론트 업로드)
      // thumbnail_image,
      // multi_images
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

    // 4) 권한 체크: 수정대상이 현재 유저의 것인지
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

    // 7) Update payload 구성 (이미지 필드 제거)
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
      title_color: payload.title_color,  // title_color 추가
    };

    // 마스터 모드이면 자동 승인 처리
    if (isMaster === true) {
      updatePayload.is_admitted = true;
      updatePayload.final_admitted = true;
    }

    // 8) Update 실행
    const { error: updateErr } = await supabase
      .from("partnershipsubmit")
      .update(updatePayload)
      .eq("id", submitId);
    if (updateErr) {
      console.error("Submit Update Error:", updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 400 });
    }

    // 추가로 themes M:N 재설정 (기존 것 삭제 -> 새로 insert)
    const { error: delErr } = await supabase
      .from("partnershipsubmit_themes")
      .delete()
      .eq("submit_id", submitId);
    if (delErr) {
      console.error("Theme Delete Error:", delErr);
    }
    for (const themeId of themes) {
      const tId = parseInt(themeId, 10);
      const { error: themeBridgeErr } = await supabase
        .from("partnershipsubmit_themes")
        .insert([{ submit_id: parseInt(submitId, 10), theme_id: tId }]);
      if (themeBridgeErr) {
        console.error("Theme Insert Error:", themeBridgeErr);
      }
    }

    // 수정 결과 반환 (id는 optional)
    return NextResponse.json({
      success: true,
      id: parseInt(submitId, 10),
    });
  } catch (err) {
    console.error("PUT /api/partnership error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}