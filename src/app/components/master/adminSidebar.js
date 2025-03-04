'use client';
import React, { useState } from 'react';
import Link from 'next/link';
import {
  HomeIcon,
  UsersIcon,
  Cog6ToothIcon,
  ArrowLeftOnRectangleIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';

export default function AdminSidebar() {
  // 모바일 사이즈에서 사이드바를 접었다 폈다 할 수 있는 상태
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* 사이드바 (왼쪽) */}
      <aside
        className={`${
          isOpen ? 'w-64' : 'w-20'
        } relative flex flex-col border-r border-gray-200 bg-white transition-all duration-300`}
      >
        {/* 로고 영역 */}
        <div className="flex items-center justify-between p-4">
          <div
            className={`${
              isOpen ? 'opacity-100' : 'opacity-0'
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
                isOpen ? '' : 'rotate-180'
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
          {/* 제휴신청 메뉴 추가 */}
          <NavItem
            href="/master/partnership"
            icon={<PaperAirplaneIcon className="h-5 w-5" />}
            label="제휴신청"
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
      {/* 라벨 (사이드바가 열려있을 때만 보임) */}
      {isOpen && <span className="text-sm font-medium">{label}</span>}
    </Link>
  );
}