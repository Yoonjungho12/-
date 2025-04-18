"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseF";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  // (A) 이메일+비번 로그인
  const handleLogin = async () => {
    setErrorMessage("");

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
    <div className="min-h-screen w-full bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* 메인 카드 */}
        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-8">
          {/* 로고 */}
          <div className="text-center">
            <img 
              src="/logo/logo.png" 
              alt="로고" 
              className="h-40 mx-auto object-cover object-center -mt-8 -mb-16" 
            />
          </div>

          {/* 입력 폼 */}
          <form onSubmit={handleFormSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  placeholder="아이디(이메일)"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-gray-100 focus:bg-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <input
                  type="password"
                  placeholder="비밀번호"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 bg-gray-50 hover:bg-gray-100 focus:bg-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {/* 에러 메시지 */}
            {errorMessage && (
              <div className="flex items-center justify-center text-sm text-red-500 bg-red-50 py-2 rounded-lg">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{errorMessage}</span>
              </div>
            )}

            {/* 아이디/비밀번호 찾기 */}
            <div className="flex justify-end">
              <button
                type="button"
                className="text-sm text-gray-500 hover:text-orange-500 transition-colors duration-200"
              >
                아이디/비밀번호 찾기
              </button>
            </div>

            {/* 버튼 그룹 */}
            <div className="space-y-4">
              {/* 로그인 버튼 */}
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-medium hover:from-orange-600 hover:to-red-600 transform hover:scale-[1.02] transition-all duration-200 shadow-md hover:shadow-lg"
              >
                로그인
              </button>

              {/* 구글 로그인 버튼 */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full py-3 px-4 rounded-xl bg-white border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 flex items-center justify-center space-x-2 transform hover:scale-[1.02] transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <img src="/icons/google.svg" alt="" className="w-5 h-5" />
                <span>구글 계정으로 로그인</span>
              </button>

              {/* 카카오 로그인 버튼 */}
              <button
                type="button"
                onClick={handleKakaoLogin}
                className="w-full py-3 px-4 rounded-xl bg-[#FEE500] text-[#391B1B] font-medium hover:bg-[#FDD800] flex items-center justify-center space-x-2 transform hover:scale-[1.02] transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <img src="/icons/kakao.svg" alt="" className="w-5 h-5" />
                <span>카카오 계정으로 로그인</span>
              </button>
            </div>
          </form>

          {/* 회원가입 링크 */}
          <div className="pt-4 text-center border-t border-gray-200">
            <Link 
              href="/signup" 
              className="text-orange-500 hover:text-orange-600 font-medium inline-flex items-center space-x-1 group"
            >
              <span>새로운 계정 만들기</span>
              <svg 
                className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-200" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}