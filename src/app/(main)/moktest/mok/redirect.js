// src/pages/mok/redirect.js
import { useEffect, useState } from 'react';

export default function MokRedirect() {
  const [result, setResult] = useState('');

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const data = query.get('data');
    try {
      const parsed = JSON.parse(decodeURIComponent(data));
      setResult(JSON.stringify(parsed, null, 2));
    } catch (e) {
      setResult(data || '결과 없음');
    }
  }, []);

  return (
    <div style={{ padding: '2rem' }}>
      <h2>🔄 본인인증 결과 (Redirect)</h2>
      <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{result}</pre>
    </div>
  );
}