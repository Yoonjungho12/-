// src/app/(chat)/messages/[senderId]/page.js
"use client";

import React, { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseF";

/* ============== (A) VisualViewport 기반 훅 + PC/모바일 구분 + SafeAreaPadding ============== */
function useVisualViewportHeight() {
  const [calcHeight, setCalcHeight] = useState("100vh");

  useEffect(() => {
    function updateHeight() {
      // 1) PC/모바일 판별 (md 브레이크포인트: 768px)
      const isMdUp = window.innerWidth >= 768;
      // 2) PC면 116, 모바일이면 60 (원하시는 수치로 조절)
      const offset = isMdUp ? 116 : 60;

      // (option) iOS SafeAreaInsets도 고려하여 패딩으로 쓰고 싶으면 아래처럼 적용 가능
      // 일단 예시로만:
      // const safeAreaPadding = "env(safe-area-inset-bottom)"; // iOS 홈 인디케이터 영역

      if (window.visualViewport) {
        const vh = window.visualViewport.height;
        const total = `calc(${vh}px - ${offset}px)`;
        setCalcHeight(total);
        console.log("📏 visualViewport =>", vh, "offset =>", offset);
      } else {
        const fallback = window.innerHeight;
        const total = `calc(${fallback}px - ${offset}px)`;
        setCalcHeight(total);
        console.log("📏 fallback =>", fallback, "offset =>", offset);
      }
    }

    // 초기 한 번 실행
    updateHeight();

    // VisualViewport resize/scroll → 툴바 숨김/표시 대응
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", updateHeight);
      window.visualViewport.addEventListener("scroll", updateHeight);
    }
    // 일반 resize (PC/안드로이드)
    window.addEventListener("resize", updateHeight);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", updateHeight);
        window.visualViewport.removeEventListener("scroll", updateHeight);
      }
      window.removeEventListener("resize", updateHeight);
    };
  }, []);

  return calcHeight;
}

/* ============== (B) 채팅 시각 포맷 함수 ============== */
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

/* ============== (C) 메인 채팅 컴포넌트 ============== */
export default function ChatPage() {
  const router = useRouter();
  const { senderId } = useParams();

  // (1) 세션
  const [session, setSession] = useState(null);

  // (2) 상대방 정보
  const [otherNickname, setOtherNickname] = useState("상대방");

  // (3) 채팅 메시지
  const [chatMessages, setChatMessages] = useState([]);
  const [newContent, setNewContent] = useState("");

  // 스크롤 컨테이너
  const scrollContainerRef = useRef(null);
  // Textarea ref (키보드 올라올 때 scrollIntoView 등에 사용 가능)
  const inputRef = useRef(null);

  // 동적 높이
  const dynamicHeight = useVisualViewportHeight();

  // ---------------------------
  // (A) 세션 로드
  // ---------------------------
  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) console.error("세션 로딩 오류:", error);
      else setSession(data.session);
    });
  }, []);

  // ---------------------------
  // (B) 채팅 로드
  // ---------------------------
  async function fetchChat(myId, otherId) {
    try {
      // 1) 상대→나 메시지를 읽음처리
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .match({ sender_id: otherId, receiver_id: myId })
        .is("read_at", null);

      // 2) 전체 대화
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

      // 3) 프로필 닉네임
      const { data: profData } = await supabase
        .from("profiles")
        .select("nickname")
        .eq("user_id", otherId)
        .single();

      setOtherNickname(profData?.nickname || "상대방");
    } catch (err) {
      console.error("채팅 로딩 오류:", err);
    }
  }

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
          // 상대→나 메시지면 바로 read_at 처리
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

  // ---------------------------
  // (C) 채팅 목록 변화 → 맨 아래 스크롤
  // ---------------------------
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  }, [chatMessages]);

  // ---------------------------
  // (D) 메시지 전송
  // ---------------------------
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
      console.error("메시지 전송 오류:", err);
    }
  }

  // ---------------------------
  // (E) 키보드 포커스 시 처리
  // ---------------------------
  function handleFocus() {
    // 1) 키보드가 올라오면 → 인풋을 화면에 보이도록 스크롤
    //    (iOS 사파리에서 완벽하진 않지만, 많이 개선됨)
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop =
          scrollContainerRef.current.scrollHeight;
      }
      // (선택) inputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  }

  function handleBlur() {
    // 2) 키보드 내려갔을 때 혹시나 추가 동작
    // 현재는 아무것도 안 하지만, 필요시 log나 다른 로직 추가 가능
  }

  // ---------------------------
  // (F) 뒤로가기
  // ---------------------------
  function handleGoBack() {
    router.push("/messages");
  }

  // ---------------------------
  // (G) UI 렌더링
  // ---------------------------
  const dynamicHeight = useVisualViewportHeight();

  return (
    <div
      className="
        flex
        flex-col
        bg-gray-50
        mt-[30px]
      "
      style={{
        // 툴바 + 키보드 고려한 동적 높이
        height: dynamicHeight,
        // (옵션) iOS 홈 인디케이터 확보
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* (1) 데스크톱 헤더 */}
      <div className="hidden md:flex flex-none border-b border-gray-200 p-4 items-center justify-between bg-white">
        <button
          onClick={handleGoBack}
          className="text-gray-600 hover:text-orange-500 mr-2"
        >
          &larr;
        </button>
        <div className="text-lg font-semibold text-gray-800">
          {otherNickname}
        </div>
        <div />
      </div>

      {/* (2) 채팅 목록 */}
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

      {/* (3) 입력 영역 (하단) */}
      <form
        onSubmit={handleSendMessage}
        className="flex-none border-t border-gray-200 p-3 bg-white"
      >
        <div className="flex items-center gap-2">
          <textarea
            ref={inputRef}
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
            onFocus={handleFocus}
            onBlur={handleBlur}
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