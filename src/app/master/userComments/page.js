"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation"; // Next.js 13 전용
import { supabase } from "@/lib/supabaseF";

// 작성일(생성일) 로컬 시간 표시
function formatLocalTime(isoString) {
  if (!isoString) return "(작성일 없음)";

  const utcDate = new Date(isoString);
  const localDate = new Date(utcDate.getTime());
  // 시분
  const hh = String(localDate.getHours()).padStart(2, "0");
  const mm = String(localDate.getMinutes()).padStart(2, "0");

  // 오늘/어제/일 전 계산
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
  if (dayDiff < 0) dayDiff = 0; // 미래 데이터 방어

  if (dayDiff === 0) return `오늘 ${hh}:${mm}`;
  if (dayDiff === 1) return `어제 ${hh}:${mm}`;
  if (dayDiff <= 7) return `${dayDiff}일 전 ${hh}:${mm}`;

  // 7일 초과 시: 올해면 "M월 D일 HH:MM", 아니면 "YYYY년 M월 D일 HH:MM"
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

export default function UserCommentsPopup() {
  const searchParams = useSearchParams();
  const userId = searchParams.get("user_id"); // 쿼리스트링에서 user_id 추출

  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState([]);

  useEffect(() => {
    if (!userId) return;
    fetchComments(userId);
  }, [userId]);

  async function fetchComments(uid) {
    setLoading(true);
    try {
      // comments 테이블에서 user_id=uid,
      // partnershipsubmit_id 연결해서 post_title, id, 그리고 created_at, is_admitted도
      const { data, error } = await supabase
        .from("comments")
        .select(`
          id,
          comment,
          created_at,
          is_admitted,
          partnershipsubmit_id,
          partnershipsubmit (
            id,
            post_title
          )
        `)
        .eq("user_id", uid)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("댓글 조회 에러:", error);
        setComments([]);
        setLoading(false);
        return;
      }
      setComments(data || []);
    } catch (err) {
      console.error("API fetch 오류:", err);
      setComments([]);
    } finally {
      setLoading(false);
    }
  }

  if (!userId) {
    return <div className="p-4">잘못된 접근 (user_id가 없음)</div>;
  }
  if (loading) {
    return <div className="p-4">로딩 중...</div>;
  }

  return (
    <div className="p-4" style={{ minWidth: 600 }}>
      <h1 className="text-lg font-bold mb-4">
        유저 댓글 기록 (user_id: {userId})
      </h1>
      {comments.length === 0 ? (
        <div>댓글이 없습니다.</div>
      ) : (
        <table className="border border-gray-300 text-sm w-full">
          <thead className="bg-gray-50">
            <tr>
              {/* 1) 게시글 제목 */}
              <Th>게시글 제목</Th>
              {/* 2) 댓글 내용 */}
              <Th>댓글 내용</Th>
              {/* 3) 작성일 */}
              <Th>작성일</Th>
              {/* 4) 승인 여부 */}
              <Th>승인</Th>
            </tr>
          </thead>
          <tbody>
            {comments.map((cmt) => {
              const pSub = cmt.partnershipsubmit;
              return (
                <tr key={cmt.id} className="border-b">
                  {/* 게시글 제목 */}
                  <Td>
                    {pSub ? (
                      <a
                        href={`/board/details/${pSub.id}`}
                        className="text-blue-600 underline cursor-pointer"
                      >
                        {pSub.post_title || "(제목없음)"}
                      </a>
                    ) : (
                      <span className="text-gray-400">(연결된 글 없음)</span>
                    )}
                  </Td>

                  {/* 댓글 내용 */}
                  <Td>{cmt.comment}</Td>

                  {/* 작성일 (포맷) */}
                  <Td>{formatLocalTime(cmt.created_at)}</Td>

                  {/* 승인 여부 (색상 표시) */}
                  <Td>
                    {cmt.is_admitted ? (
                      <span className="text-green-600 font-semibold">
                        승인
                      </span>
                    ) : (
                      <span className="text-orange-500 font-semibold">
                        미승인
                      </span>
                    )}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

/** 공용 Th/Td 컴포넌트 - 모두 가운데 정렬 */
function Th({ children }) {
  return (
    <th className="border-b border-gray-300 p-2 text-center font-semibold">
      {children}
    </th>
  );
}
function Td({ children }) {
  return (
    <td className="border-b border-gray-200 p-2 text-center">
      {children}
    </td>
  );
}