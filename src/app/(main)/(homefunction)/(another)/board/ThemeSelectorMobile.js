"use client";

import { useState } from "react";
import Link from "next/link";

export default function ThemeSelectorMobile({
  regionSlug,
  subregionSlug,
  themeName,
  selectedThemeIds,
  allThemes,
}) {
  const [isOpen, setIsOpen] = useState(false);

  // (1) 4칸씩 나누는 함수 (기존 로직 그대로)
  function chunkArray(array, size) {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  }

  return (
    <div className="p-2 items-center">
      {/* (A) 토글 버튼 + 정렬 옵션 */}
      <div className="flex items-center justify-between">
        {/* 토글 버튼 (테마선택 + ON/OFF) */}
        <div
          className="relative inline-block border border-gray-300 rounded-full px-3 py-1 cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="text-xs">테마선택</span>
          <span className="absolute top-[-8px] right-[-16px] text-[10px] bg-gray-600 text-white px-1 py-[1px] rounded">
            {isOpen ? "ON" : "OFF"}
          </span>
        </div>

        {/* 정렬 옵션: 전체 | 최저가 순 | 조회수 순 */}
       
      </div>

      {/* (B) 테마 표: isOpen일 때만 표시 */}
      {isOpen && (
        <table className="w-full table-fixed border-collapse mb-4 mt-3">
          <tbody>
            {chunkArray(allThemes, 4).map((row, rowIdx) => (
              <tr key={rowIdx}>
                {row.map((th) => {
                  // 테마 선택 여부
                  const isSelected = selectedThemeIds.includes(th.id);
                  // 이동 경로 (PC 테마 표와 동일하게 region/subregion/테마)
                  const href = `/board/${regionSlug || "전체"}/${
                    subregionSlug || "전체"
                  }/${th.name}`;

                  // 스타일
                  const tdClass = isSelected
                    ? "bg-gradient-to-r from-rose-500 to-orange-400 text-white font-medium"
                    : "bg-white text-gray-600 hover:bg-gray-50";

                  return (
                    <td
                      key={th.id}
                      className={`border border-gray-100 p-2 text-center align-middle text-sm cursor-pointer relative overflow-hidden ${tdClass}`}
                    >
                      <Link href={href} className="block no-underline text-xs">
                        {th.name}
                      </Link>
                      {isSelected && (
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent)]" />
                      )}
                    </td>
                  );
                })}

                {/* row.length가 4보다 작을 수도 있으니, 빈 칸 채우기 */}
                {row.length < 4 &&
                  Array.from({ length: 4 - row.length }).map((_, extraIdx) => (
                    <td
                      key={`extra_${extraIdx}`}
                      className="border border-gray-100 p-2 bg-gray-50"
                    />
                  ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}