"use client"; // Next.js 13 Client Component 예시
import { useState } from "react";

export default function MyMobilePage() {
  // "가고싶다" 목록 예시 (임시 데이터)
  const [wishList, setWishList] = useState([
    { id: 1, title: "평택 고덕 [나인스웨디시] 내상ZERO 젊은한국인..." },
  ]);

  const handleRemoveWish = (id) => {
    setWishList((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div
      style={{
        maxWidth: "480px",
        margin: "0 auto",
        padding: "1rem",
        backgroundColor: "#fff",
        minHeight: "100vh",
        boxSizing: "border-box",
      }}
    >
      {/* 상단 프로필 영역 */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        {/* 왼쪽: 아바타 + 이름 */}
        <div style={{ display: "flex", alignItems: "center" }}>
          {/* 아바타 동그라미 */}
          <div
            style={{
              width: "50px",
              height: "50px",
              borderRadius: "50%",
              backgroundColor: "#444",
              marginRight: "12px",
            }}
          />
          <div style={{ fontSize: "1rem", fontWeight: "bold" }}>이민제</div>
        </div>

        {/* 오른쪽: 정보수정 / 로그아웃 */}
        <div>
          <button
            style={{
              marginRight: "10px",
              background: "none",
              border: "none",
              fontSize: "0.9rem",
              cursor: "pointer",
            }}
          >
            정보수정
          </button>
          <button
            style={{
              background: "none",
              border: "none",
              fontSize: "0.9rem",
              cursor: "pointer",
            }}
          >
            로그아웃
          </button>
        </div>
      </div>

      {/* 구분선 */}
      <hr style={{ border: "none", borderTop: "1px solid #eee" }} />

      {/* 2x2 그리드 메뉴 (5개 버튼) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "10px",
          marginTop: "1rem",
        }}
      >
        <button style={menuButtonStyle}>내 쪽지함 &gt;</button>
        <button style={menuButtonStyle}>제휴신청 &gt;</button>
        <button style={menuButtonStyle}>내 글 관리 &gt;</button>
        <button style={menuButtonStyle}>가고싶다 &gt;</button>
        <button style={menuButtonStyle}>연락내역 &gt;</button>
      </div>

      {/* 가고싶다 목록 */}
      <div style={{ marginTop: "1.5rem" }}>
        {/* 타이틀 */}
        <div
          style={{
            color: "#f9665e",
            fontWeight: "bold",
            marginBottom: "0.5rem",
          }}
        >
          가고싶다
        </div>

        {/* 목록 */}
        {wishList.map((wish) => (
          <div
            key={wish.id}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "0.5rem",
            }}
          >
            <div style={{ fontSize: "0.9rem" }}>{wish.title}</div>
            <button
              onClick={() => handleRemoveWish(wish.id)}
              style={{
                background: "none",
                border: "none",
                color: "#f00",
                fontSize: "1rem",
                cursor: "pointer",
              }}
            >
              X
            </button>
          </div>
        ))}
      </div>

      {/* 구분선 */}
      <hr style={{ border: "none", borderTop: "1px solid #eee", margin: "1rem 0" }} />

      {/* 고객센터 영역 */}
      <div>
        <div
          style={{
            fontSize: "1rem",
            fontWeight: "bold",
            marginBottom: "0.5rem",
          }}
        >
          고객센터
        </div>
        <div style={{ fontSize: "0.9rem", lineHeight: "1.5" }}>
          <div>평일 오전 9:30~18:00</div>
          <div>0504-1361-3000 (문자문의)</div>
          <div>카톡 1:1상담 입점문의</div>
        </div>
      </div>
    </div>
  );
}

// 메뉴 버튼 공통 스타일
const menuButtonStyle = {
  display: "inline-block",
  padding: "0.8rem",
  fontSize: "0.9rem",
  backgroundColor: "#f9f9f9",
  border: "none",
  textAlign: "left",
  cursor: "pointer",
};