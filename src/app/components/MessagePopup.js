"use client";
import React, { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseF";

/** UTC -> 로컬 시각 + "오늘/어제/N일 전" 등등 */
function formatLocalTime(isoString) {
  // (기존 포맷 함수 복붙)
  if (!isoString) return "(등록일 없음)";
  const utcDate = new Date(isoString);
  const localDate = new Date(utcDate.getTime());
  // 시분
  const hh = String(localDate.getHours()).padStart(2, "0");
  const mm = String(localDate.getMinutes()).padStart(2, "0");
  const timeStr = `${hh}:${mm}`;
  // 날짜 계산
  const cYear = localDate.getFullYear();
  const cMonth = localDate.getMonth();
  const cDay = localDate.getDate();
  const createdNoTime = new Date(cYear, cMonth, cDay, 0, 0, 0);
  const now = new Date();
  const nYear = now.getFullYear();
  const nMonth = now.getMonth();
  const nDay = now.getDate();
  const nowNoTime = new Date(nYear, nMonth, nDay, 0, 0, 0);
  let dayDiff = Math.floor((nowNoTime - createdNoTime) / (1000*60*60*24));
  if (dayDiff < 0) dayDiff = 0;

  if (dayDiff === 0) return `오늘 ${timeStr}`;
  if (dayDiff === 1) return `어제 ${timeStr}`;
  if (dayDiff <= 7) return `${dayDiff}일 전 ${timeStr}`;
  const yyyy = localDate.getFullYear();
  const mon = localDate.getMonth() + 1;
  const dd = localDate.getDate();
  return `${yyyy}년 ${mon}월 ${dd}일`;
}

/**
 * 쪽지 팝업 (코드 스플리팅 대상)
 * - myId, myNickname: NavBar에서 전달받음
 * - unreadCount, setUnreadCount: 읽음처리 시 감소
 */
export default function MessagePopup({
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

  // 1) "최근 쪽지 목록" 불러오기 → 각 메시지에 otherNickname
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

      // otherId별로 최신 1개
      const map = new Map();
      const finalArr = [];
      for (const m of data) {
        const otherId = m.sender_id === myId ? m.receiver_id : m.sender_id;
        if (!map.has(otherId)) {
          map.set(otherId, m);
          finalArr.push(m);
        }
      }

      // each => otherNickname
      for (const msg of finalArr) {
        const otherId = msg.sender_id === myId ? msg.receiver_id : msg.sender_id;
        if (!otherId) {
          msg.otherNickname = "(알 수 없음)";
          continue;
        }
        // 프로필
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

  // 2) "대화내역"으로 전환
  async function openDetail(otherId, msg) {
    setView("detail");
    setSelectedOtherId(otherId);

    // 내가 수신자이면서 아직 read_at이 없는 메시지라면 → 읽음 처리
    if (!msg.read_at && msg.receiver_id === myId) {
      markAsRead(msg);
    }
    await loadFullConversation(otherId);
  }

  // 읽음처리 → read_at= now
  async function markAsRead(msg) {
    try {
      const { error } = await supabase
        .from("messages")
        .update({ read_at: new Date().toISOString() })
        .eq("id", msg.id);
      if (!error) {
        // unreadCount 감소
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error("read fail:", err);
    }
  }

  // 3) "상세 대화" 로드
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

      // 각 msg.sender_id -> 프로필 닉네임
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

  // 목록으로 돌아가기
  function handleBack() {
    setView("list");
    setSelectedOtherId(null);
  }

  // 메시지 전송
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
      // 다시 로드
      await loadFullConversation(selectedOtherId);
    } catch (err) {
      alert("에러:" + err.message);
    }
  }

  // UI
  return (
    <div className="absolute right-0 top-10 z-50 w-[500px] border bg-white shadow-lg">
      {/* 상단 (빨간 바) */}
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

      {/* 탭 (데모) */}
      <div className="flex space-x-2 border-b border-gray-200 p-2">
        <button className="px-2 py-1 border-b-2 border-red-500">대화내역</button>
        <button className="px-2 py-1">쪽지쓰기</button>
        <button className="px-2 py-1">관리자에게</button>
      </div>

      {/* 내용 영역 */}
      {view === "list" ? (
        // 목록
        <div className="p-4">
          {loading ? (
            <p>로딩중...</p>
          ) : recentList.length === 0 ? (
            <p>쪽지가 없습니다.</p>
          ) : (
            <ul className="space-y-4">
              {recentList.map((m) => {
                const otherId = m.sender_id === myId ? m.receiver_id : m.sender_id;
                return (
                  <li
                    key={m.id}
                    className="cursor-pointer border-b pb-2 flex items-start justify-between"
                    onClick={() => openDetail(otherId, m)}
                  >
                    {/* 왼쪽 프로필 아이콘 + 닉네임 + 최근 메시지 */}
                    <div className="flex items-start">
                      <div className="mr-2 flex h-12 w-12 items-center justify-center
                                      rounded-full bg-pink-500 text-white text-2xl font-bold">
                        V
                      </div>
                      <div className="text-sm">
                        <p className="mb-1 font-semibold">
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
        // 상세 대화
        <div className="flex h-[300px] flex-col">
          <div className="flex-1 overflow-y-auto p-4">
            {/* 뒤로가기 */}
            <button
              onClick={handleBack}
              className="mb-2 rounded bg-gray-200 px-2 py-1 text-sm"
            >
              뒤로가기
            </button>

            {loading ? (
              <p>로딩중...</p>
            ) : fullMessages.length === 0 ? (
              <p>대화가 없습니다.</p>
            ) : (
              fullMessages.map((msg) => {
                const isMine = msg.sender_id === myId;
                return (
                  <div
                    key={msg.id}
                    className={`mb-2 flex ${isMine ? "justify-end" : "justify-start"}`}
                  >
                    {/* 내 메시지가 아닐 때 -> 왼쪽 닉네임 아이콘 */}
                    {!isMine && (
                      <div className="mr-2 flex h-10 w-10 items-center justify-center
                                      rounded-full bg-pink-500 text-white text-xl font-bold">
                        {msg.senderNickname?.substring(0, 1) || "?"}
                      </div>
                    )}
                    <div
                      className={`max-w-[70%] rounded p-2 text-sm
                                  ${isMine ? "bg-blue-100 text-right" : "bg-gray-100"}`}
                    >
                      {/* 보낸이 닉네임 */}
                      {!isMine && (
                        <p className="mb-1 font-semibold text-xs">
                          {msg.senderNickname}
                        </p>
                      )}
                      {/* 메시지 내용 */}
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
              className="w-full rounded border border-gray-300 p-1 text-sm"
              rows={2}
              placeholder="메시지를 입력하세요..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
            />
            <div className="mt-2 text-right">
              <button
                onClick={handleSend}
                className="rounded bg-blue-500 px-4 py-1 text-sm text-white"
              >
                보내기
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 하단 안내 */}
      <div className="p-3 text-sm text-gray-500">
        쪽지는 20일 동안 저장됩니다.
      </div>
    </div>
  );
}