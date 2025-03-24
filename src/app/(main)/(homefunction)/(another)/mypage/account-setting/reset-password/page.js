"use client";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseF";

export default function PasswordResetPage() {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // 비밀번호 표시
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isTokenValid, setIsTokenValid] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();

  // (A) 쿼리 파라미터 (혹시 여기에 토큰이 있을 수 있으므로)
  const accessTokenQuery = searchParams.get("access_token");
  const refreshTokenQuery = searchParams.get("refresh_token");

  // (B) 마운트 시점에 window.location.hash를 한번에 파싱
  useEffect(() => {
    if (typeof window === "undefined") return;

    console.log("===> onMount, full window.location:", window.location.href);
    console.log("===> onMount, window.location.hash:", window.location.hash);

    // 해시를 변수에 저장
    const initialHash = window.location.hash; // 예: "#access_token=...&refresh_token=..."
    // 바로 세션 설정 로직 실행
    checkTokensAndSetSession(initialHash);
  }, []);

  async function checkTokensAndSetSession(initialHash) {
    // (1) 쿼리에 토큰이 있나?
    let finalAccess = "";
    let finalRefresh = "";

    if (accessTokenQuery && refreshTokenQuery) {
      console.log("쿼리 파라미터로 토큰 발견");
      finalAccess = accessTokenQuery;
      finalRefresh = refreshTokenQuery;
    } else if (initialHash) {
      console.log("해시(fragment)로부터 토큰 파싱 시도");
      // "#access_token=xxx&refresh_token=xxx"
      const hashStr = initialHash.replace(/^#/, ""); // '#' 제거
      const hashObj = new URLSearchParams(hashStr);

      const hAccess = hashObj.get("access_token");
      const hRefresh = hashObj.get("refresh_token");

      console.log("해시로부터 access_token:", hAccess);
      console.log("해시로부터 refresh_token:", hRefresh);

      if (hAccess && hRefresh) {
        finalAccess = hAccess;
        finalRefresh = hRefresh;
      }
    }

    console.log("최종 finalAccess:", finalAccess);
    console.log("최종 finalRefresh:", finalRefresh);

    // (2) 세션 설정
    if (finalAccess && finalRefresh) {
      const { data, error } = await supabase.auth.setSession({
        access_token: finalAccess,
        refresh_token: finalRefresh,
      });
      if (error) {
        console.error("세션 세팅 오류:", error.message);
        setErrorMessage("유효한 토큰이 아니거나 만료되었습니다.");
      } else {
        console.log("세션 세팅 성공:", data);
        setIsTokenValid(true);
      }
    } else {
      setErrorMessage("유효한 토큰이 없습니다. 이메일 링크를 확인해주세요.");
    }
  }

  // (C) 비밀번호 변경
  async function handleChangePassword() {
    setMessage("");
    setErrorMessage("");

    if (!isTokenValid) {
      setErrorMessage("유효한 인증 토큰이 없어 비밀번호를 변경할 수 없습니다.");
      return;
    }
    if (!newPassword.trim() || !confirmPassword.trim()) {
      setErrorMessage("비밀번호를 모두 입력해주세요!");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("두 비밀번호가 일치하지 않습니다.");
      return;
    }

    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) {
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
      setMessage("비밀번호 변경이 완료되었습니다!");
      setTimeout(() => {
        router.push("/mypage/account-setting");
      }, 1500);
    } catch (err) {
      setErrorMessage("오류 발생: " + err.message);
    }
  }

  return (
    <div className="flex mt-30 items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded shadow-md p-6">
        <h1 className="text-xl font-bold mb-6 text-center">비밀번호 재설정</h1>

        {message && <p className="text-center text-green-600 mb-4">{message}</p>}
        {errorMessage && <p className="text-center text-red-500 mb-4">{errorMessage}</p>}

        {/* 새 비밀번호 */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            새 비밀번호
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="새 비밀번호를 입력하세요"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? (
                // 눈 가려진 아이콘
                <svg xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
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
                <svg xmlns="http://www.w3.org/2000/svg"
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

        {/* 비밀번호 확인 */}
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
              placeholder="비밀번호를 다시 입력하세요"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-2 top-2 text-gray-500 hover:text-gray-700"
            >
              {showConfirmPassword ? (
                // 눈 가려진 아이콘
                <svg xmlns="http://www.w3.org/2000/svg"
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
                <svg xmlns="http://www.w3.org/2000/svg"
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

        {/* 비밀번호 변경 버튼 */}
        {!isTokenValid && errorMessage ? (
          <button
            disabled
            className="w-full py-2 bg-gray-300 text-white font-semibold rounded cursor-not-allowed"
          >
            비밀번호 변경
          </button>
        ) : (
          <button
            onClick={handleChangePassword}
            className="w-full py-2 bg-orange-500 text-white font-semibold rounded hover:bg-orange-600 transition-colors"
          >
            비밀번호 변경
          </button>
        )}
      </div>
    </div>
  );
}