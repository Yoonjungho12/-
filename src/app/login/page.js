"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseF"; // 클라이언트용 supabase 객체

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();
  console.log("NODE_ENV is:", process.env.NODE_ENV);
console.log("NEXT_PUBLIC_CALL_BACK_URL is:", process.env.NEXT_PUBLIC_CALL_BACK_URL);
  // (A) 일반 이메일+비번 로그인
  const handleLogin = async () => {
    setErrorMessage("");
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        setErrorMessage(error.message);
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

  // (B) 구글 로그인
async function handleGoogleLogin() {
  // NODE_ENV 값이 development이면 로컬 주소, 아니라면 환경 변수의 주소를 사용하게끔 분기 처리했어요.
  const callbackBaseUrl =
    process.env.NODE_ENV === 'development'
      ? 'http://localhost:3000'
      : process.env.NEXT_PUBLIC_CALL_BACK_URL

  // Supabase OAuth 로그인 로직
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      // 로컬이면 localhost:3000, 로컬이 아니면 env.process.NEXT_PUBLIC_CALL_BACK_URL
      // 뒤에 /auth/callback?provider=google 붙이기
      redirectTo: callbackBaseUrl + '/auth/callback?provider=google',
    },
  })

  // 에러 처리
  if (error) {
    console.error('구글 로그인 중 오류가 발생했어요:', error)
    return
  }

  // 정상적으로 data를 받아온 경우
  console.log('구글 로그인 성공!', data)
}
const handleKakaoLogin = async () => {
    setErrorMessage("");
    try {
      // 로컬 환경이면 http://localhost:3000, 아니면 process.env.CALL_BACK_URL 사용
      const callbackBaseUrl =
        process.env.NODE_ENV === "development"
          ? "http://localhost:3000"
          : process.env.NEXT_PUBLIC_CALL_BACK_URL;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: {
          redirectTo: callbackBaseUrl + "/auth/callback?provider=kakao",
        },
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }
      // 인증 후 돌아옴
      console.log("카카오 로그인 성공:", data);
    } catch (err) {
      setErrorMessage(err.message || "카카오 로그인 중 오류가 발생했습니다.");
    }
  };

  return (
    <div className="h-screen w-full bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-md bg-white p-6 shadow text-base">
        {/* 로고 영역 */}
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-red-500">
            VIP info
            <span className="ml-1 text-xl font-normal text-green-600">VIP 건마</span>
          </h1>
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

          {/* 에러 메시지 표시 */}
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

          {/* 로그인 버튼 */}
          <button
            type="submit"
            className="w-full rounded bg-red-500 py-3 text-base font-medium text-white hover:bg-red-600"
          >
            로그인
          </button>

          {/* 소셜 로그인 버튼들 */}
          <div className="flex items-center justify-center space-x-3">
            {/* (1) 구글 로그인 버튼 (네이버 → 구글로 변경) */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="flex items-center space-x-1 rounded bg-blue-500 px-4 py-3
                         text-base font-medium text-white hover:bg-blue-600"
            >
              {/* 간단한 구글 아이콘 (혹은 FontAwesome 등 사용 가능) */}
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 512 512">
                <path d="M256 8C119.1 8 8 119.1 8 256c0 123.4 90.98 225.9 209 245.2v-173h-63v-72h63v-55.1c0-62.2 37.3-96.3 93.8-96.3 27.4 0 56 4.9 56 4.9v61h-31.5c-31 0-40.7 19.3-40.7 39.2v46.3h69.2l-11 72h-58.2v173C413 481.9 504 379.4 504 256 504 119.1 392.9 8 256 8z" />
              </svg>
              <span>구글 로그인</span>
            </button>

            {/* (2) 카카오 로그인 버튼 */}
            <button
              type="button"
              onClick={handleKakaoLogin}
              className="flex items-center space-x-1 rounded bg-yellow-300 px-4 py-3
                         text-base font-medium text-gray-800 hover:bg-yellow-400"
            >
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M0 0h24v24H0z" fill="none" />
                <path d="M3 3h18v18H3V3z" />
              </svg>
              <span>카카오 로그인</span>
            </button>
          </div>

          {/* 간편 계정 가입 */}
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