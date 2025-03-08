"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseF";

// (1) 간단한 스켈레톤 카드 컴포넌트
function ShopCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm animate-pulse">
      <div className="min-h-[300px] w-full bg-gray-200" />
      <div className="p-4">
        <div className="mb-2 h-4 w-3/4 bg-gray-200" />
        <div className="h-4 w-1/2 bg-gray-200" />
      </div>
    </div>
  );
}

// 특정 지역명 치환
function rewriteSpecialProvince(original) {
  switch (original) {
    case "제주":
      return "제주특별자치도";
    case "세종":
      return "세종특별자치시";
    case "강원":
      return "강원특별자치도";
    case "전북":
      return "전북특별자치도";
    default:
      return original;
  }
}

export default function MainoneClient({ initialRegion, initialData }) {
  // 지역 탭
  const regionTabs = [
    "서울", "인천", "대전", "세종", "광주", "대구", "울산", "부산",
    "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
  ];

  // 탭 슬라이드 관련
  const [showCount, setShowCount] = useState(11);

  useEffect(() => {
    function handleResize() {
      const w = window.innerWidth;
      if (w < 640) {
        setShowCount(5);
      } else if (w < 768) {
        setShowCount(7);
      } else if (w < 1024) {
        setShowCount(9);
      } else {
        setShowCount(11);
      }
    }
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [startIndex, setStartIndex] = useState(0);

  const [selectedRegion, setSelectedRegion] = useState(initialRegion);

  const visibleTabs = [];
  for (let i = 0; i < showCount; i++) {
    const tabIndex = (startIndex + i) % regionTabs.length;
    visibleTabs.push(regionTabs[tabIndex]);
  }

  function handlePrev() {
    setStartIndex((prev) => (prev - 1 + regionTabs.length) % regionTabs.length);
  }
  function handleNext() {
    setStartIndex((prev) => (prev + 1) % regionTabs.length);
  }

  // Supabase Fetch
  const [shopList, setShopList] = useState(initialData || []);
  const [isLoading, setIsLoading] = useState(false);

  async function handleClickRegion(region) {
    if (region === selectedRegion) return;
    setSelectedRegion(region);

    setIsLoading(true);

    const replaced = rewriteSpecialProvince(region);

    const { data, error } = await supabase
      .from("partnershipsubmit")
      .select(`
        id,
        final_admitted,
        post_title,
        company_name,
        address,
        address_street,
        shop_type,
        comment,
        greeting,
        thumbnail_url,
        partnershipsubmit_themes (
          themes (
            id,
            name
          )
        )
      `)
      .eq("final_admitted", true)
      .textSearch("search_tsv", replaced, {
        type: "websearch",
        config: "simple",
      });

    setIsLoading(false);

    if (error) {
      console.error("DB fetch error:", error);
      alert("데이터 로드 오류가 발생했습니다.");
      return;
    }

    const sliced = (data || []).slice(0, 8);
    setShopList(sliced);
  }

  if (isLoading) {
    return (
      <div className="w-full bg-white">
        {/* 로딩 시 스켈레톤 */}
        <div className="mx-auto max-w-5xl px-4 pt-8">
          <h2 className="text-center text-2xl font-bold">
            건마 1인샵 스웨디시 마사지 인기 순위
            <span className="ml-2 text-red-600" aria-hidden="true">❤️</span>
          </h2>
          <p className="mt-2 text-center text-gray-700">
            실시간 많은 회원들이 보고있는 업체를 소개합니다
          </p>
        </div>

        <div className="mx-auto mt-6 max-w-5xl px-4 pb-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <ShopCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 실제 렌더
  return (
    <div className="w-full bg-white">
      {/* 상단 타이틀 */}
      <div className="mx-auto max-w-5xl px-4 pt-8">
        <h2 className="text-center text-2xl font-bold">
          건마 1인샵 스웨디시 마사지 인기 순위
          <span className="ml-2 text-red-600" aria-hidden="true">❤️</span>
        </h2>
        <p className="mt-2 text-center text-gray-700">
          실시간 많은 회원들이 보고있는 업체를 소개합니다
        </p>
      </div>

      {/* 지역 탭 */}
      <div className="mx-auto mt-6 max-w-7xl px-4">
        <div className="w-full relative overflow-hidden rounded border border-gray-300 shadow-sm">
          <ul className="flex">
            {visibleTabs.map((region, idx) => {
              const isSelected = selectedRegion === region;
              return (
                <li key={idx} className="flex-1">
                  <button
                    onClick={() => handleClickRegion(region)}
                    className={
                      isSelected
                        ? "block w-full h-full bg-red-600 px-4 py-2 text-center text-white hover:bg-red-700"
                        : "block w-full h-full bg-gray-100 px-4 py-2 text-center text-gray-700 hover:bg-gray-200"
                    }
                    aria-label={`${region} 지역 선택`}
                  >
                    {region}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* 왼쪽 화살표 */}
          <button
            onClick={handlePrev}
            aria-label="이전 지역"
            className="
              absolute top-1/2 left-0 z-10
              -translate-y-1/2
              w-6 h-6 md:w-9 md:h-9
              rounded-full border border-gray-300 bg-white text-gray-700
              flex items-center justify-center
              hover:bg-red-100
            "
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 md:h-4 md:w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* 오른쪽 화살표 */}
          <button
            onClick={handleNext}
            aria-label="다음 지역"
            className="
              absolute top-1/2 right-0 z-10
              -translate-y-1/2
              w-6 h-6 md:w-9 md:h-9
              rounded-full border border-gray-300 bg-white text-gray-700
              flex items-center justify-center
              hover:bg-red-100
            "
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 md:h-4 md:w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* 모바일 슬라이드 + 데스크톱 그리드 */}
      <div className="mt-6 mx-auto max-w-7xl px-4 pb-8">
        {/* 모바일 */}
        <div className="block sm:hidden px-8">
          <div
            className="
              flex
              overflow-x-auto
              gap-8
              snap-x snap-mandatory
            "
            style={{ scrollBehavior: "smooth" }}
          >
            {shopList.map((item) => {
              const imageUrl = `https://vejthvawsbsitttyiwzv.supabase.co/storage/v1/object/public/gunma/${item.thumbnail_url}`;
              const detailUrl = `/board/details/${item.id}`;
              const themeList = item.partnershipsubmit_themes || [];

              return (
                <Link
                  key={item.id}
                  href={detailUrl}
                  className="
                    shrink-0 
                    w-[263px]
                    snap-start
                    rounded-xl border border-gray-200 bg-white shadow-sm
                    focus-within:ring-2 focus-within:ring-blue-500
                  "
                >
                  <div className="w-[263px] h-[153px] overflow-hidden">
                    <Image
                      src={imageUrl}
                      alt={`${item.company_name || item.post_title} 썸네일`}
                      width={263}
                      height={153}
                      style={{ objectFit: "cover" }}
                      quality={30}
                      priority
                      className="rounded-2xl"
                      sizes="263px"
                    />
                  </div>

                  <div className="p-4 w-[263px] box-border">
                    <h3 className="mb-1 text-base font-semibold text-gray-900">
                      {item.company_name || item.post_title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {item.address} {item.address_street}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {item.comment
                        ? typeof item.comment === "string"
                          ? item.comment.slice(0, 30)
                          : JSON.stringify(item.comment).slice(0, 30)
                        : "자세한 정보 보기..."}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {themeList.map((t) => (
                        <span
                          key={t.themes.id}
                          className="rounded bg-red-100 px-2 py-1 text-xs text-red-600"
                        >
                          {t.themes.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* 데스크톱 */}
        <div className="hidden sm:grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shopList.map((item) => {
            const imageUrl = `https://vejthvawsbsitttyiwzv.supabase.co/storage/v1/object/public/gunma/${item.thumbnail_url}`;
            const detailUrl = `/board/details/${item.id}`;
            const themeList = item.partnershipsubmit_themes || [];

            return (
              <Link
                key={item.id}
                href={detailUrl}
                className="block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm
                  focus-within:ring-2 focus-within:ring-blue-500
                "
              >
                <div className="h-[153px] w-[263px] overflow-hidden mx-auto mt-4">
                  <Image
                    src={imageUrl}
                    alt={`${item.company_name || item.post_title} 썸네일`}
                    width={263}
                    height={153}
                    style={{ objectFit: "cover" }}
                    quality={30}
                    priority
                  />
                </div>

                <div className="p-4">
                  <h3 className="mb-1 text-base font-semibold text-gray-900">
                    {item.company_name || item.post_title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {item.address} {item.address_street}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {item.comment
                      ? typeof item.comment === "string"
                        ? item.comment.slice(0, 30)
                        : JSON.stringify(item.comment).slice(0, 30)
                      : "자세한 정보 보기..."}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {themeList.map((t) => (
                      <span
                        key={t.themes.id}
                        className="rounded bg-red-100 px-2 py-1 text-xs text-red-600"
                      >
                        {t.themes.name}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}