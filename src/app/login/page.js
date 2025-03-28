"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseF";
import ReCAPTCHA from "react-google-recaptcha";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [captchaToken, setCaptchaToken] = useState(""); // 캡차 토큰 상태
  const router = useRouter();

  // reCAPTCHA 체크 완료 시 콜백
  const handleRecaptchaChange = (token) => {
    console.log("Recaptcha value:", token);
    setCaptchaToken(token);
  };

  // (A) 이메일+비번 로그인
  const handleLogin = async () => {
    setErrorMessage("");

    // 1) reCAPTCHA 토큰이 없는 경우 => 사용자에게 안내
    if (!captchaToken) {
      setErrorMessage("로봇이 아님을 인증해주세요.");
      return;
    }

    try {
      // 실제 로그인 로직 (예: supabase)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        if (error.message === "Invalid login credentials") {
          setErrorMessage("아이디 또는 비밀번호가 일치하지 않습니다.");
        } else {
          setErrorMessage(error.message);
        }
        return;
      }

      // 로그인 성공 → 홈으로 이동
      router.push("/");
    } catch (err) {
      setErrorMessage(err.message || "로그인 중 오류가 발생했습니다.");
    }
  };

  // 폼 제출(Enter) 시 처리
  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleLogin();
  };

  // (B) 구글 로그인 (서버 경유)
  async function handleGoogleLogin() {
    setErrorMessage("");
    try {
      const res = await fetch(`/api/social-login?provider=google`);
      const { url, error } = await res.json();

      if (error || !url) {
        console.error("소셜 로그인 URL 발급 실패:", error);
        setErrorMessage(error || "URL 발급 실패");
        return;
      }

      window.location.href = url;
    } catch (err) {
      console.error("구글 로그인 중 오류가 발생했어요:", err);
      setErrorMessage(err.message || "구글 로그인 중 오류가 발생했습니다.");
    }
  }

  // (C) 카카오 로그인 (서버 경유)
  const handleKakaoLogin = async () => {
    setErrorMessage("");
    try {
      const res = await fetch(`/api/social-login?provider=kakao`);
      const { url, error } = await res.json();

      if (error || !url) {
        console.error("소셜 로그인 URL 발급 실패:", error);
        setErrorMessage(error || "URL 발급 실패");
        return;
      }

      window.location.href = url;
    } catch (err) {
      console.error("카카오 로그인 중 오류가 발생했습니다:", err);
      setErrorMessage(err.message || "카카오 로그인 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="h-screen w-full bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-md bg-white p-6 shadow text-base">
        {/* 로고 */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-orange-500">여기닷</h1>
        </div>

        {/* 입력 폼 */}
        <form onSubmit={handleFormSubmit} className="space-y-5">
          <input
            type="text"
            placeholder="아이디(이메일)"
            className="w-full rounded border border-gray-300 px-3 py-3 text-base
                       focus:outline-none focus:ring-2 focus:ring-red-400"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="비밀번호"
            className="w-full rounded border border-gray-300 px-3 py-3 text-base
                       focus:outline-none focus:ring-2 focus:ring-red-400"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {/* 에러 메시지 */}
          {errorMessage && (
            <div className="flex items-center text-sm text-red-500">
              <svg
                className="mr-1 h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.506 0 
                     2.598-1.445 2.076-2.88l-2.928-8A2 2 0 0016.07 
                     6H7.93a2 2 0 00-1.9 1.37l-2.928 8c-.522 
                     1.435.57 2.88 2.076 2.88z"
                />
              </svg>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* 아이디/비밀번호 찾기 */}
          <div className="flex justify-end">
            <button
              type="button"
              className="text-sm text-gray-500 hover:text-red-500"
            >
              아이디/비밀번호 찾기
            </button>
          </div>

          {/* reCAPTCHA 체크박스 */}
          <div className="flex justify-center">
            <ReCAPTCHA
              sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY} 
              // ↑ .env 파일 등에 넣어서 빌드 시 NEXT_PUBLIC_ 변수로 노출
              onChange={handleRecaptchaChange}
            />
          </div>

          {/* 로그인 버튼 */}
          <div className="flex flex-col items-center justify-center">
            <button
              type="submit"
              className="w-full rounded bg-orange-400 py-3 text-base font-medium text-white hover:bg-orange-500  mb-3"
            >
              로그인
            </button>

            {/* 구글 로그인 버튼 */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="items-center space-x-1 rounded bg-white px-4 py-3
                         text-base font-medium text-black hover:bg-blue-500 hover:text-white w-full flex justify-center border border-blue-600 mb-3"
            >
              <img src="/icons/google.svg" alt="" width={20} />
              <span>구글 로그인</span>
            </button>

            {/* 카카오 로그인 버튼 */}
            <button
              type="button"
              onClick={handleKakaoLogin}
              className="flex items-center space-x-1 rounded bg-yellow-300 px-4 py-3
                         text-base font-medium text-gray-800 hover:bg-yellow-400 w-full flex justify-center"
            >
              <img src="/icons/kakao.svg" alt="" width={20} />
              <span>카카오 로그인</span>
            </button>
          </div>

          {/* 계정 가입 */}
          <div className="mt-2 text-center">
            <Link href="/signup" className="text-base text-red-500 hover:underline">
              간편 계정 가입
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}