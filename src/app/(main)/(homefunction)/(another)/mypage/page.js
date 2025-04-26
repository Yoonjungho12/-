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
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      {/* PC 환경에서는 좌측 프로필, 우측 컨텐츠 구조 */}
      <div className="w-full max-w-[1280px] mx-auto p-4 md:p-8 lg:py-12">
        <div className="lg:flex lg:gap-8">
          {/* 좌측: 프로필 섹션 (PC에서는 고정) */}
          <div className="lg:w-[320px] lg:flex-shrink-0">
            <div className="sticky top-8">
              {/* 프로필 카드 */}
              <div className="bg-white rounded-2xl p-6 shadow-sm mb-4 lg:mb-6">
                <div className="flex flex-col items-center text-center lg:py-4">
                  {/* 아바타 */}
                  <div className="w-24 h-24 lg:w-32 lg:h-32 bg-gradient-to-br from-orange-400 to-orange-500 rounded-[24px] flex items-center justify-center mb-4 lg:mb-6 shadow-lg">
                    {isLoggedIn ? (
                      <span className="text-4xl lg:text-5xl font-bold text-white">
                        {nickname[0]?.toUpperCase() || '?'}
                      </span>
                    ) : (
                      <svg className="w-12 h-12 lg:w-16 lg:h-16 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    )}
                  </div>

                  {/* 프로필 정보 */}
                  {isLoggedIn ? (
                    <div className="w-full">
                      <div className="text-2xl font-bold text-gray-900 mb-1">{nickname}</div>
                      <div className="text-sm text-gray-500 mb-6">{session.user?.email}</div>
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={handleEditNickname}
                          className="w-full px-5 py-2.5 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium hover:from-orange-600 hover:to-orange-700 transition-all"
                        >
                          계정설정
                        </button>
                        <button
                          onClick={handleLogout}
                          className="w-full px-5 py-2.5 bg-white text-red-600 rounded-xl font-medium border border-neutral-200 hover:bg-red-50 hover:border-red-200 transition-all"
                        >
                          로그아웃
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full">
                      <div className="text-xl font-bold text-gray-900 mb-6">
                        로그인을 해주세요
                      </div>
                      <button
                        onClick={handleLogin}
                        className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-medium hover:from-orange-600 hover:to-orange-700 transition-all"
                      >
                        로그인
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 고객센터 섹션 - PC에서는 프로필 아래에 위치 */}
              <div className="hidden lg:block bg-white rounded-2xl p-6 shadow-sm">
                <div className="font-bold text-xl mb-6 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-neutral-50">
                    <svg className="w-5 h-5 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  </div>
                  <span className="text-gray-900">고객센터</span>
                </div>
                <div className="space-y-4">
                  {[
                    {
                      icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
                      text: "평일 오전 9:30~18:00"
                    },
                    {
                      icon: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
                      text: "010-2117-7392 (문자문의)"
                    }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3 group">
                      <div className="p-2 rounded-lg bg-neutral-50 text-neutral-600 group-hover:bg-neutral-100 transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                        </svg>
                      </div>
                      <span className="text-gray-600 group-hover:text-gray-900 transition-colors">
                        {item.text}
                      </span>
                    </div>
                  ))}
                  <a
                    href="https://open.kakao.com/o/sF0jBaqh"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#FEE500] hover:bg-[#FFE000] transition-colors shadow-sm hover:shadow"
                  >
                    <img 
                      src="/icons/kakao.svg" 
                      alt="카카오톡" 
                      className="w-5 h-5"
                    />
                    <span className="text-[#3C1E1E] font-medium">
                      카카오톡 1:1 상담 입점문의
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* 우측: 메인 컨텐츠 */}
          <div className="flex-1 lg:mt-0 mt-6">
            {/* 메뉴 섹션 */}
            <div className="space-y-8">
              {/* 메뉴 그리드 */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  {
                    icon: "M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z",
                    label: "1:1 채팅",
                    onClick: () => router.push("/messages")
                  },
                  {
                    icon: "M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z",
                    label: "내 댓글",
                    onClick: () => router.push("/mypage/myComments")
                  },
                  {
                    icon: "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H15",
                    label: "내 커뮤니티 게시글",
                    onClick: () => router.push("/mypage/myCommunityPosts")
                  },
                  {
                    icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
                    label: "제휴신청",
                    onClick: () => router.push("/partnership")
                  }
                ].map((menu, index) => (
                  <button
                    key={index}
                    onClick={menu.onClick}
                    className="group bg-white p-6 rounded-xl shadow-sm hover:shadow transition-all"
                  >
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-3 rounded-lg bg-orange-50 text-orange-600 group-hover:bg-orange-100 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={menu.icon} />
                        </svg>
                      </div>
                      <span className="font-medium text-neutral-900">
                        {menu.label}
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {/* 가고싶다 섹션 */}
              <div className="bg-white rounded-2xl p-6 shadow-sm">
                <div className="font-bold text-xl mb-6 flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-neutral-50">
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <span className="text-gray-900">여기닷</span>
                </div>
                {wishList.length === 0 ? (
                  <div className="text-sm text-gray-500 bg-neutral-50 rounded-xl p-6 text-center">
                    {isLoggedIn ? "여기닷 목록이 비어있습니다." : "로그인 후 이용해주세요."}
                  </div>
                ) : (
                  <div className="grid gap-2 lg:grid-cols-2">
                    {wishList.map((wish) => (
                      <div key={wish.id} 
                        className="group flex items-center justify-between p-4 rounded-xl bg-neutral-50 hover:bg-neutral-100 transition-colors"
                      >
                        <button
                          onClick={() => handleWishClick(wish.partnershipsubmit_id)}
                          className="text-gray-700 hover:text-orange-600 transition-colors text-left flex-1"
                        >
                          {wish.partnershipsubmit?.company_name || "알 수 없는 업체"}
                        </button>
                        <button
                          onClick={() => handleRemoveWish(wish.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 모바일: 고객센터 섹션 */}
      <div className="lg:hidden mt-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="font-bold text-xl mb-6 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-neutral-50">
              <svg className="w-5 h-5 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <span className="text-gray-900">고객센터</span>
          </div>
          <div className="space-y-4">
            {[
              {
                icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
                text: "평일 오전 9:30~18:00"
              },
              {
                icon: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
                text: "010-2117-7392 (문자문의)"
              }
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3 group">
                <div className="p-2 rounded-lg bg-neutral-50 text-neutral-600 group-hover:bg-neutral-100 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon} />
                  </svg>
                </div>
                <span className="text-gray-600 group-hover:text-gray-900 transition-colors">
                  {item.text}
                </span>
              </div>
            ))}
            <a
              href="https://open.kakao.com/o/sF0jBaqh"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 p-3 rounded-xl bg-[#FEE500] hover:bg-[#FFE000] transition-colors shadow-sm hover:shadow"
            >
              <img 
                src="/icons/kakao.svg" 
                alt="카카오톡" 
                className="w-5 h-5"
              />
              <span className="text-[#3C1E1E] font-medium">
                카카오톡 1:1 상담 입점문의
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// 메뉴 카드 컴포넌트
function MenuCard({ icon, label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-xl bg-neutral-50 p-6 hover:bg-neutral-100 transition-colors"
    >
      <div className="flex flex-col items-center gap-4">
        <div className="p-3 rounded-lg bg-white shadow-sm group-hover:shadow transition-shadow">
          <svg className="w-6 h-6 text-neutral-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={icon} />
          </svg>
        </div>
        <span className="font-medium text-neutral-900">
          {label}
        </span>
      </div>
    </button>
  );
}