"use client";
import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseF";

export default function RecommendedShopsClient({ initialTag, initialShops }) {
  // 사용할 태그(테마) 목록
  const tags = ["라운지바", "네일샵", "애견미용", "타로", "태닝샵"];

  // 서버에서 받은 초기 태그와 초기 샵 목록
  const [selectedTag, setSelectedTag] = useState(initialTag || "라운지바");
  const [shops, setShops] = useState(initialShops || []);

  // 태그 클릭 시 → Supabase 재호출
  async function handleClickTag(tagName) {
    if (tagName === selectedTag) return;
    setSelectedTag(tagName);

    try {
      // 1) themes 테이블에서 name = tagName
      let { data: themeRows } = await supabase
        .from("themes")
        .select("id, name")
        .eq("name", tagName)
        .single();

      // themeRows가 없으면 그냥 빈 값
      if (!themeRows) {
        setShops([]);
        return;
      }

      // 2) partnershipsubmit_themes 테이블에서 theme_id
      const themeId = themeRows.id;
      let { data: relRows } = await supabase
        .from("partnershipsubmit_themes")
        .select("submit_id")
        .eq("theme_id", themeId);

      if (!relRows || relRows.length === 0) {
        setShops([]);
        return;
      }

      // 3) partnershipsubmit에서 id in (...)
      const submitIds = relRows.map((r) => r.submit_id);
      let { data: subRows } = await supabase
        .from("partnershipsubmit")
        .select(
          "id, post_title, address, address_street, thumbnail_url, comment"
        )
        .in("id", submitIds)
        .limit(4);

      if (!subRows || subRows.length === 0) {
        setShops([]);
        return;
      }

      // 4) 받아온 데이터 변환
      const newShops = subRows.map((item) => ({
        id: item.id,
        imgSrc:
          "https://vejthvawsbsitttyiwzv.supabase.co/storage/v1/object/public/gunma/" +
          item.thumbnail_url,
        title: item.post_title,
        address: (item.address || "") + " " + (item.address_street || ""),
        reviewCount: item.comment || 0,
      }));

      setShops(newShops);
    } catch (err) {
      console.error("handleClickTag error:", err);
      setShops([]);
    }
  }

  return (
    <>
      {/* 
        ★ 부모 컨테이너가 어딘가에서 width 제한을 해도,
        아래 기법을 쓰면 해당 섹션만은 "뷰포트 기준"으로 깔림
      */}
     <section
  className="
    relative 
    left-1/2 
    -translate-x-1/2 
    w-screen 
    py-10 
    flex 
    flex-col 
    items-center 
    mb-10
    mt-10
    md:mt-20
    bg-gradient-to-r from-red-400 to-orange-400
    text-white
  "
>
        {/* 
          여기부터 실제 "콘텐츠 폭" 
          max-w-7xl + mx-auto로 가운데 정렬 
        */}
        <div className="mx-auto w-full max-w-5xl px-4">
          {/* === 핵심: 제목 양옆에 수평선(직선) 넣기 === */}
          <div className="flex items-center justify-center mt-2 mb-4 w-[100%] mx-auto">
            <hr className="flex-grow border-[0.5px] border-white" />
            <h2 className="mx-3 text-xl md:text-2xl font-bold text-white  whitespace-nowrap px-3">
              여기닷! 테마별 업체 추천
            </h2>
            <hr className="flex-grow border-[0.5px] border-white" />
          </div>
          <p className="text-white text-sm md:text-[16px] text-center">
            회원님께서 필요한 업체를 테마별로 빠르게 찾아보세요!
          </p>

          {/* 태그 버튼들 */}
          <div className="mt-6 flex flex-wrap justify-center gap-1 md:gap-3">
            {tags.map((tag) => {
              const isSelected = tag === selectedTag;
              return (
                <button
                  key={tag}
                  onClick={() => handleClickTag(tag)}
                  className={
                    isSelected
                      ? "rounded-full bg-orange-500 border border-white px-2 py-2 md:py-3 md:px-3 text-white hover:bg-orange-600 text-sm md:text-base"
                      : "rounded-full border border-orange-500 px-2 py-2 md:py-0 md:px-3 bg-white text-orange-600 hover:bg-white text-sm md:text-base"
                  }
                >
                  {tag}
                </button>
              );
            })}
          </div>

          {/* 
            (A) 모바일(640px 미만) → 슬라이드 형태
            (B) 데스크톱(640px 이상) → 그리드 형태
          */}
          <div className="mt-8">
            {/* (A) 모바일 슬라이드 */}
            <div className="block sm:hidden px-2">
              <div
                className="
                  flex
                  overflow-x-auto
                  gap-8
                  snap-x 
                  snap-mandatory
                  hide-scrollbar
                "
                style={{ scrollBehavior: "smooth" }}
              >
                {shops.map((shop) => (
                  <Link
                    key={shop.id}
                    href={`/board/details/${shop.id}`}
                    className="
                      shrink-0
                  w-[290px]
                      snap-start
                      rounded-xl 
                      border border-gray-200 
                      bg-white 
                      shadow-sm
                      focus-within:ring-2 focus-within:ring-blue-500
                    "
                  >
                    {/* 이미지 영역 */}
                    <div className="w-[240px] h-[130px] mx-auto mt-2 overflow-hidden">
                      <Image
                        src={shop.imgSrc}
                        alt={shop.title}
                        width={240}
                        height={130}
                        style={{ objectFit: "cover" }}
                        quality={30}
                        priority
                        className="rounded-2xl"
                        sizes="240px"
                      />
                    </div>
                    {/* 텍스트 영역 */}
                    <div className="p-4 w-[300px] box-border">
                      <h3 className="mb-1 text-base font-semibold text-gray-900">
                        {shop.title}
                      </h3>
                      <p className="text-sm text-gray-600">{shop.address}</p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        리뷰 {shop.reviewCount}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* (B) 데스크톱 그리드 */}
            <div className="hidden sm:grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {shops.map((shop) => (
                <Link
                  key={shop.id}
                  href={`/board/details/${shop.id}`}
                  className="
                    block
                    overflow-hidden
                    rounded-xl 
                    border border-gray-200
                    bg-white
                    shadow-sm
                    focus-within:ring-2 focus-within:ring-blue-500
                  "
                >
                  <div className="h-[153px] w-[263px] overflow-hidden mx-auto mt-4">
                    <Image
                      src={shop.imgSrc}
                      alt={shop.title}
                      width={263}
                      height={153}
                      style={{ objectFit: "cover" }}
                      quality={30}
                      priority
                      className="rounded-2xl"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="mb-1 text-base font-semibold text-gray-900">
                      {shop.title}
                    </h3>
                    <p className="text-sm text-gray-600">{shop.address}</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      리뷰 {shop.reviewCount}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* 더보기 버튼 */}
        <Link
          href={"/board/전체/전체"}
          className="md:mt-10 md:mb-10 rounded border-[0.5px] border-gray-500 px-5 py-2 text-gray-500"
        >
          더보기 +
        </Link>
      </section>
    </>
  );
}