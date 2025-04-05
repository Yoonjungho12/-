export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getCurrentDate } from '@/lib/utils'; // utils는 @/lib에 위치하므로 이건 유지 OK

const mobileOK = require('../../../../lib/mok/mok_Key_Manager_v1.0.3.js');
mobileOK.keyInit(process.cwd() + '/secure/mok_keyInfo.dat', 'thdwkd12!');

export async function POST() {
  const clientTxId = 'YEOGI' + uuidv4().replace(/-/g, '') + '|' + getCurrentDate();
  const encClientTxId = mobileOK.RSAEncrypt(clientTxId);

  return NextResponse.json({
    usageCode: '01001',
    serviceId: mobileOK.getServiceId(),
    encryptReqClientInfo: encClientTxId,
    serviceType: 'telcoAuth',
    retTransferType: 'MOKToken',
    returnUrl: 'https://www.yeogidot.com/api/mok/mok_std_result',
  });
}