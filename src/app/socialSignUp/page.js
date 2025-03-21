"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseF"; // 클라이언트용 supabase 객체

export default function SocialSignUpPage() {
  const router = useRouter();

  // 입력 필드 상태
  const [nickname, setNickname] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // 세션에서 가져온 user_id (없으면 null)
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // 1) 세션 가져오기
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error("세션 로딩 오류:", error);
        setErrorMsg("로그인이 필요합니다!");
        return;
      }
      const user = data?.session?.user;
      if (!user) {
        // 세션이 없으면 로그인 페이지로
        setErrorMsg("로그인이 필요합니다!");
        router.push("/login");
        return;
      }

      const uid = user.id;
      setUserId(uid);

      // ─────────────────────────────────────────────────
      // 우선 user_metadata에서 nickname이 있으면 초기값으로 세팅
      // (예: 카카오 "nickname", 구글 "name" 등이 들어올 수 있음)
      // ※ 실제로는 user_metadata 구조를 console.log로 확인 후 맞춰주세요.
      // ─────────────────────────────────────────────────
      const metaNickname = user.user_metadata?.nickname
        || user.user_metadata?.name
        || ""; 
      // 일단 nickname state를 user_metadata 값으로 설정
      setNickname(metaNickname);

      // 2) 그 뒤 profiles에서 기존 nickname, name, phone 값 가져오기
      fetchProfile(uid, metaNickname);
    });
  }, [router]);

  // ─────────────────────────────────────────────────────────
  // profiles 조회
  // 만약 profiles에 nickname이 이미 있다면 → 그것으로 최종 덮어씀
  // ─────────────────────────────────────────────────────────
  async function fetchProfile(uid, metaNickname) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("nickname, name, phone")
        .eq("user_id", uid)
        .single();

      if (error) {
        // 만약 "row가 없음" 에러라면 (error.details: "Results contain 0 rows"),
        // 그냥 기존 metaNickname(소셜에서 온 값) 쓰면 됨
        console.log("profiles 조회 에러(없음):", error);
        return;
      }

      // 이미 profiles row가 있으면 덮어씀
      if (data) {
        setNickname(data.nickname || metaNickname || "");
        setName(data.name || "");
        setPhone(data.phone || "");
      }
    } catch (err) {
      console.error("profiles 조회 중 오류:", err);
      setErrorMsg("프로필 로딩에 실패했습니다.");
    }
  }

  // ─────────────────────────────────────────────────────────
  // 저장(회원가입 완료) 버튼
  // ─────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    if (!userId) {
      setErrorMsg("유효한 세션이 없습니다. 다시 로그인해 주세요.");
      return;
    }

    if (!nickname || !phone) {
      setErrorMsg("닉네임과 전화번호는 필수입니다.");
      return;
    }

    try {
      // profiles에 upsert
      const { error } = await supabase.from("profiles").upsert({
        user_id: userId,
        nickname: nickname.trim(),
        name: name.trim(),
        phone: phone.trim(),
      });
      if (error) {
        console.error("프로필 업데이트 오류:", error);
        setErrorMsg("저장 중 오류가 발생했습니다.");
        return;
      }

      alert("회원정보가 저장되었습니다!");
      router.push("/");
    } catch (err) {
      console.error("handleSubmit 오류:", err);
      setErrorMsg("저장 중 예기치 않은 오류가 발생했습니다.");
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-4 bg-white shadow">
      <h1 className="text-xl font-bold mb-4">소셜 회원가입 / 프로필 정보</h1>

      {/* 에러 메시지 */}
      {errorMsg && (
        <div className="mb-4 text-sm text-red-500">{errorMsg}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 이름(실명) */}
        <div>
          <label className="block mb-1 font-semibold">이름(실명)</label>
          <input
            type="text"
            className="w-full border rounded px-2 py-2"
            placeholder="예) 홍길동"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        {/* 닉네임 */}
        <div>
          <label className="block mb-1 font-semibold">닉네임</label>
          <input
            type="text"
            className="w-full border rounded px-2 py-2"
            placeholder="사용할 닉네임"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            required
          />
        </div>

        {/* 전화번호 */}
        <div>
          <label className="block mb-1 font-semibold">전화번호</label>
          <input
            type="tel"
            className="w-full border rounded px-2 py-2"
            placeholder="예) 010-1234-5678"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 text-white rounded py-2 font-semibold hover:bg-blue-500"
        >
          회원 가입 완료
        </button>
      </form>
    </div>
  );
}