"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseF";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

// 날짜 포맷 함수
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
 *
 * @param {object} props
 * @param {"finalPending"|"legitPartner"|"partnership"} props.listType
 *   - finalPending : is_admitted=true, final_admitted=false (최종 승인 대기)
 *   - legitPartner : is_admitted=true, final_admitted=true (최종 승인 완료)
 *   - partnership  : is_admitted=false (승인 대기)
 */
export default function PartnershipList({ listType }) {
  const router = useRouter();

  const [authChecked, setAuthChecked] = useState(false);
  const [sessionUserId, setSessionUserId] = useState(null);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState("desc");

  // 체크박스 관련
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
  // 2) 세션 후: 목록조회
  // -----------------------------
  useEffect(() => {
    if (!authChecked) return;
    fetchPartnershipData(sortOrder);
  }, [authChecked, sortOrder, listType]);

  // -----------------------------
  // 목록조회: 조건에 따라 (필요한 필드만 선택)
  // -----------------------------
  async function fetchPartnershipData(order) {
    setLoading(true);
    try {
      let query = supabase
        .from("partnershipsubmit")
        .select("id, company_name, phone_number, address, post_title, created_at, profiles(nickname)")
        .order("created_at", { ascending: order === "asc" });

      if (listType === "finalPending") {
        query = query.eq("is_admitted", true).eq("final_admitted", false);
      } else if (listType === "legitPartner") {
        query = query.eq("is_admitted", true).eq("final_admitted", true);
      } else if (listType === "partnership") {
        query = query.eq("is_admitted", false);
      }

      const { data, error } = await query;
      if (error) {
        console.error("파트너십 조회 오류:", error);
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

  // -----------------------------
  // 행 클릭 → 팝업
  // -----------------------------
  const handleRowClick = (row) => {
    const w = 600, h = 600;
    const top = window.screenY + 100, left = window.screenX + 100;
    window.open(
      `/master/popup?id=${row.id}&user_id=${row.user_id}`,
      `popupWindow-${row.id}`,
      `width=${w},height=${h},top=${top},left=${left},resizable=no,scrollbars=yes`
    );
  };

  // -----------------------------
  // 삭제 (선택 항목)
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
  // 승인 버튼 처리
  // -----------------------------
  const handleApprovalSelected = async () => {
    if (selectedIds.length === 0) {
      alert("승인할 항목이 없습니다.");
      return;
    }
    if (
      !confirm(
        listType === "partnership"
          ? `${selectedIds.length}개 항목을 승인하시겠습니까?`
          : `${selectedIds.length}개 항목을 최종 승인하시겠습니까? 최종 승인 후에는 모든 일반 사용자들에게 노출됩니다.`
      )
    )
      return;
    try {
      let updateData = {};
      if (listType === "partnership") {
        updateData = { is_admitted: true };
      } else if (listType === "finalPending") {
        updateData = { final_admitted: true };
      }
      const { error } = await supabase
        .from("partnershipsubmit")
        .update(updateData)
        .in("id", selectedIds);
      if (error) {
        console.error("승인 처리 중 에러:", error);
        alert("승인 처리 실패");
        return;
      }
      alert("승인 처리 완료");
      setRows((prev) => prev.filter((r) => !selectedIds.includes(r.id)));
      setSelectedIds([]);
      setIsAllSelected(false);
    } catch (err) {
      console.error("승인 처리 오류:", err);
      alert("승인 처리 중 오류");
    }
  };

  // -----------------------------
  // 체크박스 (개별/전체)
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

  // isAllSelected 동기화
  if (
    selectedIds.length === rows.length &&
    rows.length > 0 &&
    !isAllSelected
  ) {
    setIsAllSelected(true);
  } else if (isAllSelected && selectedIds.length !== rows.length) {
    setIsAllSelected(false);
  }

  // 조건부 렌더링
  if (!authChecked) {
    return <div className="p-4 text-blue-600">로그인 여부 확인 중...</div>;
  }
  if (loading) {
    return <div className="p-4 text-blue-600">데이터 불러오는 중...</div>;
  }

  return (
    <div className="bg-white p-4">
      {/* 총 건수 표시 */}
      <div className="mb-2 text-sm text-gray-600">총 {rows.length} 건</div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold text-blue-600">
          {listType === "finalPending"
            ? "최종 승인 대기 목록"
            : listType === "legitPartner"
            ? "최종 승인 완료 목록"
            : "제휴 신청 대기 목록"}
        </h1>
        <div className="flex items-center gap-2">
          <select
            className="border border-gray-300 p-1 text-sm"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="desc">최신순</option>
            <option value="asc">오래된순</option>
          </select>
          <button
            onClick={handleDeleteSelected}
            className="border border-red-500 text-red-500 px-4 py-1 rounded"
          >
            삭제
          </button>
          {(listType === "partnership" || listType === "finalPending") && (
            <button
              onClick={handleApprovalSelected}
              className="border border-green-500 text-green-500 px-4 py-1 rounded"
            >
              {listType === "partnership" ? "승인" : "최종승인"}
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border border-gray-200 text-sm">
          <thead className="bg-white text-blue-600">
            <tr>
              <Th>
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </Th>
              <Th>업체명</Th>
              <Th>닉네임</Th>
              <Th>전화번호</Th>
              <Th>주소</Th>
              <Th>글 제목</Th>
              {listType === "finalPending" && <Th>이미지</Th>}
              <Th>등록일</Th>
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
                  <Td>{row.company_name}</Td>
                  <Td>{row.profiles ? row.profiles.nickname : ""}</Td>
                  <Td>{row.phone_number}</Td>
                  <Td>{row.address}</Td>
                  <Td>{row.post_title}</Td>
                  {listType === "finalPending" && (
                    <Td>
                      {row.thumbnail_url ? (
                        <div className="flex items-center gap-1">
                          <CheckCircleIcon className="h-4 w-4 text-green-500" />
                          <span>이미지 업로드 완료</span>
                        </div>
                      ) : (
                        <span className="text-gray-500">미 업로드</span>
                      )}
                    </Td>
                  )}
                  <Td>{formatLocalTime(row.created_at)}</Td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={listType === "finalPending" ? 7 : 6}
                  className="p-4 text-center text-gray-500"
                >
                  {listType === "partnership"
                    ? "승인 대기중인 신청이 없습니다."
                    : "해당 목록에 항목이 없습니다."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// 작은 컴포넌트들
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