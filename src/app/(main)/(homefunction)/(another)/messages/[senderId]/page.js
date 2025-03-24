"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseF";

function isIosDevice() {
  if (typeof window === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function formatChatTime(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  const now = new Date();
  const yyyy = d.getFullYear();
  const mm = d.getMonth() + 1;
  const dd = d.getDate();
  const hh = d.getHours();
  const min = d.getMinutes();

  const strH = String(hh).padStart(2, "0");
  const strM = String(min).padStart(2, "0");
  const isToday =
    yyyy === now.getFullYear() &&
    mm === now.getMonth() + 1 &&
    dd === now.getDate();
  if (isToday) return `${strH}:${strM}`;

  const sameYear = yyyy === now.getFullYear();
  if (sameYear) {
    return `${mm}-${dd} ${strH}:${strM}`;
  }
  return `${yyyy}-${mm}-${dd} ${strH}:${strM}`;
}

export default function ChatPage() {
  const router = useRouter();
  const { senderId } = useParams();

  const [session, setSession] = useState(null);
  const [otherNickname, setOtherNickname] = useState("상대방");
  const [chatMessages, setChatMessages] = useState([]);
  const [newContent, setNewContent] = useState("");

  const isIos = isIosDevice();
  const prevVisualViewport = useRef(0);

  // 마지막 메시지 ref
  const lastMsgRef = useRef(null);

  // 세션 로딩
  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error("세션 로딩 오류:", error);
      } else {
        setSession(data.session);
      }
    });
  }, []);

  // 채팅 로드
  async function fetchChat(myId, otherId) {
    try {
      // 상대→나 read_at 처리
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .match({ sender_id: otherId, receiver_id: myId })
        .is("read_at", null);

      const { data, error } = await supabase
        .from("messages")
        .select(`
          id,
          sender_id,
          receiver_id,
          content,
          created_at,
          read_at,
          sender_profiles:profiles!fk_sender ( nickname ),
          receiver_profiles:profiles!fk_receiver ( nickname )
        `)
        .or(
          `and(sender_id.eq.${myId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${myId})`
        )
        .order("created_at", { ascending: true });

      if (!error && data) {
        setChatMessages(data);
      }

      // 상대 닉네임
      const { data: profData } = await supabase
        .from("profiles")
        .select("nickname")
        .eq("user_id", otherId)
        .single();
      if (profData?.nickname) {
        setOtherNickname(profData.nickname);
      }
    } catch (err) {
      console.error("채팅 로드 오류:", err);
    }
  }

  // 초기 & 실시간
  useEffect(() => {
    if (!session?.user?.id || !senderId) return;
    const myId = session.user.id;

    fetchChat(myId, senderId);

    const channel = supabase.channel("chat-realtime");
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "messages" },
      async (payload) => {
        const { new: newRow, eventType } = payload;
        const relevant =
          (newRow.sender_id === myId && newRow.receiver_id === senderId) ||
          (newRow.sender_id === senderId && newRow.receiver_id === myId);

        if (!relevant) return;

        if (eventType === "INSERT") {
          let finalRow = newRow;
          if (newRow.sender_id === senderId && newRow.receiver_id === myId) {
            const { data: updated } = await supabase
              .from("messages")
              .update({ read_at: new Date().toISOString() })
              .match({ id: newRow.id })
              .select("*");
            if (updated && updated.length > 0) {
              finalRow = updated[0];
            }
          }
          setChatMessages((prev) => {
            const next = [...prev, finalRow];
            next.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            return next;
          });
        } else if (eventType === "UPDATE") {
          setChatMessages((prev) => {
            const list = [...prev];
            const idx = list.findIndex((m) => m.id === newRow.id);
            if (idx !== -1) {
              list[idx] = newRow;
            }
            return list;
          });
        }
      }
    );
    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session, senderId]);

  // 스크롤
  useEffect(() => {
    if (lastMsgRef.current) {
      lastMsgRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  // 메시지 전송
  async function handleSendMessage(e) {
    e.preventDefault();
    if (!newContent.trim()) return;
    const myId = session?.user?.id;
    if (!myId) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: myId,
        receiver_id: senderId,
        content: newContent.trim(),
      });
      if (!error) setNewContent("");
    } catch (err) {
      console.error("메시지 전송 오류:", err);
    }
  }

  // 뒤로가기
  function handleGoBack() {
    router.push("/messages");
  }

  // iOS
  useEffect(() => {
    if (!isIos) return;
    function handleViewportResize() {
      const currentHeight = window.visualViewport.height;
      const isMdUp = window.innerWidth >= 768;
      const offset = isMdUp ? 116 : 60;

      if (currentHeight < prevVisualViewport.current) {
        // 키보드 올라옴
        const scrollHeight = document.scrollingElement.scrollHeight;
        const scrollTop = scrollHeight - (currentHeight - offset);
        window.scrollTo({ top: scrollTop, behavior: "smooth" });
      }
      prevVisualViewport.current = currentHeight;
    }
    window.visualViewport.addEventListener("resize", handleViewportResize);
    return () => {
      window.visualViewport.removeEventListener("resize", handleViewportResize);
    };
  }, [isIos]);

  function handleFocusTextArea() {
    setTimeout(() => {
      if (lastMsgRef.current) {
        lastMsgRef.current.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  }

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* 상단 헤더 (PC 전용, 흰색) */}
      <div
        className="
          hidden md:flex items-center justify-between
          border-b border-gray-200 
          bg-white 
          p-4 
          fixed
          w-full
          top-0 
          z-50
          h-[60px]
        "
      >
        <button
          onClick={handleGoBack}
          className="text-gray-600 hover:text-orange-500 mr-2"
        >
          &larr;
        </button>
        <div className="text-lg font-semibold text-gray-800">{otherNickname}</div>
        <div />
      </div>

      {/* 채팅 영역: flex-1, flex, flex-col => 메시지들 아래 정렬 */}
      <div
        className="
          flex-1 
          flex
          flex-col
          bg-gray-50 
          pt-[60px] /* 헤더 높이 */
          pb-[66px] /* 하단 입력창 높이 */
          overflow-y-auto
        "
      >
        {/* 메시지 래퍼: mt-auto → 맨 아래 정렬 */}
        <div className="mt-auto p-3">
          {chatMessages.length === 0 ? (
            <div className="text-sm text-gray-200">대화가 없습니다.</div>
          ) : (
            chatMessages.map((msg, idx) => {
              const isMine = msg.sender_id === session?.user?.id;
              const isLast = idx === chatMessages.length - 1;
              return (
                <div
                  key={msg.id}
                  ref={isLast ? lastMsgRef : null}
                  className={`mb-2 w-full flex ${isMine ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] p-2 text-sm shadow-sm ${
                      isMine
                        ? "bg-orange-400 text-white rounded-tl-2xl rounded-br-2xl rounded-bl-2xl"
                        : "bg-white text-gray-800 rounded-tr-2xl rounded-br-2xl rounded-bl-2xl"
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                    <div className="mt-1 text-xs opacity-80 text-right">
                      {formatChatTime(msg.created_at)}
                      {isMine ? (
                        msg.read_at ? (
                          <span className="ml-1 text-white">읽음</span>
                        ) : (
                          <span className="ml-1 text-gray-300" />
                        )
                      ) : msg.read_at ? (
                        <span className="ml-1 text-blue-200">읽음</span>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 입력 영역 (하단 fixed, 흰색) */}
      <form
        onSubmit={handleSendMessage}
        className="
          border-t border-gray-200 
          bg-white 
          p-3 
          fixed
          w-full
          bottom-0
          z-50
          h-[66px]
        "
      >
        <div className="flex items-center gap-2 h-full">
          <textarea
            rows={1}
            className="
              flex-1 border border-gray-300 
              rounded-md p-2 text-base 
              focus:outline-none focus:ring-1 focus:ring-orange-400 
              resize-none h-full
            "
            placeholder="메시지를 입력하세요 (Shift+Enter 줄바꿈)"
            value={newContent}
            onFocus={handleFocusTextArea}
            onKeyDown={handleKeyDown}
            onChange={(e) => setNewContent(e.target.value)}
          />
          <button
            type="submit"
            className="
              bg-orange-500 text-white 
              rounded-md 
              px-3 py-2 text-sm 
              hover:bg-orange-600 
              h-full
            "
          >
            전송
          </button>
        </div>
      </form>
    </div>
  );
}