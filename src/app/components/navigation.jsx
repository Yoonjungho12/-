"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabaseF";
import { useRouter } from "next/navigation";

/** UTC -> 로컬 시간 ("오늘 hh:mm", "어제 hh:mm", "N일 전 hh:mm", "YYYY년 M월 D일") */
function formatLocalTime(isoString) {
  if (!isoString) return "(등록일 없음)";

  const utcDate = new Date(isoString);
  const localDate = new Date(utcDate.getTime());
  const hh = String(localDate.getHours()).padStart(2, "0");
  const mm = String(localDate.getMinutes()).padStart(2, "0");
  const timeStr = `${hh}:${mm}`;

  const cYear = localDate.getFullYear();
  const cMonth = localDate.getMonth();
  const cDay = localDate.getDate();

  const createdNoTime = new Date(cYear, cMonth, cDay, 0, 0, 0);
  const now = new Date();
  const nYear = now.getFullYear();
  const nMonth = now.getMonth();
  const nDay = now.getDate();
  const nowNoTime = new Date(nYear, nMonth, nDay, 0, 0, 0);

  let diffDays = Math.floor((nowNoTime - createdNoTime) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) diffDays = 0;

  if (diffDays === 0) {
    return `오늘 ${timeStr}`;
  } else if (diffDays === 1) {
    return `어제 ${timeStr}`;
  } else if (diffDays <= 7) {
    return `${diffDays}일 전 ${timeStr}`;
  } else {
    const yyyy = localDate.getFullYear();
    const mon = localDate.getMonth() + 1;
    const dd = localDate.getDate();
    return `${yyyy}년 ${mon}월 ${dd}일`;
  }
}

export default function NavBar() {
  const [session, setSession] = useState(null);
  const router = useRouter();

  // 쪽지 팝업 열림
  const [showMsgPopup, setShowMsgPopup] = useState(false);
  // 읽지 않은 개수
  const [unreadCount, setUnreadCount] = useState(0);
  // 내 닉네임
  const [myNickname, setMyNickname] = useState("");

  useEffect(() => {
    // 현재 세션 가져오기
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        fetchMyProfile(data.session.user.id);
        fetchUnreadCount(data.session.user.id);
      }
    });

    // 세션 상태 변동 (로그인/로그아웃 등)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        if (newSession?.user?.id) {
          fetchMyProfile(newSession.user.id);
          fetchUnreadCount(newSession.user.id);
        } else {
          setMyNickname("");
          setUnreadCount(0);
        }
      }
    );
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const isLoggedIn = !!session;

  // 내 프로필 닉네임
  async function fetchMyProfile(userId) {
    try {
      const { data } = await supabase
        .from("profiles")
        .select("nickname")
        .eq("user_id", userId)
        .single();
      setMyNickname(data?.nickname || "(닉네임 없음)");
    } catch (err) {
      console.error("프로필 오류:", err);
      setMyNickname("(오류)");
    }
  }

  // 읽지 않은 쪽지 개수
  async function fetchUnreadCount(userId) {
    try {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .match({ receiver_id: userId })
        .is("read_at", null);
      setUnreadCount(data?.length || 0);
    } catch (err) {
      console.error("unreadCount:", err);
    }
  }

  // 로그아웃
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  // 쪽지 아이콘 클릭
  const handleMessageIconClick = () => {
    if (!session?.user?.id) {
      alert("로그인 필요");
      return;
    }
    setShowMsgPopup(!showMsgPopup);
  };

  return (
    <header className="w-full border-b border-gray-200 bg-white">
      {/* 상단 바 (PC) */}
      <div className="mx-auto hidden max-w-7xl items-center justify-between px-6 py-3 md:flex">
        {/* 로고 */}
        <Link href="/">
          <div className="flex items-center space-x-2 text-2xl font-bold text-red-500">
            <span>VIP info</span>
            <span className="text-base font-normal text-green-600">VIP 건마</span>
          </div>
        </Link>

        {/* 검색창 */}
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="지역, 업종, 상호명 검색하세요"
            className="w-full rounded-full border border-red-300 py-3 pl-6 pr-14 text-base focus:outline-none focus:ring-2 focus:ring-red-400"
          />
          <svg
            className="absolute right-4 top-1/2 h-6 w-6 -translate-y-1/2 text-red-400"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>

        {/* 오른쪽 아이콘들 */}
        <div className="flex items-center space-x-7">
          {isLoggedIn ? (
            <>
              {/* 로그아웃 */}
              <div
                className="flex cursor-pointer flex-col items-center text-gray-600 hover:text-red-500"
                onClick={handleLogout}
              >
                <svg
                  className="mb-1.5 h-7 w-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 9V5.25
                      A2.25 2.25
                      0 0013.5 3
                      h-7.5A2.25
                      2.25 0 003.75
                      5.25v13.5
                      A2.25 2.25
                      0 006
                      21h7.5
                      a2.25 2.25
                      0 002.25-2.25
                      V15"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 9l6
                      3-6 3V9z"
                  />
                </svg>
                <span className="text-sm">로그아웃</span>
              </div>

              {/* 나의활동 */}
              <div className="flex cursor-pointer flex-col items-center text-gray-600 hover:text-red-500">
                <svg
                  className="mb-1.5 h-7 w-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8c1.657
                      0 3 .843
                      3 1.882v4.235
                      c0 1.04-1.343
                      1.883-3
                      1.883s
                      -3-.843
                      -3-1.883
                      v-4.235
                      C9 8.843
                      10.343 8
                      12 8z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.293
                      9.293a1 1
                      0 011.414
                      1.414L16.414
                      13l2.293
                      2.293a1
                      1 0 01-1.414
                      1.414l-2.293
                      -2.293
                      -2.293
                      2.293a1
                      1 0
                      01-1.414
                      -1.414
                      L13 
                      13l
                      -2.293
                      -2.293
                      a1 1 0
                      011.414
                      -1.414
                      L14 
                      11.586
                      l2.293
                      -2.293z"
                  />
                </svg>
                <span className="text-sm">나의활동</span>
              </div>

              {/* 1:1 쪽지 아이콘 */}
              <div className="relative flex cursor-pointer flex-col items-center text-gray-600 hover:text-red-500">
                <svg
                  onClick={handleMessageIconClick}
                  className="mb-1.5 h-7 w-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 8l7.89
                      5.26a3 3
                      0 003.22 0
                      L22 8m-9
                      13H7a2 2
                      0 01-2-2V5
                      a2 2 0
                      012-2h10
                      a2 2
                      0
                      012 2v14
                      a2 2 0
                      01-2 2
                      h-2"
                  />
                </svg>
                <span className="text-sm">1:1 쪽지</span>
                {/* 배지 */}
                {unreadCount > 0 && (
                  <div className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                    {unreadCount}
                  </div>
                )}

                {/* 팝업 */}
                {showMsgPopup && (
                  <MessagePopup
                    myId={session.user.id}
                    myNickname={myNickname}
                    unreadCount={unreadCount}
                    setUnreadCount={setUnreadCount}
                    onClose={() => setShowMsgPopup(false)}
                  />
                )}
              </div>

              {/* 제휴문의 */}
              <div className="flex cursor-pointer flex-col items-center text-gray-600 hover:text-red-500">
                <Link
                  href="/partnership"
                  className="flex cursor-pointer flex-col items-center text-gray-600 hover:text-red-500"
                >
                  <svg
                    className="mb-1.5 h-7 w-7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 8l7.89
                        5.26a3 3
                        0 003.22
                        0L22 8
                        m-9 13H7
                        a2 2 0
                        01-2-2V5
                        a2 2 0
                        012-2
                        h10a2 2
                        0
                        012 2v14
                        a2 2
                        0
                        01-2 2
                        h-2"
                    />
                  </svg>
                  <span className="text-sm">제휴문의</span>
                </Link>
              </div>
            </>
          ) : (
            /* 비로그인 */
            <>
              <Link
                href="/login"
                className="flex cursor-pointer flex-col items-center text-gray-600 hover:text-red-500"
              >
                <svg
                  className="mb-1.5 h-7 w-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 9V5.25
                      A2.25 2.25
                      0 0013.5 3
                      h-7.5A2.25
                      2.25 0
                      003.75
                      5.25v13.5
                      A2.25 2.25
                      0
                      006 21
                      h7.5
                      a2.25 2.25
                      0 002.25
                      -2.25V15"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 9l6
                      3-6 3V9z"
                  />
                </svg>
                <span className="text-sm">로그인</span>
              </Link>

              <div className="flex cursor-pointer flex-col items-center text-gray-600 hover:text-red-500">
                <svg
                  className="mb-1.5 h-7 w-7"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8c1.657
                      0 3 .843
                      3 1.882v4.235
                      c0 1.04-1.343
                      1.883-3
                      1.883s
                      -3-.843
                      -3-1.883
                      v-4.235
                      C9 8.843
                      10.343 8
                      12 8z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.293
                      9.293a1 1
                      0 011.414
                      1.414L16.414
                      13l2.293
                      2.293a1 1
                      0 01-1.414
                      1.414l-2.293
                      -2.293-2.293
                      2.293a1 1
                      0 01-1.414
                      -1.414L13 
                      13l-2.293
                      -2.293a1
                      1 0 011.414
                      -1.414L14 
                      11.586
                      l2.293
                      -2.293z"
                  />
                </svg>
                <span className="text-sm">나의활동</span>
              </div>

              <div className="flex cursor-pointer flex-col items-center text-gray-600 hover:text-red-500">
                <Link
                  href="/partnership"
                  className="flex cursor-pointer flex-col items-center text-gray-600 hover:text-red-500"
                >
                  <svg
                    className="mb-1.5 h-7 w-7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 8l7.89
                        5.26a3 3
                        0
                        003.22 0
                        L22 8
                        m-9 13H7
                        a2 2 0
                        01-2-2V5
                        a2 2 0
                        012-2
                        h10a2 2
                        0
                        012 2v14
                        a2 2
                        0
                        01-2 2
                        h-2"
                    />
                  </svg>
                  <span className="text-sm">제휴문의</span>
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

/** 
 * 쪽지 팝업:
 *  - "대화내역"에서 각 메시지의 상대 nickname 표시
 *  - 클릭 시, 상세 화면(전체 대화)에서 각 메시지.senderNickname 표시
 */
function MessagePopup({ onClose, myId, myNickname, unreadCount, setUnreadCount }) {
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState("list"); // "list" | "detail"
  const [recentList, setRecentList] = useState([]);
  const [selectedOtherId, setSelectedOtherId] = useState(null);

  const [fullMessages, setFullMessages] = useState([]);
  const [messageInput, setMessageInput] = useState("");

  useEffect(() => {
    loadRecentConversations();
  }, []);

  /** "최근 쪽지" 목록을 불러와, 각 메시지에 "상대방 닉네임" 세팅 */
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
      // 1) messages를 돌면서, "otherId"를 구하고, 닉네임을 가져온 뒤 message.otherNickname에 넣기
      const map = new Map();
      const finalArr = [];

      for (const m of data) {
        const otherId = m.sender_id === myId ? m.receiver_id : m.sender_id;
        // 아직 map에 없다면 => "가장 최신" 메시지
        if (!map.has(otherId)) {
          map.set(otherId, m);
          finalArr.push(m);
        }
      }

      // 2) "otherId"별로 profiles.nickname 조회
      //    여기서는 간단히, 각 메시지에서 바로 fetch (비효율) / 필요 시 캐싱
      for (const msg of finalArr) {
        const otherId = msg.sender_id === myId ? msg.receiver_id : msg.sender_id;
        if (!otherId) {
          msg.otherNickname = "(알 수 없음)";
          continue;
        }
        // 프로필 fetch
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

  /** 특정 메시지 클릭 => 상세 화면(상대와의 전체 대화) */
  async function openDetail(otherId, msg) {
    setView("detail");
    setSelectedOtherId(otherId);
    // 읽음
    if (!msg.read_at && msg.receiver_id === myId) {
      markAsRead(msg);
    }
    await loadFullConversation(otherId);
  }

  /** 메시지 하나 읽음처리 */
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

  /** 상대와의 전체 대화 로드 => 각 메시지.senderNickname 세팅 */
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

      // 각 메시지의 sender_id => profiles.nickname => msg.senderNickname
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

  /** 뒤로가기 */
  function handleBack() {
    setView("list");
    setSelectedOtherId(null);
  }

  /** 메시지 전송 => insert */
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
      // 다시 전체 대화 로드
      await loadFullConversation(selectedOtherId);
    } catch (err) {
      alert("에러:" + err.message);
    }
  }

  return (
    <div className="absolute right-0 top-10 z-50 w-[500px] border bg-white shadow-lg">
      {/* 상단 빨간 바 */}
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

      {view === "list" ? (
        // [목록] (상대 닉네임 표시)
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
                    className="border-b pb-2 cursor-pointer flex items-start justify-between"
                    onClick={() => openDetail(otherId, m)}
                  >
                    {/* 왼쪽: 아이콘 + "상대 닉네임" + 메시지 */}
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
        // [상세 대화]
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
                  <div key={msg.id} className={`mb-2 flex ${isMine ? "justify-end" : "justify-start"}`}>
                    {!isMine && (
                      <div className="mr-2 flex h-10 w-10 items-center justify-center rounded-full bg-pink-500 text-white text-xl font-bold">
                        {msg.senderNickname?.substring(0,1) || "?"}
                      </div>
                    )}
                    <div
                      className={`max-w-[70%] p-2 rounded text-sm ${
                        isMine ? "bg-blue-100 text-right" : "bg-gray-100"
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
          {/* 메시지 입력 + 보내기 */}
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

      {/* 하단 안내 */}
      <div className="p-3 text-sm text-gray-500">
        쪽지는 20일 동안 저장됩니다.
      </div>
    </div>
  );
}
