"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseF";

/** 날짜 포맷 함수 (오늘/어제/N일 전 / 그 외 년월일 처리) */
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

/** 지정 길이를 넘어가면 "..."로 잘라주는 함수 */
function truncateText(text, maxLen = 15) {
  if (!text) return "";
  return text.length > maxLen ? text.slice(0, maxLen) + "..." : text;
}

export default function PartnershipsDashboardCard() {
  const router = useRouter();

  const [authChecked, setAuthChecked] = useState(false);
  const [sessionUserId, setSessionUserId] = useState(null);

  // 1) "승인 대기" 상태
  const [partnershipRows, setPartnershipRows] = useState([]);
  const [partnershipPage, setPartnershipPage] = useState(1);
  const [partnershipTotal, setPartnershipTotal] = useState(0);

  // 2) "최종 승인 대기" 상태
  const [finalPendingRows, setFinalPendingRows] = useState([]);
  const [finalPendingPage, setFinalPendingPage] = useState(1);
  const [finalPendingTotal, setFinalPendingTotal] = useState(0);

  // 3) "최종 승인 완료" 상태
  const [legitPartnerRows, setLegitPartnerRows] = useState([]);
  const [legitPartnerPage, setLegitPartnerPage] = useState(1);
  const [legitPartnerTotal, setLegitPartnerTotal] = useState(0);

  const [loading, setLoading] = useState(true);

  // -----------------------------------------------------------
  // 1) 세션 체크
  // -----------------------------------------------------------
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

  // -----------------------------------------------------------
  // 2) 목록 데이터 불러오기
  //   (각 페이지나 권한 여부가 바뀔 때마다 다시 로드)
  // -----------------------------------------------------------
  useEffect(() => {
    if (!authChecked) return;
    fetchAllData();
  }, [
    authChecked,
    partnershipPage,
    finalPendingPage,
    legitPartnerPage,
  ]);

  /** 전체 3가지 목록을 각각 10개씩 로드하고 totalCount도 받아옴 */
  async function fetchAllData() {
    setLoading(true);
    try {
      // 2-1) partnershipRows (승인 대기: is_admitted=false)
      const { from: pFrom, to: pTo } = getRange(partnershipPage);
      const { data: pRows, count: pCount, error: pErr } = await supabase
        .from("partnershipsubmit")
        .select(`
          id,
          user_id,
          company_name,
          address,
          post_title,
          created_at
        `, { count: "exact" }) // totalCount까지 얻기 위해 count: "exact"
        .eq("is_admitted", false)
        .range(pFrom, pTo)
        .order("created_at", { ascending: false });

      if (pErr) {
        console.error("승인 대기 목록 에러:", pErr);
      } else {
        setPartnershipRows(pRows || []);
        setPartnershipTotal(pCount || 0);
      }

      // 2-2) finalPendingRows (최종 승인 대기: is_admitted=true, final_admitted=false)
      const { from: fpFrom, to: fpTo } = getRange(finalPendingPage);
      const { data: fpRows, count: fpCount, error: fpErr } = await supabase
        .from("partnershipsubmit")
        .select(`
          id,
          user_id,
          company_name,
          address,
          post_title,
          created_at
        `, { count: "exact" })
        .eq("is_admitted", true)
        .eq("final_admitted", false)
        .range(fpFrom, fpTo)
        .order("created_at", { ascending: false });

      if (fpErr) {
        console.error("최종 승인 대기 목록 에러:", fpErr);
      } else {
        setFinalPendingRows(fpRows || []);
        setFinalPendingTotal(fpCount || 0);
      }

      // 2-3) legitPartnerRows (최종 승인 완료: is_admitted=true, final_admitted=true)
      const { from: lFrom, to: lTo } = getRange(legitPartnerPage);
      const { data: lRows, count: lCount, error: lErr } = await supabase
        .from("partnershipsubmit")
        .select(`
          id,
          user_id,
          company_name,
          address,
          post_title,
          created_at
        `, { count: "exact" })
        .eq("is_admitted", true)
        .eq("final_admitted", true)
        .range(lFrom, lTo)
        .order("created_at", { ascending: false });

      if (lErr) {
        console.error("최종 승인 완료 목록 에러:", lErr);
      } else {
        setLegitPartnerRows(lRows || []);
        setLegitPartnerTotal(lCount || 0);
      }
    } catch (err) {
      console.error("전체 파트너십 데이터 불러오기 에러:", err);
    } finally {
      setLoading(false);
    }
  }

  /** 각 페이지 번호에 따라 Supabase range()에 쓸 from, to 계산 */
  function getRange(page, pageSize = 10) {
    const from = (page - 1) * pageSize;
    const to = from + (pageSize - 1);
    return { from, to };
  }

  // -----------------------------------------------------------
  // 행 클릭 → 팝업
  // -----------------------------------------------------------
  function handleRowClick(row) {
    const w = 600;
    const h = 1200;
    const top = window.screenY + 100;
    const left = window.screenX + 100;
    window.open(
      `/master/popup?id=${row.id}&user_id=${row.user_id}`,
      `popupWindow-${row.id}`,
      `width=${w},height=${h},top=${top},left=${left},resizable=no,scrollbars=yes`
    );
  }

  // 로딩/가드
  if (!authChecked) {
    return <div className="p-4 text-slate-600">로그인 여부 확인 중...</div>;
  }
  if (loading) {
    return <div className="p-4 text-slate-600">대시보드 데이터 불러오는 중...</div>;
  }

  return (
    <div className="w-full mx-auto bg-white p-4 border border-slate-200 rounded-md shadow-sm">
      <h1 className="text-2xl font-bold mb-6 text-slate-700">제휴신청 대시보드</h1>

      {/* 1) 승인 대기 목록 */}
      <section className="mb-8">
        <SectionHeader
          title="제휴 신청 대기"
          onClickMore={() => router.push("/master/partnership")}
        />
        <TableComponent rows={partnershipRows} onRowClick={handleRowClick} />
        <Pagination
          currentPage={partnershipPage}
          totalCount={partnershipTotal}
          onPageChange={setPartnershipPage}
        />
      </section>

      {/* 2) 최종 승인 대기 */}
      <section className="mb-8">
        <SectionHeader
          title="최종 승인 대기"
          onClickMore={() => router.push("/master/finalPending")}
        />
        <TableComponent rows={finalPendingRows} onRowClick={handleRowClick} />
        <Pagination
          currentPage={finalPendingPage}
          totalCount={finalPendingTotal}
          onPageChange={setFinalPendingPage}
        />
      </section>

      {/* 3) 최종 승인 완료
      <section>
        <SectionHeader
          title="최종 승인 완료 (최대 10개)"
          onClickMore={() => router.push("/master/legitPartner")}
        />
        <TableComponent rows={legitPartnerRows} onRowClick={handleRowClick} />
        <Pagination
          currentPage={legitPartnerPage}
          totalCount={legitPartnerTotal}
          onPageChange={setLegitPartnerPage}
        />
      </section> */}
    </div>
  );
}

/** 공용 섹션 헤더 + '더보기' 버튼 */
function SectionHeader({ title, onClickMore }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <h2 className="text-lg font-semibold text-slate-700">{title}</h2>
      <button
        onClick={onClickMore}
        className="bg-zinc-700 border border-zinc-700 px-3 py-1 text-white rounded text-sm
                   hover:bg-zinc-400 hover:border-zinc-400 focus:outline-none"
      >
        더보기
      </button>
    </div>
  );
}

/** 공용 테이블 컴포넌트 */
function TableComponent({ rows, onRowClick }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border border-slate-100 text-sm">
        <thead className="bg-slate-50 text-slate-700">
          <tr>
            {/* 글 제목 -> 업체명 -> 주소 -> 등록일 */}
            <Th>글 제목</Th>
            <Th>업체명</Th>
            <Th>주소</Th>
            <Th style={{ width: "140px" }}>등록일</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="border-b last:border-none hover:bg-slate-50 cursor-pointer"
              onClick={() => onRowClick(row)}
            >
              {/* 글 제목, 주소는 기존 그대로 15글자. 업체명만 10글자로 처리 */}
              <Td>{truncateText(row.post_title, 15)}</Td>
              <Td>{truncateText(row.company_name, 10)}</Td>
              <Td>{truncateText(row.address, 15)}</Td>
              <Td className="text-slate-500">{formatLocalTime(row.created_at)}</Td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <Td colSpan={4} className="p-4 text-center text-slate-400">
                데이터가 없습니다.
              </Td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

/** 테이블 헤더 셀 */
function Th({ children, style = {} }) {
  return (
    <th
      className="border-b border-slate-200 p-2 font-semibold text-left text-sm"
      style={style}
    >
      {children}
    </th>
  );
}

/** 테이블 데이터 셀 */
function Td({ children, colSpan = null, className = "", style = {} }) {
  return (
    <td
      colSpan={colSpan || undefined}
      className={`border-b border-slate-100 p-2 text-sm text-slate-600 ${className}`}
      style={style}
    >
      {children}
    </td>
  );
}

/** 간단한 페이징 컴포넌트 */
function Pagination({ currentPage, totalCount, onPageChange }) {
  // 한 페이지에 10개씩
  const pageSize = 10;
  const totalPages = Math.ceil(totalCount / pageSize);

  if (totalPages <= 1) return null; // 페이지가 1개 이하라면 버튼 안 보임

  const handlePrev = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };
  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  return (
    <div className="flex justify-end mt-2 space-x-2">
      <button
        onClick={handlePrev}
        disabled={currentPage === 1}
        className="px-3 py-1 border border-zinc-300 text-sm rounded 
                   disabled:bg-zinc-100 disabled:text-zinc-400 
                   hover:bg-zinc-200 focus:outline-none"
      >
        이전
      </button>
      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="px-3 py-1 border border-zinc-300 text-sm rounded
                   disabled:bg-zinc-100 disabled:text-zinc-400
                   hover:bg-zinc-200 focus:outline-none"
      >
        다음
      </button>
    </div>
  );
}