"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseF";

/** 날짜/시간 문자열을 로컬 시간 형식으로 변환 (오늘/어제/N일 전) */
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
    0,
    0,
    0
  );
  const now = new Date();
  const nowNoTime = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    0,
    0,
    0
  );
  let dayDiff = Math.floor((nowNoTime - createdNoTime) / (1000 * 60 * 60 * 24));
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
 * 미승인 댓글 목록 (CommentsPendingList)
 */
export default function CommentsPendingList() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [sessionUserId, setSessionUserId] = useState(null);

  // 댓글 목록
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // 정렬
  const [sortOrder, setSortOrder] = useState("desc");

  // 체크박스 (개별/전체)
  const [selectedIds, setSelectedIds] = useState([]);
  const [isAllSelected, setIsAllSelected] = useState(false);

  // ------------------------------
  // 1) 세션 체크
  // ------------------------------
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

  // ------------------------------
  // 2) 목록 조회
  // ------------------------------
  useEffect(() => {
    if (!authChecked) return;
    fetchComments(sortOrder);
  }, [authChecked, sortOrder]);

  async function fetchComments(order) {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          id,
          user_id,
          partnershipsubmit_id,
          comment,
          created_at,
          is_admitted,
          profiles!inner(nickname),
          partnershipsubmit!inner(post_title, comment)
        `)
        .eq("is_admitted", false) // 미승인만
        .order("created_at", { ascending: order === "asc" });

      if (error) {
        console.error("댓글 조회 오류:", error);
        setRows([]);
        setLoading(false);
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

  // 행 클릭 (예: 디테일 팝업 열기)
  function handleRowClick(row) {
    console.log("row clicked:", row);
    // TODO: 팝업 혹은 상세 보기
  }

  // ------------------------------
  // 체크박스 로직
  // ------------------------------
  function handleCheckboxChange(rowId, checked) {
    if (checked) {
      setSelectedIds((prev) => [...prev, rowId]);
    } else {
      setSelectedIds((prev) => prev.filter((id) => id !== rowId));
    }
  }

  function handleSelectAll(checked) {
    setIsAllSelected(checked);
    if (checked) {
      const allIds = rows.map((r) => r.id);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  }

  // isAllSelected 동기화
  useEffect(() => {
    if (rows.length === 0) {
      if (isAllSelected) setIsAllSelected(false);
      return;
    }
    if (selectedIds.length === rows.length && !isAllSelected) {
      setIsAllSelected(true);
    } else if (isAllSelected && selectedIds.length !== rows.length) {
      setIsAllSelected(false);
    }
  }, [rows, selectedIds, isAllSelected]);

  // ------------------------------
  // 삭제
  // ------------------------------
  async function handleDeleteSelected() {
    if (selectedIds.length === 0) {
      alert("선택된 항목이 없습니다.");
      return;
    }
    if (!confirm(`${selectedIds.length}개 댓글을 삭제하시겠습니까?`)) return;

    try {
      const { error } = await supabase
        .from("comments")
        .delete()
        .in("id", selectedIds);

      if (error) {
        console.error("삭제 에러:", error);
        alert("삭제 실패");
        return;
      }
      setRows((prev) => prev.filter((r) => !selectedIds.includes(r.id)));
      setSelectedIds([]);
      setIsAllSelected(false);
      alert("삭제 완료");
    } catch (err) {
      console.error("삭제 오류:", err);
      alert("삭제 중 오류 발생");
    }
  }

  // ------------------------------
  // 승인
  // ------------------------------
  async function handleApproveSelected() {
    if (selectedIds.length === 0) {
      alert("승인할 항목이 없습니다.");
      return;
    }
    if (!confirm(`${selectedIds.length}개 댓글을 승인하시겠습니까?`)) {
      return;
    }

    try {
      // 1) 다시 한번 승인 대상 확인
      const { data: commentsToApprove, error: fetchError } = await supabase
        .from("comments")
        .select("id, partnershipsubmit_id")
        .in("id", selectedIds)
        .eq("is_admitted", false);

      if (fetchError) {
        console.error("승인 대상 조회 에러:", fetchError);
        alert("승인 실패(조회오류)");
        return;
      }
      if (!commentsToApprove || commentsToApprove.length === 0) {
        alert("이미 승인된 항목이거나 존재하지 않습니다.");
        return;
      }

      // 2) partnershipsubmit.comment += ...
      const groupByPs = {};
      for (const cmt of commentsToApprove) {
        const psId = cmt.partnershipsubmit_id;
        groupByPs[psId] = (groupByPs[psId] || 0) + 1;
      }
      for (const psIdStr of Object.keys(groupByPs)) {
        const psId = parseInt(psIdStr, 10);
        const incrementCount = groupByPs[psIdStr];

        // 현재 게시글의 기존 comment 값
        const { data: psData, error: psError } = await supabase
          .from("partnershipsubmit")
          .select("comment")
          .eq("id", psId)
          .single();
        if (psError || !psData) {
          console.error("파트너십 조회 에러:", psError);
          continue;
        }
        const oldVal = psData.comment || 0;
        const newVal = oldVal + incrementCount;

        // 업데이트
        const { error: updateError } = await supabase
          .from("partnershipsubmit")
          .update({ comment: newVal })
          .eq("id", psId);
        if (updateError) {
          console.error("댓글 수 업데이트 에러:", updateError);
          // continue anyway
        }
      }

      // 3) comments.is_admitted=true
      const { error: approveError } = await supabase
        .from("comments")
        .update({ is_admitted: true })
        .in("id", selectedIds);

      if (approveError) {
        console.error("댓글 승인 에러:", approveError);
        alert("승인 처리 중 오류 발생");
        return;
      }

      // 4) 화면 목록에서 제거
      setRows((prev) => prev.filter((r) => !selectedIds.includes(r.id)));
      setSelectedIds([]);
      setIsAllSelected(false);
      alert("승인 완료!");
      router.refresh();
    } catch (err) {
      console.error("승인 처리 오류:", err);
      alert("승인 처리 중 알 수 없는 오류");
    }
  }

  // ------------------------------
  // 상태별 렌더링
  // ------------------------------
  if (!authChecked) {
    return <div className="p-4 text-slate-600">로그인 여부 확인 중...</div>;
  }
  if (loading) {
    return <div className="p-4 text-slate-600">데이터 불러오는 중...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto bg-white p-4 border border-slate-200 rounded-md shadow-sm">
      {/* 헤더 영역 */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-700">
          미승인 댓글 목록
        </h2>
        <div className="flex items-center gap-2">
          {/* 정렬 셀렉트 */}
          <select
            className="border border-slate-300 py-1 px-2 text-sm rounded hover:bg-slate-100"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="desc">최신순</option>
            <option value="asc">오래된순</option>
          </select>
          {/* 삭제 버튼 */}
          <button
            onClick={handleDeleteSelected}
            className="bg-zinc-700 border border-zinc-700 px-3 py-1 text-white rounded text-sm
                       hover:bg-zinc-400 hover:border-zinc-400 focus:outline-none"
          >
            삭제
          </button>
          {/* 승인 버튼 */}
          <button
            onClick={handleApproveSelected}
            className="bg-zinc-700 border border-zinc-700 px-3 py-1 text-white rounded text-sm
                       hover:bg-zinc-400 hover:border-zinc-400 focus:outline-none"
          >
            승인
          </button>
        </div>
      </div>

      {/* 건수 */}
      <div className="text-sm text-slate-500 mb-2">
        총 {rows.length} 건
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full border border-slate-100 text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <Th style={{ width: "40px" }}>
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </Th>
              <Th>닉네임</Th>
              <Th>게시글</Th>
              <Th style={{ width: "40%" }}>댓글 내용</Th>
              <Th style={{ width: "100px" }}>작성일</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isChecked = selectedIds.includes(row.id);
              return (
                <tr
                  key={row.id}
                  className="border-b last:border-none hover:bg-slate-50 cursor-pointer"
                  onClick={() => handleRowClick(row)}
                >
                  <Td className="text-center">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onClick={(ev) => ev.stopPropagation()}
                      onChange={(e) =>
                        handleCheckboxChange(row.id, e.target.checked)
                      }
                    />
                  </Td>
                  <Td className="text-slate-600 px-2 py-1">
                    {row.profiles?.nickname || "(닉네임 없음)"}
                  </Td>
                  <Td className="text-slate-600 px-2 py-1">
                    {row.partnershipsubmit?.post_title || "(게시글 없음)"}
                  </Td>
                  <Td className="text-slate-600 px-2 py-1 whitespace-pre-wrap break-words">
                    {row.comment}
                  </Td>
                  <Td className="text-slate-500 px-2 py-1">
                    {formatLocalTime(row.created_at)}
                  </Td>
                </tr>
              );
            })}

            {rows.length === 0 && (
              <tr>
                <Td colSpan={5} className="p-4 text-center text-slate-400">
                  미승인 댓글이 없습니다.
                </Td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** 테이블 헤더 셀 */
function Th({ children, className="", style={} }) {
  return (
    <th
      className={`border-b border-slate-200 p-2 font-semibold text-sm text-left ${className}`}
      style={style}
    >
      {children}
    </th>
  );
}

/** 테이블 데이터 셀 */
function Td({ children, className="", style={}, colSpan=null }) {
  return (
    <td
      colSpan={colSpan || undefined}
      className={`border-b border-slate-100 p-2 align-middle text-sm ${className}`}
      style={style}
    >
      {children}
    </td>
  );
}