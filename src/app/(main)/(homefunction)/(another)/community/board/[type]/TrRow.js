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

export default function TrRow({ post, boardInfo }) {
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
      className="border-b border-gray-200 cursor-pointer hover:bg-gray-50"
      onClick={handleRowClick}
    >
      <td className="p-2 text-center">{post.id}</td>
      <td className="p-2">
        {post.title}
        {commentCount > 0 && (
          <span className="text-orange-500 text-xs ml-2">{commentCount}</span>
        )}
        {/* 방문후기면 theme_id 표시 */}
        {boardInfo.name === "방문후기" && post.theme_id ? (
          <span className="ml-2 text-xs text-gray-500">
            {`[${
              THEMES.find((t) => t.id === post.theme_id)?.name ||
              "기타"
            }]`}
          </span>
        ) : null}
      </td>
      <td className="p-2 text-center">{nickname}</td>
      <td className="p-2 text-center">{formattedDate}</td>
      <td className="p-2 text-center">{views}</td>
    </tr>
  );
}