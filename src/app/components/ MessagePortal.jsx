// app/components/MessagePortal.jsx
"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseF";
import Portal from "./Portal";

function formatLocalTime(isoString) {
  /* ... 동일한 로컬 시간 포맷 함수 ... */
}

export default function MessagePortal({
  onClose,
  myId,
  myNickname,
  unreadCount,
  setUnreadCount,
}) {
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list");
  const [recentList, setRecentList] = useState([]);
  const [selectedOtherId, setSelectedOtherId] = useState(null);
  const [fullMessages, setFullMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");

  useEffect(() => {
    loadRecentConversations();
  }, []);

  async function loadRecentConversations() {
    /* 쪽지 목록 로직 */
  }

  async function openDetail(otherId, msg) {
    /* 상세 대화 로직 */
  }

  async function markAsRead(msg) {
    /* 읽음 처리 */
  }

  async function loadFullConversation(otherId) {
    /* 전체 대화 */
  }

  function handleBack() {
    setView("list");
    setSelectedOtherId(null);
  }

  async function handleSend() {
    /* 메시지 전송 */
  }

  // ★ Portal로 감싸, DOM 트리 밖(#portal-root)으로 이동
  return (
    <Portal>
      <div className="fixed right-0 top-10 z-50 w-[500px] border bg-white shadow-lg">
        {/* (중략) 쪽지 UI */}
        {/* onClose, load, etc. */}
      </div>
    </Portal>
  );
}