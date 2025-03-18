"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseF";

// 날짜 포맷 함수 (기존과 동일)
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

export default function PartnershipsDashboardCard() {
  const router = useRouter();

  const [authChecked, setAuthChecked] = useState(false);
  const [sessionUserId, setSessionUserId] = useState(null);

  // 세 가지 목록 각각의 데이터를 저장할 state
  const [partnershipRows, setPartnershipRows] = useState([]);
  const [finalPendingRows, setFinalPendingRows] = useState([]);
  const [legitPartnerRows, setLegitPartnerRows] = useState([]);

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
  // 2) 각 목록 데이터 불러오기
  // -----------------------------------------------------------
  useEffect(() => {
    if (!authChecked) return;
    fetchAllPartnershipData();
  }, [authChecked]);

  async function fetchAllPartnershipData() {
    setLoading(true);
    try {
      // 2-1) partnership (승인 대기: is_admitted=false)
      const { data: partnershipData, error: partnershipError } = await supabase
        .from("partnershipsubmit")
        .select(
          "id, user_id, company_name, phone_number, address, post_title, created_at, profiles(nickname)"
        )
        .eq("is_admitted", false)
        .order("created_at", { ascending: false })
        .limit(10);
      if (partnershipError) {
        console.error("승인 대기 목록 불러오기 에러:", partnershipError);
      }

      // 2-2) finalPending (최종 승인 대기: is_admitted=true, final_admitted=false)
      const { data: finalPendingData, error: finalPendingError } =
        await supabase
          .from("partnershipsubmit")
          .select(
            "id, user_id, company_name, phone_number, address, post_title, created_at, profiles(nickname)"
          )
          .eq("is_admitted", true)
          .eq("final_admitted", false)
          .order("created_at", { ascending: false })
          .limit(10);
      if (finalPendingError) {
        console.error("최종 승인 대기 목록 불러오기 에러:", finalPendingError);
      }

      // 2-3) legitPartner (최종 승인 완료: is_admitted=true, final_admitted=true)
      const { data: legitPartnerData, error: legitPartnerError } = await supabase
        .from("partnershipsubmit")
        .select(
          "id, user_id, company_name, phone_number, address, post_title, created_at, profiles(nickname)"
        )
        .eq("is_admitted", true)
        .eq("final_admitted", true)
        .order("created_at", { ascending: false })
        .limit(10);
      if (legitPartnerError) {
        console.error("최종 승인 완료 목록 불러오기 에러:", legitPartnerError);
      }

      setPartnershipRows(partnershipData || []);
      setFinalPendingRows(finalPendingData || []);
      setLegitPartnerRows(legitPartnerData || []);
    } catch (err) {
      console.error("파트너십 데이터 불러오기 전체 오류:", err);
    } finally {
      setLoading(false);
    }
  }

  // -----------------------------------------------------------
  // 행 클릭 → 팝업 로직
  // -----------------------------------------------------------
  const handleRowClick = (row) => {
    const w = 600;
    const h = 1200;
    const top = window.screenY + 100;
    const left = window.screenX + 100;
    window.open(
      `/master/popup?id=${row.id}&user_id=${row.user_id}`,
      `popupWindow-${row.id}`,
      `width=${w},height=${h},top=${top},left=${left},resizable=no,scrollbars=yes`
    );
  };

  // 로딩/세션 상태
  if (!authChecked) {
    return <div className="p-4 text-blue-600">로그인 여부 확인 중...</div>;
  }
  if (loading) {
    return <div className="p-4 text-blue-600">대시보드 데이터 불러오는 중...</div>;
  }

  // -----------------------------------------------------------
  // 대시보드 UI
  // -----------------------------------------------------------
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6 text-blue-600">제휴신청</h1>

      {/* 1) 승인 대기 목록 (is_admitted=false) */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold text-blue-600">
            제휴 신청 대기 목록 (최대 10개)
          </h2>
          <button
            onClick={() => router.push("/master/partnership")}
            className="border border-blue-500 px-3 py-1 text-sm rounded text-blue-500"
          >
            더보기
          </button>
        </div>
        <TableComponent rows={partnershipRows} onRowClick={handleRowClick} />
      </section>

      {/* 2) 최종 승인 대기 목록 (is_admitted=true, final_admitted=false) */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold text-blue-600">
            최종 승인 대기 목록 (최대 10개)
          </h2>
          <button
            onClick={() => router.push("/master/finalPending")}
            className="border border-blue-500 px-3 py-1 text-sm rounded text-blue-500"
          >
            더보기
          </button>
        </div>
        <TableComponent rows={finalPendingRows} onRowClick={handleRowClick} />
      </section>

      {/* 3) 최종 승인 완료 목록 (is_admitted=true, final_admitted=true) */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold text-blue-600">
            최종 승인 완료 목록 (최대 10개)
          </h2>
          <button
            onClick={() => router.push("/master/legitPartner")}
            className="border border-blue-500 px-3 py-1 text-sm rounded text-blue-500"
          >
            더보기
          </button>
        </div>
        <TableComponent rows={legitPartnerRows} onRowClick={handleRowClick} />
      </section>
    </div>
  );
}

// 공용 테이블 컴포넌트
function TableComponent({ rows, onRowClick }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border border-gray-200 text-sm">
        <thead className="bg-white text-blue-600">
          <tr>
            <Th>업체명</Th>
            <Th>닉네임</Th>
            <Th>전화번호</Th>
            <Th>주소</Th>
            <Th>글 제목</Th>
            <Th>등록일</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.id}
              className="hover:bg-gray-50"
              onClick={() => onRowClick(row)} // 행 클릭 → 팝업
            >
              <Td>{row.company_name}</Td>
              <Td>{row.profiles?.nickname || ""}</Td>
              <Td>{row.phone_number}</Td>
              <Td>{row.address}</Td>
              <Td>{row.post_title}</Td>
              <Td>{formatLocalTime(row.created_at)}</Td>
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