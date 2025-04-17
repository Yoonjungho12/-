"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseF";
import { useRouter } from "next/navigation"; // ⬅️ 이거 추가!
/** 날짜 포맷 함수 (오늘/어제/x일 전) */
function formatLocalTime(isoString) {
  if (!isoString) return "(등록일 없음)";
  const utcDate = new Date(isoString);
  const localDate = new Date(utcDate.getTime());

  const hh = String(localDate.getHours()).padStart(2, "0");
  const mm = String(localDate.getMinutes()).padStart(2, "0");
  const timeStr = `${hh}:${mm}`;

  const createdNoTime = new Date(
    localDate.getFullYear(),
    localDate.getMonth(),
    localDate.getDate(),
    0, 0, 0
  );
  const now = new Date();
  const nowNoTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0, 0, 0
  );
  let dayDiff = Math.floor(
    (nowNoTime - createdNoTime) / (1000 * 60 * 60 * 24)
  );
  if (dayDiff < 0) dayDiff = 0;

  if (dayDiff === 0) return `오늘 ${timeStr}`;
  if (dayDiff === 1) return `어제 ${timeStr}`;
  if (dayDiff <= 7) return `${dayDiff}일 전 ${timeStr}`;

  const yyyy = localDate.getFullYear();
  const mon = localDate.getMonth() + 1;
  const dd = localDate.getDate();
  return `${yyyy}년 ${mon}월 ${dd}일`;
}

export default function PostsPendingList() {
  const router = useRouter(); 
  const [rows, setRows] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);

  // 페이지네이션 & 정렬
  const [page, setPage] = useState(1);       // 현재 페이지
  const pageSize = 10;                      // 한 페이지 최대 10개
  const [totalCount, setTotalCount] = useState(0);
  const [sortOrder, setSortOrder] = useState("desc"); // "desc" = 최신순, "asc"=오래된순

  useEffect(() => {
    fetchPendingPosts();
  }, [page, sortOrder]);

  // 게시글 승인 대기 목록 로드
  async function fetchPendingPosts() {
    setLoading(true);
    try {
      let query = supabase
        .from("posts")
        .select(
          `
            id,
            title,
            created_at,
            user_id,
            is_admitted,
            profiles(nickname),
            boards(name)
          `,
          { count: "exact" } // 전체 개수도 가져오기
        )
        .eq("is_admitted", false);

      // 정렬 (최신순 desc / 오래된순 asc)
      if (sortOrder === "desc") {
        query = query.order("created_at", { ascending: false });
      } else {
        query = query.order("created_at", { ascending: true });
      }

      // 페이지네이션 (range)
      const from = (page - 1) * pageSize;
      const to = from + (pageSize - 1);
      query = query.range(from, to);

      const { data, count, error } = await query;
      if (error) {
        console.error("게시글 승인 대기 목록 조회 오류:", error);
        setRows([]);
        setTotalCount(0);
      } else {
        setRows(data || []);
        setTotalCount(count || 0);
      }
      setSelectedIds([]);
    } catch (err) {
      console.error("API 오류:", err);
      setRows([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }

  // 체크박스 (개별)
  function handleCheckboxChange(postId) {
    setSelectedIds((prev) => {
      if (prev.includes(postId)) {
        return prev.filter((id) => id !== postId);
      } else {
        return [...prev, postId];
      }
    });
  }

  // 전체선택 체크박스
  function handleSelectAllChange(e) {
    if (e.target.checked) {
      const allIds = rows.map((r) => r.id);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  }

  // 승인 (체크된 글들)
  async function handleApproveSelected() {
    if (selectedIds.length === 0) {
      alert("승인할 게시글을 선택하세요.");
      return;
    }
    if (!confirm(`선택된 ${selectedIds.length}건을 승인하시겠습니까?`)) return;

    try {
      const { error } = await supabase
        .from("posts")
        .update({ is_admitted: true })
        .in("id", selectedIds);

      if (error) {
        console.error("게시글 승인 오류:", error);
        alert("승인 실패: " + error.message);
        return;
      }
      alert("선택된 게시글이 승인되었습니다.");
      setRows((prev) => prev.filter((row) => !selectedIds.includes(row.id)));
      setSelectedIds([]);
      router.refresh();
      // 또는 fetchPendingPosts();로 다시 전체 로드 가능
    } catch (err) {
      console.error("승인 처리 중 오류:", err);
      alert("승인 처리 중 오류 발생!");
    }
  }

  // 삭제 (체크된 글들)
  async function handleRejectSelected() {
    if (selectedIds.length === 0) {
      alert("삭제할 게시글을 선택하세요.");
      return;
    }
    if (!confirm(`선택된 ${selectedIds.length}건을 삭제하시겠습니까?`)) return;

    try {
      const { error } = await supabase
        .from("posts")
        .delete()
        .in("id", selectedIds);

      if (error) {
        console.error("게시글 삭제 오류:", error);
        alert("삭제 실패: " + error.message);
        return;
      }
      alert("선택된 게시글이 삭제되었습니다.");
      setRows((prev) => prev.filter((row) => !selectedIds.includes(row.id)));
      setSelectedIds([]);
    } catch (err) {
      console.error("삭제 처리 중 오류:", err);
      alert("삭제 처리 중 오류 발생!");
    }
  }

  // 페이지네이션 (이전 / 다음)
  function handlePrevPage() {
    if (page > 1) {
      setPage(page - 1);
    }
  }

  function handleNextPage() {
    // 총 페이지 수
    const totalPages = Math.ceil(totalCount / pageSize);
    if (page < totalPages) {
      setPage(page + 1);
    }
  }

  // 정렬 변경 (최신순/오래된순)
  function handleSortChange(e) {
    setSortOrder(e.target.value);
    setPage(1); // 정렬 바꿀 때 첫 페이지로
  }

  // 로딩
  if (loading) {
    return (
      <div className="p-4 text-sm text-slate-500">
        게시글 승인 대기 목록 불러오는 중...
      </div>
    );
  }

  // 총 페이지 수
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="bg-white p-4 border border-slate-200 rounded-md shadow-sm">
      {/* 상단 타이틀 + 총 개수 */}
      <div className="flex items-center justify-between mb-3">
        {/* 왼쪽: 제목 + 총 건수 */}
        <div>
          <h1 className="text-base font-semibold text-slate-700">
            커뮤니티 게시글 승인 대기 목록
          </h1>
          <span className="text-sm text-slate-500">총 {totalCount}건</span>
        </div>

        {/* 오른쪽: 정렬/버튼 */}
        <div className="flex items-center gap-2">
          {/* 정렬 select */}
          <select
            value={sortOrder}
            onChange={handleSortChange}
            className="border border-slate-300 rounded px-2 py-1 text-sm text-slate-700"
          >
            <option value="desc">최신순</option>
            <option value="asc">오래된순</option>
          </select>

          {/* 삭제/승인 버튼 (zinc 계열) */}
          <button
            onClick={handleRejectSelected}
            className="px-3 py-1 text-sm rounded bg-zinc-700 text-white hover:bg-zinc-600"
          >
            삭제
          </button>
          <button
            onClick={handleApproveSelected}
            className="px-3 py-1 text-sm rounded bg-zinc-700 text-white hover:bg-zinc-600"
          >
            승인
          </button>
        </div>
      </div>

      {/* 테이블 */}
      {rows.length === 0 ? (
        <div className="text-sm text-slate-500 mt-2">
          승인 대기 게시글이 없습니다.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border border-slate-100 text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <Th>
                  <input
                    type="checkbox"
                    onChange={handleSelectAllChange}
                    checked={
                      rows.length > 0 &&
                      rows.every((row) => selectedIds.includes(row.id))
                    }
                  />
                </Th>
                <Th>게시판</Th>
                <Th>제목</Th>
                <Th>닉네임</Th>
                <Th>작성일</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const isChecked = selectedIds.includes(row.id);
                return (
                  <tr
                    key={row.id}
                    className="border-b last:border-none hover:bg-slate-50"
                  >
                    <Td>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleCheckboxChange(row.id)}
                      />
                    </Td>
                    <Td>{row.boards?.name || "(게시판 없음)"}</Td>
                    <Td>{row.title || "(제목 없음)"}</Td>
                    <Td>{row.profiles?.nickname || "(닉네임 없음)"}</Td>
                    <Td>{formatLocalTime(row.created_at)}</Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* 페이지네이션 (이전 / 다음) */}
      {totalPages > 1 && (
        <div className="flex justify-end mt-4 space-x-2">
          <button
            onClick={handlePrevPage}
            disabled={page <= 1}
            className="px-3 py-1 border border-slate-300 text-sm rounded
                       disabled:bg-slate-100 disabled:text-slate-400
                       hover:bg-slate-200 focus:outline-none"
          >
            이전
          </button>
          <button
            onClick={handleNextPage}
            disabled={page >= totalPages}
            className="px-3 py-1 border border-slate-300 text-sm rounded
                       disabled:bg-slate-100 disabled:text-slate-400
                       hover:bg-slate-200 focus:outline-none"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}

// 테이블 헤더/데이터용 컴포넌트
function Th({ children }) {
  return (
    <th className="border-b border-slate-200 p-2 font-semibold text-left text-sm">
      {children}
    </th>
  );
}
function Td({ children }) {
  return (
    <td className="border-b border-slate-100 p-2 text-sm text-slate-600">
      {children}
    </td>
  );
}