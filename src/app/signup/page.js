"use client";
import React, { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabaseF";

export default function SignupPage() {
  // 폼 상태
  const [userId, setUserId] = useState(""); // 아이디 (이메일 형태)
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");

  const [name, setName] = useState("");
  const [nickname, setNickname] = useState("");
  const [phone, setPhone] = useState("");


  // 예) 약관동의 체크
  const [checkedTerm1, setCheckedTerm1] = useState(true);
  const [checkedTerm2, setCheckedTerm2] = useState(true);
      const router = useRouter();
  // 가입하기 버튼 클릭
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== passwordConfirm) {
      alert("비밀번호가 일치하지 않습니다.");
      return;
    }

    // 1) Supabase Auth 로 아이디/비밀번호 가입
    const { data, error } = await supabase.auth.signUp({
      email: userId,
      password: password,
    });
    if (error) {
      alert("Auth 가입 실패: " + error.message);
      return;
    }

    // userId(이메일), password는 이미 Supabase Auth에 등록됨
    // 2) 나머지 정보(이름, 닉네임, 휴대폰, 이메일)를 서버에 전송
    //    Supabase Auth 가입결과로 data.user.id가 나옴(유니크 UUID)
    const user_id = data.user?.id;
    try {
      const res = await fetch("/api/signUp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user_id,
          name: name,
          nickname: nickname,
          phone: phone,
        }),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg);
      }
      alert("가입 완료!");
      router.push('/login');
    } catch (err) {
      alert("프로필 저장 중 오류가 발생했습니다: " + err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center px-4">
      {/* 로고 */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-red-500">
          VIP info
          <span className="ml-1 text-base font-normal text-green-600">VIP 건마</span>
        </h1>
      </div>

      {/* 흰색 박스 */}
      <div className="w-full max-w-md rounded-md bg-white p-6 shadow">
        {/* 제목 */}
        <h2 className="mb-4 text-xl font-semibold text-gray-700">간편 회원가입</h2>

        {/* 약관동의 (예시 2개) */}
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

        {/* 입력 폼 */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* 아이디 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">
              아이디 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-red-400"
              placeholder="아이디(이메일)"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>

          {/* 비밀번호 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">
              비밀번호 (8자리 이상, 문자, 숫자, 특수문자) <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-red-400"
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* 비밀번호 확인 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">
              비밀번호 확인 <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-red-400"
              placeholder="비밀번호 재입력"
              value={passwordConfirm}
              onChange={(e) => setPasswordConfirm(e.target.value)}
            />
          </div>

          {/* 이름 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">
              이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-red-400"
              placeholder="이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* 닉네임 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">
              닉네임(공백없이 한글, 영문, 숫자만 입력가능) <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-red-400"
              placeholder="닉네임"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
            />
          </div>



          {/* 휴대폰 번호 */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-600">
              휴대폰 번호 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              className="w-full rounded border border-gray-300 px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-red-400"
              placeholder="휴대폰 번호"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {/* (사진 속) 캡차 */}
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-2">
              <img
                src="/images/captcha-sample.png"
                alt="captcha"
                className="h-10 w-20 rounded border border-gray-300"
              />
              {/* 스피커 아이콘 */}
              <svg
                className="h-6 w-6 text-gray-500"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M11.49 3.87L6.6 7H4a2 2 0 00-2 2v6a2 2 
                     0 002 2h2.6l4.89 3.13A1 1 0 0012 19V5a1 
                     1 0 00-.51-.87z"
                />
              </svg>
            </div>
            <input
              type="text"
              className="flex-1 rounded border border-gray-300 px-3 py-2 text-sm
                         focus:outline-none focus:ring-2 focus:ring-red-400"
              placeholder="캡차 입력"
            />
          </div>

          {/* 가입하기 버튼 */}
          <button
            type="submit"
            className="mt-3 w-full rounded bg-red-500 py-2 text-sm font-medium text-white hover:bg-red-600"
          >
            가입하기
          </button>
        </form>

        {/* 하단 안내문구 */}
        <div className="mt-4 text-sm text-gray-500">
          <p>이름, 닉네임은 변경이 불가능합니다</p>
          <p>변경시 고객센터로 문의 부탁 드립니다</p>
        </div>

        {/* 고객센터 */}
        <div className="mt-4 flex items-center space-x-3 text-sm text-gray-600">
          <svg
            className="h-5 w-5 text-gray-500"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2 5a2 2 0 012-2h4.5a2 2 
                 0 011.414.586l2.914 2.914A2 2 
                 0 0113 7.914V19a2 2 0 01-2 2H4a2 
                 2 0 01-2-2V5z"
            />
          </svg>
          <p>고객센터 0504-1361-3000 (문자문의)</p>
        </div>

        {/* 회원탈퇴 */}
        <div className="mt-4 text-sm text-gray-500">
          <button className="text-gray-500 hover:text-red-500 hover:underline">
            회원탈퇴
          </button>
        </div>
      </div>
    </div>
  );
}