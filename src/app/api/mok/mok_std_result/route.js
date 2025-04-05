import { NextResponse } from 'next/server';
import { mokKeyManager } from '../../../../lib/mok/mok_Key_Manager_v1.0.3';

export async function POST(request) {
  try {
    const body = await request.json();
    const { requestId, encryptedData } = body;

    // 필수 파라미터 검증
    if (!requestId || !encryptedData) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 모크 키 매니저 초기화
    const keyManager = new mokKeyManager();
    await keyManager.initialize();

    // 인증 결과 복호화
    const decryptedResult = await keyManager.decryptResult({
      requestId,
      encryptedData,
    });

    // 인증 결과 검증
    if (!decryptedResult || !decryptedResult.success) {
      return NextResponse.json(
        { error: '인증 결과가 유효하지 않습니다.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      result: decryptedResult,
    });
  } catch (error) {
    console.error('인증 결과 처리 중 오류:', error);
    return NextResponse.json(
      { error: '인증 결과 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 