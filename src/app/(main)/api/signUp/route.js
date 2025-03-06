import { createClient } from '@supabase/supabase-js';
import {supabase} from '@/lib/supabaseE';

export async function POST(request) {
  try {
    const { user_id, name, nickname, phone, email } = await request.json();

    // user_id가 없으면 에러
    if (!user_id) {
      return new Response("user_id is required", { status: 400 });
    }

    // profiles 테이블에 INSERT
    const { data, error } = await supabase
      .from("profiles")
      .insert({
        user_id,
        name,
        nickname,
        phone,
      })
      .single();

    if (error) {
      return new Response(error.message, { status: 400 });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(err.message, { status: 500 });
  }
}