// PartnershipRow.client.jsx
"use client";

import { useRouter } from "next/navigation";

/* 인라인 스타일 (VIP, 일반, mobile-info 등) */
const vipTrStyle = {
  backgroundColor: "rgb(255, 240, 240)", // VIP 행
};
const baseTrStyle = {
  backgroundColor: "#ffffff",
};
const vipBadgeStyle = {
  display: "inline-block",
  color: "#fff",
  backgroundColor: "#c23e2d",
  padding: "4px 6px",
  marginRight: "6px",
  borderRadius: "4px",
  fontWeight: "bold",
  fontSize: "12px",
  animation: "textBlink 2s infinite",
};
const normalBadgeStyle = {
  display: "inline-block",
  color: "#fff",
  backgroundColor: "#b196c1",
  padding: "4px 6px",
  marginRight: "6px",
  borderRadius: "4px",
  fontWeight: "bold",
  fontSize: "12px",
};
const mobileInfoStyle = {
  display: "none",
  fontSize: "12px",
  color: "#888",
  marginTop: "4px",
};

/**
 * props:
 *  - item: DB row
 *  - displayPrice: "12,000원" 등
 *  - mobileInfo: "조회수 123 / 리뷰 4 / 최저가 10,000원"
 *  - slug: createSlug(item.company_name)
 */
export default function PartnershipRow({ item, displayPrice, mobileInfo, slug }) {
  const router = useRouter();

  // VIP 여부
  const isVIP = item.ad_type === "VIP" || item.ad_type === "VIP+";

  // rowStyle
  const rowStyle = isVIP ? vipTrStyle : baseTrStyle;

  // row 클릭 시 상세 페이지 이동
  function handleRowClick() {
    // e.g. /board/details/{id}-{slug}
    router.push(`/board/details/${item.id}-${slug}`);
  }

  return (
    <tr
      style={rowStyle}
      className="cursor-pointer hover:bg-gray-100"
      onClick={handleRowClick}
    >
      {/* (1) 제목 셀 */}
      <td className="border border-gray-200 py-2 px-2 whitespace-nowrap overflow-hidden text-ellipsis desktop-only">
        {isVIP ? (
          <span style={vipBadgeStyle} className="badge-desktop">
            VIP
          </span>
        ) : (
          <span style={normalBadgeStyle} className="badge-desktop">
            일반
          </span>
        )}
        <span
          className={`inline-block align-middle whitespace-nowrap overflow-hidden text-ellipsis ${
            isVIP && item.ad_type === "VIP+" ? "text-blue-700" : "text-gray-800"
          }`}
          style={{ maxWidth: "80%" }}
        >
          {item.post_title}
        </span>

        {/* 모바일 전용 info */}
        <div
          className="mobile-info hidden text-xs text-gray-500 mt-1"
          style={mobileInfoStyle}
        >
          {mobileInfo}
        </div>
      </td>

      {/* (2) 최저가 */}
      <td className="border border-gray-200 py-2 px-2 text-center desktop-only">
        {displayPrice}
      </td>

      {/* (3) 조회수 */}
      <td className="border border-gray-200 py-2 px-2 text-center desktop-only">
        {Number(item.views || 0).toLocaleString()}
      </td>

      {/* (4) 리뷰수 */}
      <td className="border border-gray-200 py-2 px-2 text-center desktop-only">
        {item.comment || 0}
      </td>
    </tr>
  );
}