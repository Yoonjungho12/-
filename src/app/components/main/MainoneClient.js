"use client";
import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseF";

// (A) 스켈레톤 카드
function ShopCardSkeleton() {
  return (
    <div className="overflow-hidden border border-gray-200 bg-white shadow-sm animate-pulse">
      <div className="min-h-[300px] w-full bg-gray-200" />
      <div className="p-4">
        <div className="mb-2 h-4 w-3/4 bg-gray-200" />
        <div className="h-4 w-1/2 bg-gray-200" />
      </div>
    </div>
  );
}

// (B) 가격 포맷
function formatPrice(num) {
  if (!num || isNaN(num)) {
    return "가격 정보 없음";
  }
  return Number(num).toLocaleString() + "원";
}

// (C) 지역명 치환
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
  // 1) 지역 목록
  const regionTabs = [
    "서울", "인천", "대전", "세종", "광주", "대구", "울산", "부산",
    "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
  ];

  // 2) 선택된 지역
  const [selectedRegion, setSelectedRegion] = useState(initialRegion);

  // 3) 가게 리스트, 로딩
  const [shopList, setShopList] = useState(initialData || []);
  const [isLoading, setIsLoading] = useState(false);

  // 4) “가로 스크롤”에 사용할 Ref를 **미리** 선언
  const ulRef = useRef(null);

  // 5) Supabase에서 데이터 가져오기
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
        comment,
        greeting,
        thumbnail_url,
        sections (
          courses ( price )
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

  // 6) 로딩 중이면 스켈레톤 렌더
  if (isLoading) {
    return (
      <div className="w-full bg-white">
        <div className="mx-auto max-w-5xl px-4 pt-8">
          <h2 className="text-center text-xl font-bold">
            여기닷 제휴 파트너 실시간 인기순위
            <span className="ml-2 text-orange-500" aria-hidden="true">
              ❤️
            </span>
          </h2>
          <p className="mt-2 text-center text-red-100">
            실시간 많은 회원들이 보고 있어요!
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

  // 7) 화살표 클릭 시 스크롤 이동
  function scrollLeft() {
    if (ulRef.current) {
      ulRef.current.scrollBy({
        left: -100,
        behavior: "smooth",
      });
    }
  }
  function scrollRight() {
    if (ulRef.current) {
      ulRef.current.scrollBy({
        left: 100,
        behavior: "smooth",
      });
    }
  }

  // 8) 실제 렌더
  return (
    <div className="w-full bg-white">
      {/* 상단 타이틀 */}
      <div className="w-full px-4 pt-8">
        <h2 className="text-center text-xl md:text-2xl font-bold">
          여기닷 제휴 파트너 실시간 인기순위
        </h2>
        <p className="mt-2 text-center text-gray-500">
          실시간 많은 회원들이 보고 있어요!
        </p>
      </div>

      {/* ▼▼ 가로 스크롤 탭 ▼▼ */}
      <div className="mt-6 max-w-7xl mx-auto px-4 ">
        <div className="relative p-2">
          {/* 왼쪽 화살표 */}
          <button
            onClick={scrollLeft}
            className="
              absolute top-1/2 left-0 z-10
              -translate-y-1/2
              w-6 h-6 md:w-9 md:h-9
              rounded-full border border-gray-300 bg-white text-gray-700
              flex items-center justify-center
              hover:bg-orange-400 hover:border-transparent hover:text-white
            "
            aria-label="이전 지역"
          >
            <svg
              className="h-3 w-3 md:h-4 md:w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* 탭 목록 (가로 스크롤) */}
          <ul
            ref={ulRef}
            className="
              flex
              overflow-x-auto
              whitespace-nowrap
              scroll-smooth
              hide-scrollbar
              list-none
              p-0
              m-0
            "
          >
            {regionTabs.map((region, idx) => {
              const isSelected = selectedRegion === region;
              return (
                <li key={idx} className="flex-none">
                  <button
                    onClick={() => handleClickRegion(region)}
                    className={`shadow-sm ${
  isSelected
    ? "px-4 py-2 bg-gradient-to-r from-red-400 to-orange-400 text-white md:w-40 text-sm md:text-base"
    : "border-gray-200 px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 md:w-40 text-sm md:text-base"
}`}
                    aria-label={`${region} 지역 선택`}
                  >
                    {region}
                  </button>
                </li>
              );
            })}
          </ul>

          {/* 오른쪽 화살표 */}
          <button
            onClick={scrollRight}
            className="
              absolute top-1/2 right-0 z-10
              -translate-y-1/2
              w-6 h-6 md:w-9 md:h-9
              rounded-full border border-gray-300 bg-white text-gray-700
              flex items-center justify-center
              hover:bg-orange-400 hover:border-transparent hover:text-white
            "
            aria-label="다음 지역"
          >
            <svg
              className="h-3 w-3 md:h-4 md:w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* 모바일/데스크톱 카드 */}
      <div className="mt-6 mx-auto max-w-7xl pb-8 ">
        {/* (모바일) 슬라이드 */}
        <div className="block sm:hidden px-4 ">
          <div
            className="
              flex
              overflow-x-auto
              gap-8
              snap-x snap-mandatory
              hide-scrollbar
              
            "
            style={{ scrollBehavior: "smooth" }}
          >
            {shopList.map((item) => {
              // ▼▼ 최저가 계산 ▼▼
              let lowestPrice = null;
              if (item.sections?.length) {
                item.sections.forEach((sec) => {
                  if (sec.courses?.length) {
                    sec.courses.forEach((c) => {
                      if (
                        lowestPrice === null ||
                        (c.price && c.price < lowestPrice)
                      ) {
                        lowestPrice = c.price;
                      }
                    });
                  }
                });
              }

              // 이미지 URL/상세링크
              const imageUrl =
                process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL +'/'+
                item.thumbnail_url;
              const detailUrl = `/board/details/${item.id}`;

              return (
                <Link
                  key={item.id}
                  href={detailUrl}
                  className="
                    shrink-0
                    w-[270px]
                    snap-start
                    rounded-xl
                    border border-gray-200
                    bg-white
                    shadow-xl
                    focus-within:ring-2 focus-within:ring-blue-500
                  "
                >
                  {/* 
                    (이미지) 
                    rounded-xl + overflow-hidden으로 둥글게 자름
                  */}
                  <div className="w-[240px] h-[130px] mx-auto mt-3
                   overflow-hidden rounded-xl flex">
                    <Image
                      src={imageUrl}
                      alt={`${item.company_name || item.post_title} 썸네일`}

                      width={240}
                      height={130}
                      style={{ objectFit: "cover", objectPosition: "center",  }}
                      quality={30}
                      priority
                      sizes="240px"
                    />
                  </div>

                  <div className="p-4 w-[300px] box-border">
                    <h3 className="mb-1 text-base font-semibold text-gray-900">
                      {item.company_name || item.post_title}
                    </h3>
                    <p className="text-sm text-gray-600">{item.address}</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {item.comment
                        ? "리뷰 " +
                          (typeof item.comment === "string"
                            ? item.comment.slice(0, 30)
                            : JSON.stringify(item.comment).slice(0, 30))
                        : "자세한 정보 보기..."}
                    </p>

                    {/* 
                      (최저가 영역) 
                      lowestPrice 변수를 출력 
                    */}
                    <div className="mt-2 text-sm font-semibold">
                      {lowestPrice !== null
                        ? formatPrice(lowestPrice)
                        : "가격 정보 없음"}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* (데스크톱) 그리드 */}
        <div className="hidden sm:grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {shopList.map((item) => {
            // ▼▼ 최저가 계산 ▼▼
            let lowestPrice = null;
            if (item.sections?.length) {
              item.sections.forEach((sec) => {
                if (sec.courses?.length) {
                  sec.courses.forEach((c) => {
                    if (
                      lowestPrice === null ||
                      (c.price && c.price < lowestPrice)
                    ) {
                      lowestPrice = c.price;
                    }
                  });
                }
              });
            }

            // 썸네일/상세링크
           const imageUrl =
                process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL +'/'+
                item.thumbnail_url;
              const detailUrl = `/board/details/${item.id}`;

            return (
              <Link
                key={item.id}
                href={detailUrl}
                className="
                  block
                  overflow-hidden
                  rounded-xl
                  border border-gray-200
                  bg-white
                  shadow-xl
                  focus-within:ring-2 focus-within:ring-blue-500
                   w-[290px]
                "
              >
                {/* 
                  (이미지) 
                  overflow-hidden + rounded-xl 
                */}
                <div className="h-[153px] w-[263px] overflow-hidden mx-auto mt-3 rounded-xl flex">
                  <Image
                    src={imageUrl}
                    alt={`${item.company_name || item.post_title} 썸네일`}
                    width={263}
                    height={153}
                     style={{ objectFit: "cover", objectPosition: "center" }}
                    quality={30}
                    priority
                  />
                </div>

                <div className="p-4">
                  <h3 className="mb-1 text-base font-semibold text-gray-900">
                    {item.company_name || item.post_title}
                  </h3>
                  
                  <p className="mt-0.5 text-xs text-gray-500">
                    {item.comment
                      ? typeof item.comment === "string"
                        ? item.comment.slice(0, 30)
                        : JSON.stringify(item.comment).slice(0, 30)
                      : "자세한 정보 보기..."
                    }
                  </p>

                  {/* (최저가 영역) */}
                  <div className="mt-2 text-sm font-semibold">
                    {lowestPrice !== null
                      ? formatPrice(lowestPrice)
                      : "가격 정보 없음"}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      <div className="flex justify-center"> 

          <Link
        href={"/today/전체/전체/전체"}
        className="mt-15 rounded border-[0.5px] border-gray-500 px-5 py-2 text-gray-500"
      >
        더보기 +
      </Link>
      </div>
    </div>
  );
}