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

  // ★ 사용자에게 안 보이지만, 내부에서 저장만 하는 이메일
  const [email, setEmail] = useState("");

  const [errorMsg, setErrorMsg] = useState("");
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

      // 세션으로부터 userId 설정
      const uid = user.id;
      setUserId(uid);

      // (A) 세션에서 이메일 가져와 저장 (UI에는 노출 안 함)
      const userEmail = user.email || user.user_metadata?.email || "";

      // 닉네임 후보값 (카카오: nickname, 구글: name 등)
      const metaNickname =
        user.user_metadata?.nickname ||
        user.user_metadata?.name ||
        "";

      setEmail(userEmail);       // ★ 사용자 눈에는 안 보이지만 state에 넣음
      setNickname(metaNickname);

      // (B) DB에서 기존 프로필 값 로딩
      fetchProfile(uid, userEmail, metaNickname);
    });
  }, [router]);

  // ─────────────────────────────────────────────────────────
  // DB에서 profiles 조회 → 있으면 기존 값 덮어쓰기
  // ─────────────────────────────────────────────────────────
  async function fetchProfile(uid, userEmail, userNickname) {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("nickname, name, phone, email")
        .eq("user_id", uid)
        .single();

      if (error) {
        // "row가 없음" 에러는 그냥 새로 작성
        if (error.details?.includes("0 rows")) {
          console.log("profiles 테이블에 기록 없음:", error);
          return;
        }
        console.error("profiles 조회 에러:", error);
        return;
      }

      // 이미 profiles row가 있으면 → 기존 값으로 덮어씁니다
      if (data) {
        setNickname(data.nickname || userNickname || "");
        setName(data.name || "");
        setPhone(data.phone || "");
        setEmail(data.email || userEmail || "");
      }
    } catch (err) {
      console.error("profiles 조회 중 오류:", err);
      setErrorMsg("프로필 로딩에 실패했습니다.");
    }
  }

  // ─────────────────────────────────────────────────────────
  // [저장] 버튼 → profiles 업서트
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
      // profiles에 upsert (email은 화면에는 없지만, 내부적으로 저장)
      const { error } = await supabase.from("profiles").upsert({
        user_id: userId,
        email: email.trim(),        // ★ UI에 안 보이지만 db에 저장
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
        {/* (이메일 필드 없음) */}

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
            required
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