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

  // “정보수정” 모드 여부
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  // 수정용 인풋 값
  const [editNicknameInput, setEditNicknameInput] = useState("");

  // "가고싶다" 목록 (DB에서 가져온 데이터)
  const [wishList, setWishList] = useState([]);

  // --------------------------------------
  // (1) 세션 & 프로필 불러오기
  // --------------------------------------
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

  // --------------------------------------
  // (2) "가고싶다" 목록 불러오기
  // --------------------------------------
  useEffect(() => {
    if (!isLoggedIn) {
      setWishList([]);
      return;
    }

    async function fetchWishList() {
      try {
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
        setWishList(data || []);
      } catch (err) {
        console.error("Unknown Error:", err);
      }
    }

    if (session?.user?.id) {
      fetchWishList();
    }
  }, [isLoggedIn, session]);

  // --------------------------------------
  // (3) 로그아웃
  // --------------------------------------
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

  // ─────────────────────────────────────────
  // (4) "가고싶다" 항목 삭제
  // ─────────────────────────────────────────
  async function handleRemoveWish(id) {
    try {
      const { error } = await supabase.from("wantToGo").delete().eq("id", id);
      if (error) {
        console.error("Wish Delete Error:", error);
        return;
      }
      setWishList((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Unknown Error:", err);
    }
  }

  // ─────────────────────────────────────────
  // (5) 닉네임 수정
  // ─────────────────────────────────────────
  function handleEditNickname() {
    setEditNicknameInput(nickname);
    setIsEditingNickname(true);
  }

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

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ nickname: newNick })
        .eq("user_id", session.user.id);

      if (error) {
        console.error("Nickname Update Error:", error);
        alert("닉네임 변경 실패!");
        return;
      }

      setNickname(newNick);
      setIsEditingNickname(false);
      alert("닉네임이 변경되었습니다!");
    } catch (err) {
      console.error("Unknown Error:", err);
      alert("오류가 발생했습니다.");
    }
  }

  function handleCancelEdit() {
    setIsEditingNickname(false);
    setEditNicknameInput("");
  }

  // ─────────────────────────────────────────
  // (6) "가고싶다" 목록 클릭 → board/details/[id]
  // ─────────────────────────────────────────
  function handleWishClick(partnershipsubmitId) {
    router.push(`/board/details/${partnershipsubmitId}`);
  }

  // ------------------------------------------
  // UI
  // ------------------------------------------
  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "0 auto",
        padding: "1.5rem",
        backgroundColor: "#fff",
        boxSizing: "border-box",
      }}
    >
      {/* (A) 헤더 영역 */}
      <h2 style={{ fontSize: "1.5rem", marginBottom: "3rem", marginTop:'1rem',fontWeight: "bold" }}>
        마이페이지
      </h2>

      {/* 프로필 */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: "1.5rem" }}>
        {/* 임시 아바타 */}
        <div
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            backgroundColor: "#eee",
            marginRight: "1rem",
          }}
        />
        <div>
          {isLoggedIn ? (
            <>
              <div style={{ fontSize: "1.2rem", fontWeight: "bold", marginBottom: "0.3rem" }}>
                {nickname}
              </div>
              <div style={{ fontSize: "0.9rem", color: "#666" }}>
                {session.user?.email || ""}
              </div>
            </>
          ) : (
            <div style={{ fontSize: "1rem", fontWeight: "bold", color: "#666" }}>
              로그인을 해주세요
            </div>
          )}
        </div>

        {/* 오른쪽 계정설정 or 로그인 */}
        <div style={{ marginLeft: "auto" }}>
          {isLoggedIn ? (
            <button
              style={{
                background: "#eee",
                border: "none",
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "0.85rem",
                cursor: "pointer",
              }}
              onClick={handleEditNickname}
            >
              계정설정
            </button>
          ) : (
            <button
              style={{
                background: "#eee",
                border: "none",
                padding: "4px 8px",
                borderRadius: "4px",
                fontSize: "0.85rem",
                cursor: "pointer",
              }}
              onClick={handleLogin}
            >
              로그인
            </button>
          )}
        </div>
      </div>

      {/* 닉네임 수정모드 */}
      {isEditingNickname && (
        <div style={{ marginBottom: "1.5rem" }}>
          <input
            type="text"
            value={editNicknameInput}
            onChange={(e) => setEditNicknameInput(e.target.value)}
            style={{
              width: "200px",
              marginRight: "8px",
              border: "1px solid #ccc",
              padding: "6px",
            }}
          />
          <button
            onClick={handleUpdateNickname}
            style={{
              marginRight: "5px",
              backgroundColor: "#4CAF50",
              border: "none",
              color: "#fff",
              padding: "6px 12px",
              cursor: "pointer",
              borderRadius: "4px",
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
              padding: "6px 12px",
              cursor: "pointer",
              borderRadius: "4px",
            }}
          >
            취소
          </button>
        </div>
      )}

      <hr style={{ borderTop: "1px solid #ddd", marginBottom: "1.5rem" }} />

      {/* (B) 메뉴 목록 (수직으로) */}
      <div>
        <MenuItem
          label="1:1 채팅"
          onClick={() => router.push("/messages")}
        />
     <MenuItem
          label="내 댓글"
          onClick={() => router.push("/mypage/myComments")}
        />
        <MenuItem
          label="내 커뮤니티 게시글"
          onClick={() => router.push("/mypage/myCommunityPosts")}
        />
        
           <MenuItem
          label="제휴신청"
          onClick={() => router.push("/partnership")}
        />
      </div>

      <hr style={{ borderTop: "1px solid #ddd", margin: "1.5rem 0" }} />

      {/* (C) 가고싶다 목록 */}
      <div>
        <div
          style={{
            fontWeight: "bold",
            fontSize: "1.1rem",
            marginBottom: "0.5rem",
            color: "#f9665e",
          }}
        >
          가고싶다
        </div>
        {wishList.length === 0 ? (
          <div style={{ fontSize: "0.9rem", color: "#666" }}>
            {isLoggedIn
              ? "가고싶다 목록이 비어있습니다."
              : "로그인 후 이용해주세요."}
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
              <button
                onClick={() => handleWishClick(wish.partnershipsubmit_id)}
                style={{
                  fontSize: "0.9rem",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  textAlign: "left",
                  textDecoration: "underline",
                }}
              >
                {wish.partnershipsubmit?.company_name || "알 수 없는 업체"}
              </button>

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

      <hr style={{ borderTop: "1px solid #ddd", margin: "1.5rem 0" }} />

      {/* (D) 고객센터 영역 */}
      <div>
        <div
          style={{
            fontSize: "1.1rem",
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

/* ------------------------------------------
   공통 메뉴 아이템 (수직 나열)
   label: 버튼 제목
   onClick: 클릭 시 동작
------------------------------------------ */
function MenuItem({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "1rem 0",
        background: "none",
        border: "none",
        borderBottom: "1px solid #eee",
        fontSize: "1rem",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}