import { supabase } from '../../lib/supabaseE'; // 서비스 역할 키 사용
import { NextResponse } from 'next/server';

export async function POST(request) {
  console.log('여기 일단 왔긴왔어');
  try {
    // 1) 클라이언트에서 보낸 JSON payload 파싱
    const payload = await request.json();
    console.log('[DEBUG] Received payload:', payload);

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
      near_building,
      open_hours,
      program_info,
      post_title,
      manager_desc,
    } = payload;

    // 2) 정수 변환
    const regionIdInt = parseInt(region_id, 10);
    const subRegionIdInt = sub_region_id ? parseInt(sub_region_id, 10) : null;

    // 3) 필수 항목 검증
    if (
      !ad_type ||
      isNaN(regionIdInt) ||
      !company_name ||
      !phone_number ||
      !parking_type ||
      !shop_type ||
      !address ||
      !open_hours ||
      !program_info
    ) {
      console.log("Missing required fields:", {
        ad_type,
        region_id,
        company_name,
        phone_number,
        parking_type,
        shop_type,
        address,
        open_hours,
        program_info,
      });
      return new NextResponse('필수 항목을 모두 입력해 주세요.', { status: 400 });
    }

    // -------------------------------
    // 여기부터 세션 JWT를 이용하여 글쓴이(user_id) 추출
    // -------------------------------
    // Authorization 헤더에서 Bearer 토큰 추출
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) {
      console.error('[DEBUG] 토큰이 제공되지 않았습니다.');
      return new NextResponse('인증 토큰이 필요합니다.', { status: 401 });
    }

    // (A) 먼저 setSession으로 토큰을 반영
    const { error: sessionError } = await supabase.auth.setSession({
      access_token: token,
      // refresh_token: '',  // refresh 토큰이 필요하다면 추가
    });
    if (sessionError) {
      console.error('[DEBUG] 세션 설정 에러:', sessionError);
      return new NextResponse('세션 설정 중 에러가 발생했습니다.', { status: 401 });
    }

    // (B) 이제 getUser() 호출
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('[DEBUG] 사용자 정보를 가져오지 못했습니다.', authError);
      return new NextResponse('인증 정보가 올바르지 않습니다.', { status: 401 });
    }

    console.log('[DEBUG] 인증된 사용자:', user);
    // 글쓴이 UUID
    const user_id = user.id;

    // -------------------------------
    // DB에 Insert할 최종 Payload
    // -------------------------------
    const insertPayload = {
      ad_type,
      region_id: regionIdInt,
      sub_region_id: subRegionIdInt,
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
      near_building,
      open_hours,
      program_info,
      post_title,
      manager_desc,
      user_id, // 글쓴이 UUID
    };

    // 4) partnershipSubmit 테이블에 INSERT
    const { data, error } = await supabase
      .from('partnershipsubmit')
      .insert([insertPayload])
      .single();

    console.log('탈출은 함');
    if (error) {
      console.error('INSERT 에러:', error);
      return new NextResponse(error.message, { status: 400 });
    }

    return NextResponse.json({ success: true, data });
  } catch (err) {
    console.error('POST API 에러:', err);
    return new NextResponse(err.message, { status: 500 });
  }
}