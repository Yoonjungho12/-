"use client"; // ★ 클라이언트 컴포넌트

import { useRouter } from "next/navigation";

// 테마 목록(방문후기 표시용)
const THEMES = [
  { id: 0,  name: "전체",         sort_order: 0 },
  { id: 1,  name: "신규업체",     sort_order: 1 },
  { id: 19, name: "눈썹문신",     sort_order: 19 },
  { id: 20, name: "애견펜션",     sort_order: 20 },
  { id: 21, name: "사주",        sort_order: 21 },
  { id: 22, name: "타로",        sort_order: 22 },
  { id: 23, name: "아이폰-스냅",   sort_order: 23 },
  { id: 24, name: "웨딩플래너",   sort_order: 24 },
  { id: 25, name: "룸카페",      sort_order: 25 },
  { id: 26, name: "성인용품",    sort_order: 26 },
  { id: 27, name: "클럽",       sort_order: 27 },
  { id: 28, name: "나이트클럽",   sort_order: 28 },
  { id: 29, name: "네일샵",     sort_order: 29 },
  { id: 30, name: "애견미용",   sort_order: 30 },
  { id: 31, name: "태닝샵",     sort_order: 31 },
  { id: 32, name: "왁싱샵",     sort_order: 32 },
  { id: 33, name: "라운지바",   sort_order: 33 },
  { id: 34, name: "헌팅포차",   sort_order: 34 },
  { id: 35, name: "바",        sort_order: 35 },
  { id: 36, name: "감성주점",   sort_order: 36 },
];

export default function TrRow({ post, boardInfo, number }) {
  const router = useRouter();

  // 행 클릭 시 상세 페이지로 이동
  function handleRowClick() {
    router.push(`/community/board/detail/${boardInfo.id}/${post.id}`);
  }

  // 날짜 포맷
  const dateObj = new Date(post.created_at);
  const now = new Date();
  let formattedDate;
  if (dateObj.getFullYear() === now.getFullYear()) {
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const dd = String(dateObj.getDate()).padStart(2, "0");
    formattedDate = `${mm}-${dd}`;
  } else {
    formattedDate = dateObj.toISOString().split("T")[0];
  }

  const nickname = post.profiles?.nickname || "익명";
  const commentCount = post.post_comments ? post.post_comments.length : 0;
  const views = post.views || 0;

  return (
    <tr
      className="group hover:bg-gray-50 cursor-pointer transition-colors"
      onClick={handleRowClick}
    >
      <td className="py-4 text-center">
        <div className="text-sm text-gray-600">{number}</div>
      </td>
      <td className="py-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-900 group-hover:text-orange-500 transition-colors truncate">
                {post.title}
              </span>
              {commentCount > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-600">
                  {commentCount}
                </span>
              )}
            </div>
            {/* 방문후기면 theme_id 표시 */}
            {boardInfo.name === "방문후기" && post.theme_id ? (
              <div className="mt-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  {THEMES.find((t) => t.id === post.theme_id)?.name || "기타"}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </td>
      <td className="py-4 text-center">
        <div className="text-sm text-gray-600">{nickname}</div>
      </td>
      <td className="py-4 text-center">
        <div className="text-sm text-gray-500">{formattedDate}</div>
      </td>
      <td className="py-4 text-center">
        <div className="text-sm text-gray-500">{views}</div>
      </td>
    </tr>
  );
}