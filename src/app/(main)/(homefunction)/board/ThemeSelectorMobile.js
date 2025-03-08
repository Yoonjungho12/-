// src/app/(main)/board/ThemeSelectorMobile.js
"use client";

/**
 * ThemeSelectorMobile
 * 
 * 모바일 전용 테마 선택 컴포넌트 (CSR)
 * - "테마선택" 버튼 → 열고 닫기
 * - PC에서는 안 보임
 */

import { useState } from "react";
import Link from "next/link";

export default function ThemeSelectorMobile({
  regionSlug,
  themeName,
  selectedThemeIds,
  allThemes,
}) {
  const [isOpen, setIsOpen] = useState(false);

  // 테이블/칸 스타일
  const tableStyle = {
    width: "100%",
    tableLayout: "fixed",
    borderCollapse: "collapse",
    marginBottom: "1rem",
  };
  function getTdStyle(isSelected) {
    return {
      border: "1px solid #ddd",
      padding: "8px",
      cursor: "pointer",
      backgroundColor: isSelected ? "#f9665e" : "#fff",
      color: isSelected ? "#fff" : "#333",
      textAlign: "center",
      verticalAlign: "middle",
    };
  }

  // 9칸씩 나누는 함수
  function chunkArray(array, size) {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  }

  return (
    <div>
      {/* 버튼 */}
      <button
        style={{
          display: "inline-block",
          marginBottom: "1rem",
          padding: "8px 12px",
          backgroundColor: "#f9665e",
          color: "#fff",
          border: "none",
          cursor: "pointer"
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? "테마창 닫기" : "테마선택"}
      </button>

      {/* 열렸을 때 테마표 */}
      {isOpen && (
        <>
          <h2 className="text-2xl font-bold">테마별 샵 선택 (모바일 CSR)</h2>
          <p style={{ color: "#666", marginBottom: "1rem"}} className="text-lg">
            원하는 테마를 골라보세요!
          </p>

          <table style={tableStyle}>
            <tbody>
              {chunkArray(allThemes, 9).map((row, rowIdx) => (
                <tr key={rowIdx}>
                  {row.map((th) => {
                    const isSelected = selectedThemeIds.includes(th.id);
                    const href = `/board/${regionSlug}/${th.name}`;
                    return (
                      <td key={th.id} style={getTdStyle(isSelected)}>
                        <Link href={href} style={{ display: "block" }}>
                          {th.name}
                        </Link>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}