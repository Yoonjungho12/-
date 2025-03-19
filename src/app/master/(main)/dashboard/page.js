"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseF";

// 대시보드 컴포넌트들
import DashboardSummary from "./DashboardSummary";
import PartnershipsDashboardCard from "./PartnershipsDashboardCard";
import CommentsPendingList from "./CommentsPendingList";
import RecentlyJoinedList from "./RecentlyJoinedList";

// 새로 만든 '게시글 승인 대기' 컴포넌트
import PostsPendingList from "./PostsPendingList";

export default function DashboardPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [sessionUserId, setSessionUserId] = useState(null);

  // 세션 체크
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
      {/* 1) 상단 요약 섹션 */}
      <DashboardSummary />

      {/* 2) 기존 파트너십, 댓글, 가입회원 섹션 */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* 왼쪽 영역 */}
        <div className="w-full md:w-1/2 border-gray-200 rounded-md flex flex-col space-y-5">
          <RecentlyJoinedList />
          <PartnershipsDashboardCard />
        </div>

        {/* 오른쪽 영역 */}
        <div className="w-full md:w-1/2 border-gray-200 rounded-md">
          {/* 댓글 승인 대기 */}
          <CommentsPendingList />

          {/* 게시글 승인 대기 (새로 추가) */}
          <div className="mt-4">
            <PostsPendingList />
          </div>
        </div>
      </div>
    </div>
  );
}