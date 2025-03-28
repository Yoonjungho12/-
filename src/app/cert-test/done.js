"use client";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

/**
 *  모바일 환경에서 popup:false일 때,
 *  인증 완료 후 이 페이지로 리디렉션됩니다.
 *  ex) https://내도메인/cert-test/done?imp_uid=xxx&merchant_uid=yyy&success=true
 */
export default function CertDonePage() {
  const searchParams = useSearchParams();
  const imp_uid = searchParams.get("imp_uid");
  const success = searchParams.get("success");

  useEffect(() => {
    // success === "true" 이고 imp_uid가 있다면 인증 성공
    if (success === "true" && imp_uid) {
      // 서버로 imp_uid 전송 → 인증 정보 조회
      alert(`인증(모바일) 성공! imp_uid: ${imp_uid}`);

      fetch("/api/certifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imp_uid }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            console.log("인증 정보(모바일) 조회 성공:", data.data);
            alert(
              `이름: ${data.data.name}\n생년월일: ${data.data.birth}`
            );
            // 이후 원하는 로직(가입 처리 등) 진행
          } else {
            alert(`인증 정보 조회 실패: ${data.error}`);
          }
        })
        .catch((err) => {
          console.error(err);
          alert("서버 통신 오류 발생(모바일)");
        });
    } else {
      // 실패 or 파라미터 누락
      alert("인증 실패했거나 파라미터가 없습니다.");
    }
  }, [imp_uid, success]);

  return (
    <div style={{ padding: 24 }}>
      <h1>모바일 인증 완료 페이지</h1>
      <p>
        인증 결과를 조회 중입니다... <br />
        (PC에서는 보통 이 페이지가 필요 없어요)
      </p>
    </div>
  );
}