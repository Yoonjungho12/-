"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseF";

// 날짜 포맷 함수
function formatLocalTime(isoString) {
  if (!isoString) return "";
  const date = new Date(isoString);
  const now = new Date();

  const diffDays = Math.floor(
    (new Date(now.getFullYear(), now.getMonth(), now.getDate()) -
      new Date(date.getFullYear(), date.getMonth(), date.getDate())) / 86400000
  );
  const hh = String(date.getHours()).padStart(2, "0");
  const mm = String(date.getMinutes()).padStart(2, "0");

  if (diffDays === 0) return `오늘 ${hh}:${mm}`;
  if (diffDays === 1) return `어제 ${hh}:${mm}`;
  if (diffDays <= 7) return `${diffDays}일 전 ${hh}:${mm}`;

  if (date.getFullYear() === now.getFullYear()) {
    return `${date.getMonth() + 1}월 ${date.getDate()}일 ${hh}:${mm}`;
  }
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${hh}:${mm}`;
}

export default function ChatPopupB() {
  const searchParams = useSearchParams();
  const otherId = searchParams.get("otherId"); // 상대방 user_id

  // 내 로그인 정보
  const [myId, setMyId] = useState(null);
  const [myNickname, setMyNickname] = useState("나(B)");

  // 상대 닉네임
  const [otherNickname, setOtherNickname] = useState("상대방(A)");

  // 메시지 목록, 입력값
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");

  // 맨 아래 스크롤
  const bottomRef = useRef(null);

  // 1) 세션 로드
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data, error }) => {
      if (error || !data.session) {
        alert("로그인 정보가 없습니다. 팝업 닫습니다.");
        window.close();
        return;
      }
      const userId = data.session.user.id;
      setMyId(userId);

      // 닉네임 로드
      const { data: me } = await supabase
        .from("profiles")
        .select("nickname")
        .eq("user_id", userId)
        .single();
      if (me?.nickname) {
        setMyNickname(me.nickname + "(B)");
      }
    });
  }, []);

  // 2) 상대방 닉네임
  useEffect(() => {
    if (!otherId) {
      alert("상대방 아이디가 없습니다!");
      window.close();
      return;
    }
    supabase
      .from("profiles")
      .select("nickname")
      .eq("user_id", otherId)
      .single()
      .then(({ data, error }) => {
        if (!error && data) {
          setOtherNickname(data.nickname + "(A)");
        }
      });
  }, [otherId]);

  // (A) 초기 대화 로드 + 내가 받은 메시지 → 읽음 처리
  async function loadInitialConversation(myUserId, otherUserId) {
    try {
      // (1) 안 읽은 (상대→나) 메시지 => read_at= now
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .match({ receiver_id: myUserId, sender_id: otherUserId })
        .is("read_at", null);

      // (2) 전체 대화 조회
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${myUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${myUserId})`
        )
        .order("created_at", { ascending: true });

      if (!error && data) {
        setMessages(data);
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      }
    } catch (err) {
      alert("대화 로딩 오류: " + err.message);
    }
  }

  // 3) useEffect - 초기 로드 & Realtime 구독
  useEffect(() => {
    if (!myId || !otherId) return;

    // (A) 처음에 전체 대화 로드
    loadInitialConversation(myId, otherId);

    // (B) Realtime INSERT+UPDATE
    const channel = supabase.channel("messages-realtime");
    channel.on(
      "postgres_changes",
      { event: "*", schema: "public", table: "messages" },
      async (payload) => {
        const { new: newRow, eventType } = payload; // 'INSERT' or 'UPDATE' etc.

        // 나↔상대 대화인지
        const relevant =
          (newRow.sender_id === myId && newRow.receiver_id === otherId) ||
          (newRow.sender_id === otherId && newRow.receiver_id === myId);

        if (!relevant) return;

        if (eventType === "INSERT") {
          // 새 메시지 도착
          let finalRow = newRow;

          // 만약 (sender=other, receiver=me)이면 => 내가 지금 보고 있음 => read_at= now
          if (newRow.sender_id === otherId && newRow.receiver_id === myId) {
            // DB에서 read_at=now + select("*") 로 변경된 row까지 가져오기
            const { data: updated, error } = await supabase
              .from("messages")
              .update({ read_at: new Date().toISOString() })
              .match({ id: newRow.id })
              .select("*"); // 업데이트 후 최신 row 반환

            if (!error && updated?.length > 0) {
              finalRow = updated[0]; // 이제 read_at가 있는 메시지
            }
          }

          // finalRow를 messages에 추가
          setMessages((prev) => {
            const updated = [...prev, finalRow];
            updated.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            return updated;
          });

          // 스크롤 아래로
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
        } else if (eventType === "UPDATE") {
          // read_at 업데이트
          setMessages((prev) => {
            const updated = [...prev];
            const idx = updated.findIndex((m) => m.id === payload.new.id);
            if (idx !== -1) {
              updated[idx] = payload.new;
            }
            return updated;
          });
        }
      }
    );
    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [myId, otherId]);

  // 4) 메시지 전송
  async function handleSend() {
    if (!myId || !otherId) {
      alert("전송 대상 정보 없음");
      return;
    }
    if (!inputValue.trim()) {
      alert("메시지를 입력하세요");
      return;
    }
    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: myId,
        receiver_id: otherId,
        content: inputValue.trim(),
      });
      if (error) {
        alert("전송 실패: " + error.message);
        return;
      }
      setInputValue("");
    } catch (err) {
      alert("전송 오류: " + err.message);
    }
  }

  // 닫기
  function handleClose() {
    window.close();
  }

  // 5) UI
  if (!otherId) {
    return <div className="p-4">잘못된 접근 (상대방 ID 없음)</div>;
  }

  return (
    <div className="flex flex-col w-screen h-screen bg-zinc-100 text-zinc-800">
      {/* 상단 바 */}
      <div className="flex items-center justify-between bg-white border-b border-zinc-200 p-3 shadow-sm">
        <div className="flex flex-col">
          <span className="font-semibold text-base">채팅창(B)</span>
          <span className="text-xs text-zinc-500">
            {myNickname} ↔ {otherNickname}
          </span>
        </div>
        <button
          onClick={handleClose}
          className="text-sm text-zinc-500 hover:text-zinc-800 
            border border-zinc-200 hover:bg-zinc-100 px-2 py-1 rounded-md"
        >
          닫기
        </button>
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto p-3">
        {messages.length === 0 ? (
          <div className="text-sm text-zinc-500">대화가 없습니다.</div>
        ) : (
          messages.map((msg) => {
            const isMine = (msg.sender_id === myId);
            return (
              <div
                key={msg.id}
                className={`mb-2 flex w-full ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] p-2 text-sm shadow 
                    ${
                      isMine
                        ? "bg-zinc-700 text-white rounded-tl-2xl rounded-br-2xl rounded-bl-2xl"
                        : "bg-zinc-200 text-zinc-800 rounded-tr-2xl rounded-br-2xl rounded-bl-2xl"
                    }`}
                >
                  <div className="whitespace-pre-wrap">{msg.content}</div>

                  {/* 시간 & (read_at) */}
                  <div className="mt-1 text-xs opacity-70 text-right">
                    {formatLocalTime(msg.created_at)}
                    {/* read_at 있으면 '읽음' */}
                    {msg.read_at && (
                      <span className="ml-1 text-blue-600">읽음</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* 입력창 */}
      <div className="border-t border-zinc-200 bg-white p-3">
        <div className="flex gap-2">
          <textarea
            rows={2}
            className="flex-1 border border-zinc-200 rounded-md p-2 text-sm
              focus:outline-none focus:ring-1 focus:ring-zinc-400"
            placeholder="메시지를 입력..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button
            onClick={handleSend}
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm rounded-md"
          >
            전송(B)
          </button>
        </div>
      </div>
    </div>
  );
}