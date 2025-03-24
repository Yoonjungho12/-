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
    <div className="max-w-[600px] mx-auto p-4 md:p-8 relative">
      <h1 className="text-2xl font-bold mb-8">계정 설정</h1>

      {!isLoggedIn ? (
        <p className="text-gray-600">로그인 상태가 아닙니다.</p>
      ) : (
        <div className="space-y-6">
          <div className="relative w-24 h-24 mx-auto">
            <div className="w-full h-full rounded-full bg-gray-300" />
            <div className="absolute bottom-0 right-0 bg-white rounded-full border p-1">
              <svg
                className="w-5 h-5 text-gray-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M4 5a2 2 0 
                012-2h.172a2 2 0 
                001.414-.586l.828-.828A2 2 0 
                0110.828 1H12a2 2 0 
                012 2v1h2a2 2 0 
                012 2v6a2 2 0 
                01-2 2h-3v2a2 2 0 
                01-2 2H5a2 2 0 
                01-2-2v-2H1a2 2 0 
                01-2-2V6a2 2 0 
                012-2h3zM5 10a1 1 0 
                102 0 1 1 0 
                00-2 0z" />
              </svg>
            </div>
          </div>

          {/* 닉네임/이메일 */}
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

          {/* 비밀번호 변경 */}
          <div className="flex items-center justify-between">
            <span className="text-gray-500">비밀번호 변경</span>
            <button
              onClick={handleChangePassword}
              className="text-sm text-purple-500"
            >
              수정
            </button>
          </div>

          {/* 기타 정보 관리 */}
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

          {/* 하단: 로그아웃 | 회원 탈퇴 */}
          <div className="flex justify-between items-center mt-6 text-sm text-gray-400">
            <button onClick={handleLogout} className="hover:text-gray-600">
              로그아웃
            </button>
            <button
              onClick={handleDeleteAccountClick}
              className="hover:text-gray-600"
            >
              회원 탈퇴
            </button>
          </div>
        </div>
      )}

      {/* 회원 탈퇴 모달 + 오버레이 */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          onClick={handleOverlayClick}
        >
          <div className="absolute inset-0 bg-black/50"></div>

          <div
            onClick={handleModalContentClick}
            className="relative bg-white p-6 rounded shadow-md w-[300px]"
          >
            <h2 className="text-lg font-bold mb-3">
              정말 여기닷을 떠나실 건가요?
            </h2>
            <p className="text-sm text-gray-700 mb-6">
              계정 탈퇴 시 모든 개인정보가 삭제됩니다.
            </p>
            <div className="flex flex-col justify-end">
              <button
                onClick={handleCancelDelete}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-1 rounded mb-3"
              >
                다시 생각해볼게요
              </button>
              <button
                onClick={handleConfirmDelete}
                className="bg-gray-300 hover:bg-gray-400 px-4 py-1 rounded"
              >
                계정 탈퇴
              </button>
            </div>
          </div>
        </div>
      )}
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