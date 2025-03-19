"use client";

import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseF";
import { useRouter } from "next/navigation";

/** 날짜/시간 포맷 (가입일) */
function formatLocalTime(isoString) {
  if (!isoString) return "(가입일 없음)";

  const utcDate = new Date(isoString);
  const localDate = new Date(utcDate.getTime());
  const hh = String(localDate.getHours()).padStart(2, "0");
  const mm = String(localDate.getMinutes()).padStart(2, "0");

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

  if (dayDiff === 0) return `오늘 ${hh}:${mm}`;
  if (dayDiff === 1) return `어제 ${hh}:${mm}`;
  if (dayDiff <= 7) return `${dayDiff}일 전 ${hh}:${mm}`;

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

/** 전화번호 포맷 함수 */
function formatPhoneNumber(raw) {
  if (!raw) return "";

  const digits = raw.replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("010")) {
    return digits.replace(/^(\d{3})(\d{4})(\d{4})$/, "$1-$2-$3");
  } else if (digits.length === 10) {
    return digits.replace(/(\d{2,3})(\d{3,4})(\d{4})/, "$1-$2-$3");
  }
  return raw;
}

/**
 * 최근 가입한 회원 목록 (최대 10명)
 */
export default function RecentlyJoinedList() {
  const router = useRouter();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentUsers();
  }, []);

  // 최근 가입회원 최대 10명 조회
  async function fetchRecentUsers() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("user_id, name, nickname, phone, created_at")
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        console.error("최근 가입 회원 조회 오류:", error);
        setRows([]);
      } else {
        setRows(data || []);
      }
    } catch (err) {
      console.error("API 오류:", err);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }

  // 행 클릭 시 → userComments 팝업 오픈
  function handleRowClick(userId) {
    const w = 800,
      h = 1050;
    const top = window.screenY + 100;
    const left = window.screenX + 100;
    window.open(
      `/master/userComments?user_id=${userId}`,
      `popupWindow-${userId}`,
      `width=${w},height=${h},top=${top},left=${left},resizable=no,scrollbars=yes`
    );
  }

  if (loading) {
    return (
      <div className="p-4 text-sm text-slate-500">
        최근 가입 회원 조회 중...
      </div>
    );
  }

  return (
    <div className="bg-white p-4 border border-slate-200 rounded-md shadow-sm">
      {/* 헤더 영역 */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-slate-700">
          최근 가입한 회원
        </h2>
        <button
          onClick={() => router.push("/master/users")}
          className="bg-zinc-700 border border-zinc-700 px-3 py-1 text-white rounded text-sm
                       hover:bg-zinc-400 hover:border-zinc-400 focus:outline-none"
        >
          더보기
        </button>
      </div>

      {rows.length === 0 ? (
        <div className="text-sm text-slate-500">
          최근 가입 회원이 없습니다.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border border-slate-100 text-sm">
            <thead className="bg-slate-50 text-slate-700">
              <tr>
                <Th>이름</Th>
                <Th>닉네임</Th>
                <Th>전화번호</Th>
                <Th>가입일</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.user_id}
                  className="border-b last:border-none hover:bg-slate-50 cursor-pointer"
                  onClick={() => handleRowClick(row.user_id)}
                >
                  <Td>{row.name || ""}</Td>
                  <Td>{row.nickname || ""}</Td>
                  <Td>{formatPhoneNumber(row.phone)}</Td>
                  <Td>{formatLocalTime(row.created_at)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/** 테이블 헤더 셀 */
function Th({ children }) {
  return (
    <th className="border-b border-slate-200 p-2 font-semibold text-left text-sm">
      {children}
    </th>
  );
}

/** 테이블 일반 셀 */
function Td({ children }) {
  return (
    <td className="border-b border-slate-100 p-2 text-sm text-slate-600">
      {children}
    </td>
  );
}