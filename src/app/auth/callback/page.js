"use client";
import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseF";

export default function AuthCallbackPage() {
  const [message, setMessage] = useState("처리 중입니다...");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const debug = (msg) => {
      console.log("🔍", msg);
      setMessage(msg);
    };

    const processCallback = async () => {
      const provider = searchParams.get("provider") || "unknown";
      debug(`provider: ${provider}`);

      const currentUrl = window.location.href;
      const hashIndex = currentUrl.indexOf("#");
      if (hashIndex < 0) {
        debug("❌ 해시(#) 파라미터 없음");
        return;
      }

      const hashString = currentUrl.substring(hashIndex + 1);
      const params = new URLSearchParams(hashString);
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");

      if (!accessToken) {
        debug("❌ access_token 없음");
        return;
      }

      debug("✅ access_token 수신, 세션 설정 시도");
      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (sessionError) {
        debug("❌ setSession 에러: " + sessionError.message);
        return;
      }

      debug("✅ 세션 설정 완료 → 유저 조회");
      await new Promise((r) => setTimeout(r, 500)); // 세션 적용 대기

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user) {
        debug("❌ 유저 조회 실패: " + (userError?.message || "no user"));
        return;
      }

      const user = userData.user;
      const userId = user.id;
      debug(`✅ 유저 조회 완료: ${user.email || user.user_metadata?.email}`);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      if (profileError) {
        debug("❌ 프로필 조회 실패: " + profileError.message);
        return;
      }

      if (profile) {
        debug("✅ 기존 프로필 있음 → /로 이동");
        router.push("/");
      } else {
        debug("ℹ️ 프로필 없음 → /socialSignUp 으로 이동");
        router.push("/socialSignUp");
      }
    };

    processCallback().catch((err) => {
      console.error("🚨 콜백 처리 중 치명적 에러:", err);
      setMessage("콜백 처리 중 예외 발생: " + err.message);
    });
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
    display: "flex", flexDirection: "column", alignItems: "center",
    justifyContent: "center", height: "40vh", backgroundColor: "#fff",
  },
  spinner: {
    width: "50px", height: "50px", marginBottom: "16px",
    border: "6px solid #f3f3f3", borderTop: "6px solid #3498db",
    borderRadius: "50%", animation: "spin 1s linear infinite",
  },
  text: {
    fontSize: "14px", color: "#666",
  },
};