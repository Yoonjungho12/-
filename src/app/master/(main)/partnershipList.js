"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseF";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/24/solid";

/** 날짜/시간 문자열 포맷 (오늘/어제/N일 전/그 외) */
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
 * PartnershipList 컴포넌트
 * @param {"finalPending"|"legitPartner"|"partnership"} listType
 */
export default function PartnershipList({ listType }) {
  const router = useRouter();

  const [authChecked, setAuthChecked] = useState(false);
  const [sessionUserId, setSessionUserId] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // 정렬 옵션
  const [sortOrder, setSortOrder] = useState("desc");

  // 체크박스
  const [selectedIds, setSelectedIds] = useState([]);
  const [isAllSelected, setIsAllSelected] = useState(false);

  // -----------------------------
  // 1) 세션 체크
  // -----------------------------
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

  // -----------------------------
  // 2) 목록조회 + 가격 업로드 여부 체크
  // -----------------------------
  useEffect(() => {
    if (!authChecked) return;
    fetchPartnershipRows(listType, sortOrder);
  }, [authChecked, listType, sortOrder]);

  /** 메인 데이터 가져오기 → extra: _priceUploaded 필드 세팅 */
  async function fetchPartnershipRows(listType, order) {
    setLoading(true);

    try {
      // 2-1) partnershipsubmit 목록
      let query = supabase
        .from("partnershipsubmit")
        .select(`
          id,
          user_id,
          company_name,
          phone_number,
          address,
          post_title,
          created_at,
          thumbnail_url
        `)
        .order("created_at", { ascending: order === "asc" });

      if (listType === "finalPending") {
        // is_admitted=true + final_admitted=false
        query = query.eq("is_admitted", true).eq("final_admitted", false);
      } else if (listType === "legitPartner") {
        // is_admitted=true + final_admitted=true
        query = query.eq("is_admitted", true).eq("final_admitted", true);
      } else if (listType === "partnership") {
        // is_admitted=false
        query = query.eq("is_admitted", false);
      }

      const { data, error } = await query;
      if (error) {
        console.error("파트너십 목록 조회 오류:", error);
        setRows([]);
        setLoading(false);
        return;
      }

      const rawRows = data || [];

      // 2-2) finalPending인 경우만, 섹션/코스 존재여부(가격 업로드) 확인
      if (listType === "finalPending") {
        // 한 번에 row.id들 모아서 sections/courses join
        const postIds = rawRows.map((r) => r.id);
        if (postIds.length > 0) {
          // sections + courses(*)
          const { data: secs, error: secErr } = await supabase
            .from("sections")
            .select("id, post_id, courses(*)")
            .in("post_id", postIds);

          if (secErr) {
            console.error("섹션 조회 오류:", secErr);
            // 그냥 무시 → 전부 미 업로드로 처리
          } else {
            // map postId -> boolean(가격 업로드됨?)
            const priceUploadedMap = {};
            for (const row of secs) {
              // row.post_id
              // row.courses
              if (!priceUploadedMap[row.post_id]) {
                priceUploadedMap[row.post_id] = false;
              }
              // 만약 하나라도 courses가 있으면 업로드
              if (row.courses && row.courses.length > 0) {
                priceUploadedMap[row.post_id] = true;
              }
            }

            // rawRows에 _priceUploaded 필드 추가
            for (const r of rawRows) {
              r._priceUploaded = !!priceUploadedMap[r.id];
            }
          }
        } else {
          // 목록이 비었으니 skip
        }
      }

      setRows(rawRows);
    } catch (err) {
      console.error("fetchPartnershipRows 오류:", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  // -----------------------------
  // 행 클릭 → 팝업 열기
  // -----------------------------
  const handleRowClick = (row) => {
    const w = 800, h = 1000;
    const top = window.screenY + 100, left = window.screenX + 100;
    window.open(
      `/master/popup?id=${row.id}&user_id=${row.user_id}`,
      `popupWindow-${row.id}`,
      `width=${w},height=${h},top=${top},left=${left},resizable=yes,scrollbars=yes`
    );
  };

  // -----------------------------
  // 선택 항목 삭제
  // -----------------------------
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) {
      alert("선택된 항목이 없습니다.");
      return;
    }
    if (!confirm(`${selectedIds.length}개 항목을 삭제하시겠습니까?`)) return;
    try {
      const { error } = await supabase
        .from("partnershipsubmit")
        .delete()
        .in("id", selectedIds);
      if (error) {
        console.error("삭제 중 에러:", error);
        alert("삭제 실패");
        return;
      }
      // 목록에서 제거
      setRows((prev) => prev.filter((r) => !selectedIds.includes(r.id)));
      setSelectedIds([]);
      setIsAllSelected(false);
      alert("삭제 완료");
    } catch (err) {
      console.error("삭제 오류:", err);
      alert("삭제 중 오류");
    }
  };

  // -----------------------------
  // 승인/최종승인 처리
  // -----------------------------
  const handleApprovalSelected = async () => {
    if (selectedIds.length === 0) {
      alert("승인할 항목이 없습니다.");
      return;
    }
    const confirmMsg =
      listType === "partnership"
        ? `${selectedIds.length}개 항목을 승인하시겠습니까?`
        : `${selectedIds.length}개 항목을 최종 승인하시겠습니까?\n(모든 사용자에게 노출됩니다.)`;
    if (!confirm(confirmMsg)) return;

    try {
      let updateData = {};
      if (listType === "partnership") {
        updateData = { is_admitted: true };
      } else if (listType === "finalPending") {
        updateData = { final_admitted: true };
      }

      // 1) partnershipsubmit 업데이트
      const { data: updatedRows, error } = await supabase
        .from("partnershipsubmit")
        .update(updateData)
        .in("id", selectedIds)
        .select();

      if (error) {
        console.error("승인/최종승인 중 에러:", error);
        alert("승인 처리 실패");
        return;
      }

      // 2) finalPending → profiles.isPartner=true
      if (listType === "finalPending") {
        const userIds = updatedRows.map((r) => r.user_id).filter(Boolean);
        if (userIds.length > 0) {
          const { error: profileError } = await supabase
            .from("profiles")
            .update({ isPartner: true })
            .in("user_id", userIds);
          if (profileError) {
            console.error("isPartner 업데이트 에러:", profileError);
            alert("파트너 권한 업데이트 중 오류 발생");
          }
        }
      }

      alert("승인 처리 완료");
      // 목록에서 제거
      setRows((prev) => prev.filter((r) => !selectedIds.includes(r.id)));
      setSelectedIds([]);
      setIsAllSelected(false);
    } catch (err) {
      console.error("승인 처리 오류:", err);
      alert("승인 처리 중 오류");
    }
  };

  // -----------------------------
  // 체크박스 로직
  // -----------------------------
  const handleCheckboxChange = (rowId, checked) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, rowId]);
    } else {
      setSelectedIds((prev) => prev.filter((id) => id !== rowId));
    }
  };

  const handleSelectAll = (checked) => {
    setIsAllSelected(checked);
    if (checked) {
      const allIds = rows.map((r) => r.id);
      setSelectedIds(allIds);
    } else {
      setSelectedIds([]);
    }
  };

  if (
    selectedIds.length === rows.length &&
    rows.length > 0 &&
    !isAllSelected
  ) {
    setIsAllSelected(true);
  } else if (isAllSelected && selectedIds.length !== rows.length) {
    setIsAllSelected(false);
  }

  // -----------------------------
  // 상태별 렌더링
  // -----------------------------
  if (!authChecked) {
    return <div className="p-4 text-slate-600">로그인 여부 확인 중...</div>;
  }
  if (loading) {
    return <div className="p-4 text-slate-600">데이터 불러오는 중...</div>;
  }

  // 테이블 헤더 제목
  let titleLabel = "제휴 신청 대기 목록";
  if (listType === "finalPending") {
    titleLabel = "최종 승인 대기 목록";
  } else if (listType === "legitPartner") {
    titleLabel = "게시된 제휴 목록";
  }

  return (
    <div className="bg-white p-4  rounded-md shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-slate-700">
          {titleLabel}
          <span className="ml-1 text-sm text-slate-500">({rows.length})</span>
        </h1>

        {/* 정렬 옵션 + 버튼들 */}
        <div className="flex items-center gap-2">
          <select
            className="border border-slate-300 py-1 px-2 text-sm rounded hover:bg-slate-100"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="desc">최신순</option>
            <option value="asc">오래된순</option>
          </select>

          <button
            onClick={handleDeleteSelected}
            className="px-3 py-1 text-sm rounded border border-red-600 text-red-600
                       hover:bg-red-600 hover:text-white hover:border-transparent 
                       focus:outline-none"
          >
            삭제
          </button>

          {(listType === "partnership" || listType === "finalPending") && (
            <button
              onClick={handleApprovalSelected}
              className="px-3 py-1 text-sm rounded border border-green-600 text-green-600
                         hover:bg-green-600 hover:text-white hover:border-transparent 
                         focus:outline-none"
            >
              {listType === "partnership" ? "승인" : "최종승인"}
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border border-slate-100 text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <Th className="text-center w-10"> 
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </Th>

              {/* 글제목 */}
              <Th className="text-center max-w-[150px]">글 제목</Th>
              {/* 업체명 */}
              <Th className="text-center">업체명</Th>
              {/* 전화번호 */}
              <Th className="text-center">전화번호</Th>
              {/* 주소 */}
              <Th className="text-center">주소</Th>

              {/* finalPending일 경우에만: 이미지 업로드, 가격 업로드 */}
              {listType === "finalPending" && (
                <>
                  <Th className="text-center">이미지 업로드</Th>
                  <Th className="text-center">가격 업로드</Th>
                </>
              )}

              {/* 등록일 */}
              <Th className="text-center w-28">등록일</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isChecked = selectedIds.includes(row.id);

              // 이미지 업로드 판별
              const imageUploaded = !!row.thumbnail_url;

              // 가격 업로드 (finalPending일 때만 적용) → row._priceUploaded
              const priceUploaded = !!row._priceUploaded; 

              return (
                <tr
                  key={row.id}
                  className="border-b last:border-none hover:bg-slate-50 cursor-pointer"
                  onClick={() => handleRowClick(row)}
                >
                  {/* 체크박스 */}
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

                  {/* 글 제목 */}
                  <Td className="text-center text-slate-600 break-words px-2 py-2 max-w-[150px]">
                    {row.post_title || "(글제목 없음)"}
                  </Td>

                  {/* 업체명 */}
                  <Td className="text-center text-slate-600 break-words px-2 py-2">
                    {row.company_name || "(업체명 없음)"}
                  </Td>

                  {/* 전화번호 */}
                  <Td className="text-center text-slate-600 px-2 py-2">
                    {row.phone_number || "(연락처 없음)"}
                  </Td>

                  {/* 주소 */}
                  <Td className="text-center text-slate-600 break-words px-2 py-2">
                    {row.address || "(주소 없음)"}
                  </Td>

                  {/* finalPending 전용: 이미지 업로드 */}
                  {listType === "finalPending" && (
                    <Td className="text-center text-slate-600 px-2 py-2">
                      {imageUploaded ? (
                        <UploadBadge isOk />
                      ) : (
                        <UploadBadge isOk={false} />
                      )}
                    </Td>
                  )}

                  {/* finalPending 전용: 가격 업로드 */}
                  {listType === "finalPending" && (
                    <Td className="text-center text-slate-600 px-2 py-2">
                      {priceUploaded ? (
                        <UploadBadge isOk />
                      ) : (
                        <UploadBadge isOk={false} />
                      )}
                    </Td>
                  )}

                  {/* 등록일 */}
                  <Td className="text-center text-slate-500 px-2 py-2">
                    {formatLocalTime(row.created_at)}
                  </Td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={listType === "finalPending" ? 8 : 6}
                  className="p-4 text-center text-slate-400"
                >
                  {listType === "partnership"
                    ? "승인 대기중인 신청이 없습니다."
                    : listType === "finalPending"
                    ? "최종 승인 대기 항목이 없습니다."
                    : "게시된 제휴가 없습니다."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** 업로드 표시 배지: 업로드 완료 / 미 업로드 */
function UploadBadge({ isOk }) {
  return isOk ? (
    <div className="flex items-center gap-1 justify-center text-green-600">
      <CheckCircleIcon className="h-4 w-4" />
      <span>업로드 완료</span>
    </div>
  ) : (
    <div className="flex items-center gap-1 justify-center text-red-500">
      <XCircleIcon className="h-4 w-4" />
      <span>미 업로드</span>
    </div>
  );
}

/** 테이블 헤더 셀 */
function Th({ children, className="", style={} }) {
  return (
    <th
      className={`border-b border-slate-200 p-2 font-semibold text-sm ${className}`}
      style={style}
    >
      {children}
    </th>
  );
}

/** 테이블 데이터 셀 */
function Td({ children, className="", style={} }) {
  return (
    <td
      className={`border-b border-slate-100 p-2 align-middle text-sm ${className}`}
      style={style}
    >
      {children}
    </td>
  );
}