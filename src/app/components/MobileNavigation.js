"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * MobileBottomNav
 *  - 모바일 하단 고정
 *  - 왼쪽부터 [전체, 홈, 내주변, 마이페이지]
 *  - 마지막 스캐너 아이콘(예시)은 제거
 */
export default function MobileBottomNav() {
  const pathname = usePathname();

  const navItems = [
    {
      label: "전체",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      ),
      href: "/all",
    },
    {
      label: "홈",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 9.5l9-7 9 7V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"></path>
        </svg>
      ),
      href: "/",
    },
    {
      label: "내주변",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="10" r="3"></circle>
          <path d="M12 2v2"></path>
          <path d="M12 20v2"></path>
          <path d="M20 10h2"></path>
          <path d="M2 10H4"></path>
        </svg>
      ),
      href: "/near-me",
    },
    {
      label: "마이페이지",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M4 21v-2a4 4 0 0 1 3-3.87"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      ),
      href: "/mypage",
    },
    // 스캐너 아이콘/버튼은 제거했습니다.
  ];

  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        height: "60px",
        background: "#fff",
        borderTop: "1px solid #ccc",
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        zIndex: 999,
      }}
    >
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.label + item.href}
            href={item.href}
            style={{
              flex: 1,
              textAlign: "center",
              textDecoration: "none",
              color: isActive ? "#ff5349" : "#aaa",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              fontSize: "12px",
            }}
          >
            <div style={{ fontSize: "24px" }}>{item.icon}</div>
            {item.label && <div>{item.label}</div>}
          </Link>
        );
      })}
    </nav>
  );
}