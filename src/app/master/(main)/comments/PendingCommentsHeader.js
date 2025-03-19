//master/comments/PendingCommentsHeader.js
"use client";

import React from "react";

export default function PendingCommentsHeader({
  sortOrder,
  setSortOrder,
  totalCount,
  onDelete,
  onApprove,
}) {
  return (
    <div className="flex items-center gap-2">
      <h2 className="text-lg font-bold text-blue-600">미승인 댓글 목록</h2>

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
        onClick={onDelete}
        className="border border-red-500 text-red-500 px-4 py-1 rounded text-sm"
      >
        삭제
      </button>

      {/* 승인 버튼 */}
      <button
        onClick={onApprove}
        className="border border-green-500 text-green-500 px-4 py-1 rounded text-sm"
      >
        승인
      </button>

      {/* 건수 표시 */}
      <div className="text-sm text-gray-500 ml-2">
        총 {totalCount} 건
      </div>
    </div>
  );
}