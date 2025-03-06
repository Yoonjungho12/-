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
import { supabase } from "../../lib/supabaseF";

export default function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(true);

  // partnershipsubmit 미확인 건수
  const [unreadPartnershipCount, setUnreadPartnershipCount] = useState(0);

  useEffect(() => {
    loadPartnershipUnreadCount();
  }, []);

  async function loadPartnershipUnreadCount() {
    try {
      const { count, error } = await supabase
        .from("partnershipsubmit")
        .select("id", { count: "exact", head: true })
        .eq("is_read", false);

      if (error) {
        console.error("미확인 제휴 카운트 조회 에러:", error);
        return;
      }
      if (count !== null) {
        setUnreadPartnershipCount(count);
      }
    } catch (err) {
      console.error("unreadPartnershipCount 조회 오류:", err);
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <aside
        className={`${
          isOpen ? "w-64" : "w-20"
        } relative flex flex-col border-r border-gray-200 bg-white transition-all duration-300`}
      >
        {/* 로고 + 사이드바 토글 버튼 */}
        <div className="flex items-center justify-between p-4">
          <div
            className={`${
              isOpen ? "opacity-100" : "opacity-0"
            } overflow-hidden transition-opacity duration-200`}
          >
            <span className="text-xl font-bold text-blue-600">Admin Panel</span>
          </div>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="ml-auto rounded p-2 text-gray-600 hover:bg-gray-100"
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        </div>

        {/* 메뉴 그룹 */}
        <nav className="mt-4 flex-1 space-y-4 px-2">
          {/* 일반 회원 그룹 */}
          <NavCategory label="일반 회원" isOpen={isOpen} />
          <NavItem
            href="/master/users"
            icon={<UsersIcon className="h-5 w-5" />}
            label="사용자 관리"
            isOpen={isOpen}
          />
          {/* ==== 새로 추가된 "전체 댓글" 아이템 ==== */}
          <NavItem
            href="/master/comments" // 원하는 경로로 설정
            icon={<ChatBubbleOvalLeftEllipsisIcon className="h-5 w-5" />}
            label="전체 댓글"
            isOpen={isOpen}
          />

          {/* 제휴 섹션 그룹 */}
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
          />
          <NavItem
            href="/master/partnership"
            icon={<PaperAirplaneIcon className="h-5 w-5" />}
            label="제휴 신청"
            isOpen={isOpen}
            badge={unreadPartnershipCount > 0 && unreadPartnershipCount}
          />

          {/* 기타 그룹 */}
          <NavCategory label="기타" isOpen={isOpen} />
          <NavItem
            href="/admin"
            icon={<HomeIcon className="h-5 w-5" />}
            label="대시보드"
            isOpen={isOpen}
          />
          <NavItem
            href="/master/messages"
            icon={<EnvelopeIcon className="h-5 w-5" />}
            label="쪽지함"
            isOpen={isOpen}
          />
          <NavItem
            href="/admin/settings"
            icon={<Cog6ToothIcon className="h-5 w-5" />}
            label="설정"
            isOpen={isOpen}
          />
        </nav>

        {/* 하단 로그아웃 */}
        <div className="mt-auto p-4">
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
    <div className="px-2 text-xs font-bold uppercase text-gray-400">{label}</div>
  );
}

function NavItem({ href, icon, label, isOpen, badge }) {
  const pathname = usePathname();
  // 현재 경로가 이 아이템의 href(또는 하위 경로)와 일치하면 active 상태
  const isActive = pathname === href || pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-md p-2 ${
        isActive
          ? "bg-blue-100 text-blue-600"
          : "text-gray-700 hover:bg-gray-100"
      }`}
    >
      <div className="relative">
        {icon}
        {badge && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {badge}
          </span>
        )}
      </div>
      {isOpen && <span className="text-sm font-medium">{label}</span>}
    </Link>
  );
}