"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseF"; // 클라이언트용 supabase 객체
import { useRouter } from "next/navigation";

export default function MessagesPage() {
  const router = useRouter();

  const [session, setSession] = useState(null);

  // ★ 보여줄 목록 (최신 메시지만)
  const [messages, setMessages] = useState([]);

  // 탭, 검색 관련 상태 그대로
  const [selectedTab, setSelectedTab] = useState("전체"); 
  const [searchKeyword, setSearchKeyword] = useState("");

  // 예시: 운영자(관리자) 계정 user_id (실제로는 DB나 설정값에서 가져와야 함)
  const adminUserId = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"; // 가짜 UUID

  // 1) 로그인 세션 로드
  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error("세션 로딩 오류:", error);
        return;
      }
      setSession(data.session);
    });
  }, []);

  // 2) messages 불러오기 + “발신자별” 최신 메시지 하나만 표시
  useEffect(() => {
    if (!session?.user?.id) return;

    async function fetchMessages() {
      try {
        let query = supabase
          .from("messages")
          .select(
            `
              id,
              sender_id,
              content,
              created_at,
              sender_profiles:profiles!fk_sender (nickname)
            `
          )
          .eq("receiver_id", session.user.id)
          .order("created_at", { ascending: false }); // 최신 메시지가 먼저

        // (A) "안읽음" 탭이면 read_at이 null인 것만
        if (selectedTab === "안읽음") {
          query = query.is("read_at", null);
        }

        // 쿼리 실행
        const { data, error } = await query;
        if (error && Object.keys(error).length > 0) {
          console.error("메시지 조회 오류:", error);
          return;
        }

        // 전체 결과 (최신 먼저)
        let allData = data || [];

        // (B) 검색어 필터 (발신자 닉네임 or content)
        if (searchKeyword.trim()) {
          const kwd = searchKeyword.trim().toLowerCase();
          allData = allData.filter((msg) => {
            const nickname = msg.sender_profiles?.nickname?.toLowerCase() || "";
            const content = msg.content?.toLowerCase() || "";
            return nickname.includes(kwd) || content.includes(kwd);
          });
        }

        // (C) “한 사람이 보낸 여러 메시지 중 최신 하나만” 골라내기
        //     ascending=false → allData[0]가 가장 최신.
        //     conversationMap에 "sender_id"가 없을 때만 set
        const conversationMap = {};
        for (const msg of allData) {
          if (!conversationMap[msg.sender_id]) {
            // 아직 없다면 이 메시지가 "그 사람의 최신메시지"
            conversationMap[msg.sender_id] = msg;
          }
        }

        // (D) 객체 → 배열
        const finalList = Object.values(conversationMap);

        setMessages(finalList);
      } catch (err) {
        console.error("Unknown fetchMessages Error:", err);
      }
    }

    fetchMessages();
  }, [session, selectedTab, searchKeyword]);

  // 탭 클릭
  function handleTabClick(tabName) {
    setSelectedTab(tabName);
  }

  // 검색 인풋 엔터
  function handleSearchKeyDown(e) {
    if (e.key === "Enter") {
      // 이미 searchKeyword가 세팅되어 있으므로, useEffect로 재조회
    }
  }

  // 운영자에게 쪽지
  async function handleSendMessageToAdmin() {
    if (!session?.user?.id) {
      alert("로그인 후 이용 가능합니다.");
      return;
    }
    const content = "안녕하세요, 운영자님! 문의드립니다.";
    try {
      const { error } = await supabase.from("messages").insert({
        sender_id: session.user.id,
        receiver_id: adminUserId,
        content,
      });
      if (error) {
        console.error("운영자 메시지 전송 오류:", error);
        alert("메시지 전송에 실패했습니다.");
        return;
      }
      alert("운영자에게 쪽지를 보냈습니다!");
    } catch (err) {
      console.error("Unknown error sending message to admin:", err);
      alert("오류가 발생했습니다.");
    }
  }

  // 메시지 카드 클릭 → 상대방 ID로 이동
  function handleClickMessage(senderId) {
    router.push(`/messages/${senderId}`);
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pt-10 md:pt-40 pb-16">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">채팅</h1>

        {/* 운영자에게 쪽지 쓰기 버튼 */}
        <button
          onClick={handleSendMessageToAdmin}
          className="text-sm bg-orange-500 text-white px-3 py-2 rounded-md hover:bg-blue-600"
        >
          운영자에게 쪽지 쓰기
        </button>
      </div>

      {/* 검색 바 */}
      <div className="mb-2">
        <input
          type="text"
          placeholder="이름과 서비스를 검색해 주세요"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          className="w-full rounded-md border border-gray-300 px-3 py-2"
        />
      </div>

      {/* 탭 메뉴 */}
      <div className="flex space-x-4 border-b border-gray-200 mb-4 text-sm">
        {["전체", "안읽음", "즐겨찾기", "고용"].map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabClick(tab)}
            className={`pb-2 ${
              selectedTab === tab
                ? "border-b-2 border-gray-900 font-medium text-gray-900"
                : "text-gray-500"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* 메시지 목록 */}
      <div className="space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            onClick={() => handleClickMessage(msg.sender_id)}
            className="flex items-center justify-between border-b border-gray-100 pb-2 cursor-pointer hover:bg-gray-50"
          >
            {/* 왼쪽: 발신자 닉네임 + 내용 일부 */}
            <div>
              <div className="text-base font-semibold text-gray-800">
                {msg.sender_profiles?.nickname || "알 수 없는 발신자"}
              </div>
              <div className="text-sm text-gray-500">
                {msg.content?.slice(0, 30) + (msg.content?.length > 30 ? "..." : "")}
              </div>
            </div>
            {/* 오른쪽: 시간 */}
            <div className="text-xs text-gray-400">
              {timeAgoFormat(msg.created_at)}
            </div>
          </div>
        ))}

        {messages.length === 0 && (
          <div className="text-gray-500 text-sm mt-6">
            해당 조건의 메시지가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}

// 간단 timeAgo 함수 (원하는대로 바꿔 쓰세요)
function timeAgoFormat(dateString) {
  if (!dateString) return "";
  const diffMs = new Date().getTime() - new Date(dateString).getTime();
  const diffMin = diffMs / (1000 * 60);

  if (diffMin < 60) {
    return Math.floor(diffMin) + "분 전";
  } else if (diffMin < 60 * 24) {
    return Math.floor(diffMin / 60) + "시간 전";
  } else if (diffMin < 60 * 24 * 7) {
    return Math.floor(diffMin / (60 * 24)) + "일 전";
  } else {
    const d = new Date(dateString);
    const y = d.getFullYear().toString().slice(2);
    const m = ("0" + (d.getMonth() + 1)).slice(-2);
    const day = ("0" + d.getDate()).slice(-2);
    return `${y}.${m}.${day}`;
  }
}