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

  // 비밀번호 재설정 메일 전송 박스 표시 여부
  const [showPwBox, setShowPwBox] = useState(false);

  // (1) 세션/프로필 로드
  useEffect(() => {
    async function init() {
      // 1) 현재 세션 가져오기
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) {
        console.error("Session Error:", error);
      }
      setSession(session);

      if (session?.user) {
        // provider 정보 확인 (email / google / etc.)
        const userProvider = session.user.app_metadata?.provider ?? "email";
        setProvider(userProvider);

        // profiles 테이블에서 닉네임 가져오기
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

  // (2) 로그아웃
  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout Error:", error);
      return;
    }
    router.push("/");
  }

  // (3) 닉네임 수정 로직
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

  // (4) 비밀번호 재설정 메일 전송
  function handleChangePassword() {
    if (provider !== "email") {
      // 소셜 로그인인 경우
      alert("소셜 로그인 회원은 비밀번호 변경이 불가능합니다.");
      return;
    }
    // 일반 가입(이메일) 회원이면 전송 박스 표시
    setShowPwBox(true);
  }

  async function sendPasswordResetEmail() {
    if (!session?.user?.email) {
      alert("유효한 이메일 정보를 찾을 수 없습니다.");
      return;
    }
    try {
      // 원하는 리디렉트 경로로 수정하셔도 됩니다.
      const { data, error } = await supabase.auth.resetPasswordForEmail(
        session.user.email,
        {
          redirectTo: `${window.location.origin}/mypage/account-setting/reset-password`,
        }
      );
      if (error) {
        alert("비밀번호 재설정 이메일 전송 실패: " + error.message);
        return;
      }
      alert("비밀번호 재설정 이메일을 보냈습니다!");
      setShowPwBox(false);
    } catch (err) {
      alert("오류 발생: " + err.message);
    }
  }

  return (
    <div className="max-w-[600px] mx-auto p-4 md:p-8">
      <h1 className="text-2xl font-bold mb-8">계정 설정</h1>

      {!isLoggedIn ? (
        <p className="text-gray-600">로그인 상태가 아닙니다.</p>
      ) : (
        <div className="space-y-6">
          {/* 아바타 + 카메라 아이콘 (임시) */}
          <div className="relative w-24 h-24 mx-auto">
            <div className="w-full h-full rounded-full bg-gray-300" />
            <div className="absolute bottom-0 right-0 bg-white rounded-full border p-1">
              <svg
                className="w-5 h-5 text-gray-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M4 5a2 2 0 012-2h.172a2 2 0 001.414-.586l.828-.828A2 2 0 0110.828 1H12a2 2 0 012 2v1h2a2 2 0 012 2v6a2 2 0 01-2 2h-3v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2H1a2 2 0 01-2-2V6a2 2 0 012-2h3zM5 10a1 1 0 102 0 1 1 0 00-2 0z" />
              </svg>
            </div>
          </div>

          {/* (A) 닉네임/이메일 표시 */}
          <div className="space-y-2">
            <label className="block text-gray-500">숨고 활동명</label>
            {!isEditingNickname ? (
              <div className="flex items-center justify-between">
                <span>{nickname || "닉네임 없음"}</span>
                <button
                  onClick={handleEditNickname}
                  className="text-sm text-purple-500"
                >
                  수정
                </button>
              </div>
            ) : (
              <div>
                <div className="relative mb-4">
                  <input
                    type="text"
                    value={editNicknameInput}
                    onChange={(e) => setEditNicknameInput(e.target.value)}
                    maxLength={30}
                    className="border border-gray-300 px-2 py-1 w-full rounded text-sm"
                  />
                  <span className="absolute right-2 top-1 text-gray-400 text-sm">
                    {editNicknameInput.length}/30자
                  </span>
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    onClick={handleCancelEdit}
                    className="text-sm bg-gray-300 px-3 py-1 rounded"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleUpdateNickname}
                    className="text-sm bg-gray-500 text-white px-3 py-1 rounded"
                  >
                    저장하기
                  </button>
                </div>
              </div>
            )}
            <p className="text-sm text-gray-600">{session.user.email}</p>
          </div>

          {/* (B) 비밀번호 재설정 */}
          <div className="flex items-center justify-between">
            <span className="text-gray-500">비밀번호 변경</span>
            <button
              onClick={handleChangePassword}
              className="text-sm text-purple-500"
            >
              수정
            </button>
          </div>

          {/* 비밀번호 재설정 메일 전송 박스 */}
          {showPwBox && (
            <div className="border border-gray-300 rounded bg-white p-4 shadow-md">
              <h3 className="text-lg font-bold mb-2">비밀번호 재설정</h3>
              <p className="text-sm text-gray-600 mb-4">
                비밀번호 재설정 링크를 이메일로 보내드립니다.
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={sendPasswordResetEmail}
                  className="bg-purple-500 text-white px-3 py-1 rounded text-sm"
                >
                  비밀번호 재설정 메일 보내기
                </button>
                <button
                  onClick={() => setShowPwBox(false)}
                  className="bg-gray-300 px-3 py-1 rounded text-sm"
                >
                  취소
                </button>
              </div>
            </div>
          )}

          {/* (C) 기타 정보 관리 */}
          <div className="pt-2 border-t border-gray-200 space-y-3 text-gray-600 text-sm">
            <button
              onClick={() => alert("개인 정보 관리 페이지로 이동")}
              className="w-full text-left"
            >
              개인 정보 관리 &gt;
            </button>
            <button
              onClick={() => alert("맞춤 정보 설정 페이지로 이동")}
              className="w-full text-left"
            >
              내 맞춤 정보 설정 &gt;
            </button>
          </div>

          {/* (D) 하단: 로그아웃 | 계정 탈퇴 */}
          <div className="flex justify-between items-center mt-6 text-sm text-gray-400">
            <button onClick={handleLogout} className="hover:text-gray-600">
              로그아웃
            </button>
            <button
              onClick={() => alert("계정 탈퇴 로직을 구현해주세요!")}
              className="hover:text-gray-600"
            >
              계정 탈퇴
            </button>
          </div>
        </div>
      )}
    </div>
  );
}