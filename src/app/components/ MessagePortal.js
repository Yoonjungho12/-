// app/components/MessagePortal.jsx
"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseF";
import Portal from "./Portal";

function formatLocalTime(isoString) {
  // 기존 함수와 동일...
  // ...
  return "...";
}

/**
 * MessagePortal
 * - Portal을 사용하여, DOM 트리 바깥(#portal-root)에 띄우는 쪽지 UI
 * - NavBar에서 props 전달 (myId, myNickname, unreadCount...)
 */
export default function MessagePortal({
  onClose,
  myId,
  myNickname,
  unreadCount,
  setUnreadCount,
}) {
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list"); // "list" or "detail"

  const [recentList, setRecentList] = useState([]);
  const [selectedOtherId, setSelectedOtherId] = useState(null);
  const [fullMessages, setFullMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");

  useEffect(() => {
    loadRecentConversations();
  }, []);

  async function loadRecentConversations() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`sender_id.eq.${myId},receiver_id.eq.${myId}`)
        .order("created_at", { ascending: false });
      if (error) {
        console.error("loadRecent err:", error);
        setLoading(false);
        return;
      }

      const map = new Map();
      const finalArr = [];

      for (const m of data) {
        const otherId = m.sender_id === myId ? m.receiver_id : m.sender_id;
        if (!map.has(otherId)) {
          map.set(otherId, m);
          finalArr.push(m);
        }
      }

      // 닉네임 fetch
      for (const msg of finalArr) {
        const otherId = msg.sender_id === myId ? msg.receiver_id : msg.sender_id;
        if (!otherId) {
          msg.otherNickname = "(알 수 없음)";
          continue;
        }
        const { data: pData } = await supabase
          .from("profiles")
          .select("nickname")
          .eq("user_id", otherId)
          .single();
        msg.otherNickname = pData?.nickname || "(닉네임 없음)";
      }

      setRecentList(finalArr);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  async function openDetail(otherId, msg) {
    setView("detail");
    setSelectedOtherId(otherId);
    if (!msg.read_at && msg.receiver_id === myId) {
      markAsRead(msg);
    }
    await loadFullConversation(otherId);
  }

  async function markAsRead(msg) {
    try {
      const { error } = await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("id", msg.id);
      if (!error) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("read fail:", err);
    }
  }

  async function loadFullConversation(otherId) {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${myId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${myId})`
        )
        .order("created_at", { ascending: true });
      if (error) {
        console.error("fullConv err:", error);
        setLoading(false);
        return;
      }

      // senderNickname
      for (const msg of data) {
        if (!msg.sender_id) {
          msg.senderNickname = "(알 수 없음)";
          continue;
        }
        const { data: pData } = await supabase
          .from("profiles")
          .select("nickname")
          .eq("user_id", msg.sender_id)
          .single();
        msg.senderNickname = pData?.nickname || "(닉네임 없음)";
      }

      setFullMessages(data || []);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  }

  function handleBack() {
    setView("list");
    setSelectedOtherId(null);
  }

  async function handleSend() {
    if (!messageInput.trim()) {
      alert("메시지를 입력하세요.");
      return;
    }
    if (!selectedOtherId) {
      alert("상대 정보가 없습니다!");
      return;
    }

    try {
      const { error } = await supabase.from("messages").insert([
        {
          sender_id: myId,
          receiver_id: selectedOtherId,
          content: messageInput,
        },
      ]);
      if (error) {
        alert("전송 실패:" + error.message);
        return;
      }
      setMessageInput("");
      await loadFullConversation(selectedOtherId);
    } catch (err) {
      alert("에러:" + err.message);
    }
  }

  return (
    <Portal>
      <div className="fixed right-0 top-10 z-50 w-[500px] border bg-white shadow-lg">
        {/* 빨간 바 */}
        <div className="flex items-center justify-between bg-red-500 px-4 py-2 text-white">
          {view === "list" ? (
            <span className="font-bold">{myNickname}님의 쪽지함</span>
          ) : (
            <span className="font-bold">상세 대화</span>
          )}
          <button onClick={onClose} className="font-bold text-xl">
            ✕
          </button>
        </div>

        {/* 탭 */}
        <div className="flex space-x-2 border-b border-gray-200 p-2">
          <button className="px-2 py-1 border-b-2 border-red-500">대화내역</button>
          <button className="px-2 py-1">쪽지쓰기</button>
          <button className="px-2 py-1">관리자에게</button>
        </div>

        {/* 내용 */}
        {view === "list" ? (
          <div className="p-4">
            {loading ? (
              <p>로딩중...</p>
            ) : recentList.length === 0 ? (
              <p>쪽지가 없습니다.</p>
            ) : (
              <ul className="space-y-4">
                {recentList.map((m) => {
                  const otherId =
                    m.sender_id === myId ? m.receiver_id : m.sender_id;
                  return (
                    <li
                      key={m.id}
                      className="border-b pb-2 cursor-pointer flex items-start justify-between"
                      onClick={() => openDetail(otherId, m)}
                    >
                      <div className="flex items-start">
                        <div className="mr-2 flex h-12 w-12 items-center justify-center rounded-full bg-pink-500 text-white text-2xl font-bold">
                          V
                        </div>
                        <div className="text-sm">
                          <p className="font-semibold mb-1">
                            {m.otherNickname ?? "(상대 없음)"}
                          </p>
                          <p className="text-gray-700">{m.content}</p>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatLocalTime(m.created_at)}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : (
          <div className="flex h-[300px] flex-col">
            <div className="flex-1 overflow-y-auto p-4">
              <button
                onClick={handleBack}
                className="mb-2 bg-gray-200 px-2 py-1 rounded"
              >
                뒤로가기
              </button>
              {loading ? (
                <p>로딩중...</p>
              ) : fullMessages.length === 0 ? (
                <p>대화 내역이 없습니다.</p>
              ) : (
                fullMessages.map((msg) => {
                  const isMine = msg.sender_id === myId;
                  return (
                    <div
                      key={msg.id}
                      className={`mb-2 flex ${
                        isMine ? "justify-end" : "justify-start"
                      }`}
                    >
                      {!isMine && (
                        <div className="mr-2 flex h-10 w-10 items-center justify-center rounded-full bg-pink-500 text-white text-xl font-bold">
                          {msg.senderNickname?.substring(0, 1) || "?"}
                        </div>
                      )}
                      <div
                        className={`max-w-[70%] p-2 rounded text-sm ${
                          isMine
                            ? "bg-blue-100 text-right"
                            : "bg-gray-100"
                        }`}
                      >
                        {!isMine && (
                          <p className="font-semibold text-xs mb-0.5">
                            {msg.senderNickname}
                          </p>
                        )}
                        <p>{msg.content}</p>
                        <div className="mt-1 text-xs text-gray-400">
                          {formatLocalTime(msg.created_at)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {/* 입력창 */}
            <div className="border-t p-3">
              <textarea
                className="w-full border border-gray-300 rounded p-1 text-sm"
                rows={2}
                placeholder="메시지를 입력하세요..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
              />
              <div className="mt-2 text-right">
                <button
                  onClick={handleSend}
                  className="bg-blue-500 text-white px-4 py-1 rounded text-sm"
                >
                  보내기
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="p-3 text-sm text-gray-500">
          쪽지는 20일 동안 저장됩니다.
        </div>
      </div>
    </Portal>
  );
}