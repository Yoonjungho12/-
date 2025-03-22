"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function MobileBottomNav() {
  const pathname = usePathname();

  // ─────────────────────────────────────────
  // (A) /messages/[something] 이면 언마운트
  // ─────────────────────────────────────────
  // 예) pathname = "/messages/abc123" → split("/") → ["messages","abc123"]
  const segments = pathname.split("/").filter(Boolean); 
  if (segments[0] === "messages" && segments.length > 1) {
    return null; // /messages/동적 -> 안보이게(언마운트)
  }

  // ─────────────────────────────────────────
  // (B) 네비 아이템 목록
  // ─────────────────────────────────────────
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
          <path d="M12 21s8-4.438 8-10a8 8 0 10-16 0c0 5.562 8 10 8 10z" />
          <circle cx="12" cy="11" r="3" />
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
  ];

  // ─────────────────────────────────────────
  // (C) 렌더링
  // ─────────────────────────────────────────
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