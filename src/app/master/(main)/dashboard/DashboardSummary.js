"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  UsersIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  PaperAirplaneIcon,
  EnvelopeIcon,
  CheckBadgeIcon,
  ChatBubbleOvalLeftEllipsisIcon,
} from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabaseF";

export default function DashboardSummary() {
  const [loading, setLoading] = useState(true);
  const [partnershipCount, setPartnershipCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0); // 커뮤니티 게시글 승인 대기
  const [unreadMessagesCount, setUnreadMessagesCount] = useState(0); // 읽지 않은 쪽지 건수

  // 현재 로그인 사용자 정보
  const [nickname, setNickname] = useState("");
  const [myUid, setMyUid] = useState("");

  // --------------------------
  // 1) 로그인된 유저 정보 (user_id, 닉네임) 가져오기
  // --------------------------
  useEffect(() => {
    async function fetchUserInfo() {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) {
          throw sessionError;
        }
        if (!session?.user?.id) {
          console.warn("로그인이 필요합니다!");
          return;
        }
        const uid = session.user.id;
        setMyUid(uid);

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("nickname")
          .eq("user_id", uid)
          .single();

        if (profileError) {
          console.error("프로필 조회 오류:", profileError);
        } else {
          setNickname(profileData?.nickname || "");
        }
      } catch (err) {
        console.error("오류:", err);
      }
    }

    fetchUserInfo();
  }, []);

  // --------------------------
  // 2) 요약 데이터 로딩 (제휴 신청, 댓글 승인, 커뮤니티 승인, 읽지 않은 쪽지)
  // --------------------------
  useEffect(() => {
    fetchSummaryCounts();
  }, [myUid]);

  async function fetchSummaryCounts() {
    setLoading(true);
    try {
      // 1) 신규 제휴 신청 (is_admitted=false)
      const { count: pCount, error: pErr } = await supabase
        .from("partnershipsubmit")
        .select("id", { count: "exact", head: true })
        .eq("is_admitted", false);
      if (pErr) {
        console.error("신규 제휴 신청 건수 조회 에러:", pErr);
      }

      // 2) 댓글 승인 대기 (is_admitted=false)
      const { count: cCount, error: cErr } = await supabase
        .from("comments")
        .select("id", { count: "exact", head: true })
        .eq("is_admitted", false);
      if (cErr) {
        console.error("댓글 승인 대기 건수 조회 에러:", cErr);
      }

      // 3) 커뮤니티 게시글 승인 대기 (posts.is_admitted=false)
      const { count: postCount, error: postErr } = await supabase
        .from("posts")
        .select("id", { count: "exact", head: true })
        .eq("is_admitted", false);
      if (postErr) {
        console.error("커뮤니티 글 승인 대기 건수 조회 에러:", postErr);
      }

      // 4) 읽지 않은 쪽지 (내가 receiver인 메시지 중 read_at IS NULL)
      let mCount = 0;
      if (myUid) {
        const { count, error: mErr } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("receiver_id", myUid)
          .is("read_at", null);
        if (mErr) {
          console.error("읽지 않은 쪽지 조회 에러:", mErr);
        } else {
          mCount = count || 0;
        }
      }

      // 결과 설정
      setPartnershipCount(pCount || 0);
      setCommentsCount(cCount || 0);
      setPostsCount(postCount || 0);
      setUnreadMessagesCount(mCount);
    } catch (err) {
      console.error("요약 섹션 데이터 조회 중 오류:", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white border border-slate-200 rounded-md shadow-sm p-4 mb-4">
        <div className="text-sm text-slate-500">요약 데이터 불러오는 중...</div>
      </div>
    );
  }

  // 전체 합 (모든 항목 합계)
  const total = partnershipCount + commentsCount + postsCount + unreadMessagesCount;

  return (
    <div className="bg-white border border-slate-200 rounded-md shadow-sm p-4 mb-4">
      {/* 상단 타이틀 영역 */}
      <div className="flex items-center gap-2 mb-2">
        <div className="text-lg font-semibold text-slate-700">오늘의 알림</div>
        <div className="w-6 h-6 bg-red-500 text-white text-xs flex items-center justify-center rounded-full font-bold">
          {total}
        </div>
      </div>

      {/* 항목들 */}
      <div className="flex flex-wrap gap-4 text-sm text-slate-700">
        <div>
          <span className="font-semibold">신규 제휴 신청</span>{" "}
          <span className="text-red-500 font-bold">{partnershipCount}</span>
        </div>
        <div>
          <span className="font-semibold">댓글 승인 대기</span>{" "}
          <span className="text-red-500 font-bold">{commentsCount}</span>
        </div>
        <div>
          <span className="font-semibold">커뮤니티 승인 대기</span>{" "}
          <span className="text-red-500 font-bold">{postsCount}</span>
        </div>
        <div>
          <span className="font-semibold">읽지 않은 쪽지</span>{" "}
          <span className="text-red-500 font-bold">{unreadMessagesCount}</span>
        </div>
      </div>
    </div>
  );
}