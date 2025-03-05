"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
// Heroicons
import {
  HomeIcon,
  UsersIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  PaperAirplaneIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";

import { supabase } from "../../lib/supabaseF"; // ← 경로 맞춰주세요!

export default function AdminSidebar() {
  const [isOpen, setIsOpen] = useState(true);

  // ---------------------------------
  // 1) 읽지 않은 제휴신청 건수 (is_read = false)
  // ---------------------------------
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    loadUnreadCount();
  }, []);

  async function loadUnreadCount() {
    try {
      // is_read가 false인 것들의 개수만 가져온다
      const { count, error } = await supabase
        .from("partnershipsubmit") // 테이블명 정확히
        .select("id", { count: "exact", head: true }) // head: true → 실제 rows 안 불러오고 count만!
        .eq("is_read", false);

      if (error) {
        console.error("미확인 제휴신청 카운트 조회 에러:", error);
        return;
      }
      if (count !== null) {
        setUnreadCount(count);
      }
    } catch (err) {
      console.error("unreadCount 조회 중 오류:", err);
    }
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* 사이드바 (왼쪽) */}
      <aside
        className={`${
          isOpen ? "w-64" : "w-20"
        } relative flex flex-col border-r border-gray-200 bg-white transition-all duration-300`}
      >
        {/* 로고 영역 */}
        <div className="flex items-center justify-between p-4">
          <div
            className={`${
              isOpen ? "opacity-100" : "opacity-0"
            } overflow-hidden transition-opacity duration-200`}
          >
            <span className="text-xl font-bold text-blue-600">Admin Panel</span>
          </div>
          {/* 사이드바 열고 닫기 버튼 */}
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

        {/* 메뉴 목록 */}
        <nav className="mt-4 flex-1 space-y-1 px-2">
          <NavItem
            href="/admin"
            icon={<HomeIcon className="h-5 w-5" />}
            label="대시보드"
            isOpen={isOpen}
          />
          <NavItem
            href="/admin/users"
            icon={<UsersIcon className="h-5 w-5" />}
            label="사용자 관리"
            isOpen={isOpen}
          />
          <NavItem
            href="/admin/settings"
            icon={<Cog6ToothIcon className="h-5 w-5" />}
            label="설정"
            isOpen={isOpen}
          />
          {/* 제휴신청 */}
          <NavItem
            href="/master/partnership"
            icon={<PaperAirplaneIcon className="h-5 w-5" />}
            label="제휴신청"
            isOpen={isOpen}
          />
          {/* 쪽지함 메뉴 추가 */}
          <NavItem
            href="/master/messages" // 실제 라우트 경로에 맞춰 수정
            icon={
              <div className="relative">
                <EnvelopeIcon className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-2 -right-2 flex h-4 w-4
                      items-center justify-center rounded-full bg-red-500
                      text-xs font-bold text-white"
                  >
                    {unreadCount}
                  </span>
                )}
              </div>
            }
            label="쪽지함"
            isOpen={isOpen}
          />
        </nav>

        {/* 하단 로그아웃 버튼 */}
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

/**
 * 개별 NavItem 컴포넌트
 * props:
 *  - href: 이동할 링크
 *  - icon: 아이콘 컴포넌트 (Heroicons 등)
 *  - label: 메뉴 이름
 *  - isOpen: 사이드바 열림 상태
 */
function NavItem({ href, icon, label, isOpen }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-md p-2 text-gray-700 hover:bg-gray-100"
    >
      {/* 아이콘 */}
      <div className="text-gray-500">{icon}</div>
      {/* 라벨 (사이드바 열림 상태에 따라 표시) */}
      {isOpen && <span className="text-sm font-medium">{label}</span>}
    </Link>
  );
}