"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseF";

export default function MyMobileUI() {
  const router = useRouter();

  const [session, setSession] = useState(null);
  const [nickname, setNickname] = useState("...");

  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [editNicknameInput, setEditNicknameInput] = useState("");

  const [wishList, setWishList] = useState([]);

  // (A) 초기 세션/프로필 로딩
  useEffect(() => {
    async function fetchUser() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();
      if (error) {
        console.error("Session Error:", error);
      }
      setSession(session);

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

  const isLoggedIn = !!session?.user;

  // (B) 가고싶다 목록 로딩
  useEffect(() => {
    if (!isLoggedIn) {
      setWishList([]);
      return;
    }
    async function fetchWishList() {
      try {
        const { data, error } = await supabase
          .from("wantToGo")
          .select(
            `id,
             partnershipsubmit_id,
             partnershipsubmit:partnershipsubmit_id (
               company_name
             )`
          )
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

  // (C) 로그아웃
  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout Error:", error);
      return;
    }
    setSession(null);
  }

  // (C-2) 로그인/회원가입 버튼 핸들러
  function handleLogin() {
    router.push("/login");
  }
  function handleSignup() {
    router.push("/signup");
  }

  // (D) 가고싶다 목록 제거
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

  // (E) 계정설정 버튼 -> /mypage/account-setting 이동
  function handleEditNickname() {
    router.push("/mypage/account-setting");
  }

  // (F) 닉네임 수정(실제 로직은 account-setting 페이지에서 이뤄짐)
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

  // (G) 가고싶다 목록 -> 상세페이지 이동
  function handleWishClick(partnershipsubmitId) {
    router.push(`/board/details/${partnershipsubmitId}`);
  }

  return (
    <div className="max-w-[600px] mx-auto p-6 bg-white box-border">
      {/* 헤더 */}
      <h2 className="text-2xl hidden md:block font-bold md:mt-4 md:mb-12">
        마이페이지
      </h2>

      {/* 프로필 영역 */}
      <div className="flex items-center mb-6">
        {/* 아바타 */}
        <div className="w-[60px] h-[60px] bg-gray-300 rounded-full" />

        {/* 프로필 텍스트 */}
        <div className="ml-4 flex-1">
          {isLoggedIn ? (
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3">
              <div className="flex-1">
                <div className="text-lg font-bold mb-1">{nickname}</div>
                <div className="text-sm text-gray-600">
                  {session.user?.email || ""}
                </div>
              </div>
              <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                <button
                  onClick={handleEditNickname}
                  className="bg-gray-200 text-sm px-3 py-1 rounded"
                >
                  계정설정
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-gray-200 text-sm px-3 py-1 rounded"
                >
                  로그아웃
                </button>
              </div>
            </div>
          ) : (
            // 로그인 안 됨 -> 안내 + "로그인" 버튼
            <div className="flex justify-between space-x-2">
              <div className="text-base font-bold text-gray-600">
                로그인을 해주세요
              </div>
              <button
                onClick={handleLogin}
                className="bg-gray-200 text-sm px-3 py-1 rounded"
              >
                로그인
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 닉네임 수정모드 */}
      {isEditingNickname && (
        <div className="mb-6">
          <input
            type="text"
            value={editNicknameInput}
            onChange={(e) => setEditNicknameInput(e.target.value)}
            className="w-[200px] border border-gray-300 px-2 py-1 mr-2"
          />
          <button
            onClick={handleUpdateNickname}
            className="bg-green-500 text-white px-4 py-1 rounded mr-2"
          >
            변경
          </button>
          <button
            onClick={handleCancelEdit}
            className="bg-gray-300 px-4 py-1 rounded"
          >
            취소
          </button>
        </div>
      )}

      <hr className="border-t border-gray-300 mb-6" />

      {/* 메뉴 목록 (수직) */}
      <div className="flex flex-col space-y-1">
        <MenuItem label="1:1 채팅" onClick={() => router.push("/messages")} />
        <MenuItem
          label="내 댓글"
          onClick={() => router.push("/mypage/myComments")}
        />
        <MenuItem
          label="내 커뮤니티 게시글"
          onClick={() => router.push("/mypage/myCommunityPosts")}
        />
        <MenuItem label="제휴신청" onClick={() => router.push("/partnership")} />
      </div>

      <hr className="border-t border-gray-300 my-6" />

      {/* 가고싶다 목록 */}
      <div>
        <div className="font-bold text-lg mb-2 text-[#f9665e]">가고싶다</div>
        {wishList.length === 0 ? (
          <div className="text-sm text-gray-600">
            {isLoggedIn
              ? "가고싶다 목록이 비어있습니다."
              : "로그인 후 이용해주세요."}
          </div>
        ) : (
          <div className="space-y-2">
            {wishList.map((wish) => (
              <div key={wish.id} className="flex justify-between items-center">
                <button
                  onClick={() => handleWishClick(wish.partnershipsubmit_id)}
                  className="text-sm text-left underline"
                >
                  {wish.partnershipsubmit?.company_name || "알 수 없는 업체"}
                </button>
                <button
                  onClick={() => handleRemoveWish(wish.id)}
                  className="text-red-500 text-base"
                >
                  X
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <hr className="border-t border-gray-300 my-6" />

      {/* 고객센터 */}
      <div>
        <div className="text-lg font-bold mb-2">고객센터</div>
        <div className="text-sm leading-5 text-gray-700">
          <div>평일 오전 9:30~18:00</div>
          <div>0504-1361-3000 (문자문의)</div>
          <div>카톡 1:1상담 입점문의</div>
        </div>
      </div>
    </div>
  );
}

/** 공통 메뉴 아이템 컴포넌트 */
function MenuItem({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="
        w-full
        text-left
        py-3
        border-b
        border-gray-200
        text-base
        hover:bg-gray-100
      "
    >
      {label}
    </button>
  );
}