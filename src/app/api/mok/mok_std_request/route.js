const { NextResponse } = require('next/server');
const { v4: uuidv4 } = require('uuid');
const { getCurrentDate } = require('../../../../lib/utils');
const path = require('path');

const runtime = 'nodejs';

// ✅ 대표님의 실제 서비스 ID
const SERVICE_ID = '275c0d3b-57a8-44df-a659-f0eba1da319c';

async function POST() {
  const mobileOK = require(path.join(process.cwd(), 'lib/mok/mok_Key_Manager_v1.0.3.js'));
  mobileOK.keyInit(process.cwd() + '/secure/mok_keyInfo.dat', 'thdwkd12!');

  const clientTxId = 'YEOGI' + uuidv4().replace(/-/g, '') + '|' + getCurrentDate();
  const encClientTxId = mobileOK.RSAEncrypt(clientTxId);

  return NextResponse.json({
    usageCode: '01001',
    serviceId: SERVICE_ID, // ✅ 여기로 고정
    encryptReqClientInfo: encClientTxId,
    serviceType: 'telcoAuth',
    retTransferType: 'MOKToken',
    returnUrl: 'https://www.yeogidot.com/api/mok/mok_std_result',
  });
}

module.exports = { POST, runtime };
//sdddfsafad