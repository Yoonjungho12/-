"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseF";
import { useRouter } from "next/navigation";

// 날짜 포맷 함수 (로컬 시간 변환)
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

export default function CommentsPendingList() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [sessionUserId, setSessionUserId] = useState(null);

  // 댓글 목록
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // 정렬 (asc|desc)
  const [sortOrder, setSortOrder] = useState("desc");

  // 체크박스
  const [selectedIds, setSelectedIds] = useState([]);
  const [isAllSelected, setIsAllSelected] = useState(false);

  // 1) 인증 체크
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

  // 2) 세션 후, 댓글 목록 조회
  useEffect(() => {
    if (!authChecked) return;
    fetchComments(sortOrder);
  }, [authChecked, sortOrder]);

  // is_admitted = false 댓글 목록 가져오기
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
        .eq("is_admitted", false)
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

  // 테이블 행 클릭 시 (디테일 팝업 등)
  const handleRowClick = (row) => {
    console.log("row:", row);
  };

  // 체크박스 개별
  const handleCheckboxChange = (rowId, checked) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, rowId]);
    } else {
      setSelectedIds((prev) => prev.filter((id) => id !== rowId));
    }
  };

  // 체크박스 전체
  const handleSelectAll = (checked) => {
    setIsAllSelected(checked);
    if (checked) {
      const allIds = rows.map((r) => r.id);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  // isAllSelected 동기화
  if (rows.length > 0) {
    if (selectedIds.length === rows.length && !isAllSelected) {
      setIsAllSelected(true);
    } else if (isAllSelected && selectedIds.length !== rows.length) {
      setIsAllSelected(false);
    }
  } else {
    if (isAllSelected) setIsAllSelected(false);
  }

  // 삭제
  const handleDeleteSelected = async () => {
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
  };

  // 승인
  const handleApproveSelected = async () => {
    if (selectedIds.length === 0) {
      alert("승인할 항목이 없습니다.");
      return;
    }
    if (!confirm(`${selectedIds.length}개 댓글을 승인하시겠습니까?`)) {
      return;
    }

    try {
      // 1) 승인 대상 re-fetch
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

      // 2) partnershipsubmit_id별로 그룹화
      const groupByPs = {};
      for (const cmt of commentsToApprove) {
        const psId = cmt.partnershipsubmit_id;
        groupByPs[psId] = (groupByPs[psId] || 0) + 1;
      }

      // 3) partnershipsubmit.comment += ...
      for (const psIdStr of Object.keys(groupByPs)) {
        const psId = parseInt(psIdStr, 10);
        const incrementCount = groupByPs[psIdStr];

        // (a) 기존 comment 값
        const { data: psData, error: psError } = await supabase
          .from("partnershipsubmit")
          .select("comment")
          .eq("id", psId)
          .single();

        if (psError || !psData) {
          console.error("게시물 조회 에러:", psError);
          continue;
        }

        const oldVal = psData.comment || 0;
        const newVal = oldVal + incrementCount;

        // (b) 업데이트
        const { error: updateError } = await supabase
          .from("partnershipsubmit")
          .update({ comment: newVal })
          .eq("id", psId);

        if (updateError) {
          console.error("댓글수 갱신 에러:", updateError);
          continue;
        }
      }

      // 4) comments.is_admitted = true
      const { error: approveError } = await supabase
        .from("comments")
        .update({ is_admitted: true })
        .in("id", selectedIds);

      if (approveError) {
        console.error("댓글 승인 에러:", approveError);
        alert("승인 중 오류 발생");
        return;
      }

      // 5) 목록에서 제거
      setRows((prev) => prev.filter((r) => !selectedIds.includes(r.id)));
      setSelectedIds([]);
      setIsAllSelected(false);
      alert("승인 완료!");
    } catch (err) {
      console.error("승인 처리 오류:", err);
      alert("승인 처리 중 알 수 없는 오류");
    }
  };

  // 화면 상태
  if (!authChecked) {
    return <div className="p-4">로그인 여부 확인 중...</div>;
  }
  if (loading) {
    return <div className="p-4">데이터 불러오는 중...</div>;
  }

  return (
    <div className="p-4">
      {/* 한 줄에 전부 왼쪽 정렬 */}
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-bold text-blue-600">
          미승인 댓글
        </h2>

        {/* 정렬 셀렉트 */}
        <select
          className="border border-gray-300 p-1 text-sm"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
        >
          <option value="desc">최신순</option>
          <option value="asc">오래된순</option>
        </select>

        {/* 삭제 버튼 */}
        <button
          onClick={handleDeleteSelected}
          className="border border-red-500 text-red-500 px-4 py-1 rounded text-sm"
        >
          삭제
        </button>

        {/* 승인 버튼 */}
        <button
          onClick={handleApproveSelected}
          className="border border-green-500 text-green-500 px-4 py-1 rounded text-sm"
        >
          승인
        </button>
      </div>

      {/* 건수 표시 */}
      <div className="text-sm text-gray-500 mt-1">총 {rows.length} 건</div>

      {/* 테이블 */}
      <table className="mt-4 border border-gray-200 text-sm w-full">
        <thead className="bg-white text-blue-600">
          <tr>
            <Th>
              <input
                type="checkbox"
                checked={isAllSelected}
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
            </Th>
            <Th>닉네임</Th>
            <Th>게시글</Th>
            <Th>댓글 내용</Th>
            <Th>작성일</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const isChecked = selectedIds.includes(row.id);
            return (
              <tr
                key={row.id}
                className="hover:bg-gray-50"
                onClick={() => handleRowClick(row)}
              >
                <Td>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(e) =>
                      handleCheckboxChange(row.id, e.target.checked)
                    }
                    onClick={(ev) => ev.stopPropagation()}
                  />
                </Td>
                <Td>{row.profiles?.nickname || "(닉네임 없음)"}</Td>
                <Td>{row.partnershipsubmit?.post_title || "(게시글 없음)"}</Td>
                <Td>{row.comment}</Td>
                <Td>{formatLocalTime(row.created_at)}</Td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <td colSpan={5} className="p-4 text-center text-gray-500">
                미승인 댓글이 없습니다.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

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