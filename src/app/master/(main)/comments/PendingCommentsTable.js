//masteer/main/comments/PendingCommentsTable.js
"use client";

import React from "react";

export default function PendingCommentsTable({
  rows,
  selectedIds,
  isAllSelected,
  onSelectAll,
  onCheckboxChange,
  formatLocalTime,
}) {
  // 행 클릭 시
  function handleRowClick(row) {
    console.log("row clicked:", row);
    // 원하면 팝업 or 상세 페이지 이동 로직
  }

  return (
    <table className="mt-4 border border-gray-200 text-sm w-full">
      <thead className="bg-white text-blue-600">
        <tr>
          <Th>
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={(e) => onSelectAll(e.target.checked)}
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
                    onCheckboxChange(row.id, e.target.checked)
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