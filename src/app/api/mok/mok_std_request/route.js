export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { getCurrentDate } from '../../../../lib/utils';
import { v4 as uuidv4 } from 'uuid';

const mobileOK = require('../../../../lib/mok/mok_Key_Manager_v1.0.3.js');
mobileOK.keyInit(process.cwd() + '/secure/mok_keyInfo.dat', 'thdwkd12!');

export async function POST() {
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