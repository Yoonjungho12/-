import axios from "axios";

/**
 * Next.js 13 App Router (Route Handler)
 * POST /api/certifications
 * 
 * 1) 클라이언트가 imp_uid를 보내면,
 * 2) 포트원(아임포트) REST API로 인증 정보 조회
 * 3) 결과 반환
 */

export async function POST(request) {
  try {
    const body = await request.json();
    const { imp_uid } = body;
    if (!imp_uid) {
      return new Response(JSON.stringify({
        success: false,
        error: "imp_uid가 누락되었습니다."
      }), { status: 400 });
    }

    // 1) 포트원 Access Token 발급
    const getTokenRes = await axios.post(
      "https://api.iamport.kr/users/getToken",
      {
        imp_key: "0556004168561576",        // 예: 'imp_apikey'
        imp_secret: "Re5bBp8Ufdd2NgFYz85sWsiVwiAghIbWqnAo30MiyPht0MDYwNZqErrBag7OvqkNod4XcNuOZQZULnMI"  
      },
      {
        headers: { "Content-Type": "application/json" },
      }
    );

    const { access_token } = getTokenRes.data.response;
    if (!access_token) {
      throw new Error("포트원 토큰 발급 실패");
    }

    // 2) 인증 정보 조회
    const getCertRes = await axios.get(
      `https://api.iamport.kr/certifications/${imp_uid}`,
      {
        headers: { Authorization: access_token },
      }
    );

    if (getCertRes.data.code === 0) {
      // 조회 성공
      const certInfo = getCertRes.data.response;
      // certInfo.name, certInfo.birth, certInfo.gender, certInfo.unique_key 등

      // 필요한 로직(예: DB 저장, 나이 체크, 가입 처리 등) 작성 가능

      return new Response(JSON.stringify({
        success: true,
        data: certInfo
      }), { status: 200 });

    } else {
      // 포트원 인증 조회 실패
      const msg = getCertRes.data.message || "인증 조회 중 오류 발생";
      throw new Error(msg);
    }

  } catch (err) {
    console.error("POST /api/certifications error:", err);
    return new Response(JSON.stringify({
      success: false,
      error: err.message
    }), { status: 500 });
  }
}