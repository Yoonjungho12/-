"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseF";

export default function UsersPage() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [sessionUserId, setSessionUserId] = useState(null);

  // 유저 목록
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // 필터 (all, normal, partner)
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    // 1) 세션 체크
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

  // 2) profiles 테이블에서 목록 조회
  useEffect(() => {
    if (!authChecked) return;
    fetchProfiles(filter);
  }, [authChecked, filter]);

  async function fetchProfiles(filterOption) {
    setLoading(true);
    try {
      let query = supabase
        .from("profiles")
        .select("user_id, nickname, name, phone, isPartner");

      // 필터 적용
      if (filterOption === "normal") {
        // 일반 유저: isPartner != true (즉 false 또는 null 포함)
        query = query.or("isPartner.eq.false,isPartner.is.null");
      } else if (filterOption === "partner") {
        // 제휴 유저: isPartner == true
        query = query.eq("isPartner", true);
      }
      // 전체(all)는 필터 없이

      const { data, error } = await query;
      if (error) {
        console.error("profiles 조회 에러:", error);
        setRows([]);
        return;
      }
      setRows(data || []);
    } catch (err) {
      console.error("API 오류:", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  // -------------------------------------
  // [새로 추가] 행 클릭 → 팝업 열기
  // -------------------------------------
  const handleRowClick = (row) => {
    // 팝업 창 사이즈 및 위치
    const w = 1300;
    const h = 800;
    const top = window.screenY + 100;
    const left = window.screenX + 100;

    // 팝업 열기
    window.open(
      `/master/userComments?user_id=${row.user_id}`, // 쿼리스트링에 user_id 넘김
      `popupWindow-${row.user_id}`,
      `width=${w},height=${h},top=${top},left=${left},resizable=yes,scrollbars=yes`
    );
  };

  // -------------------------------------
  // 탈퇴 버튼
  // -------------------------------------
  async function handleDeleteUser(userId) {
    if (!confirm("정말 탈퇴 처리하시겠습니까?")) return;

    try {
      const res = await fetch("/api/deleteUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId }),
      });
      if (!res.ok) {
        const { error } = await res.json();
        alert(`탈퇴 실패: ${error || "알 수 없는 에러"}`);
        return;
      }
      alert("탈퇴가 완료되었습니다.");
      // 목록 재조회
      fetchProfiles(filter);
    } catch (err) {
      console.error("회원 탈퇴 중 오류:", err);
      alert("회원 탈퇴 중 오류 발생");
    }
  }

  if (!authChecked) {
    return <div className="p-4 text-blue-600">로그인 여부 확인 중...</div>;
  }
  if (loading) {
    return <div className="p-4 text-blue-600">데이터 불러오는 중...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold text-blue-600 mb-4">유저 목록</h1>

      {/* 필터 선택 영역 */}
      <div className="flex items-center gap-2 mb-4">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border border-gray-300 p-2 text-sm"
        >
          <option value="all">전체 보기</option>
          <option value="normal">일반 유저</option>
          <option value="partner">제휴 유저</option>
        </select>
        <span className="text-gray-600 text-sm">총 {rows.length}명</span>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-200 text-sm">
          <thead className="bg-gray-50 text-blue-600">
            <tr>
              <Th>유저ID</Th>
              <Th>이름</Th>
              <Th>닉네임</Th>
              <Th>전화번호</Th>
              <Th>제휴 여부</Th>
              <Th>탈퇴</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.user_id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => handleRowClick(row)} // 여기서 클릭 시 팝업!
              >
                <Td>{row.user_id}</Td>
                <Td>{row.name || ""}</Td>
                <Td>{row.nickname || ""}</Td>
                <Td>{row.phone || ""}</Td>
                <Td>{row.isPartner ? "제휴" : "일반"}</Td>
                {/* 탈퇴 버튼만은 클릭 전파 막음 (팝업 뜨지 않도록) */}
                <Td onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => handleDeleteUser(row.user_id)}
                    className="text-red-500 border border-red-500 px-2 py-1 text-xs rounded"
                  >
                    회원탈퇴
                  </button>
                </Td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="p-4 text-center text-gray-500">
                  데이터가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 테이블 헤더/데이터용 컴포넌트
function Th({ children }) {
  return (
    <th className="border-b border-gray-200 p-2 text-left font-semibold">
      {children}
    </th>
  );
}
function Td({ children }) {
  return <td className="border-b border-gray-200 p-2">{children}</td>;
}