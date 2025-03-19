"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseF";

/** 날짜/시간 문자열을 로컬 시간 형식으로 변환 */
function formatLocalTime(isoString) {
  if (!isoString) return "(작성일 없음)";

  const utcDate = new Date(isoString);
  const localDate = new Date(utcDate.getTime());

  // 시/분
  const hh = String(localDate.getHours()).padStart(2, "0");
  const mm = String(localDate.getMinutes()).padStart(2, "0");

  // 오늘/어제/N일 전
  const createdNoTime = new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate());
  const now = new Date();
  const nowNoTime = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let dayDiff = Math.floor((nowNoTime - createdNoTime) / (1000*60*60*24));
  if (dayDiff < 0) dayDiff = 0;

  if (dayDiff === 0) return `오늘 ${hh}:${mm}`;
  if (dayDiff === 1) return `어제 ${hh}:${mm}`;
  if (dayDiff <= 7) return `${dayDiff}일 전 ${hh}:${mm}`;

  // 7일 이상 → 올해 vs 이전
  const thisYear = now.getFullYear();
  const year = localDate.getFullYear();
  const month = localDate.getMonth() + 1;
  const date = localDate.getDate();

  if (year === thisYear) {
    return `${month}월 ${date}일 ${hh}:${mm}`;
  } else {
    return `${year}년 ${month}월 ${date}일 ${hh}:${mm}`;
  }
}

/**
 * CommentsList
 *
 * @param {boolean} isApproved - true이면 승인된 목록, false이면 미승인 목록
 */
export default function CommentsList({ isApproved }) {
  const router = useRouter();

  const [authChecked, setAuthChecked] = useState(false);
  const [sessionUserId, setSessionUserId] = useState(null);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState("desc");

  // 페이지네이션
  const PAGE_SIZE = 100;
  const [totalCount, setTotalCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(0);
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  // 체크박스
  const [selectedIds, setSelectedIds] = useState([]);
  const [isAllSelected, setIsAllSelected] = useState(false);

  // 헤더 타이틀
  const title = isApproved ? "승인된 댓글 목록" : "미승인 댓글 목록";
  // 승인 버튼(미승인일 때만)
  const showApproveBtn = !isApproved;

  // 세션 체크
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

  // 목록 조회
  useEffect(() => {
    if (!authChecked) return;
    fetchComments(sortOrder, pageNumber);
  }, [authChecked, sortOrder, pageNumber]);

  async function fetchComments(order, pageNum) {
    setLoading(true);
    try {
      const start = pageNum * PAGE_SIZE;
      const end = start + PAGE_SIZE - 1;

      const { data, error, count } = await supabase
        .from("comments")
        .select(`
          id,
          user_id,
          partnershipsubmit_id,
          comment,
          created_at,
          is_admitted,
          profiles!inner(user_id, nickname),
          partnershipsubmit!inner(id, post_title, comment)
        `,
          { count: "exact" }
        )
        .eq("is_admitted", isApproved)
        .order("created_at", { ascending: order === "asc" })
        .range(start, end);

      if (error) {
        console.error("댓글 조회 오류:", error);
        setRows([]);
        setLoading(false);
        return;
      }
      setRows(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error("API 오류:", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  // 체크박스 전체선택
  function handleSelectAll(checked) {
    setIsAllSelected(checked);
    if (checked) {
      const allIds = rows.map((r) => r.id);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  }
  function handleCheckboxChange(rowId, checked) {
    if (checked) {
      setSelectedIds((prev) => [...prev, rowId]);
    } else {
      setSelectedIds((prev) => prev.filter((id) => id !== rowId));
    }
  }
  useEffect(() => {
    if (rows.length === 0) {
      setIsAllSelected(false);
      return;
    }
    if (selectedIds.length === rows.length && !isAllSelected) {
      setIsAllSelected(true);
    } else if (isAllSelected && selectedIds.length !== rows.length) {
      setIsAllSelected(false);
    }
  }, [rows, selectedIds, isAllSelected]);

  // 삭제
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

      if (pageNumber > 0 && rows.length === selectedIds.length) {
        setPageNumber((prev) => prev - 1);
      }
      alert("삭제 완료");
    } catch (err) {
      console.error("삭제 오류:", err);
      alert("삭제 중 오류 발생");
    }
  }

  // 승인
  async function handleApproveSelected() {
    if (selectedIds.length === 0) {
      alert("승인할 항목이 없습니다.");
      return;
    }
    if (!confirm(`${selectedIds.length}개 댓글을 승인하시겠습니까?`)) {
      return;
    }
    try {
      // 승인 대상
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
        alert("이미 승인되었거나 존재하지 않습니다.");
        return;
      }

      // partnershipsubmit.comment +=
      const groupByPs = {};
      for (const cmt of commentsToApprove) {
        const psId = cmt.partnershipsubmit_id;
        groupByPs[psId] = (groupByPs[psId] || 0) + 1;
      }
      for (const psIdStr of Object.keys(groupByPs)) {
        const psId = parseInt(psIdStr, 10);
        const incrementCount = groupByPs[psIdStr];

        const { data: psData, error: psError } = await supabase
          .from("partnershipsubmit")
          .select("comment")
          .eq("id", psId)
          .single();
        if (psError || !psData) {
          continue;
        }
        const oldVal = psData.comment || 0;
        const newVal = oldVal + incrementCount;

        await supabase
          .from("partnershipsubmit")
          .update({ comment: newVal })
          .eq("id", psId);
      }

      // comments.is_admitted = true
      const { error: approveError } = await supabase
        .from("comments")
        .update({ is_admitted: true })
        .in("id", selectedIds);
      if (approveError) {
        console.error("승인 에러:", approveError);
        alert("승인 중 오류");
        return;
      }
      // 화면에서 제거
      setRows((prev) => prev.filter((r) => !selectedIds.includes(r.id)));
      setSelectedIds([]);
      setIsAllSelected(false);

      if (pageNumber > 0 && rows.length === selectedIds.length) {
        setPageNumber((prev) => prev - 1);
      }
      alert("승인 완료!");
      router.refresh();
    } catch (err) {
      console.error("승인 처리 오류:", err);
      alert("승인 오류");
    }
  }

  // 페이지 이동
  function handlePrevPage() {
    if (pageNumber > 0) {
      setPageNumber(pageNumber - 1);
    }
  }
  function handleNextPage() {
    if (pageNumber < totalPages - 1) {
      setPageNumber(pageNumber + 1);
    }
  }

  // 닉네임 클릭 → userComments 팝업
  function handleNicknameClick(e, row) {
    e.stopPropagation();
    if (!row.user_id) {
      alert("user_id가 없습니다!");
      return;
    }
    const w = 1000, h = 900;
    const top = window.screenY + 100;
    const left = window.screenX + 100;
    window.open(
      `/master/userComments?user_id=${row.user_id}`,
      `userCommentsPopup-${row.user_id}`,
      `width=${w},height=${h},top=${top},left=${left},resizable=yes,scrollbars=yes`
    );
  }

  // 게시글 제목 클릭 → /board/detail/:id 팝업
  function handlePostTitleClick(e, row) {
    e.stopPropagation();
    const postId = row.partnershipsubmit?.id;
    if (!postId) {
      alert("게시글 ID가 없습니다!");
      return;
    }
    const w = 1400, h = 1200;
    const top = window.screenY + 50;
    const left = window.screenX + 50;
    window.open(
      `/board/detail/${postId}`,
      `postDetailPopup-${postId}`,
      `width=${w},height=${h},top=${top},left=${left},resizable=yes,scrollbars=yes`
    );
  }

  if (!authChecked) {
    return <div className="p-4">로그인 여부 확인 중...</div>;
  }
  if (loading) {
    return <div className="p-4">데이터 불러오는 중...</div>;
  }

  return (
    <div className="p-4 border border-slate-200 rounded-md bg-white shadow-sm">
      {/* 헤더 */}
      <CommentsHeader
        title={title}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        totalCount={totalCount}
        onDelete={handleDeleteSelected}
        onApprove={handleApproveSelected}
        showApproveBtn={showApproveBtn}
      />

      {/* 테이블 */}
      <CommentsTable
        rows={rows}
        selectedIds={selectedIds}
        isAllSelected={isAllSelected}
        onSelectAll={handleSelectAll}
        onCheckboxChange={handleCheckboxChange}
        handleNicknameClick={handleNicknameClick}
        handlePostTitleClick={handlePostTitleClick}
      />

      {/* 페이지네이션 */}
      <div className="flex gap-2 mt-4 items-center justify-center">
        <button
          onClick={handlePrevPage}
          disabled={pageNumber === 0}
          className="px-3 py-1 text-xs rounded border border-slate-300 text-slate-600 
                     hover:bg-slate-200 disabled:opacity-50"
        >
          Prev
        </button>
        <div className="text-sm text-slate-600">
          페이지 <span className="font-medium ml-1 mr-1">{pageNumber + 1}</span> /{" "}
          {totalPages}
        </div>
        <button
          onClick={handleNextPage}
          disabled={pageNumber >= totalPages - 1}
          className="px-3 py-1 text-xs rounded border border-slate-300 text-slate-600 
                     hover:bg-slate-200 disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

/** 공통 헤더 */
function CommentsHeader({
  title,
  sortOrder,
  setSortOrder,
  totalCount,
  onDelete,
  onApprove,
  showApproveBtn,
}) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <h2 className="text-lg font-semibold text-slate-700">{title}</h2>

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
        onClick={onDelete}
        className="px-3 py-1 text-sm rounded border border-red-600 text-red-600
                   hover:bg-red-600 hover:text-white hover:border-transparent 
                   focus:outline-none"
      >
        삭제
      </button>

      {/* 승인 버튼 (미승인만) */}
      {showApproveBtn && (
        <button
          onClick={onApprove}
          className="px-3 py-1 text-sm rounded border border-green-600 text-green-600
                     hover:bg-green-600 hover:text-white hover:border-transparent 
                     focus:outline-none"
        >
          승인
        </button>
      )}

      {/* 건수 */}
      <div className="text-sm text-slate-500 ml-auto">총 {totalCount} 건</div>
    </div>
  );
}

/** 공통 테이블 */
function CommentsTable({
  rows,
  selectedIds,
  isAllSelected,
  onSelectAll,
  onCheckboxChange,
  handleNicknameClick,
  handlePostTitleClick,
}) {
  return (
    <table className="w-full border border-slate-100 text-sm">
      <thead className="bg-slate-50 text-slate-700">
        <tr>
          <Th className="text-center" style={{width: "40px"}}>
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={(e) => onSelectAll(e.target.checked)}
            />
          </Th>
          <Th className="text-center">닉네임</Th>
          <Th className="text-center">게시글</Th>
          <Th className="text-center">댓글 내용</Th>
          <Th className="text-center" style={{width: "120px"}}>작성일</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          const isChecked = selectedIds.includes(row.id);
          return (
            <tr key={row.id} className="border-b last:border-none">
              {/* 체크박스 */}
              <Td className="text-center">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) => onCheckboxChange(row.id, e.target.checked)}
                  onClick={(ev) => ev.stopPropagation()}
                />
              </Td>

              {/* 닉네임 */}
              <Td className="text-center">
                <div
                  className="cursor-pointer text-slate-600 font-medium 
                             hover:text-slate-900 hover:bg-slate-100 inline-block px-2 py-1 rounded
                             transition-colors"
                  onClick={(e) => handleNicknameClick(e, row)}
                >
                  {row.profiles?.nickname || "(닉네임 없음)"}
                </div>
              </Td>

              {/* 게시글 (10줄 넘으면 ... 처리) */}
              <Td className="max-w-[300px] text-center">
                {row.partnershipsubmit ? (
                  <div
                    className="cursor-pointer text-slate-600 font-medium 
                               hover:text-slate-900 hover:bg-slate-100 inline-block px-2 py-1 rounded
                               transition-colors line-clamp-10 break-words overflow-hidden"
                    onClick={(e) => handlePostTitleClick(e, row)}
                    style={{textAlign: "center"}}
                  >
                    {row.partnershipsubmit?.post_title || "(게시글 없음)"}
                  </div>
                ) : (
                  <span className="text-gray-400">(게시글 없음)</span>
                )}
              </Td>

              {/* 댓글 내용 (줄바꿈 표시) */}
              <Td className="whitespace-pre-wrap break-words px-2 py-2 align-top max-w-[400px] text-slate-700">
                {row.comment}
              </Td>

              {/* 작성일 */}
              <Td className="text-center text-slate-500 align-top">
                {formatLocalTime(row.created_at)}
              </Td>
            </tr>
          );
        })}

        {rows.length === 0 && (
          <tr>
            <td colSpan={5} className="p-4 text-center text-slate-400">
              댓글이 없습니다.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function Th({ children, className="", style={} }) {
  return (
    <th
      className={`border-b border-slate-200 p-2 font-semibold ${className}`}
      style={style}
    >
      {children}
    </th>
  );
}

function Td({ children, className="", style={} }) {
  return (
    <td
      className={`border-b border-slate-100 p-2 ${className}`}
      style={style}
    >
      {children}
    </td>
  );
}