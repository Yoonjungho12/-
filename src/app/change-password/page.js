"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseF";

export default function PasswordResetPage() {
  // 입력 필드
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // 비밀번호 표시 토글
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI 메시지
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // 세션
  const [session, setSession] = useState(null);
  const router = useRouter();
  const isLoggedIn = !!session?.user;

  // 마운트 후 세션 가져오기
  useEffect(() => {
    async function getSession() {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        // 필요 없다면 이 에러도 제거/주석 처리 가능
        console.error("getSession Error:", error);
      }
      setSession(data?.session || null);
    }
    getSession();
  }, []);

  // 비밀번호 변경
  async function handleChangePassword() {
    setMessage("");
    setErrorMessage("");

    if (!isLoggedIn) {
      setErrorMessage("로그인되지 않아 비밀번호를 변경할 수 없습니다.");
      return;
    }
    if (!oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setErrorMessage("기존 비밀번호와 새 비밀번호를 모두 입력해주세요!");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("새 비밀번호와 재입력이 일치하지 않습니다.");
      return;
    }

    // 1) 기존 비번 확인
    try {
      const email = session.user.email;
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password: oldPassword,
        });

      if (signInError) {
        // ※ 기존에는 console.error 로 찍었지만, 이제 제거함
        // console.error("기존 비밀번호 인증 실패:", signInError.message);
        setErrorMessage("기존 비밀번호가 맞지 않습니다.");
        return;
      }
    } catch (err) {
      // 여기도 필요하다면 console.error 제거할 수 있음
      // console.error("기존 비밀번호 인증 중 오류:", err);
      setErrorMessage("기존 비밀번호 인증에 실패했습니다.");
      return;
    }

    // 2) 새 비번으로 updateUser
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        // 특수 에러 메시지
        if (error.message === "Auth session missing!") {
          setErrorMessage("로그인을 한 후 진행해주세요!");
          return;
        }
        if (error.message === "New password should be different from the old password.") {
          setErrorMessage("새 비밀번호는 기존 비밀번호와 달라야 합니다");
          return;
        }
        setErrorMessage("비밀번호 변경 실패: " + error.message);
        return;
      }

      // 성공
      alert("비밀번호 변경이 완료되었습니다!");
        router.push('/mypage/account-setting')
    } catch (err) {
      // console.error("비밀번호 변경 중 오류:", err);
      setErrorMessage("오류 발생: " + err.message);
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen p-4 bg-gray-100">
      <div className="w-full max-w-sm bg-white rounded shadow-md p-6">
        <h1 className="text-xl font-bold mb-6 text-center">비밀번호 변경</h1>

        {message && (
          <p className="text-center text-green-600 mb-4">{message}</p>
        )}
        {errorMessage && (
          <p className="text-center text-red-500 mb-4">{errorMessage}</p>
        )}

        {/* 기존 비밀번호 */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            기존 비밀번호
          </label>
          <div className="relative">
            <input
              type={showOldPassword ? "text" : "password"}
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="기존 비밀번호를 입력하세요"
            />
            <button
              type="button"
              onClick={() => setShowOldPassword(!showOldPassword)}
              className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
            >
              {showOldPassword ? (
                // 눈 가려진 아이콘
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M13.875 18.825l-2.598-2.599 
                    M9.88 14.83A3.001 3.001 0 0111.999 9
                    c.658 0 1.293.214 1.829.58
                    m-1.705 4.104A2.994 2.994 0 0112 12.001
                    c.688 0 1.307.27 1.76.705
                    M2.458 12C3.732 7.943 7.345 5 
                    12 5c2.129 0 3.996.708 5.533 1.887
                    m3.01 3.98A11.963 11.963 0 0112 19
                    c-2.13 0-3.998-.709-5.536-1.889
                    M12 9.001v.01" />
                </svg>
              ) : (
                // 눈 아이콘
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M15 12c0 1.657-1.343 3-3 3
                     s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3z 
                     M2.458 12C3.732 7.943 7.345 5
                     12 5c4.656 0 8.27 2.943 9.542 7
                     -1.272 4.057-4.886 7-9.542 7
                     -4.655 0-8.27-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* 새 비밀번호 */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            새 비밀번호
          </label>
          <div className="relative">
            <input
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="새 비밀번호를 입력하세요"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
            >
              {showNewPassword ? (
                /* 눈 가려진 아이콘 */
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M13.875 18.825l-2.598-2.599 
                    M9.88 14.83A3.001 3.001 0 0111.999 9
                    c.658 0 1.293.214 1.829.58
                    m-1.705 4.104A2.994 2.994 0 0112 12.001
                    c.688 0 1.307.27 1.76.705
                    M2.458 12C3.732 7.943 7.345 5 
                    12 5c2.129 0 3.996.708 5.533 1.887
                    m3.01 3.98A11.963 11.963 0 0112 19
                    c-2.13 0-3.998-.709-5.536-1.889
                    M12 9.001v.01" />
                </svg>
              ) : (
                /* 눈 아이콘 */
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M15 12c0 1.657-1.343 3-3 3
                    s-3-1.343-3-3 1.343-3 3-3 3 1.343 3 3z 
                    M2.458 12C3.732 7.943 7.345 5 
                    12 5c4.656 0 8.27 2.943 9.542 7
                    -1.272 4.057-4.886 7-9.542 7
                    -4.655 0-8.27-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* 새 비밀번호 확인 */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            새 비밀번호 확인
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="새 비밀번호를 다시 입력하세요"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
            >
              {showConfirmPassword ? (
                /* 눈 가려진 아이콘 */
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M13.875 18.825l-2.598-2.599
                    M9.88 14.83A3.001 3.001 0 0111.999 9
                    c.658 0 1.293.214 1.829.58
                    m-1.705 4.104A2.994 2.994 0 0112 12.001
                    c.688 0 1.307.27 1.76.705
                    M2.458 12C3.732 7.943 7.345 5
                    12 5c2.129 0 3.996.708 5.533 1.887
                    m3.01 3.98A11.963 11.963 0 0112 19
                    c-2.13 0-3.998-.709-5.536-1.889
                    M12 9.001v.01" />
                </svg>
              ) : (
                /* 눈 아이콘 */
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M15 12c0 1.657-1.343 3-3 3s-3-1.343-3-3 
                     1.343-3 3-3 3 1.343 3 3z 
                     M2.458 12C3.732 7.943 7.345 5 
                     12 5c4.656 0 8.27 2.943 9.542 7 
                     -1.272 4.057-4.886 7-9.542 7 
                     -4.655 0-8.27-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <button
          onClick={handleChangePassword}
          className="w-full py-2 bg-orange-500 text-white font-semibold rounded hover:bg-orange-600 transition-colors"
        >
          비밀번호 변경
        </button>
      </div>
    </div>
  );
}