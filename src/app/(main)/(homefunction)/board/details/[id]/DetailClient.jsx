"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import MapKakao from "./MapKakao";
import { MegaphoneIcon } from "@heroicons/react/24/outline";
import { supabase } from "@/lib/supabaseF"; // 클라이언트 측 Supabase
import CommentsUI from "./comment";

// Supabase 스토리지 URL 빌더
function buildPublicImageUrl(path) {
  return `https://vejthvawsbsitttyiwzv.supabase.co/storage/v1/object/public/gunma/${path}`;
}

// 단순 label-value 표시용
function DetailRow({ label, value }) {
  return (
    <div className="mb-2">
      <span className="inline-block w-24 font-semibold text-gray-600">
        {label}
      </span>
      <span className="text-gray-800">{value || "-"}</span>
    </div>
  );
}

export default function DetailClient({ row, images, numericId }) {
  // “가고싶다” 목록 저장 여부
  const [isSaved, setIsSaved] = useState(false);
  // Supabase 세션 정보
  const [session, setSession] = useState(null);

  // 1) 컴포넌트 마운트 시 세션 정보 가져오기
  useEffect(() => {
    supabase.auth.getSession().then(({ data, error }) => {
      if (!error && data) {
        setSession(data.session);
      }
    });
  }, []);

  // 2) 세션이 확인되면, 이미 wantToGo 테이블에 저장되어 있는지 체크
  useEffect(() => {
    if (!session) return; // 로그인하지 않았다면 체크X

    const userId = session.user.id;
    supabase
      .from("wantToGo")
      .select("id")
      .eq("user_id", userId)
      .eq("partnershipsubmit_id", numericId)
      .single()
      .then(({ data, error }) => {
        if (data && !error) {
          setIsSaved(true);
        }
      });
  }, [session, numericId]);

  // 3) 이미지 배열 만들기
  const allImages = [];
  if (row.thumbnail_url) {
    allImages.push(buildPublicImageUrl(row.thumbnail_url));
  }
  if (images && images.length > 0) {
    images.forEach((imgObj) => {
      allImages.push(buildPublicImageUrl(imgObj.image_url));
    });
  }

  // 4) 저장 아이콘 클릭 시 - 토글 로직
  const handleSave = async () => {
    // 로그인 안 된 경우
    if (!session) {
      alert("로그인이 필요합니다!");
      return;
    }

    const userId = session.user.id;

    // 이미 저장된 상태면 → 삭제
    if (isSaved) {
      try {
        const { error } = await supabase
          .from("wantToGo")
          .delete()
          .eq("user_id", userId)
          .eq("partnershipsubmit_id", numericId);

        if (error) {
          console.error(error);
          alert("목록 삭제 중 오류가 발생했습니다.");
          return;
        }
        setIsSaved(false);
        alert("가고싶다 목록에서 삭제되었습니다.");
      } catch (err) {
        console.error(err);
        alert("목록 삭제 중 에러가 발생했습니다.");
      }
      return;
    }

    // 저장되어 있지 않으면 → 삽입
    try {
      const { error } = await supabase.from("wantToGo").insert({
        user_id: userId,
        partnershipsubmit_id: numericId,
      });

      if (error) {
        console.error(error);
        alert("저장 중 오류가 발생했습니다.");
        return;
      }
      setIsSaved(true);
      alert("가고싶다 목록에 저장되었습니다.");
    } catch (err) {
      console.error(err);
      alert("저장 중 에러가 발생했습니다.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
      {/* ===== 왼쪽 섹션 (이미지 + 상세 정보) ===== */}
      <div className="flex-[7]">
        {/* ======= 1) 이미지 섹션 ======= */}
        <div className="flex gap-4">
          {/* 왼쪽: 첫 번째 이미지 */}
          <div className="relative flex-1 h-80 bg-gray-100 rounded overflow-hidden">
            {allImages.length > 0 ? (
              <>
                <Image
                  src={allImages[0]}
                  alt="메인 이미지"
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 66vw, 66vw"
                />
                {/* 오른쪽 상단 저장 아이콘 */}
                <button
                  onClick={handleSave}
                  className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center 
                    bg-black/60
                    ${isSaved ? "text-red-500" : "text-white"}
                  `}
                  style={{ transition: "color 0.3s" }}
                  aria-label="save-button"
                >
                  {/* 하트 모양 아이콘 (outline → fill 변화는 text 색상으로 표현) */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 21l-1.45-1.342C5.4 15.36 2 12.28 
                      2 8.5 2 5.42 4.42 3 7.5 3c1.74 
                      0 3.41.81 4.5 2.09A5.987 
                      5.987 0 0 1 16.5 3C19.58 3 
                      22 5.42 22 8.5c0 3.78-3.4 
                      6.86-8.55 11.158L12 21z"
                    />
                  </svg>
                </button>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                이미지가 등록되지 않았습니다.
              </div>
            )}
          </div>

          {/* 오른쪽: 썸네일 목록 */}
          {allImages.length > 1 && (
            <div
              className="flex flex-col gap-2 overflow-y-auto"
              style={{ width: "90px" }}
            >
              {allImages.map((src, idx) => (
                <div
                  key={idx}
                  className="relative w-[80px] h-[80px] border rounded overflow-hidden"
                >
                  <Image
                    src={src}
                    alt={`썸네일-${idx}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ======= 2) 텍스트 상세 정보 ======= */}
        <div className="mt-6 bg-white p-4 rounded">
          <h1 className="text-3xl">
            <DetailRow label="업체명" value={row.company_name} />
          </h1>
          <div className="flex items-center gap-1 text-gray-700 mb-3">
            <MegaphoneIcon className="w-5 h-5 text-red-500" />
            <span className="font-semibold">{row.shop_type || "샵형태 미입력"}</span>
          </div>
          <DetailRow label="업체 소개" value={row.greeting} />
          <DetailRow label="오시는 길" value={row.address} />
          <DetailRow label="인근 건물" value={row.near_building} />
          <DetailRow label="전화번호" value={row.phone_number} />
          <DetailRow label="연락방법" value={row.contact_method} />
          <DetailRow label="영업시간" value={row.open_hours} />
          <DetailRow label="주차안내" value={row.parking_type} />
          <DetailRow label="관리사" value={row.manager_desc} />
          {row.program_info?.trim() && (
            <DetailRow label="프로그램" value={row.program_info} />
          )}
        </div>

        {/* ======= 이벤트 블록 ======= */}
        <div className="mt-6 bg-white p-4 rounded">
          {row.event_info?.trim() && (
            <DetailRow label="이벤트" value={row.event_info} />
          )}
        </div>

        {/* ======= 댓글, 기타 컴포넌트 영역 ======= */}
        <div className="mt-6 bg-white p-4 rounded">
          <CommentsUI company_name={row.company_name} id={row.id} />
        </div>
      </div>

      {/* ===== 오른쪽 섹션 (지도) ===== */}
      <div className="flex-[3] rounded overflow-hidden h-[330px]">
        <MapKakao address={row.address} />
      </div>
    </div>
  );
}