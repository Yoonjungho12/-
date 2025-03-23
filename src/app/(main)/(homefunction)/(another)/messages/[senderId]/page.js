// src/app/(chat)/messages/[senderId]/page.js
"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseF";

/* ===============================
   (1) iOS 기기 판별 함수
   (단순 userAgent 검사 예시)
=============================== */
function isIosDevice() {
  if (typeof window === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/* ===============================
   (2) 날짜/시간 포맷 함수
=============================== */
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

/* ===============================
   (3) 메인 채팅 컴포넌트
=============================== */
export default function ChatPage() {
  const router = useRouter();
  const { senderId } = useParams();

  // 세션 정보
  const [session, setSession] = useState(null);

  // 상대방 닉네임
  const [otherNickname, setOtherNickname] = useState("상대방");

  // 채팅 메시지, 입력값
  const [chatMessages, setChatMessages] = useState([]);
  const [newContent, setNewContent] = useState("");

  // 채팅 스크롤 컨테이너
  const scrollContainerRef = useRef(null);

  // iOS 여부
  const isIos = isIosDevice();
  // 이전 visualViewport.height
  const prevVisualViewport = useRef(0);

  /* ========== (A) 세션 로드 ========== */
  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error("세션 로딩 오류:", error);
      } else {
        setSession(data.session);
      }
    });
  }, []);

  /* ========== (B) 채팅 로드 함수 ========== */
  async function fetchChat(myId, otherId) {
    try {
      // (B-1) 상대→나 메시지 → read_at 처리
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .match({ sender_id: otherId, receiver_id: myId })
        .is("read_at", null);

      // (B-2) 전체 대화 조회
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

      // (B-3) 상대 닉네임 불러오기
      const { data: profData } = await supabase
        .from("profiles")
        .select("nickname")
        .eq("user_id", otherId)
        .single();

      if (profData?.nickname) {
        setOtherNickname(profData.nickname);
      } else {
        setOtherNickname("상대방");
      }
    } catch (err) {
      console.error("채팅 로드 오류:", err);
    }
  }

  /* ========== (C) 초기 로드 + 실시간 ========== */
  useEffect(() => {
    if (!session?.user?.id || !senderId) return;
    const myId = session.user.id;

    // 채팅 초기 로드
    fetchChat(myId, senderId);

    // Realtime
    const channel = supabase.channel("chat-realtime");
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "messages" },
      async (payload) => {
        const { new: newRow, eventType } = payload;
        // 나와 상대에 해당하는 메시지만
        const relevant =
          (newRow.sender_id === myId && newRow.receiver_id === senderId) ||
          (newRow.sender_id === senderId && newRow.receiver_id === myId);

        if (!relevant) return;

        if (eventType === "INSERT") {
          let finalRow = newRow;
          // 상대→나 → read_at 처리
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
          // 업데이트 반영
          setChatMessages((prev) => {
            const list = [...prev];
            const idx = list.findIndex((m) => m.id === newRow.id);
            if (idx !== -1) list[idx] = newRow;
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

  /* ========== (D) 메시지 목록 변경 시 맨 아래 스크롤 ========== */
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  /* ========== (E) 메시지 전송 ========== */
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

      if (!error) {
        setNewContent("");
      }
    } catch (err) {
      console.error("메시지 전송 오류:", err);
    }
  }

  /* ========== (F) 뒤로가기 ========== */
  function handleGoBack() {
    router.push("/messages");
  }

  /* ==============================
     (G) iOS 키보드 수동 스크롤 + offset
     브라우저 폭 >=768 (PC) => offset=116
     브라우저 폭 <768 (모바일) => offset=60
============================== */
  useEffect(() => {
    if (!isIos) return;

    function handleViewportResize() {
      const currentHeight = window.visualViewport.height;
      const isMdUp = window.innerWidth >= 768;
      const offset = isMdUp ? 116 : 60;

      // 이전보다 줄었다면 => 키보드 올라옴
      if (currentHeight < prevVisualViewport.current) {
        // 전체 문서 높이
        const scrollHeight = document.scrollingElement.scrollHeight;

        // offset 고려해서, 키보드 영역 + 툴바나 헤더 높이만큼 띄우기
        // 정확한 계산은 상황에 따라 다를 수 있습니다.
        const scrollTop = scrollHeight - (currentHeight - offset);

        console.log(
          "[iOS] keyboard up => scrollTop:",
          scrollTop,
          "| scrollHeight:",
          scrollHeight,
          "| currentHeight:",
          currentHeight,
          "| offset:",
          offset
        );

        // 문서 스크롤 이동
        window.scrollTo({ top: scrollTop, behavior: "smooth" });
      }

      prevVisualViewport.current = currentHeight;
    }

    // iOS에서만 등록
    window.visualViewport.onresize = handleViewportResize;

    return () => {
      if (window.visualViewport) {
        window.visualViewport.onresize = null;
      }
    };
  }, [isIos]);

  /* (H) onFocus 시점에 스크롤 내려주기 (추가 보조) */
  function handleFocusTextArea() {
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop =
          scrollContainerRef.current.scrollHeight;
      }
    }, 100);
  }

  /* =======================
     최종 Return (UI)
======================= */
  return (
    <div className="flex flex-col bg-gray-50 mt-[30px] md:mt-[28px] h-screen">
      {/* PC용 헤더 */}
      <div className="hidden md:flex flex-none border-b border-gray-200 p-4 items-center justify-between bg-white">
        <button
          onClick={handleGoBack}
          className="text-gray-600 hover:text-orange-500 mr-2"
        >
          &larr;
        </button>
        <div className="text-lg font-semibold text-gray-800">{otherNickname}</div>
        <div />
      </div>

      {/* 채팅 목록 */}
      <div ref={scrollContainerRef} className="flex-1 p-3 overflow-y-auto">
        {chatMessages.length === 0 ? (
          <div className="text-sm text-gray-500">대화가 없습니다.</div>
        ) : (
          chatMessages.map((msg) => {
            const isMine = msg.sender_id === session?.user?.id;
            return (
              <div
                key={msg.id}
                className={`mb-2 w-full flex ${
                  isMine ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[70%] p-2 text-sm shadow-sm ${
                    isMine
                      ? "bg-orange-400 text-white rounded-tl-2xl rounded-br-2xl rounded-bl-2xl"
                      : "bg-white text-gray-800 rounded-tr-2xl rounded-br-2xl rounded-bl-2xl"
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">
                    {msg.content}
                  </div>
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
          })
        )}
      </div>

      {/* 입력 영역 */}
      <form
        onSubmit={handleSendMessage}
        className="flex-none border-t border-gray-200 p-3 bg-white"
      >
        <div className="flex items-center gap-2">
          <textarea
            rows={1}
            className="flex-1 border border-gray-300 rounded-md p-2 text-base focus:outline-none focus:ring-1 focus:ring-orange-400 resize-none"
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