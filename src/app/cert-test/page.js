"use client"; 
import React, { useEffect } from "react";

/**
 *  Next.js 13 App Router에서
 *  PC(팝업 콜백) + 모바일(리디렉션) 모두 대응
 */

export default function CertTestPage() {

  useEffect(() => {
    // iamport.js 스크립트 로딩
    const script = document.createElement("script");
    script.src = "https://cdn.iamport.kr/v1/iamport.js";
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleOpenCertification = () => {
    if (typeof window.IMP === "undefined") {
      alert("포트원(아임포트) SDK가 아직 로딩되지 않았습니다!");
      return;
    }

    // 1) 고객사 식별코드 초기화 (콘솔에서 확인한 imp00000000 형태)
    window.IMP.init("imp66886482"); 
    //               ↑ 실제 코드로 교체

    // 2) 인증창 호출
    window.IMP.certification(
      {
        channelKey: "channel-key-cf91db1f-63bc-4212-87f9-bfe9673c26e7", 
        // ↑ 포트원 콘솔 "연동 정보 > 채널 관리"에서 확인한 채널 키

        merchant_uid: `cert_${Date.now()}`, 
        // 가맹점 임의로 생성한 인증건 고유 ID

        popup: false, 
        // PC에선 어차피 팝업이 뜨지만, 모바일에선 false일 때 리디렉션 진행

        m_redirect_url: "http://localhost:3000/cert-test/done", 
        // 모바일 인증 완료 후 이동할 페이지 (리디렉션)
      },
      (rsp) => {
        // 콜백 함수 - PC 환경에서만 주로 실행됨
        if (rsp.success) {
          // 인증 성공 시, imp_uid를 서버로 전송 → 실제 인증 정보 조회
          alert(`인증(PC) 성공! imp_uid: ${rsp.imp_uid}`);

          fetch("/api/certifications", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ imp_uid: rsp.imp_uid }),
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.success) {
                console.log("인증 정보(PC) 조회 성공:", data.data);
                alert(
                  `이름: ${data.data.name}\n생년월일: ${data.data.birth}`
                );
              } else {
                alert(`인증 조회 실패: ${data.error}`);
              }
            })
            .catch((err) => {
              console.error(err);
              alert("서버 통신 오류 발생(PC)");
            });
        } else {
          // 인증 실패 or 취소(PC)
          alert(`인증 실패: ${rsp.error_msg}`);
        }
      }
    );
  };

  return (
    <div style={{ padding: 24 }}>
      <h1>본인인증 테스트 (Next.js App Router)</h1>
      <p>버튼을 눌러 인증창을 띄우세요.</p>
      <button onClick={handleOpenCertification}>
        본인인증 창 열기
      </button>
      <hr />
      <p>
        <b>설명:</b> <br />
        - PC: 팝업 후 콜백(<code>rsp.success</code>)이 실행됨 <br />
        - 모바일: 인증 완료 후 <code>m_redirect_url</code>로 리디렉션
      </p>
    </div>
  );
}