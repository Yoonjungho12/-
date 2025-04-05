// src/pages/index.js
'use client'
import { useEffect } from 'react';

export default function Home() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://scert.mobile-ok.com/resources/js/index.js'; // 개발용
    script.async = true;
    document.body.appendChild(script);

    const resultScript = document.createElement('script');
    resultScript.innerHTML = `
      function result(data) {
        try {
          const parsed = JSON.parse(data);
          alert("✅ 본인인증 성공\\n" + JSON.stringify(parsed, null, 2));
        } catch (e) {
          alert("❌ 인증 결과 파싱 실패: " + data);
        }
      }
    `;
    document.body.appendChild(resultScript);
  }, []);

  const handleAuthClick = () => {
    window.MOBILEOK.process(
      'https://www.yeogidot.com/mok/mok_std_request', // 📌 Express 서버 URL
      'WB',
      'result'
    );
  };

  return (
    <main style={{ padding: '2rem' }}>
      <h1>📲 본인확인 시작</h1>
      <button onClick={handleAuthClick} style={{ fontSize: '1.2rem' }}>
        본인인증 하러가기
      </button>
    </main>
  );
}