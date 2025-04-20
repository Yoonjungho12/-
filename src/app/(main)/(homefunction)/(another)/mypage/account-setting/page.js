"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseF";

export default function AccountSettingPage() {
  const router = useRouter();

  // 세션, 프로필 상태
  const [session, setSession] = useState(null);
  const [provider, setProvider] = useState("");
  const [nickname, setNickname] = useState("");

  // 닉네임 수정 모드
  const [isEditingNickname, setIsEditingNickname] = useState(false);
  const [editNicknameInput, setEditNicknameInput] = useState("");

  // 탈퇴 모달 표시
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    async function init() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Session Error:", error);
      }
      setSession(session);

      if (session?.user) {
        const userProvider = session.user.app_metadata?.provider ?? "email";
        setProvider(userProvider);

        try {
          const { data: profile, error: profileErr } = await supabase
            .from("profiles")
            .select("nickname")
            .eq("user_id", session.user.id)
            .maybeSingle();
          if (profileErr) {
            console.error("Profile Error:", profileErr);
          } else if (profile?.nickname) {
            setNickname(profile.nickname);
          }
        } catch (err) {
          console.error("Unknown Error:", err);
        }
      }
    }
    init();
  }, []);

  const isLoggedIn = !!session?.user;

  // 로그아웃
  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout Error:", error);
      return;
    }
    router.push("/");
  }

  // 닉네임 수정
  function handleEditNickname() {
    setEditNicknameInput(nickname);
    setIsEditingNickname(true);
  }
  function handleCancelEdit() {
    setIsEditingNickname(false);
    setEditNicknameInput("");
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
        alert("닉네임 변경 실패!");
        console.error("Nickname Update Error:", error);
        return;
      }
      setNickname(newNick);
      setIsEditingNickname(false);
      alert("닉네임이 변경되었습니다!");
    } catch (err) {
      alert("오류가 발생했습니다.");
      console.error("Unknown Error:", err);
    }
  }

  // 비밀번호 변경
  function handleChangePassword() {
    router.push("/change-password");
  }

  // 모달 열기
  function handleDeleteAccountClick() {
    setShowDeleteModal(true);
  }

  // ★★ 탈퇴 + 세션 해제 로직 ★★
  async function handleConfirmDelete() {
    if (!session?.user) {
      alert("로그인 상태가 아닙니다.");
      return;
    }

    const userId = session.user.id;

    try {
      // 1) 서버 측으로 삭제 요청
      const res = await fetch("/api/withdrawal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const result = await res.json();

      if (!res.ok) {
        // 서버 에러
        alert("회원 탈퇴 실패: " + (result.message || "Unknown Error"));
        return;
      }

      // 2) 회원 삭제가 성공했으므로, 로컬 세션도 정리
      await supabase.auth.signOut();

      // 3) 알림 + 홈으로 이동
      alert("계정 탈퇴가 완료되었습니다. 이용해주셔서 감사합니다!");
      router.push("/");
    } catch (err) {
      alert("오류 발생: " + err.message);
      console.error("회원 탈퇴 중 오류:", err);
    }
  }

  function handleCancelDelete() {
    setShowDeleteModal(false);
  }

  // 모달 오버레이
  function handleOverlayClick() {
    setShowDeleteModal(false);
  }
  // 모달 내부 클릭
  function handleModalContentClick(e) {
    e.stopPropagation();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100">
      <div className="max-w-[600px] mx-auto p-4 md:p-8">
        <h1 className="text-2xl font-bold mb-8 text-gray-900">계정 설정</h1>

        {!isLoggedIn ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <p className="text-gray-600">로그인 상태가 아닙니다.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 프로필 이미지 */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="w-24 h-24 mx-auto mb-6">
                <div className="w-full h-full bg-gradient-to-br from-orange-400 to-orange-500 rounded-[24px] flex items-center justify-center shadow-lg">
                  <span className="text-4xl font-bold text-white">
                    {nickname[0]?.toUpperCase() || '?'}
                  </span>
                </div>
              </div>

              {/* 닉네임/이메일 */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-600">닉네임</label>
                  {!isEditingNickname ? (
                    <div className="flex items-center justify-between bg-neutral-50 p-3 rounded-xl">
                      <span className="text-gray-900">{nickname || "닉네임 없음"}</span>
                      <button
                        onClick={handleEditNickname}
                        className="text-sm text-orange-500 hover:text-orange-600 font-medium"
                      >
                        수정
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="relative">
                        <input
                          type="text"
                          value={editNicknameInput}
                          onChange={(e) => setEditNicknameInput(e.target.value)}
                          maxLength={30}
                          className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                          {editNicknameInput.length}/30자
                        </span>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={handleCancelEdit}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-neutral-100 rounded-xl hover:bg-neutral-200 transition-colors"
                        >
                          취소
                        </button>
                        <button
                          onClick={handleUpdateNickname}
                          className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all"
                        >
                          저장하기
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                <div className="bg-neutral-50 p-3 rounded-xl">
                  <p className="text-sm text-gray-600">{session.user.email}</p>
                </div>
              </div>
            </div>

            {/* 비밀번호 변경 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">비밀번호 변경</span>
                <button
                  onClick={handleChangePassword}
                  className="text-sm text-orange-500 hover:text-orange-600 font-medium"
                >
                  수정
                </button>
              </div>
            </div>

            {/* 기타 정보 관리 */}
            <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
              <button
                onClick={() => alert("개인 정보 관리 페이지로 이동")}
                className="w-full flex items-center justify-between p-3 text-left rounded-xl hover:bg-neutral-50 transition-colors group"
              >
                <span className="font-medium text-gray-900">개인 정보 관리</span>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <button
                onClick={() => alert("맞춤 정보 설정 페이지로 이동")}
                className="w-full flex items-center justify-between p-3 text-left rounded-xl hover:bg-neutral-50 transition-colors group"
              >
                <span className="font-medium text-gray-900">내 맞춤 정보 설정</span>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* 하단: 로그아웃 | 회원 탈퇴 */}
            <div className="flex justify-between items-center mt-6">
              <button 
                onClick={handleLogout}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
              >
                로그아웃
              </button>
              <button
                onClick={handleDeleteAccountClick}
                className="text-sm font-medium text-red-500 hover:text-red-600 transition-colors"
              >
                회원 탈퇴
              </button>
            </div>
          </div>
        )}

        {/* 회원 탈퇴 모달 */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={handleOverlayClick}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

            <div
              onClick={handleModalContentClick}
              className="relative bg-white p-8 rounded-2xl shadow-lg w-[320px] mx-4"
            >
              <h2 className="text-xl font-bold text-gray-900 mb-3">
                정말 여기닷을 떠나실 건가요?
              </h2>
              <p className="text-sm text-gray-600 mb-8">
                계정 탈퇴 시 모든 개인정보가 삭제됩니다.
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleCancelDelete}
                  className="w-full py-3 text-white font-medium bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl hover:from-orange-600 hover:to-orange-700 transition-all"
                >
                  다시 생각해볼게요
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="w-full py-3 font-medium text-gray-700 bg-neutral-100 rounded-xl hover:bg-neutral-200 transition-colors"
                >
                  계정 탈퇴
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 모달 밖 클릭 시 닫기
function handleOverlayClick() {
  setShowDeleteModal(false);
}
// 모달 내부 클릭은 막기
function handleModalContentClick(e) {
  e.stopPropagation();
}