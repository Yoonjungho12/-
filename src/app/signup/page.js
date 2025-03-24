"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseF"; // 이미 설정된 Supabase 클라이언트

export default function SignupPage() {
  // ─────────────────────────────────────────
  // (A) 상태값들
  // ─────────────────────────────────────────
  const [userId, setUserId] = useState(""); // 이메일 (아이디)
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");

  // 닉네임 중복확인 결과
  const [nicknameAvailable, setNicknameAvailable] = useState(null); // true / false / null(미확인)
  const [nicknameCheckError, setNicknameCheckError] = useState("");

  // 약관동의 (예시)
  const [checkedTerm1, setCheckedTerm1] = useState(true);
  const [checkedTerm2, setCheckedTerm2] = useState(true);

  const router = useRouter();

  // ─────────────────────────────────────────
  // (B) 닉네임 중복확인 - DB 조회
  // ─────────────────────────────────────────
  async function handleCheckNickname() {
    if (!nickname.trim()) {
      setNicknameAvailable(false);
      setNicknameCheckError("닉네임을 입력해주세요.");
      return;
    }

    try {
      // 1) profiles 테이블에서 동일한 nickname 존재 여부 조회
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("nickname", nickname.trim())
        .maybeSingle();

      if (error) {
        throw new Error(error.message || "서버오류");
      }

      if (data) {
        // 이미 동일 닉네임 존재
        setNicknameAvailable(false);
        setNicknameCheckError("이미 사용 중인 닉네임입니다.");
      } else {
        // 사용 가능
        setNicknameAvailable(true);
        setNicknameCheckError("사용 가능한 닉네임입니다.");
      }
    } catch (err) {
      console.error("닉네임 중복확인 에러:", err);
      setNicknameAvailable(false);
      setNicknameCheckError(err.message || "중복확인 중 오류");
    }
  }

  // ─────────────────────────────────────────
  // (C) 가입하기
  // ─────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();

    // 1) 비번 동일 여부
    if (password !== passwordConfirm) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }
    // 2) 닉네임 중복확인 (미확인, 또는 중복이면 막기)
    if (nicknameAvailable !== true) {
      alert("닉네임 중복확인을 해주세요!");
      return;
    }
    // 3) 약관동의 체크 여부
    if (!checkedTerm1 || !checkedTerm2) {
      alert("약관에 동의해주셔야 가입 가능합니다!");
      return;
    }

    // 4) Supabase Auth 가입
    const { data, error } = await supabase.auth.signUp({
      email: userId,
      password: password,
      options: {
        data: {
          display_name: name,
        },
      },
    });

    // ─────────── 에러 메시지 한글화 ───────────
    if (error) {
      if (error.message === "User already registered") {
        alert("이미 가입된 이메일 주소입니다.");
      } else {
        alert(error.message); // 다른 오류는 그대로 표출
      }
      return;
    }
    // ────────────────────────────────────────

    // 5) profiles 테이블에 추가 정보 (user_id, name, nickname, phone, etc.)
    const user_id = data.user?.id;
    if (!user_id) {
      alert("가입 오류: user_id가 없습니다.");
      return;
    }

    try {
      const { error: insertError } = await supabase
        .from("profiles")
        .insert({
          user_id,
          email: userId,
          name,
          nickname,
          phone,
        });
      if (insertError) {
        throw new Error(insertError.message);
      }

      // 가입 성공 시, 이메일만 로컬스토리지에 저장하기
      localStorage.setItem("pendingEmail", userId);

      // 그리고 이메일 인증 안내 페이지로 이동
      router.push("/email-confirmation");
    } catch (err) {
      alert("프로필 저장 중 오류: " + err.message);
    }
  }

  // ─────────────────────────────────────────
  // (D) 소셜 로그인 (예시: 구글, 카카오)
  // ─────────────────────────────────────────
  const [errorMessage, setErrorMessage] = useState("");

  async function handleGoogleLogin() {
    setErrorMessage("");
    try {
      // /api/social-login?provider=google → OAuth
      const res = await fetch(`/api/social-login?provider=google`);
      const { url, error } = await res.json();
      if (error || !url) {
        setErrorMessage(error || "구글 로그인 오류");
        return;
      }
      window.location.href = url;
    } catch (err) {
      console.error("구글 로그인 실패:", err);
      setErrorMessage(err.message || "구글 로그인 중 오류 발생");
    }
  }

  async function handleKakaoLogin() {
    setErrorMessage("");
    try {
      const res = await fetch(`/api/social-login?provider=kakao`);
      const { url, error } = await res.json();
      if (error || !url) {
        setErrorMessage(error || "카카오 로그인 오류");
        return;
      }
      window.location.href = url;
    } catch (err) {
      console.error("카카오 로그인 실패:", err);
      setErrorMessage(err.message || "카카오 로그인 중 오류 발생");
    }
  }

  // ─────────────────────────────────────────
  // (E) UI
  // ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4">
      {/* 로고/상단 */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-orange-500">여기닷</h1>
      </div>

      {/* 흰색 컨테이너 */}
      <div className="w-full max-w-md rounded-md bg-white p-6 shadow">
        <h2 className="mb-4 text-xl font-semibold text-gray-700">간편 회원가입</h2>

        {/* (1) 약관동의 */}
        <div className="mb-5 border border-gray-200">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <div className="flex items-center space-x-2">
              <svg
                className="h-5 w-5 text-red-500"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm font-medium text-gray-700">전체동의</span>
            </div>
          </div>
          <div className="px-4 py-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={checkedTerm1}
                  onChange={() => setCheckedTerm1(!checkedTerm1)}
                  className="h-4 w-4 rounded border-gray-300 text-red-500"
                />
                <span className="text-sm text-gray-700">
                  회원가입약관의 내용에 동의 (필수)
                </span>
              </div>
              <button className="text-sm text-gray-500 hover:underline">보기</button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={checkedTerm2}
                  onChange={() => setCheckedTerm2(!checkedTerm2)}
                  className="h-4 w-4 rounded border-gray-300 text-red-500"
                />
                <span className="text-sm text-gray-700">
                  개인정보 이용 및 활용 동의 (필수)
                </span>
              </div>
              <button className="text-sm text-gray-500 hover:underline">보기</button>
            </div>
          </div>
        </div>

        {/* (2) 가입 폼 */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* 이메일(아이디) */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">
              아이디(이메일) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="예: user@example.com"
            />
          </div>

          {/* 비밀번호 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">
              비밀번호 <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="비밀번호"
            />
          </div>

          {/* 비밀번호 확인 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">
              비밀번호 확인 <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="비밀번호 재입력"
            />
          </div>

          {/* 이름 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">
              이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="실명 입력"
            />
          </div>

          {/* 닉네임 + 중복확인 버튼 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">
              닉네임 <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  setNicknameAvailable(null);
                  setNicknameCheckError("");
                }}
                className="flex-1 border border-gray-300 px-3 py-2 rounded text-sm 
                           focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="닉네임"
              />
              <button
                type="button"
                onClick={handleCheckNickname}
                className="px-3 py-2 rounded bg-gray-300 text-sm text-gray-700 hover:bg-gray-400"
              >
                중복확인
              </button>
            </div>
            {/* 결과 메시지 */}
            {nicknameAvailable === false && (
              <p className="mt-1 text-sm text-red-500">
                {nicknameCheckError || "이미 사용 중입니다."}
              </p>
            )}
            {nicknameAvailable === true && (
              <p className="mt-1 text-sm text-green-600">
                {nicknameCheckError || "사용 가능합니다."}
              </p>
            )}
          </div>

          {/* 휴대폰 번호 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">
              휴대폰 번호 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="예: 010-1234-5678"
            />
          </div>

          {/* 샘플로 캡차 or etc. */}
          <div className="flex items-center space-x-2">
            <img src="/images/captcha-sample.png" alt="captcha" className="h-10 w-20 border" />
            <input
              type="text"
              className="flex-1 border border-gray-300 px-3 py-2 text-sm rounded focus:outline-none focus:ring-2 focus:ring-orange-400"
              placeholder="캡차 입력"
            />
          </div>

          {/* 가입하기 버튼 */}
          <button
            type="submit"
            className="mt-3 w-full rounded bg-orange-400 py-2 text-base font-medium text-white
                       hover:bg-orange-600"
          >
            가입하기
          </button>
        </form>

        {/* 소셜 로그인 */}
        <div className="flex items-center justify-center gap-5 mt-4">
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex items-center justify-center gap-2 rounded bg-white border border-blue-600 
                       text-base font-medium text-black hover:bg-blue-500 hover:text-white w-full py-3"
          >
            <img src="/icons/google.svg" alt="google" width={20} />
            <span>구글 가입</span>
          </button>

          <button
            type="button"
            onClick={handleKakaoLogin}
            className="flex items-center justify-center gap-2 rounded bg-yellow-300 
                       text-base font-medium text-gray-800 hover:bg-yellow-400 w-full py-3"
          >
            <img src="/icons/kakao.svg" alt="kakao" width={20} />
            <span>카카오 가입</span>
          </button>
        </div>

        {/* 에러 메시지 */}
        {errorMessage && (
          <div className="mt-2 text-sm text-red-500 text-center">
            {errorMessage}
          </div>
        )}
      </div>
    </div>
  );
}