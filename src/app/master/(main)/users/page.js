
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseF";

/** 전화번호 포맷 함수 (010-XXXX-XXXX 등) */
function formatPhoneNumber(raw) {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("010")) {
    return digits.replace(/^(\d{3})(\d{4})(\d{4})$/, "$1-$2-$3");
  } else if (digits.length === 10) {
    return digits.replace(/^(\d{2,3})(\d{3,4})(\d{4})$/, "$1-$2-$3");
  }
  return raw;
}

// ----- 테이블 헤더 & 데이터 셀 -----
function Th({ children }) {
  return (
    <th className="border-b border-slate-200 p-2 text-left font-semibold text-sm">
      {children}
    </th>
  );
}

function Td({ children, colSpan = null, className = "", onClick }) {
  return (
    <td
      colSpan={colSpan || undefined}
      className={`border-b border-slate-100 p-2 text-sm text-slate-600 ${className}`}
      onClick={onClick}
    >
      {children}
    </td>
  );
}

// -----------------------------------
export default function UsersPage() {
  const router = useRouter();

  // 세션 확인
  const [authChecked, setAuthChecked] = useState(false);
  const [sessionUserId, setSessionUserId] = useState(null);

  // 검색 & 필터 & 페이지
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all"); 
  const [page, setPage] = useState(1);
  const pageSize = 100;
  const [totalCount, setTotalCount] = useState(0);

  // 메인 데이터
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // 체크박스
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  // -------------------------------
  // 1) 세션 체크
  // -------------------------------
  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        console.error("세션 체크 에러:", error);
        router.push("/master/login");
        return;
      }
      if (!data.session) {
        router.push("/master/login");
      } else {
        setSessionUserId(data.session.user.id);
        setAuthChecked(true);
      }
    });
  }, [router]);

  // -------------------------------
  // 2) 프로필 목록 불러오기
  // -------------------------------
  useEffect(() => {
    if (!authChecked) return;
    fetchProfiles();
  }, [authChecked, filter, page, searchTerm]);

  async function fetchProfiles() {
    setLoading(true);
    try {
      let query = supabase
        .from("profiles")
        .select("user_id, email, nickname, name, phone, isPartner, is_banned", {
          count: "exact",
        })
        .order("user_id", { ascending: true });

      // 필터
      if (filter === "normal") {
        // 일반 유저만
        query = query.or("isPartner.eq.false,isPartner.is.null");
      } else if (filter === "partner") {
        // 제휴 유저만
        query = query.eq("isPartner", true);
      }

      // 검색 (닉네임 OR 이름)
      if (searchTerm.trim() !== "") {
        const term = `%${searchTerm.trim()}%`;
        query = query.or(`nickname.ilike.${term},name.ilike.${term}`);
      }

      // 페이지네이션
      const from = (page - 1) * pageSize;
      const to = from + (pageSize - 1);
      query = query.range(from, to);

      const { data, count, error } = await query;
      if (error) {
        console.error("profiles 조회 에러:", error);
        setRows([]);
        setTotalCount(0);
        return;
      }
      setRows(data || []);
      setTotalCount(count || 0);
      setSelectedUserIds([]);
    } catch (err) {
      console.error("API 오류:", err);
      setRows([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }

  // 검색
  function handleSearch() {
    setPage(1);
    setSearchTerm(searchInput);
  }
  function handleKeyDown(e) {
    if (e.key === "Enter") {
      handleSearch();
    }
  }

  // 행 클릭 → “sendMessage?otherId” 팝업 열기
  function handleRowClick(row) {
    const w = 1000;
    const h = 1000;
    const top = window.screenY + 100;
    const left = window.screenX + 100;

    // ★ sendMessage?otherId=... 팝업
    window.open(
      `/master/sendMessage?otherId=${row.user_id}`,
      `popupWindow-${row.user_id}`,
      `width=${w},height=${h},top=${top},left=${left},resizable=yes,scrollbars=yes`
    );
  }

  // 선택 회원 탈퇴
  async function handleDeleteSelected() {
    if (selectedUserIds.length === 0) {
      alert("탈퇴할 회원을 선택하세요.");
      return;
    }
    if (!confirm(`정말 ${selectedUserIds.length}명 탈퇴 처리하시겠습니까?`)) {
      return;
    }
    try {
      for (const userId of selectedUserIds) {
        const res = await fetch("/api/deleteUser", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId }),
        });
        if (!res.ok) {
          const { error } = await res.json();
          console.error(
            `회원탈퇴 실패 (user_id=${userId}): ${error || "알 수 없는 에러"}`
          );
        }
      }
      alert("탈퇴 처리가 완료되었습니다.");
      fetchProfiles();
    } catch (err) {
      console.error("회원 탈퇴 중 오류:", err);
      alert("회원 탈퇴 중 오류 발생");
    }
  }

  // 선택 회원 차단/해제
  async function handleBanSelected() {
    if (selectedUserIds.length === 0) {
      alert("차단할 회원을 선택하세요.");
      return;
    }
    const selectedRows = rows.filter((r) => selectedUserIds.includes(r.user_id));
    const isAnyBanned = selectedRows.some((r) => r.is_banned);
    const isAnyUnbanned = selectedRows.some((r) => !r.is_banned);

    if (isAnyBanned && isAnyUnbanned) {
      alert("차단된 사용자와 일반 사용자가 같이 있어 해당 작업을 동시에 수행할 수 없습니다.");
      return;
    }

    const newBanStatus = isAnyUnbanned;
    if (!confirm(
      newBanStatus
        ? `선택한 ${selectedUserIds.length}명을 차단하시겠습니까?`
        : `선택한 ${selectedUserIds.length}명의 차단을 해제하시겠습니까?`
    )) {
      return;
    }

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_banned: newBanStatus })
        .in("user_id", selectedUserIds);

      if (error) {
        console.error("차단/해제 작업 중 오류:", error);
        alert("차단/해제 작업에 실패했습니다.");
        return;
      }
      alert(
        newBanStatus
          ? "선택한 회원을 차단했습니다."
          : "선택한 회원의 차단을 해제했습니다."
      );
      fetchProfiles();
    } catch (err) {
      console.error("차단/해제 요청 중 오류:", err);
      alert("차단/해제 작업에 실패했습니다.");
    }
  }

  // 체크박스 (개별 행)
  function handleCheckboxChange(userId) {
    setSelectedUserIds((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  }

  // 전체선택 체크박스
  function handleSelectAllChange(e) {
    if (e.target.checked) {
      const allIds = rows.map((r) => r.user_id);
      setSelectedUserIds(allIds);
    } else {
      setSelectedUserIds([]);
    }
  }

  // 페이지네이션
  const totalPages = Math.ceil(totalCount / pageSize);
  function handlePrevPage() {
    if (page > 1) setPage((p) => p - 1);
  }
  function handleNextPage() {
    if (page < totalPages) setPage((p) => p + 1);
  }

  // 로딩
  if (!authChecked) {
    return <div className="p-4 text-slate-600">로그인 여부 확인 중...</div>;
  }
  if (loading) {
    return <div className="p-4 text-slate-600">데이터 불러오는 중...</div>;
  }

  // 렌더링
  return (
    <div className="w-full mx-auto bg-white p-4 border border-slate-200 rounded-md shadow-sm">
      <h1 className="text-2xl font-bold mb-6 text-slate-700">유저 목록</h1>

      {/* 검색 / 필터 / 탈퇴 / 차단 버튼 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-4">
        {/* 필터 + 검색 */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => {
                setPage(1);
                setFilter(e.target.value);
              }}
              className="border border-slate-300 p-2 text-sm rounded focus:outline-none
                         appearance-none pr-8"
            >
              <option value="all">전체 보기</option>
              <option value="normal">일반 유저</option>
              <option value="partner">제휴 유저</option>
            </select>
            {/* 화살표 아이콘 */}
            <div className="absolute right-2 top-2 pointer-events-none text-slate-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 9l-7 7-7-7"/>
              </svg>
            </div>
          </div>

          <input
            type="text"
            placeholder="이름/닉네임 검색"
            className="border border-slate-300 p-2 text-sm rounded focus:outline-none"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          <button
            onClick={handleSearch}
            className="border border-slate-300 text-sm rounded px-3 py-2 
                       hover:bg-slate-100 transition-colors"
          >
            검색
          </button>
        </div>

        {/* 탈퇴 + 차단 버튼 */}
        <div className="flex gap-2">
          <button
            onClick={handleDeleteSelected}
            className="bg-zinc-700 border border-zinc-700 px-3 py-2 text-white rounded text-sm
                       hover:bg-zinc-400 hover:border-zinc-400 transition-colors"
          >
            회원 탈퇴
          </button>
          <button
            onClick={handleBanSelected}
            className="bg-zinc-700 border border-zinc-700 px-3 py-2 text-white rounded text-sm
                       hover:bg-zinc-400 hover:border-zinc-400 transition-colors"
          >
            유저 차단/해제
          </button>
        </div>
      </div>

      {/* 현재 페이지 & 총 개수 */}
      <div className="flex items-center mb-2 text-sm text-slate-600">
        <span>총 {totalCount}명</span>
        <span className="ml-4">현재 페이지: {page} / {totalPages || 1}</span>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full border border-slate-100 text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <Th>
                <input
                  type="checkbox"
                  onChange={handleSelectAllChange}
                  checked={
                    rows.length > 0 && selectedUserIds.length === rows.length
                  }
                />
              </Th>
              <Th>이메일</Th>
              <Th>이름</Th>
              <Th>닉네임</Th>
              <Th>전화번호</Th>
              <Th>제휴 여부</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isChecked = selectedUserIds.includes(row.user_id);
              const rowClass = row.is_banned ? "bg-red-50" : "hover:bg-slate-50";

              return (
                <tr
                  key={row.user_id}
                  className={`border-b last:border-none cursor-pointer ${rowClass}`}
                  onClick={() => handleRowClick(row)}
                >
                  <Td
                    onClick={(e) => {
                      // 체크박스 클릭 → 팝업 열림 방지
                      e.stopPropagation();
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleCheckboxChange(row.user_id)}
                    />
                  </Td>

                  <Td>{row.email || "이메일이 없습니다"}</Td>
                  <Td>
                    {row.name || ""}
                    {row.is_banned && (
                      <span className="text-xs text-red-500 ml-1">
                        (차단됨)
                      </span>
                    )}
                  </Td>
                  <Td>{row.nickname || ""}</Td>
                  <Td>{formatPhoneNumber(row.phone)}</Td>
                  <Td>{row.isPartner ? "제휴" : "일반"}</Td>
                </tr>
              );
            })}

            {rows.length === 0 && (
              <tr>
                <Td colSpan={6} className="p-4 text-center text-slate-400">
                  데이터가 없습니다.
                </Td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex flex-col items-end mt-4 space-y-2">
          {/* 이전/다음 버튼 */}
          <div className="space-x-2">
            <button
              onClick={() => page > 1 && setPage(page - 1)}
              disabled={page <= 1}
              className="px-3 py-1 border border-slate-300 text-sm rounded 
                         disabled:bg-slate-100 disabled:text-slate-400 
                         hover:bg-slate-200 focus:outline-none"
            >
              이전
            </button>
            <button
              onClick={() => page < totalPages && setPage(page + 1)}
              disabled={page >= totalPages}
              className="px-3 py-1 border border-slate-300 text-sm rounded
                         disabled:bg-slate-100 disabled:text-slate-400
                         hover:bg-slate-200 focus:outline-none"
            >
              다음
            </button>
          </div>
          {/* 숫자 페이지 버튼들 */}
          <div className="flex space-x-1">
            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-3 py-1 border border-slate-300 text-sm rounded 
                            ${p === page ? "bg-slate-200" : "hover:bg-slate-100"}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}