"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseF";

// 두 개의 컴포넌트 import
import PartnershipsDashboardCard from "./PartnershipsDashboardCard";
import CommentsPendingList from "./CommentsPendingList";

export default function DashboardPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [sessionUserId, setSessionUserId] = useState(null);

  // 우선 상위에서도 세션 체크를 해둡니다.
  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error("세션 체크 에러:", error);
        router.push("/master/login");
        return;
      }
      if (!data.session) {
        router.push("/master/login");
      } else {
        setSessionUserId(data.session.user.id);
        setAuthChecked(true);
      }
    });
  }, [router]);

  if (!authChecked) {
    return <div className="p-4 text-blue-600">로그인 여부 확인 중...</div>;
  }

  return (
    <div className="p-4">
      {/* flex-col → 모바일(기본), md:flex-row → md 이상 사이즈에선 가로배치 */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* 왼쪽 영역 (md일 때 60%) */}
        <div className="w-full md:w-3/5 border border-gray-200 rounded-md">
          <PartnershipsDashboardCard />
        </div>

        {/* 오른쪽 영역 (md일 때 40%) */}
        <div className="w-full md:w-2/5 border border-gray-200 rounded-md">
          <CommentsPendingList />
        </div>
      </div>
    </div>
  );
}