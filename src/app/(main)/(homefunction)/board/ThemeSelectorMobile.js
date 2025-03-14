// src/app/(main)/board/ThemeSelectorMobile.js
"use client";
import { useState } from "react";
import Link from "next/link";

export default function ThemeSelectorMobile({
  regionSlug,
  themeName,
  selectedThemeIds,
  allThemes,
}) {
  const [isOpen, setIsOpen] = useState(false);

  // 테이블 스타일
  const tableStyle = {
    width: "100%",
    tableLayout: "fixed",
    borderCollapse: "collapse",
    marginBottom: "1rem",
  };

  // 각 칸(TD) 스타일
  function getTdStyle(isSelected) {
    return {
      border: "1px solid #ddd",
      padding: "6px",          // 폰트 작게, 패딩도 축소
      cursor: "pointer",
      backgroundColor: isSelected ? "#f9665e" : "#fff",
      color: isSelected ? "#fff" : "#333",
      textAlign: "center",
      verticalAlign: "middle",
      fontSize: "14px",        // 폰트 작게 조정
    };
  }

  // (1) 4칸씩 나누는 함수
  function chunkArray(array, size) {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  }

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      {/* 버튼 */}
      <button
        style={{
          display: "inline-block",
          marginBottom: "1rem",
          padding: "8px 12px",
          backgroundColor: "#f9665e",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          fontSize: "14px",
          borderRadius: "4px",
        }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? "테마창 닫기" : "테마선택"}
      </button>

      {/* 열렸을 때 테마표 */}
      {isOpen && (
        <>
          <h2 style={{ fontSize: "16px", marginBottom: "0.5rem", fontWeight: "bold" }}>
            테마별 샵 선택 
          </h2>
          <p style={{ color: "#666", marginBottom: "1rem", fontSize: "14px" }}>
            원하는 테마를 골라보세요!
          </p>

          <table style={tableStyle}>
            <tbody>
              {chunkArray(allThemes, 4).map((row, rowIdx) => (
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

                  {/* 남은 칸이 4개 미만이면 빈 칸을 채워서 맞춰주기 */}
                  {row.length < 4 && 
                    Array.from({ length: 4 - row.length }).map((_, extraIdx) => (
                      <td
                        key={`extra_${extraIdx}`}
                        style={{
                          border: "1px solid #ddd",
                          padding: "6px",
                          backgroundColor: "#f9f9f9",
                        }}
                      />
                    ))
                  }
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}