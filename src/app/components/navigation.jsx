// app/components/navigation.jsx
"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseF";
import { useRouter } from "next/navigation";
import MessagePortal from "./MessagePortal"; // ★ 바뀐 파일

export default function NavBar() {
  const [session, setSession] = useState(null);
  const router = useRouter();

  // 쪽지창 열림 → Portal 렌더 여부
  const [showMsgPortal, setShowMsgPortal] = useState(false);

  const [unreadCount, setUnreadCount] = useState(0);
  const [myNickname, setMyNickname] = useState("");

  // ...
  // (기존 fetchMyProfile, fetchUnreadCount 로직)

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  // 아이콘 클릭 → setShowMsgPortal
  function handleMessageIconClick() {
    if (!session?.user?.id) {
      alert("로그인 필요");
      return;
    }
    setShowMsgPortal((prev) => !prev);
  }

  const isLoggedIn = !!session;

  return (
    <header className="w-full border-b border-gray-200 bg-white">
      <div className="mx-auto hidden max-w-7xl items-center justify-between px-6 py-3 md:flex">
        {/* 로고 */}
        <Link href="/">
          <div className="text-2xl font-bold text-red-500">VIP info</div>
        </Link>

        {/* 검색창 생략 */}

        <div className="flex items-center space-x-7">
          {isLoggedIn ? (
            <>
              <div onClick={handleLogout}>로그아웃</div>
              <div className="relative" onClick={handleMessageIconClick}>
                <svg /* ... */ />
                {unreadCount > 0 && <span>{unreadCount}</span>}
              </div>

              {/* ★ Portal 렌더 */}
              {showMsgPortal && (
                <MessagePortal
                  onClose={() => setShowMsgPortal(false)}
                  myId={session.user?.id}
                  myNickname={myNickname}
                  unreadCount={unreadCount}
                  setUnreadCount={setUnreadCount}
                />
              )}
            </>
          ) : (
            <Link href="/login">로그인</Link>
          )}
        </div>
      </div>
    </header>
  );
}