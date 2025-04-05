"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseF"; // ★ 클라이언트 전용 Supabase 객체 (anon key)

export default function AuthCallbackPage() {
  const [message, setMessage] = useState("처리 중입니다...");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    let timeoutId;
    
    const handleAuth = async () => {
      try {
        // 1) ?provider=google 등 파라미터 확인
        const provider = searchParams.get("provider") || "unknown";
        
        // 2) 브라우저 URL에서 해시 부분(#access_token=...) 가져오기
        const currentUrl = window.location.href;
        const hashIndex = currentUrl.indexOf("#");
        if (hashIndex < 0) {
          console.log("해시(#) 파라미터가 전혀 없습니다.");
          setMessage("해시 파라미터가 없습니다. 세션 설정 불가!");
          router.push("/");
          return;
        }

        // 3) '#' 뒤 문자열만 파싱
        const hashString = currentUrl.substring(hashIndex + 1); 
        const params = new URLSearchParams(hashString);
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");

        if (!accessToken) {
          setMessage("access_token이 없습니다. 세션 설정 불가!");
          router.push("/");
          return;
        }

        // 4) Supabase 세션 설정
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        if (error) {
          console.error("setSession 에러:", error);
          setMessage("세션 설정 에러: " + error.message);
          router.push("/");
          return;
        }

        console.log("=== Supabase 세션 설정 완료 ===", data);

        // 5) 이제 유저 정보 조회
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user) {
          console.error("유저 조회 에러:", userError);
          setMessage("유저 조회 실패: " + (userError?.message || "알 수 없는 오류"));
          router.push("/");
          return;
        }

        const user = userData.user;
        console.log("user 전체 정보:", user);
        const userId = user.id;
        const email = user.email || user.user_metadata?.email;
        
        // 6) provider별 닉네임 로직
        let nickname = "(소셜 사용자)";
        if (provider === "kakao") {
          nickname = user.user_metadata?.nickname || "(카카오 사용자)";
        } else if (provider === "google") {
          nickname =
            user.user_metadata?.name ||
            user.user_metadata?.full_name ||
            user.user_metadata?.given_name ||
            "(구글 사용자)";
        }

        console.log("=== 로그인된 유저 ===");
        console.log("User ID (UID):", userId);
        console.log("이메일:", email);
        console.log("닉네임:", nickname);

        // 7) DB에 프로필이 있는지 확인
        const { data: existingProfile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle();

        if (profileError) {
          console.error("프로필 조회 에러:", profileError);
          setMessage("프로필 조회 실패: " + profileError.message);
          router.push("/");
          return;
        }

        if (existingProfile) {
          console.log("기존 프로필이 있음 -> 루트(/) 이동");
          router.push("/");
        } else {
          console.log("기존 프로필이 없음 -> /socialSignUp 이동");
          router.push("/socialSignUp");
        }
      } catch (error) {
        console.error("인증 처리 중 에러:", error);
        setMessage("인증 처리 중 에러가 발생했습니다.");
        router.push("/");
      }
    };

    // 타임아웃 설정 (30초)
    timeoutId = setTimeout(() => {
      setMessage("인증 처리 시간이 초과되었습니다.");
      router.push("/");
    }, 30000);

    handleAuth();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [searchParams, router]);

  return (
    <div style={styles.container}>
      <div style={styles.spinner}></div>
      <p style={styles.text}>{message}</p>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '40vh',
    backgroundColor: '#fff',
  },
  spinner: {
    width: '50px',
    height: '50px',
    marginBottom: '16px',
    border: '6px solid #f3f3f3',
    borderTop: '6px solid #3498db',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  text: {
    fontSize: '14px',
    color: '#666',
  },
};
