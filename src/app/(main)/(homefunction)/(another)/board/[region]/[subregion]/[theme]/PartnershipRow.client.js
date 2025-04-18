// PartnershipRow.client.jsx
"use client";

import Link from "next/link";

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
  const isVIP = item.ad_type === "VIP" || item.ad_type === "VIP+";

  return (
    <tr className={`group transition-all duration-300 relative ${
      isVIP 
        ? "bg-gradient-to-r from-rose-50/80 via-orange-50/60 to-amber-50/50 hover:from-rose-100/80 hover:via-orange-50/70 hover:to-amber-50/60 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.1)]" 
        : "hover:bg-orange-50/50"
    }`}>
      <td className="py-4 px-6 desktop-only">
        <Link href={`/board/details/${item.id}`} className="block group">
          <div className="flex items-center gap-3">
            {isVIP && (
              <span className="badge-desktop inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-rose-500 to-orange-400 text-white shadow-sm ring-2 ring-rose-200">
                VIP
              </span>
            )}
            
            <div className="flex-1">
              <h3 className={`font-medium group-hover:text-rose-500 transition-colors ${
                isVIP ? "text-rose-900" : "text-gray-900"
              }`}>
                {item.post_title}
              </h3>
            </div>
          </div>
        </Link>
      </td>

      {/* 모바일용 행 */}
      <td className="py-4 px-4 mobile-info hidden" colSpan="4">
        <Link href={`/board/details/${item.id}`} className="block">
          <div className="flex items-start gap-3">
            {isVIP && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-rose-500 to-orange-400 text-white shadow-sm ring-2 ring-rose-200">
                VIP
              </span>
            )}
            
            {/* 제목과 정보 (모바일) */}
            <div className="flex-1">
              <h3 className={`font-medium ${isVIP ? "text-rose-900" : "text-gray-900"}`}>
                {item.post_title}
              </h3>
              <p className={`text-xs mt-2 ${isVIP ? "text-rose-500/70" : "text-gray-400"}`}>
                {mobileInfo}
              </p>
            </div>
          </div>
        </Link>
      </td>

      {/* 데스크톱용 추가 열 */}
      <td className="py-4 px-6 text-center desktop-only whitespace-nowrap">
        <span className={`font-medium ${isVIP ? "text-rose-600" : "text-orange-500"}`}>
          {displayPrice}
        </span>
      </td>
      <td className="py-4 px-6 text-center desktop-only whitespace-nowrap">
        <span className={isVIP ? "text-rose-600/80" : "text-gray-600"}>
          {Number(item.views || 0).toLocaleString()}
        </span>
      </td>
      <td className="py-4 px-6 text-center desktop-only whitespace-nowrap">
        <span className={isVIP ? "text-rose-600/80" : "text-gray-600"}>
          {item.comment || 0}
        </span>
      </td>

      {isVIP && (
        <div className="absolute inset-y-0 -left-1 w-1 bg-gradient-to-b from-rose-300 via-rose-400 to-orange-300 opacity-70" />
      )}
    </tr>
  );
}