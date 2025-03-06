// 예시: /app/api/messages/route.js
import { NextResponse } from 'next/server';
import {supabase} from '.@/lib/supabaseE';

export async function POST(req) {
  try {
    const body = await req.json();
    const { sender_id, receiver_id, content } = body;

    // 필수 필드 검증
    if (!sender_id || !receiver_id || !content) {
      return NextResponse.json(
        { error: '필수 필드가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // Supabase DB에 INSERT
    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          sender_id,
          receiver_id,
          content
          // subject, read_at 등 필요한 필드가 있으면 추가
        },
      ]);

    if (error) {
      console.error('쪽지 INSERT 오류:', error);
      return NextResponse.json({ error: 'DB 오류' }, { status: 500 });
    }

    // 성공
    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err) {
    console.error('API 오류:', err);
    return NextResponse.json({ error: '서버 에러' }, { status: 500 });
  }
}