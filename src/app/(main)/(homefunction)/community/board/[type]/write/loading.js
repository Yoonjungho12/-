// app/loading.js

export default function Loading() {
  return (
    <div style={styles.container}>
      <div style={styles.spinner}></div>
      <p style={styles.text}>로딩 중입니다. 잠시만 기다려 주세요...</p>

      {/* 인라인 스타일 대신 별도의 CSS 모듈이나 Tailwind를 사용하셔도 됩니다. */}
      <style>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '40vh',
    backgroundColor: '#fff',
  },
  spinner: {
    width: '50px',
    height: '50px',
    marginBottom: '16px',
    border: '6px solid #f3f3f3',
    borderTop: '6px solid #3498db',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  text: {
    fontSize: '14px',
    color: '#666',
  },
};