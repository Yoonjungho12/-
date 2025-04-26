"use client";

import Link from "next/link";

export default function PartnershipTableClient({ posts, baseUrl, sortParam }) {
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
    <div className="w-full mt-4">
      <div className="mb-4 flex justify-center items-center gap-4 text-sm font-medium">
        <Link 
          href={`${baseUrl}`} 
          className={sortParam === "" ? "text-orange-500 underline" : "text-gray-500 hover:text-orange-500"}
        >
          기본
        </Link>
        <span className="text-gray-300">•</span>
        <Link 
          href={`${baseUrl}?sort=lowest`} 
          className={sortParam === "lowest" ? "text-orange-500 underline" : "text-gray-500 hover:text-orange-500"}
        >
          가격 낮은순
        </Link>
        <span className="text-gray-300">•</span>
        <Link 
          href={`${baseUrl}?sort=views`} 
          className={sortParam === "views" ? "text-orange-500 underline" : "text-gray-500 hover:text-orange-500"}
        >
          조회수 높은순
        </Link>
      </div>
      <div className="overflow-x-auto rounded-xl border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                제목
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                최저가
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                조회수
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                리뷰수
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {posts.map((item) => {
              const isVIP = item.ad_type === "VIP" || item.ad_type === "VIP+";
              const isVIPPlus = item.ad_type === "VIP+";
              return (
                <tr
                  key={item.id}
                  className={`group transition-all duration-300 ${
                    isVIP
                      ? "bg-gradient-to-r from-rose-50/80 via-orange-50/60 to-amber-50/50 hover:from-rose-100/80 hover:via-orange-50/70 hover:to-amber-50/60 shadow-[inset_0_0_0_1px_rgba(244,63,94,0.1)]"
                      : "hover:bg-orange-50/50"
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    <Link href={`/board/details/${item.id}`} className="block group">
                      <div className="flex items-center gap-3">
                        {isVIP && (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-rose-500 to-orange-400 text-white shadow-sm ring-2 ring-rose-200">
                            VIP
                          </span>
                        )}
                        <span 
                          className={`${isVIPPlus ? "font-bold" : "font-medium"} group-hover:text-rose-500 transition-colors`}
                          style={{ color: isVIPPlus ? titleColorMap[item.title_color] : '#000000' }}
                        >
                          {item.post_title}
                        </span>
                      </div>
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <span className="text-gray-900">
                      {item.displayPrice}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <span className="text-gray-900">
                      {Number(item.views || 0).toLocaleString()}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <span className="text-gray-900">
                      {item.comment || 0}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}