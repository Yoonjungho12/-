// src/app/(chat)/messages/[senderId]/page.js
"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseF";

// (A) 날짜 포맷 함수
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

  if (isToday) {
    return `${strH}:${strM}`;
  }
  const sameYear = yyyy === now.getFullYear();
  if (sameYear) {
    return `${mm}-${dd} ${strH}:${strM}`;
  }
  return `${yyyy}-${mm}-${dd} ${strH}:${strM}`;
}

export default function ChatPage() {
  const router = useRouter();
  const { senderId } = useParams();

  // (B) Supabase 세션
  const [session, setSession] = useState(null);

  // 상대 닉네임
  const [otherNickname, setOtherNickname] = useState("상대방");

  // 채팅 메시지 목록, 입력값
  const [chatMessages, setChatMessages] = useState([]);
  const [newContent, setNewContent] = useState("");

  // 스크롤 컨테이너 참조
  const scrollContainerRef = useRef(null);

  // ========== 1) 세션 로드 ==========
  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error("세션 로딩 오류:", error);
      } else {
        setSession(data.session);
      }
    });
  }, []);

  // ========== 2) 채팅 로드 함수 ==========
  async function fetchChat(myId, otherId) {
    try {
      // (A) 내가 받은 (상대→나) 메시지 → read_at= now
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .match({ sender_id: otherId, receiver_id: myId })
        .is("read_at", null);

      // (B) 전체 대화
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

      // (C) 프로필 닉네임
      const { data: profData } = await supabase
        .from("profiles")
        .select("nickname")
        .eq("user_id", otherId)
        .single();

      setOtherNickname(profData?.nickname || "상대방");
    } catch (err) {
      console.error("채팅 로딩 오류 (catch):", err);
    }
  }

  // ========== 3) useEffect → fetch + 실시간 ==========
  useEffect(() => {
    if (!session?.user?.id || !senderId) return;
    const myId = session.user.id;
    fetchChat(myId, senderId);

    // Realtime
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
          // 상대→나 메시지이면 → read_at= now
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
            next.sort(
              (a, b) => new Date(a.created_at) - new Date(b.created_at)
            );
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

  // ========== 4) 스크롤 맨 아래 ==========
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // ========== 5) 메시지 전송 ==========
  async function handleSendMessage(e) {
    e.preventDefault();
    if (!newContent.trim()) return;

    const myId = session?.user?.id;
    if (!myId) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      const { data, error } = await supabase.from("messages").insert({
        sender_id: myId,
        receiver_id: senderId,
        content: newContent.trim(),
      });

      if (!error) {
        setNewContent("");
      }
    } catch (err) {
      console.error("메시지 전송 오류 (catch):", err);
    }
  }

  // ========== 뒤로가기 ==========
  function handleGoBack() {
    router.push("/messages");
  }

  // ========== (추가) 텍스트 에리어 onFocus ==========
  function handleFocusTextArea() {
    // (1) 약간의 지연 후 자동 스크롤
    // 키보드가 완전히 올라올 때까지 시간이 필요함
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop =
          scrollContainerRef.current.scrollHeight;
      }
    }, 100); 
  }

  // ========== UI ==========
  return (
    /* 
      - 여기서 100dvh - 60px로 화면 높이 지정 (툴바 제외)
      - paddingBottom으로 iOS 홈인디케이터 safe area 고려 (필요하다면)
      - 키보드 포커스 시 scrollTop 조정
    */
    <div
      className="
        flex
        flex-col
        bg-gray-50

        mt-[30px]
        h-[calc(100dvh-60px)]
        md:mt-[28px]
        md:h-[calc(100dvh-116px)]
      "
      style={{
        // (옵션) iOS 홈인디케이터 영역 고려
        paddingBottom: "env(safe-area-inset-bottom)", 
      }}
    >
      {/* (B) 채팅 헤더 (PC용) */}
      <div className="flex-none border-b border-gray-200 p-4 flex items-center justify-between bg-white md:flex hidden">
        <button
          onClick={handleGoBack}
          className="text-gray-600 hover:text-orange-500 mr-2"
        >
          &larr;
        </button>
        <div className="text-lg font-semibold text-gray-800 ">
          {otherNickname}
        </div>
        <div />
      </div>

      {/* (C) 채팅 목록 (스크롤) */}
      <div ref={scrollContainerRef} className="flex-1 p-3 overflow-y-auto">
        {chatMessages.length === 0 && (
          <div className="text-sm text-gray-500">대화가 없습니다.</div>
        )}
        {chatMessages.map((msg) => {
          const isMine = msg.sender_id === session?.user?.id;
          return (
            <div
              key={msg.id}
              className={`mb-2 w-full flex ${
                isMine ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`
                  max-w-[70%] p-2 text-sm shadow-sm
                  ${
                    isMine
                      ? "bg-orange-400 text-white rounded-tl-2xl rounded-br-2xl rounded-bl-2xl"
                      : "bg-white text-gray-800 rounded-tr-2xl rounded-br-2xl rounded-bl-2xl"
                  }
                `}
              >
                <div className="whitespace-pre-wrap break-words">
                  {msg.content}
                </div>

                {/* 시간+읽음 */}
                <div className="mt-1 text-xs opacity-80 text-right">
                  {formatChatTime(msg.created_at)}
                  {isMine ? (
                    msg.read_at ? (
                      <span className="ml-1 text-white">읽음</span>
                    ) : (
                      <span className="ml-1 text-gray-300">...</span>
                    )
                  ) : msg.read_at ? (
                    <span className="ml-1 text-blue-600">읽음</span>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* (D) 입력 영역 (하단) */}
      <form
        onSubmit={handleSendMessage}
        className="flex-none border-t border-gray-200 p-3 bg-white"
      >
        <div className="flex items-center gap-2">
          <textarea
            rows={1}
            className="
              flex-1
              border border-gray-300
              rounded-md p-2
              text-base
              focus:outline-none
              focus:ring-1
              focus:ring-orange-400
              resize-none
            "
            placeholder="메시지를 입력하세요"
            value={newContent}
            onFocus={handleFocusTextArea}
            onChange={(e) => setNewContent(e.target.value)}
          />
          <button
            type="submit"
            className="bg-orange-500 text-white rounded-md px-4 py-2 text-sm hover:bg-orange-600"
          >
            전송
          </button>
        </div>
      </form>
    </div>
  );
}