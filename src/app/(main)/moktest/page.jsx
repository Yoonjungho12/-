'use client'

import { useEffect } from 'react'

export default function MokTestPage() {
  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://scert.mobile-ok.com/resources/js/index.js'
    script.async = true
    document.body.appendChild(script)

    const callbackScript = document.createElement('script')
    callbackScript.innerHTML = `
      function result(data) {
        try {
          const parsed = JSON.parse(data);
          alert("인증 성공: " + JSON.stringify(parsed, null, 2));
        } catch (e) {
          alert("인증 결과 오류: " + data);
        }
      }
    `
    document.body.appendChild(callbackScript)
  }, [])

  const handleClick = () => {
    window.MOBILEOK.process(
      '/api/mok/mok_std_request',
      'WB',
      'result'
    )
  }

  return (
    <div style={{ padding: 40 }}>
      <h2>🔐 Mobile-OK 본인확인 테스트 (App Router)</h2>
      <button onClick={handleClick} style={{ fontSize: 18 }}>
        본인인증 시작
      </button>
    </div>
  )
} 