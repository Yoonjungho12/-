const { NextResponse } = require('next/server');
const { v4: uuidv4 } = require('uuid');
const { getCurrentDate } = require('../../../../lib/utils');
const path = require('path');

const runtime = 'nodejs';

async function POST() {
  const mobileOK = require(path.join(process.cwd(), 'lib/mok/mok_Key_Manager_v1.0.3.js'));
  mobileOK.keyInit(process.cwd() + '/secure/mok_keyInfo.dat', 'thdwkd12!');

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

module.exports = { POST, runtime };
//ㅇㅇ