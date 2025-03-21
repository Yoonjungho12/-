"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Head from "next/head";
import { supabase } from "@/lib/supabaseF";
import AdminSidebar from "../../components/master/adminSidebar";

export default function MasterLayout({ children }) {
  // 관리자 검증이 끝날 때까지 로딩 상태를 표시하기 위한 state
  const [loading, setLoading] = useState(true);

  // Next.js 13 클라이언트 컴포넌트에서 라우팅에 사용
  const router = useRouter();

  // 컴포넌트 마운트 시점에 관리자 계정인지 판별
  useEffect(() => {
    async function checkMaster() {
      try {
        // 1) 세션 가져오기
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.warn("세션 로딩 과정에서 문제가 발생했습니다.", sessionError);
          router.replace("/master/login");
          return;
        }

        const uid = sessionData.session?.user?.id;
        if (!uid) {
          // 로그인 안 되어있는 경우
          console.warn("로그인이 필요합니다. 관리자 영역에 접근 불가합니다.");
          router.replace("/master/login");
          return;
        }

        // 2) profiles 테이블에서 is_master 값 확인
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("is_master")
          .eq("user_id", uid)
          .single();

        if (profileError || !profileData?.is_master) {
          console.warn("관리자 계정이 아닙니다. 접근이 차단됩니다.");
          router.replace("/master/login");
          return;
        }

        // 여기까지 통과하면 관리자 계정!
        setLoading(false);
      } catch (err) {
        console.warn("관리자 계정 확인 중 알 수 없는 문제가 발생했습니다.", err);
        router.replace("/master/login");
      }
    }

    checkMaster();
  }, [router]);

  // 아직 확인 중이면 잠시 로딩중 메시지 띄우기
  if (loading) {
    return (
      <div className="p-4 text-gray-600 text-sm">
        관리자 인증 중... 잠시만 기다려주세요!
      </div>
    );
  }

  // 인증 통과 후에야 실제 Layout 렌더링
  return (
    <>
      <Head>
        <title>관리자페이지</title>
        <meta name="description" content="관리자 전용 페이지입니다." />
      </Head>

      <div className="flex min-h-screen">
        <AdminSidebar />
        <main className="flex-1 p-4 bg-zinc-50">
          {children}
        </main>
      </div>
    </>
  );
}