"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseF";
import { useRouter } from "next/navigation";  // Next.js 13+에서 사용

/** 날짜/시간 포맷 (오늘/어제/N일 전/그 외) */
function formatLocalTime(isoString) {
  if (!isoString) return "(시간 없음)";
  const d = new Date(isoString);
  const now = new Date();
  const diffDays = Math.floor(
    (new Date(now.getFullYear(), now.getMonth(), now.getDate()) -
      new Date(d.getFullYear(), d.getMonth(), d.getDate())) /
      86400000
  );
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");

  if (diffDays === 0) return `오늘 ${hh}:${mm}`;
  if (diffDays === 1) return `어제 ${hh}:${mm}`;
  if (diffDays <= 7) return `${diffDays}일 전 ${hh}:${mm}`;

  const yyyy = d.getFullYear();
  const mon = d.getMonth() + 1;
  const dd = d.getDate();
  return `${yyyy}년 ${mon}월 ${dd}일`;
}

export default function MessagesPage() {
  const router = useRouter();

  const [myUid, setMyUid] = useState(""); // 내 user_id
  const [rows, setRows] = useState([]);   // 대화 상대별 최신 메시지 목록
  const [loading, setLoading] = useState(true);

  // 관리자인지 아닌지 판별할 state
  const [isMaster, setIsMaster] = useState(null);

  // 검색어 (미구현)
  const [searchTerm, setSearchTerm] = useState("");

  // 체크박스 선택
  const [selectedIds, setSelectedIds] = useState([]);

  // 읽지 않은 쪽지 수
  const [unreadCount, setUnreadCount] = useState(0);

  // ------------------------------------------
  // 1) 세션에서 내 user_id 가져오기
  //    + 내 계정(profiles) 정보를 불러와서 is_master 확인
  // ------------------------------------------
  useEffect(() => {
    async function loadSessionAndCheckMaster() {
      try {
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error("세션 로딩 오류:", sessionError);
          return;
        }
        const uid = sessionData.session?.user?.id;
        if (!uid) {
          console.warn("로그인이 필요합니다!");
          return;
        }

        // 내 user_id 상태 업데이트
        setMyUid(uid);

        // 이제 profiles 테이블에서 is_master인지 확인
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("is_master")
          .eq("user_id", uid)
          .single();

        if (profileError) {
          console.error("프로필 조회 오류:", profileError);
          return;
        }

        // is_master가 false면? -> 404 페이지로 리다이렉트
        if (!profileData?.is_master) {
          console.error("관리자 계정이 아니므로 차단합니다. 삐빅!");
          setIsMaster(false);
        } else {
          setIsMaster(true);
        }
      } catch (err) {
        console.error("세션 및 프로필 로딩 중 오류:", err);
      }
    }

    loadSessionAndCheckMaster();
  }, []);

  // ------------------------------------------
  // 2) 만약 is_master가 false로 판명나면 404 페이지로 이동
  //    (useRouter().replace("/404") 사용)
  // ------------------------------------------
  useEffect(() => {
    if (isMaster === false) {
      // 404 페이지로 보내기
      router.replace("/404");
    }
  }, [isMaster, router]);

  // ------------------------------------------
  // 3) is_master가 true로 확인된 후 메시지 불러오기
  // ------------------------------------------
  useEffect(() => {
    if (myUid && isMaster === true) {
      fetchMessages(myUid);
      fetchUnreadCount(myUid);
    }
  }, [myUid, isMaster]);

  async function fetchMessages(uid) {
    setLoading(true);
    try {
      // 내 uid가 sender이거나 receiver인 모든 메시지를 최신순(desc)으로 불러옴
      const { data, error } = await supabase
        .from("messages")
        .select(`
          id,
          sender_id,
          receiver_id,
          content,
          created_at,
          read_at,
          sender:profiles!sender_id ( user_id, nickname, is_banned, is_master ),
          receiver:profiles!receiver_id ( user_id, nickname, is_banned, is_master )
        `)
        .or(`sender_id.eq.${uid},receiver_id.eq.${uid}`)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("쪽지 조회 오류:", error);
        setRows([]);
        setLoading(false);
        return;
      }

      // 각 대화(상대방)별로 가장 최근 메시지 1건씩만 선택
      const convMap = new Map(); // key: 상대방 user_id, value: 메시지 객체
      for (const msg of data) {
        const otherUserId = msg.sender_id === uid ? msg.receiver_id : msg.sender_id;
        // 상대 프로필: 내가 sender이면 msg.receiver, 아니면 msg.sender
        const otherProfile = msg.sender_id === uid ? msg.receiver : msg.sender;
        // 상대가 관리자인 경우는 제외 (is_master === true)
        if (otherProfile?.is_master === true) continue;
        // 내림차순 정렬이므로 처음 만나는 메시지가 최신임
        if (!convMap.has(otherUserId)) {
          convMap.set(otherUserId, {
            id: msg.id,
            sender_id: msg.sender_id,
            receiver_id: msg.receiver_id,
            content: msg.content,
            created_at: msg.created_at,
            read_at: msg.read_at,
            nickname: otherProfile?.nickname || "익명",
            is_banned: otherProfile?.is_banned,
          });
        }
      }

      const result = Array.from(convMap.values());
      setRows(result);
    } catch (err) {
      console.error("쪽지 로딩 오류:", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  // 안 읽은 쪽지 개수 (내가 수신자이고 read_at이 null인 메시지)
  async function fetchUnreadCount(uid) {
    try {
      const { count, error } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("receiver_id", uid)
        .is("read_at", null);
      if (error) {
        console.error("unreadCount 조회 오류:", error);
        setUnreadCount(0);
      } else {
        setUnreadCount(count || 0);
      }
    } catch (err) {
      console.error("unreadCount 로딩 오류:", err);
      setUnreadCount(0);
    }
  }

  // 체크박스 로직
  function handleCheckboxChange(msgId, checked) {
    setSelectedIds((prev) => {
      if (checked) {
        return [...prev, msgId];
      }
      return prev.filter((id) => id !== msgId);
    });
  }

  function handleSelectAllChange(e) {
    if (e.target.checked) {
      const allIds = rows.map((r) => r.id);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  }

  // 삭제
  async function handleDelete() {
    if (selectedIds.length === 0) {
      alert("삭제할 쪽지를 선택하세요.");
      return;
    }
    if (!confirm(`정말 ${selectedIds.length}개의 쪽지를 삭제하시겠습니까?`)) {
      return;
    }
    try {
      const { error } = await supabase
        .from("messages")
        .delete()
        .in("id", selectedIds);

      if (error) {
        console.error("메시지 삭제 오류:", error);
        alert("삭제 실패!");
        return;
      }
      setRows((prev) => prev.filter((row) => !selectedIds.includes(row.id)));
      setSelectedIds([]);
      alert("삭제 완료");
    } catch (err) {
      console.error("삭제 중 오류:", err);
      alert("삭제 오류");
    }
  }

  // 행 클릭 → 팝업 열기 (대화 상대의 user_id 기준)
  function handleRowClick(msg) {
    const otherUserId = msg.sender_id === myUid ? msg.receiver_id : msg.sender_id;
    const w = 600;
    const h = 800;
    const top = window.screenY + 100;
    const left = window.screenX + 100;
    window.open(
      `/master/sendMessage?otherId=${otherUserId}`,
      `popupWindow-${otherUserId}`,
      `width=${w},height=${h},top=${top},left=${left},resizable=yes,scrollbars=yes`
    );
  }

  // 필터/검색 (미구현)
  function handleFilterChange() {
    console.log("드롭다운 바뀜 (미구현)");
  }
  function handleSearch() {
    console.log("검색:", searchTerm);
  }

  // 만약 아직 isMaster가 null이라면(판별 중이라면) 로딩 상태로 봐주기
  if (isMaster === null) {
    return <div className="p-4 text-sm text-gray-500">검증 중... 잠시만 기다려주세요...</div>;
  }

  // 혹시 isMaster가 false면? useEffect로 404 리다이렉트 중이긴 하지만,
  // 혹시나 해서 간단 안내 뿌려놓기(순간이라도 표시될 수 있도록)
  if (isMaster === false) {
    return <div className="p-4 text-red-500">관리자 계정이 아닙니다. 404 페이지로 갑니다!</div>;
  }

  // 이제 정상적으로 페이지 표시
  if (loading) {
    return <div className="p-4 text-sm text-gray-500">쪽지 목록 로딩중...</div>;
  }

  const totalCount = rows.length;
  const page = 1;
  const totalPage = 1;

  return (
    <div className="p-4 bg-white rounded-md shadow-sm">
      {/* 상단 제목 */}
      <h1 className="text-lg font-bold mb-3 text-slate-700">
        쪽지 목록 (읽지 않은 {unreadCount}개)
      </h1>

      {/* 검색/필터 영역 */}
      <div className="flex items-center gap-2 mb-3">
        <select
          onChange={handleFilterChange}
          className="border border-gray-300 text-sm p-2 rounded focus:outline-none"
        >
          <option>전체 보기</option>
          <option>기타 조건</option>
        </select>

        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="이름/닉네임 검색"
          className="border border-gray-300 text-sm p-2 rounded focus:outline-none"
        />
        <button
          onClick={handleSearch}
          className="px-3 py-2 text-sm border border-gray-300 rounded 
                     hover:bg-gray-100 transition-colors focus:outline-none"
        >
          검색
        </button>

        {/* 오른쪽 - 삭제 버튼 */}
        <div className="ml-auto flex gap-2">
          <button
            onClick={handleDelete}
            className="px-4 py-2 bg-gray-800 text-white text-sm rounded hover:bg-gray-600
                       focus:outline-none"
          >
            삭제
          </button>
        </div>
      </div>

      <div className="mb-2 text-sm text-gray-600">
        총 {totalCount}명, 현재 페이지: {page} / {totalPage}
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto rounded-md border border-gray-200">
        <table className="w-full text-sm border-collapse">
          <thead className="bg-gray-50 text-gray-600 border-b border-gray-200">
            <tr>
              <th className="p-2 w-10 text-center">
                <input
                  type="checkbox"
                  onChange={handleSelectAllChange}
                  checked={rows.length > 0 && selectedIds.length === rows.length}
                />
              </th>
              <th className="p-2 text-left">닉네임</th>
              <th className="p-2 text-left">쪽지 내용</th>
              <th className="p-2 text-center w-32">시간</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-4 text-center text-gray-400">
                  쪽지가 없습니다.
                </td>
              </tr>
            ) : (
              rows.map((msg) => {
                const rowChecked = selectedIds.includes(msg.id);
                // 만약 상대방 메시지이고, read_at이 null이면 unread → 주황색 배경
                const isOther = msg.sender_id !== myUid;
                const unreadClass = isOther && msg.read_at === null ? "bg-orange-200" : "";
                return (
                  <tr
                    key={msg.id}
                    onClick={() => handleRowClick(msg)}
                    className={`border-b border-gray-200 last:border-none hover:bg-gray-50 
                                cursor-pointer ${msg.is_banned ? "bg-red-50" : unreadClass}`}
                  >
                    <td
                      className="p-2 text-center"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={rowChecked}
                        onChange={(e) =>
                          handleCheckboxChange(msg.id, e.target.checked)
                        }
                      />
                    </td>
                    <td className="p-2 text-gray-800">
                      {msg.nickname}
                      {msg.is_banned && (
                        <span className="text-xs text-red-500 ml-1">
                          (차단됨)
                        </span>
                      )}
                    </td>
                    <td className="p-2 text-gray-700 break-words">
                      {msg.content}
                    </td>
                    <td className="p-2 text-center text-gray-500">
                      {formatLocalTime(msg.created_at)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}