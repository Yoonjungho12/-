"use client";

import React, { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabaseF";

// 날짜 포맷 함수 (오늘/어제/N일 전)
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
  } else {
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일 ${hh}:${mm}`;
  }
}

export default function ChatPopup() {
  const searchParams = useSearchParams();
  const otherId = searchParams.get("otherId"); // 상대방 user_id

  const [myId, setMyId] = useState(null);
  const [myNickname, setMyNickname] = useState("나");
  const [otherNickname, setOtherNickname] = useState("상대방");

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState("");

  const bottomRef = useRef(null);

  // 1) 세션 체크 → 내 user_id
  useEffect(() => {
     if (window.opener) {
    window.opener.location.reload();
  }
    supabase.auth.getSession().then(async ({ data, error }) => {
      if (error) {
        alert("세션 체크 에러: " + error.message);
        window.close();
        return;
      }
      if (!data.session) {
        alert("로그인 정보가 없습니다. 팝업 닫습니다.");
        window.close();
        return;
      }
      const myUserId = data.session.user.id;
      setMyId(myUserId);

      // 내 닉네임 로드
      const { data: me, error: meErr } = await supabase
        .from("profiles")
        .select("nickname")
        .eq("user_id", myUserId)
        .single();
      if (!meErr && me?.nickname) {
        setMyNickname(me.nickname);
      }
    });
  }, []);

  // 2) 상대방 닉네임 가져오기
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
          setOtherNickname(data.nickname || "상대방");
        }
      });
  }, [otherId]);

  // 3) 전체 대화 로드
  useEffect(() => {
    if (!myId || !otherId) return;
    loadConversation(myId, otherId);
  }, [myId, otherId]);

  async function loadConversation(me, other) {
    setLoading(true);
    try {
      // ① 먼저 안 읽은 메시지 read_at 갱신
      await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("receiver_id", me)
        .eq("sender_id", other)
        .is("read_at", null);

      // ② 그리고 나서 메시지 로드
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${me},receiver_id.eq.${other}),and(sender_id.eq.${other},receiver_id.eq.${me})`
        )
        .order("created_at", { ascending: true });

      if (error) {
        alert("메시지 로드 에러: " + error.message);
        return;
      }
      setMessages(data || []);
      setLoading(false);

      // 스크롤 맨 아래로
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      alert("대화 로딩 오류: " + err.message);
      setLoading(false);
    }
  }

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
      const { error } = await supabase.from("messages").insert([
        {
          sender_id: myId,
          receiver_id: otherId,
          content: inputValue.trim(),
        },
      ]);
      if (error) {
        alert("전송 실패: " + error.message);
        return;
      }
      setInputValue("");
      // 보낸 뒤 대화 다시 로드
      await loadConversation(myId, otherId);
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } catch (err) {
      alert("전송 오류: " + err.message);
    }
  }

  function handleClose() {
    window.close();
  }

  // 5) UI
  if (!otherId) {
    return <div className="p-4">잘못된 접근(상대방 아이디 없음)</div>;
  }

  return (
    <div className="flex flex-col w-screen h-screen bg-zinc-100 text-zinc-800">
      {/* 상단 바 */}
      <div className="flex items-center justify-between bg-white border-b border-zinc-200 p-3 shadow-sm">
        <div className="flex flex-col">
          <span className="font-semibold text-base">채팅창</span>
          <span className="text-xs text-zinc-500">
            {myNickname} → {otherNickname}
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

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto p-3">
        {loading ? (
          <div>로딩중...</div>
        ) : messages.length === 0 ? (
          <div className="text-sm text-zinc-500">대화가 없습니다.</div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender_id === myId;
            return (
              <div
                key={msg.id}
                className={`mb-2 flex w-full ${
                  isMine ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[70%] p-2 text-sm shadow 
                              ${
                                isMine
                                  ? "bg-zinc-700 text-white rounded-tl-2xl rounded-br-2xl rounded-bl-2xl"
                                  : "bg-zinc-200 text-zinc-800 rounded-tr-2xl rounded-br-2xl rounded-bl-2xl"
                              }`}
                >
                  {/* 메시지 내용 */}
                  <div className="whitespace-pre-wrap">{msg.content}</div>
                  {/* 시간 & (읽음) */}
                  <div className="mt-1 text-xs opacity-70 text-right">
                    {formatLocalTime(msg.created_at)}{" "}
                    {!isMine && msg.read_at && (
                      <span className="mt-1 ml-1 text-xs text-blue-600 text-right">
                        읽음
                      </span>
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
            className="flex-1 border border-zinc-200 rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400"
            placeholder="메시지 입력..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <button
            onClick={handleSend}
            className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-sm rounded-md"
          >
            전송
          </button>
        </div>
      </div>
    </div>
  );
}