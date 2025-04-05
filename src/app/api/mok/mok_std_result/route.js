export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import axios from 'axios';
import urlencode from 'urlencode';

// ✅ src/lib/mok 기준 상대경로 (현재 위치 기준: src/app/api/mok/mok_std_result)
const mobileOK = require('../../../../lib/mok/mok_Key_Manager_v1.0.3.js');
mobileOK.keyInit(process.cwd() + '/secure/mok_keyInfo.dat', 'thdwkd12!');

export async function POST(request) {
  try {
    const body = await request.text();
    const decoded = decodeURIComponent(JSON.parse(body).data);
    const parsed = JSON.parse(decoded);

    const token = parsed.encryptMOKKeyToken;
    if (!token) return NextResponse.json({ error: '토큰 없음' }, { status: 400 });

    const mokRes = await axios.post(
      'https://scert.mobile-ok.com/gui/service/v1/result/request',
      { encryptMOKKeyToken: token }
    );

    const encrypted = mokRes.data.encryptMOKResult;
    const decrypted = mobileOK.getResult(encrypted);
    const user = JSON.parse(decrypted);

    return NextResponse.json({ success: true, user });
  } catch (err) {
    console.error('복호화 실패:', err);
    return NextResponse.json({ error: '복호화 실패' }, { status: 500 });
  }
}