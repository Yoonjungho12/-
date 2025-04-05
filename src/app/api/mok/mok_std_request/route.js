export const runtime = 'nodejs'; // ✅ 필수!

import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getCurrentDate } from '@/lib/utils';

export async function POST() {
  // ✅ 핵심 포인트: 여기서만 require! (import ❌)
  const mobileOK = require('@/lib/mok/mok_Key_Manager_v1.0.3.js');

  mobileOK.keyInit(process.cwd() + '/secure/mok_keyInfo.dat', 'thdwkd12!');

  const clientTxId = 'LINKUP' + uuidv4().replace(/-/g, '') + '|' + getCurrentDate();
  const encClientTxId = mobileOK.RSAEncrypt(clientTxId);

  const payload = {
    usageCode: '01001',
    serviceId: mobileOK.getServiceId(),
    encryptReqClientInfo: encClientTxId,
    serviceType: 'telcoAuth',
    retTransferType: 'MOKToken',
    returnUrl: 'https://www.yeogidot.com/api/mok/mok_std_result',
  };

  return NextResponse.json(payload);
}