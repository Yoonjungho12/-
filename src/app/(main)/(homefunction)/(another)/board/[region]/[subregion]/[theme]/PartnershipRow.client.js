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
  const isVIPPlus = item.ad_type === "VIP+";

  // title_color에 따른 색상 매핑
  const titleColorMap = {
    'red': '#dc2626',
    'orange': '#ea580c',
    'yellow': '#ca8a04',
    'olive': '#556b2f',
    'lime': '#65a30d',
    'green': '#16a34a',
    'blue': '#2563eb',
    'indigo': '#4f46e5',
    'pink': '#db2777',
    'purple': '#9333ea',
    'black': '#000000'
  };

  return (
    <tr className={`group transition-all duration-300 relative ${
      isVIP 
        ? "bg-gradient-to-r from-rose-50/80 via-orange-50/60 to-amber-50/50 hover:from-rose-100/80 hover:via-orange-50/70 hover:to-amber-50/60 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.1)]" 
        : "hover:bg-orange-50/50"
    }`}>
      {/* 데스크톱 뷰 */}
      <td className="hidden sm:table-cell py-4 px-6 relative">
        {isVIP && (
          <span className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-rose-300 via-rose-400 to-orange-300 opacity-70" />
        )}
        <Link href={`/board/details/${item.id}`} className="block group">
          <div className="flex items-center gap-3">
            {isVIP && (
              <span className="badge-desktop inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-rose-500 to-orange-400 text-white shadow-sm">
                VIP
              </span>
            )}
            
            <div className="flex-1">
              <h3 
                className={isVIPPlus ? "font-bold" : "font-medium"}
                style={isVIPPlus && item.title_color 
                  ? { color: titleColorMap[item.title_color] } 
                  : { color: '#000000' }
                }
              >
                {item.post_title}
              </h3>
            </div>
          </div>
        </Link>
      </td>

      {/* 모바일 뷰 */}
      <td className="sm:hidden py-3 px-4" colSpan="4">
        <Link href={`/board/details/${item.id}`} className="block">
          <div className={`flex items-start gap-2 w-full h-full px-2 py-2 rounded-md ${
            isVIP 
              ? "bg-gradient-to-r from-rose-50/80 via-orange-50/60 to-amber-50/50"
              : ""
          }`}>
            {isVIP && (
              <span className="shrink-0 inline-flex items-center px-2 py-1 rounded-md text-xs font-semibold bg-gradient-to-r from-rose-500 to-orange-400 text-white shadow-sm">
                VIP
              </span>
            )}
            
            <div className="flex-1 min-w-0">
              <h3 
                className={`truncate ${isVIPPlus ? "font-bold" : "font-medium"}`}
                style={isVIPPlus && item.title_color 
                  ? { color: titleColorMap[item.title_color] } 
                  : { color: '#000000' }
                }
              >
                {item.post_title}
              </h3>
              <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
                <span className="flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  {Number(item.views || 0).toLocaleString()}
                </span>
                <span className="flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  {item.comment || 0}
                </span>
                <span className="text-gray-900">
                  {displayPrice}
                </span>
              </div>
            </div>
          </div>
        </Link>
      </td>

      {/* 데스크톱 추가 열 */}
      <td className="hidden sm:table-cell py-4 px-6 text-center whitespace-nowrap">
        <span className="text-gray-900">
          {displayPrice}
        </span>
      </td>
      <td className="hidden sm:table-cell py-4 px-6 text-center whitespace-nowrap">
        <span className="text-gray-900">
          {Number(item.views || 0).toLocaleString()}
        </span>
      </td>
      <td className="hidden sm:table-cell py-4 px-6 text-center whitespace-nowrap">
        <span className="text-gray-900">
          {item.comment || 0}
        </span>
      </td>
    </tr>
  );
}