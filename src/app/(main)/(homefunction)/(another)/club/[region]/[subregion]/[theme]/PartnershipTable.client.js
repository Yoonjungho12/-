"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export default function PartnershipTableClient({ posts, baseUrl, sortParam }) {
  const router = useRouter();

  const handleSortChange = (newSort) => {
    const url = `${baseUrl}?sort=${newSort}`;
    router.push(url);
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* 정렬 옵션 */}
      <div className="flex justify-end space-x-4 mb-6">
        <button
          onClick={() => handleSortChange("priceAsc")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            sortParam === "priceAsc"
              ? "bg-orange-500 text-white shadow-lg"
              : "bg-white text-gray-600 hover:bg-orange-50"
          }`}
        >
          가격순
        </button>
        <button
          onClick={() => handleSortChange("viewsDesc")}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
            sortParam === "viewsDesc"
              ? "bg-orange-500 text-white shadow-lg"
              : "bg-white text-gray-600 hover:bg-orange-50"
          }`}
        >
          조회순
        </button>
      </div>

      {/* 테이블 */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="bg-white rounded-2xl shadow-xl overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  업체명
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  제목
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  최저가
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  조회수
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {posts && posts.length > 0 ? (
                posts.map((post, index) => (
                  <motion.tr
                    key={post.id}
                    variants={item}
                    className="hover:bg-orange-50 transition-colors duration-200"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/partnership/${post.slug}`}
                        className="text-gray-900 font-medium hover:text-orange-500"
                      >
                        {post.company_name}
                        {post.ad_type === "VIP" || post.ad_type === "VIP+" ? (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                            VIP
                          </span>
                        ) : null}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{post.post_title}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {post.displayPrice}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {post.views || 0}
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                    등록된 게시물이 없습니다
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
} 