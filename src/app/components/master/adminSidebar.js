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
  BriefcaseIcon,
} from "@heroicons/react/24/outline";
import { supabase } from "../../lib/supabaseF";

export default function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(true);

  // ★ "is_admitted=false"인 개수(제휴 신청)
  const [partnershipCount, setPartnershipCount] = useState(0);
  // ★ "is_admitted=true && final_admitted=false"인 개수(최종 승인 대기)
  const [finalPendingCount, setFinalPendingCount] = useState(0);
  // ★ comments.is_admitted=false인 댓글 개수 (댓글 미승인)
  const [commentsCount, setCommentsCount] = useState(0);

  // 현재 로그인 사용자의 닉네임과 user_id
  const [nickname, setNickname] = useState("");
  const [myUid, setMyUid] = useState("");

  // "읽지 않은" 쪽지 개수 (내 계정으로 온 메시지 중 read_at이 null)
  const [unreadCount, setUnreadCount] = useState(0);

  // --------------------------
  // (1) 로그인된 유저 정보 (user_id, 닉네임) 가져오기
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
  // (2) 제휴, 댓글, 쪽지 건수 로딩
  // --------------------------
  useEffect(() => {
    loadPartnershipCounts();
  }, []);

  async function loadPartnershipCounts() {
    try {
      // (A) 제휴 신청: is_admitted=false
      const { count: admittedFalseCount, error: admittedFalseError } =
        await supabase
          .from("partnershipsubmit")
          .select("id", { count: "exact", head: true })
          .eq("is_admitted", false);

      if (admittedFalseError) {
        console.error("is_admitted=false 카운트 조회 에러:", admittedFalseError);
      } else if (admittedFalseCount !== null) {
        setPartnershipCount(admittedFalseCount);
      }

      // (B) 최종 승인 대기: is_admitted=true & final_admitted=false
      const { count: finalFalseCount, error: finalFalseError } = await supabase
        .from("partnershipsubmit")
        .select("id", { count: "exact", head: true })
        .eq("is_admitted", true)
        .eq("final_admitted", false);

      if (finalFalseError) {
        console.error(
          "is_admitted=true & final_admitted=false 카운트 조회 에러:",
          finalFalseError
        );
      } else if (finalFalseCount !== null) {
        setFinalPendingCount(finalFalseCount);
      }

      // (C) 댓글 미승인: comments.is_admitted=false
      const { count: cCount, error: cErr } = await supabase
        .from("comments")
        .select("id", { count: "exact", head: true })
        .eq("is_admitted", false);
      if (cErr) {
        console.error("댓글 미승인 건수 조회 에러:", cErr);
      } else if (cCount !== null) {
        setCommentsCount(cCount);
      }
    } catch (err) {
      console.error("loadPartnershipCounts 오류:", err);
    }
  }

  // --------------------------
  // (3) 내 계정으로 온 쪽지 중, 읽지 않은 쪽지 개수 로딩 + 실시간 구독
  // --------------------------
  useEffect(() => {
    if (myUid) {
      fetchUnreadCount(myUid);
      subscribeMessages();   // 메시지 테이블 구독
      subscribePartnership(); // partnershipsubmit 테이블 구독
      subscribeComments();    // comments 테이블 구독
    }
  }, [myUid]);

  async function fetchUnreadCount(uid) {
    try {
      const { count, error } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("receiver_id", uid)
        .is("read_at", null);
      if (error) {
        console.error("unreadCount 조회 오류:", error);
        setUnreadCount(0);
      } else {
        setUnreadCount(count || 0);
      }
    } catch (err) {
      console.error("unreadCount 로딩 오류:", err);
      setUnreadCount(0);
    }
  }

  // --------------------------
  // (A) messages 테이블 실시간 구독 (이미 있음)
  // --------------------------
  function subscribeMessages() {
    const channel = supabase.channel("admin-sidebar-messages-realtime");
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "messages" },
      (payload) => {
        console.log("AdminSidebar Realtime - messages:", payload);
        // 새 메시지 or read_at 업데이트 등 → 다시 unreadCount 가져오기
        if (myUid) {
          fetchUnreadCount(myUid);
        }
      }
    );
    channel.subscribe();
  }

  // --------------------------
  // (B) partnershipsubmit 테이블 실시간 구독
  // --------------------------
  function subscribePartnership() {
    const channel = supabase.channel("admin-sidebar-partnershipsubmit-realtime");
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "partnershipsubmit" },
      (payload) => {
        console.log("AdminSidebar Realtime - partnershipsubmit:", payload);
        // 제휴 신청, 최종 승인 대기에 영향 → 다시 loadPartnershipCounts()
        loadPartnershipCounts();
      }
    );
    channel.subscribe();
  }

  // --------------------------
  // (C) comments 테이블 실시간 구독
  // --------------------------
  function subscribeComments() {
    const channel = supabase.channel("admin-sidebar-comments-realtime");
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "comments" },
      (payload) => {
        console.log("AdminSidebar Realtime - comments:", payload);
        // 댓글 승인 여부에 영향 → 다시 loadPartnershipCounts()
        loadPartnershipCounts();
      }
    );
    channel.subscribe();
  }

  return (
    <div className="flex min-h-screen bg-zinc-100">
      <aside
        className={`${
          isOpen ? "w-64" : "w-20"
        } relative flex flex-col bg-zinc-800 shadow-md transition-all duration-300`}
      >
        {/* 로고 + 토글 버튼 */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-700">
          <div
            className={`${
              isOpen ? "opacity-100" : "opacity-0"
            } overflow-hidden transition-opacity duration-200`}
          >
            <h1 className="text-xl font-bold text-white">관리자 페이지</h1>
            <h2 className="text-white">{nickname ? ` ${nickname}` : ""}</h2>
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="ml-auto rounded p-2 text-zinc-300 hover:bg-zinc-700"
          >
            <svg
              className={`h-5 w-5 transform transition-transform ${
                isOpen ? "" : "rotate-180"
              }`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* 메뉴 그룹 */}
        <nav className="mt-4 flex-1 space-y-4 px-2">
          {/* 대시보드 */}
          <NavItem
            href="/master/dashboard"
            icon={<HomeIcon className="h-5 w-5" />}
            label="대시보드"
            isOpen={isOpen}
          />

          {/* 일반 회원 */}
          <NavCategory label="일반 회원" isOpen={isOpen} />
          <NavItem
            href="/master/users"
            icon={<UsersIcon className="h-5 w-5" />}
            label="사용자 관리"
            isOpen={isOpen}
          />
          <NavItem
            href="/master/comments"
            icon={<ChatBubbleOvalLeftEllipsisIcon className="h-5 w-5" />}
            label="전체 댓글"
            isOpen={isOpen}
            badge={commentsCount > 0 && commentsCount}
          />

          {/* 제휴 섹션 */}
          <NavCategory label="제휴 섹션" isOpen={isOpen} />
          <NavItem
            href="/master/legitPartner"
            icon={<PaperAirplaneIcon className="h-5 w-5" />}
            label="제휴 고객"
            isOpen={isOpen}
          />
          <NavItem
            href="/master/finalPending"
            icon={<CheckBadgeIcon className="h-5 w-5" />}
            label="최종 승인 대기"
            isOpen={isOpen}
            badge={finalPendingCount > 0 && finalPendingCount}
          />
          <NavItem
            href="/master/partnership"
            icon={<PaperAirplaneIcon className="h-5 w-5" />}
            label="제휴 신청"
            isOpen={isOpen}
            badge={partnershipCount > 0 && partnershipCount}
          />

          {/* 기타 */}
          <NavCategory label="기타" isOpen={isOpen} />
          <NavItem
            href="/master/messages"
            icon={<EnvelopeIcon className="h-5 w-5" />}
            label="쪽지함"
            isOpen={isOpen}
            badge={unreadCount > 0 && unreadCount}
          />
          <NavItem
            href="/master/dashboard"
            icon={<Cog6ToothIcon className="h-5 w-5" />}
            label="설정"
            isOpen={isOpen}
          />
          {/* 업체 업로드 메뉴 추가 */}
          <NavItem
            href="/master/partnershipUpload"
            icon={<BriefcaseIcon className="h-5 w-5" />}
            label="업체 업로드"
            isOpen={isOpen}
          />
        </nav>

        {/* 로그아웃 */}
        <div className="mt-auto p-4 border-t border-zinc-700">
          <NavItem
            href="/logout"
            icon={<ArrowLeftOnRectangleIcon className="h-5 w-5" />}
            label="로그아웃"
            isOpen={isOpen}
          />
        </div>
      </aside>
    </div>
  );
}

function NavCategory({ label, isOpen }) {
  if (!isOpen) return null;
  return (
    <div className="px-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
      {label}
    </div>
  );
}

function NavItem({ href, icon, label, isOpen, badge }) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href);

  const baseClasses =
    "relative flex items-center gap-3 rounded-md p-2 text-sm font-medium transition-colors";
  const activeClasses = "bg-zinc-700 text-white hover:bg-zinc-700";
  const inactiveClasses = "text-zinc-300 hover:bg-zinc-700 hover:text-white";

  return (
    <Link href={href} className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}>
      <div className="relative">
        {icon}
        {badge && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {badge}
          </span>
        )}
      </div>
      {isOpen && <span>{label}</span>}
    </Link>
  );
}