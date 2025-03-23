// app/loading.js

export default function Loading() {
  return (
    <>
      {/* (A) 최상단 고정 유튜브식 오렌지 로딩 바 */}
      <div style={styles.topBarContainer}>
        <div style={styles.topBar}></div>
      </div>

      {/* (B) 가운데 텍스트 메시지 (원하시면 없애거나 스타일 바꿔주셔도 돼요) */}
      <div style={styles.container}>
        <p style={styles.text}>로딩 중입니다. 잠시만 기다려 주세요...</p>
      </div>

      {/* (C) 인라인 애니메이션 정의 */}
      <style>{`
        @keyframes loadingProgressBar {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
      `}</style>
    </>
  );
}

const styles = {
  // 로딩 바를 제외한 영역 컨테이너
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "40vh",
    backgroundColor: "#fff",
  },

  // (A) 오렌지 바를 담는 컨테이너: 화면 최상단 고정
  topBarContainer: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100%",
    height: "4px",
    // 우주끝급(!)으로 높여주는 zIndex
    zIndex: 999999999,
    backgroundColor: "white",
    overflow: "hidden",
  },

  // 오렌지 바 (Tailwind 기준: orange-500 = #F97316)
  topBar: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F97316",
    animation: "loadingProgressBar 1.3s linear infinite",
  },

  // (B) 텍스트
  text: {
    fontSize: "14px",
    color: "#666",
  },
};