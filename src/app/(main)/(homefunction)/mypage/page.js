"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseF"; // Supabase 클라이언트

export default function MyMobileUI() {
  const router = useRouter();

  // 로그인 세션 & 닉네임 상태
  const [session, setSession] = useState(null);
  const [nickname, setNickname] = useState("...");

  // “정보수정” 모드인지 여부
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  // 수정용 인풋 값
  const [editNicknameInput, setEditNicknameInput] = useState("");

  // "가고싶다" 목록 (DB에서 가져온 데이터)
  const [wishList, setWishList] = useState([]);

  // 마운트 시 세션 & 프로필(닉네임) 가져오기
  useEffect(() => {
    async function fetchUser() {
      // 1) 세션 확인
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) {
        console.error("Session Error:", sessionError);
      }
      setSession(session);

      // 2) 닉네임 불러오기
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

  // 로그인 여부
  const isLoggedIn = !!session?.user;

  // 세션 확인 후 "가고싶다" 목록 가져오기
  useEffect(() => {
    if (!isLoggedIn) {
      setWishList([]);
      return;
    }

    async function fetchWishList() {
      try {
        // wantToGo 테이블에서 user_id가 현재 로그인한 유저인 것만 조회
        // 그리고 partnershipsubmit 테이블의 company_name도 함께 가져오기
        const { data, error } = await supabase
          .from("wantToGo")
          .select(`
            id,
            partnershipsubmit_id,
            partnershipsubmit:partnershipsubmit_id (
              company_name
            )
          `)
          .eq("user_id", session.user.id);

        if (error) {
          console.error("WishList Fetch Error:", error);
          return;
        }
        // 조회된 데이터를 state에 저장
        setWishList(data || []);
      } catch (err) {
        console.error("Unknown Error:", err);
      }
    }

    if (session?.user?.id) {
      fetchWishList();
    }
  }, [isLoggedIn, session]);

  // 로그아웃
  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout Error:", error);
      return;
    }
    setSession(null); // 세션 제거
  }

  // 로그인 페이지 이동
  function handleLogin() {
    router.push("/login");
  }

  // 회원가입 페이지 이동
  function handleSignup() {
    router.push("/signup");
  }

  // "가고싶다" 항목 삭제
  async function handleRemoveWish(id) {
    try {
      // DB에서 해당 id 레코드 삭제
      const { error } = await supabase.from("wantToGo").delete().eq("id", id);
      if (error) {
        console.error("Wish Delete Error:", error);
        return;
      }
      // 로컬 state에서도 제거
      setWishList((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Unknown Error:", err);
    }
  }

  // ─────────────────────────────────────────────
  // [정보수정] 버튼 → 수정모드로 전환
  // ─────────────────────────────────────────────
  function handleEditNickname() {
    // 기존 nickname을 수정용 인풋에 세팅
    setEditNicknameInput(nickname);
    setIsEditingNickname(true);
  }

  // ─────────────────────────────────────────────
  // [변경하기] 버튼 → DB에 닉네임 업데이트
  // ─────────────────────────────────────────────
  async function handleUpdateNickname() {
    if (!session?.user?.id) {
      alert("로그인이 필요합니다.");
      return;
    }
    const newNick = editNicknameInput.trim();
    if (!newNick) {
      alert("닉네임은 비어있을 수 없습니다.");
      return;
    }

    // DB 업데이트
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({ nickname: newNick })
        .eq("user_id", session.user.id);

      if (error) {
        console.error("Nickname Update Error:", error);
        alert("닉네임 변경 실패!");
        return;
      }

      // state에 반영
      setNickname(newNick);
      setIsEditingNickname(false);
      alert("닉네임이 변경되었습니다!");
    } catch (err) {
      console.error("Unknown Error:", err);
      alert("오류가 발생했습니다.");
    }
  }

  // [취소하기] 버튼 → 수정모드 취소
  function handleCancelEdit() {
    setIsEditingNickname(false);
    setEditNicknameInput("");
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
            <div style={{ fontSize: "1rem", fontWeight: "bold" }}>
              {nickname}
            </div>
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
              onClick={handleEditNickname}
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

      {/* 닉네임 수정모드일 때 인풋 표시 */}
      {isEditingNickname && (
        <div style={{ marginBottom: "1rem" }}>
          <input
            type="text"
            value={editNicknameInput}
            onChange={(e) => setEditNicknameInput(e.target.value)}
            style={{
              width: "150px",
              marginRight: "8px",
              border: "1px solid #ccc",
              padding: "4px 6px",
            }}
          />
          <button
            onClick={handleUpdateNickname}
            style={{
              marginRight: "5px",
              backgroundColor: "#4CAF50",
              border: "none",
              color: "#fff",
              padding: "4px 8px",
              cursor: "pointer",
            }}
          >
            변경
          </button>
          <button
            onClick={handleCancelEdit}
            style={{
              backgroundColor: "#ccc",
              border: "none",
              color: "#333",
              padding: "4px 8px",
              cursor: "pointer",
            }}
          >
            취소
          </button>
        </div>
      )}

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
        <Link href='/messages' style={menuButtonStyle}>내 쪽지함 &gt;</Link>
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
        {wishList.length === 0 ? (
          <div style={{ fontSize: "0.9rem", color: "#666" }}>
            {isLoggedIn ? "가고싶다 목록이 비어있습니다." : "로그인 후 이용해주세요."}
          </div>
        ) : (
          wishList.map((wish) => (
            <div
              key={wish.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.5rem",
              }}
            >
              {/* partnershipsubmit_id 테이블의 company_name 표시 */}
              <div style={{ fontSize: "0.9rem" }}>
                {wish.partnershipsubmit?.company_name || "알 수 없는 업체"}
              </div>

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
          ))
        )}
      </div>

      {/* 구분선 */}
      <hr
        style={{
          border: "none",
          borderTop: "1px solid #eee",
          margin: "1rem 0",
        }}
      />

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