"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from '../../lib/supabaseF';

// 허용할 UUID
const ALLOWED_ADMIN_ID = "9926a690-a903-4172-9c19-dd07fd3956f3";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 로그인 처리
  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);

    if (loginError) {
      // 이메일/비번 틀림, Supabase가 반환한 에러
      setError(loginError.message);
      return;
    }

    // 여기까지 오면 "이메일/비번" 인증은 성공
    // => 이제 user ID를 확인하여 'ALLOWED_ADMIN_ID'와 같은지 검증
    const user = data?.user;
    if (!user || user.id !== ALLOWED_ADMIN_ID) {
      // 허용되지 않은 ID라면 바로 로그아웃 → 에러
      await supabase.auth.signOut();
      setError("이 계정은 관리자 권한이 없습니다.");
      return;
    }

    // 특정 UUID와 일치하면 통과 → 관리자 페이지로 이동
    router.push("/master");
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-sm rounded-md border border-gray-200 bg-white p-6 shadow-sm">
        <h1 className="mb-4 text-center text-2xl font-bold text-blue-600">
          Admin Panel
        </h1>
        <p className="mb-6 text-center text-sm text-gray-500">
          관리자 로그인이 필요합니다
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-semibold text-gray-700"
            >
              이메일
            </label>
            <input
              id="email"
              type="email"
              className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
              required
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-semibold text-gray-700"
            >
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              className="mt-1 w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="******"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-500">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-md bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>
      </div>
    </div>
  );
}