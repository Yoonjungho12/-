"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseF";

export default function WriteButton({ boardId, decodedType }) {
  const router = useRouter();

  const [isPartner, setIsPartner] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    // 로그인 여부와 profiles.isPartner 확인
    supabase.auth.getSession().then(async ({ data, error }) => {
      if (error) {
        console.error("세션 체크 에러:", error);
        setIsPartner(false);
        setChecked(true);
        return;
      }
      if (!data?.session?.user) {
        // 비로그인 시
        setIsPartner(false);
        setChecked(true);
        return;
      }
      // 로그인된 user_id
      const userId = data.session.user.id;
      // profiles에서 isPartner 가져오기
      const { data: profData, error: profErr } = await supabase
        .from("profiles")
        .select("isPartner")
        .eq("user_id", userId)
        .single();
      if (profErr) {
        console.error("프로필 조회 에러:", profErr);
        setIsPartner(false);
      } else {
        setIsPartner(profData?.isPartner === true);
      }
      setChecked(true);
    });
  }, []);

  const handleClick = () => {
    if (!checked) {
      // 아직 isPartner 체크 중
      alert("로딩 중입니다. 잠시 후 다시 시도하세요.");
      return;
    }
    if (!isPartner) {
      alert("제휴 회원만 글쓰기가 가능합니다.");
      return;
    }
    // 제휴 회원이면 글쓰기 페이지로 이동
    router.push(`/community/board/${decodedType}/write`);
  };

  return (
    <button
      onClick={handleClick}
      className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-blue-600 text-sm"
    >
      글쓰기
    </button>
  );
}