"use client";

import Link from "next/link";

export default function PartnershipTableClient({ posts, baseUrl, sortParam }) {
  return (
    <div className="w-full mt-4">
      {/* 정렬 옵션 링크 */}
      <div className="mb-6 flex items-center justify-center gap-6 text-sm font-medium bg-white rounded-full shadow-sm py-3 px-6">
        <Link
          href={baseUrl}
          className={!sortParam 
            ? "text-orange-500 font-bold relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-orange-500" 
            : "text-gray-500 hover:text-gray-700 transition-colors"}
        >
          기본
        </Link>
        <div className="w-1 h-1 rounded-full bg-gray-200" />
        <Link
          href={`${baseUrl}?sort=priceAsc`}
          className={sortParam === "priceAsc" 
            ? "text-orange-500 font-bold relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-orange-500" 
            : "text-gray-500 hover:text-gray-700 transition-colors"}
        >
          가격 낮은순
        </Link>
        <div className="w-1 h-1 rounded-full bg-gray-200" />
        <Link
          href={`${baseUrl}?sort=viewsDesc`}
          className={sortParam === "viewsDesc" 
            ? "text-orange-500 font-bold relative after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-orange-500" 
            : "text-gray-500 hover:text-gray-700 transition-colors"}
        >
          조회수 높은순
        </Link>
      </div>

      {/* Tailwind 테이블 */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="table-fixed w-full text-sm border-separate border-spacing-0">
          <colgroup><col className="w-[1%]"/><col className="w-[54%]"/><col className="w-[15%]"/><col className="w-[15%]"/><col className="w-[15%]"/></colgroup>
          <thead>
            <tr className="bg-gray-50">
              <th className="w-[1%] p-0 border-b border-gray-100"></th>
              <th className="py-4 px-6 text-left text-gray-600 font-medium desktop-only border-b border-gray-100">
                제목
              </th>
              <th className="py-4 px-6 text-center text-gray-600 font-medium desktop-only border-b border-gray-100">
                최저가
              </th>
              <th className="py-4 px-6 text-center text-gray-600 font-medium desktop-only border-b border-gray-100">
                조회수
              </th>
              <th className="py-4 px-6 text-center text-gray-600 font-medium desktop-only border-b border-gray-100">
                리뷰수
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {posts.map((item) => {
              const isVIP = item.ad_type === "VIP" || item.ad_type === "VIP+";
              return (
                <tr key={item.id} className={`group transition-all duration-300 ${
                  isVIP 
                    ? "bg-gradient-to-r from-rose-50/80 via-orange-50/60 to-amber-50/50 hover:from-rose-100/80 hover:via-orange-50/70 hover:to-amber-50/60 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.1)]" 
                    : "hover:bg-orange-50/50"
                }`}>
                  <td className="w-[1%] p-0">
                    {isVIP && (
                      <span className="block w-1 h-full bg-gradient-to-b from-rose-300 via-rose-400 to-orange-300 opacity-70" />
                    )}
                  </td>
                  
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
                        
                        <div className="flex-1">
                          <h3 className={`font-medium ${isVIP ? "text-rose-900" : "text-gray-900"}`}>
                            {item.post_title}
                          </h3>
                          <p className={`text-xs mt-2 ${isVIP ? "text-rose-500/70" : "text-gray-400"}`}>
                            조회수 {Number(item.views || 0).toLocaleString()} / 리뷰 {item.comment || 0} / 최저가 {item.displayPrice}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </td>

                  {/* 데스크톱용 추가 열 */}
                  <td className="py-4 px-6 text-center desktop-only whitespace-nowrap">
                    <span className={`font-medium ${isVIP ? "text-rose-600" : "text-orange-500"}`}>
                      {item.displayPrice}
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <style jsx>{`
        @media (max-width: 640px) {
          .desktop-only {
            display: none !important;
          }
          .badge-desktop {
            display: none !important;
          }
          .mobile-info {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
} 