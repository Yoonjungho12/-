"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
// Supabase 클라이언트 (예시 경로: "@/lib/supabaseClient")
import { supabase } from "@/lib/supabaseF"; 

/**
 * 모바일 전용 마이페이지 UI 예시
 * 로그인 상태 => 닉네임, 로그아웃 버튼 노출
 * 비로그인 => "로그인을 해주세요", 로그인/회원가입 버튼 노출
 */
export default function MyMobileUI() {
  const router = useRouter();

  // (1) 로그인 세션 & 닉네임 상태
  const [session, setSession] = useState(null);
  const [nickname, setNickname] = useState("...");

  // (2) 마운트 시 세션 & 프로필(닉네임) 가져오기
  useEffect(() => {
    async function fetchUser() {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("Session Error:", sessionError);
      }

      // 세션 저장
      setSession(session);

      // 로그인된 유저인 경우 → profiles 테이블에서 nickname 불러오기
      if (session?.user) {
        try {
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("nickname")
            .eq("user_id", session.user.id)
            .single();

          if (profileError) {
            console.error("Profile Error:", profileError);
          } else if (profile?.nickname) {
            setNickname(profile.nickname);
          }
        } catch (err) {
          console.error("Unknown Error:", err);
        }
      }
    }

    fetchUser();
  }, []);

  // (3) 로그인 여부
  const isLoggedIn = !!session?.user;

  // (4) 로그아웃 / 로그인 / 회원가입 핸들러
  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout Error:", error);
      return;
    }
    setSession(null); // 세션 제거
  }

  function handleLogin() {
    // 예: /login 페이지로 이동
    router.push("/login");
  }

  function handleSignup() {
    // 예: /signup 페이지로 이동
    router.push("/signup");
  }

  // (5) "가고싶다" 목록 예시
  const [wishList, setWishList] = useState([
    { id: 1, title: "평택 고덕 [나인스웨디시] 내상ZERO 젊은한국인..." },
  ]);

  function handleRemoveWish(id) {
    setWishList((prev) => prev.filter((item) => item.id !== id));
  }

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
        {/* 왼쪽: 프로필 or "로그인을 해주세요" */}
        {isLoggedIn ? (
          <div style={{ display: "flex", alignItems: "center" }}>
            {/* 아바타 동그라미 (임시) */}
            <div
              style={{
                width: "50px",
                height: "50px",
                borderRadius: "50%",
                backgroundColor: "#444",
                marginRight: "12px",
              }}
            />
            <div style={{ fontSize: "1rem", fontWeight: "bold" }}>{nickname}</div>
          </div>
        ) : (
          <div style={{ fontSize: "1rem", fontWeight: "bold", color: "#666" }}>
            로그인을 해주세요
          </div>
        )}

        {/* 오른쪽: 정보수정 / 로그아웃 or 로그인 / 회원가입 */}
        {isLoggedIn ? (
          <div>
            <button
              style={{
                marginRight: "10px",
                background: "none",
                border: "none",
                fontSize: "0.9rem",
                cursor: "pointer",
              }}
              onClick={() => alert("정보수정 버튼 클릭! (예시)")}
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
              onClick={handleLogout}
            >
              로그아웃
            </button>
          </div>
        ) : (
          <div>
            <button
              style={{
                marginRight: "10px",
                background: "none",
                border: "1px solid #ccc",
                fontSize: "0.9rem",
                cursor: "pointer",
                borderRadius: "4px",
                padding: "3px 8px",
              }}
              onClick={handleLogin}
            >
              로그인
            </button>
            <button
              style={{
                background: "none",
                border: "1px solid #ccc",
                fontSize: "0.9rem",
                cursor: "pointer",
                borderRadius: "4px",
                padding: "3px 8px",
              }}
              onClick={handleSignup}
            >
              회원가입
            </button>
          </div>
        )}
      </div>

      {/* 구분선 */}
      <hr style={{ border: "none", borderTop: "1px solid #eee" }} />

      {/* 2x2 그리드 메뉴 (예시: 5개 버튼) */}
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
        <div
          style={{
            color: "#f9665e",
            fontWeight: "bold",
            marginBottom: "0.5rem",
          }}
        >
          가고싶다
        </div>
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

// 공통 버튼 스타일
const menuButtonStyle = {
  display: "inline-block",
  padding: "0.8rem",
  fontSize: "0.9rem",
  backgroundColor: "#f9f9f9",
  border: "none",
  textAlign: "left",
  cursor: "pointer",
};