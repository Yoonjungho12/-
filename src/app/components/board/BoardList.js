// app/components/BoardList.jsx
import { supabase } from "@/lib/supabaseE";
import Link from "next/link";

export default async function BoardList() {
  // partnershipsubmit 테이블에서 모든 컬럼(*), 모든 행 가져오기
  const { data: items, error } = await supabase
    .from("partnershipsubmit")
    .select("*");

  if (error) {
    console.error("Error fetching partnershipsubmit list:", error);
  }

  if (!items || items.length === 0) {
    return <p>게시물이 없습니다.</p>;
  }

  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>
          {/* 각 게시물을 /board/[id] 경로로 이동 */}
          <Link href={`/board/${item.id}`}>
            {`ID: ${item.id}, TITLE: ${item.post_title}`}
          </Link>
        </li>
      ))}
    </ul>
  );
}