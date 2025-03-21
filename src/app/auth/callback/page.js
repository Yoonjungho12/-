"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseF"; // ★ 클라이언트 전용 Supabase 객체 (anon key)

export default function AuthCallbackPage() {
  const [message, setMessage] = useState("처리 중입니다...");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // 1) ?provider=google 등 파라미터 확인
    const provider = searchParams.get("provider") || "unknown";
    
    // 2) 브라우저 URL에서 해시 부분(#access_token=...) 가져오기
    const currentUrl = window.location.href;
    const hashIndex = currentUrl.indexOf("#");
    if (hashIndex < 0) {
      console.log("해시(#) 파라미터가 전혀 없습니다.");
      setMessage("해시 파라미터가 없습니다. 세션 설정 불가!");
      return;
    }

    // 3) '#' 뒤 문자열만 파싱
    const hashString = currentUrl.substring(hashIndex + 1); 
    // 예: "access_token=xxxx&refresh_token=yyyy&..."
    const params = new URLSearchParams(hashString);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");

    if (!accessToken) {
      setMessage("access_token이 없습니다. 세션 설정 불가!");
      return;
    }

    // 4) Supabase 세션 설정
    supabase.auth
      .setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      })
      .then(async ({ data, error }) => {
        if (error) {
          console.error("setSession 에러:", error);
          setMessage("세션 설정 에러: " + error.message);
          return;
        }
        console.log("=== Supabase 세션 설정 완료 ===", data);

        // 5) 이제 유저 정보 조회
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData?.user) {
          console.error("유저 조회 에러:", userError);
          setMessage("유저 조회 실패: " + (userError?.message || "알 수 없는 오류"));
          return;
        }

        const user = userData.user;
        console.log("user 전체 정보:", user);
        const userId = user.id;
        const email = user.email || user.user_metadata?.email;
        
        // 6) provider별 닉네임 로직 (원하면)
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
        //    => 있으면 홈(/)으로, 없으면 /socialSignUp으로
        const { data: existingProfile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("user_id", userId)
          .maybeSingle(); 
          // maybeSingle() -> 없으면 null, 있으면 해당 row

        if (profileError) {
          console.error("프로필 조회 에러:", profileError);
          setMessage("프로필 조회 실패: " + profileError.message);
          return;
        }

        if (existingProfile) {
          // 이미 프로필이 있으므로 메인 페이지로 이동
          console.log("기존 프로필이 있음 -> 루트(/) 이동");
          router.push("/");
        } else {
          // 프로필이 없다면, /socialSignUp으로 이동
          console.log("기존 프로필이 없음 -> /socialSignUp 이동");
          router.push("/socialSignUp");
        }
      })
      .catch((err) => {
        console.error("setSession() 중 에러:", err);
        setMessage("세션 설정 중 에러: " + err.message);
      });
  }, [searchParams, router]);

  return  (  <div style={styles.container}>
      <div style={styles.spinner}></div>
      <p style={styles.text}>로딩 중입니다. 잠시만 기다려 주세요...</p>

      {/* 인라인 스타일 대신 별도의 CSS 모듈이나 Tailwind를 사용하셔도 됩니다. */}
      <style>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
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
