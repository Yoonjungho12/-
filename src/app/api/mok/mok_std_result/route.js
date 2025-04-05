export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import axios from 'axios';
import urlencode from 'urlencode';

export async function POST(request) {
  // ✅ 여기도 require로 동적 불러오기!
  const mobileOK = require('@/lib/mok/mok_Key_Manager_v1.0.3.js');
  mobileOK.keyInit(process.cwd() + '/secure/mok_keyInfo.dat', 'thdwkd12!');

  const body = await request.text();
  const decoded = decodeURIComponent(JSON.parse(body).data);
  const parsed = JSON.parse(decoded);

  const token = parsed.encryptMOKKeyToken;
  if (!token) return NextResponse.json({ error: '토큰 없음' }, { status: 400 });

  const mokRes = await axios.post(
    'https://scert.mobile-ok.com/gui/service/v1/result/request',
    { encryptMOKKeyToken: token }
  );

  const resultEncrypted = mokRes.data.encryptMOKResult;
  const decryptedJson = mobileOK.getResult(resultEncrypted);
  const user = JSON.parse(decryptedJson);

  return NextResponse.json({ success: true, user });
}