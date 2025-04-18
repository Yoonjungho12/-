"use client";
import React, { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseF";

// (A) 스켈레톤 카드
function ShopCardSkeleton() {
  return (
    <div className="w-[290px] overflow-hidden border border-gray-200 bg-white shadow-sm animate-pulse rounded-xl">
      <div className="h-[153px] w-[263px] mx-auto mt-3 bg-gray-200 rounded-xl" />
      <div className="p-4">
        <div className="mb-2 h-4 w-3/4 bg-gray-200 rounded" />
        <div className="h-4 w-1/2 bg-gray-200 rounded" />
        <div className="mt-2 h-4 w-1/3 bg-gray-300 rounded" />
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
  const regionCache = useRef({});
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  // Intersection Observer 설정
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      {
        threshold: 0.1
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

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

  // 4) "가로 스크롤"에 사용할 Ref를 **미리** 선언
  const ulRef = useRef(null);

  // 5) Supabase에서 데이터 가져오기
  async function handleClickRegion(region) {
    if (region === selectedRegion) return;
    setSelectedRegion(region);
    setIsLoading(true);
    if (regionCache.current[region]) {
      setShopList(regionCache.current[region]);
      setIsLoading(false);
      return;
    }

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

    // await new Promise((res) => setTimeout(res, 3000));

    setIsLoading(false);
    if (error) {
      console.error("DB fetch error:", error);
      alert("데이터 로드 오류가 발생했습니다.");
      return;
    }

    const sliced = (data || []).slice(0, 8);
    regionCache.current[region] = sliced;
    setShopList(sliced);
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

  return (
    <div className="w-full bg-white" ref={sectionRef}>
      {/* 상단 타이틀 */}
      <div className={`
        w-full px-4 pt-8
        transform
        transition-all
        duration-1000
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
      `}>
        <h2 className="text-center text-1xl md:text-3xl font-bold text-gray-800  bg-clip-text">
          여기닷 제휴파트너 실시간 인기순위
        </h2>
        <p className="mt-2 text-center text-gray-500">
          실시간 많은 회원들이 보고 있어요!
        </p>
      </div>

      {/* ▼▼ 가로 스크롤 탭 ▼▼ */}
      <div className={`
        mt-6 max-w-7xl mx-auto px-4
        transform
        transition-all
        duration-1000
        delay-300
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
      `}>
        <div className="relative p-2">
          {/* 왼쪽 화살표 */}
          <button
            onClick={scrollLeft}
            className="
              absolute top-1/2 left-0 z-10
              -translate-y-1/2
              w-6 h-6 md:w-9 md:h-9
              rounded-full border-none bg-white/80 backdrop-blur-sm text-gray-700 shadow-lg
              flex items-center justify-center
              hover:bg-orange-400 hover:text-white transition-all duration-300
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
              gap-2
            "
          >
            {regionTabs.map((region, idx) => {
              const isSelected = selectedRegion === region;
              return (
                <li key={idx} className="flex-none">
                  <button
                    onClick={() => handleClickRegion(region)}
                    className={`
                      transition-all duration-300 ease-out rounded-full
                      ${isSelected
                        ? "px-6 py-2.5 bg-gradient-to-r from-red-400 to-orange-400 text-white shadow-lg md:text-base font-medium hover:shadow-xl transform hover:scale-105"
                        : "px-6 py-2.5 bg-gray-50 text-gray-600 hover:bg-gray-100 md:text-base font-medium hover:shadow-md"
                      }
                    `}
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
              rounded-full border-none bg-white/80 backdrop-blur-sm text-gray-700 shadow-lg
              flex items-center justify-center
              hover:bg-orange-400 hover:text-white transition-all duration-300
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
      <div className="mt-8 mx-auto max-w-7xl pb-12">
        {/* (모바일) 슬라이드 */}
        <div className="block sm:hidden px-4">
          <div
            className="
              flex
              overflow-x-auto
              gap-6
              snap-x snap-mandatory
              hide-scrollbar
              pb-4
            "
            style={{ scrollBehavior: "smooth" }}
          >
            {shopList.map((item, index) => {
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
                  className={`
                    group
                    shrink-0
                    w-[270px]
                    snap-start
                    rounded-2xl
                    bg-white
                    shadow-lg
                    hover:shadow-xl
                    transition-all
                    duration-700
                    transform
                    ${isVisible 
                      ? 'opacity-100 translate-y-0' 
                      : 'opacity-0 translate-y-10'
                    }
                  `}
                  style={{
                    transitionDelay: `${index * 100}ms`
                  }}
                >
                  <div className="relative w-full h-[160px] overflow-hidden">
                    <Image
                      src={imageUrl}
                      alt={`${item.company_name || item.post_title} 썸네일`}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-110"
                      quality={50}
                      priority
                      sizes="270px"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>

                  <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-800 group-hover:text-orange-500 transition-colors duration-300">
                      {item.company_name || item.post_title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-600">{item.address}</p>
                    <div className="mt-3 flex items-center text-sm text-gray-500">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span>리뷰 {item.comment || 0}</span>
                    </div>
                    <div className="mt-4 flex justify-between items-center">
                      <div className="text-orange-500 font-bold">
                        {lowestPrice !== null ? formatPrice(lowestPrice) : "가격 정보 없음"}
                      </div>
                      <div className="text-xs text-gray-400">자세히 보기 →</div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* (데스크톱) 그리드 */}
        <div className="hidden sm:grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 px-4">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <ShopCardSkeleton key={i} />)
            : shopList.map((item, index) => {
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
                    className={`
                      group
                      block
                      rounded-2xl
                      bg-white
                      shadow-lg
                      hover:shadow-xl
                      transition-all
                      duration-700
                      transform
                      ${isVisible 
                        ? 'opacity-100 translate-y-0' 
                        : 'opacity-0 translate-y-10'
                      }
                    `}
                    style={{
                      transitionDelay: `${index * 100}ms`
                    }}
                  >
                    <div className="relative w-full h-[200px] overflow-hidden">
                      <Image
                        src={imageUrl}
                        alt={`${item.company_name || item.post_title} 썸네일`}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-110"
                        quality={50}
                        priority
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>

                    <div className="p-5">
                      <h3 className="text-lg font-bold text-gray-800 group-hover:text-orange-500 transition-colors duration-300">
                        {item.company_name || item.post_title}
                      </h3>
                      <p className="mt-2 text-sm text-gray-600">{item.address}</p>
                      <div className="mt-3 flex items-center text-sm text-gray-500">
                        <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <span>리뷰 {item.comment || 0}</span>
                      </div>
                      <div className="mt-4 flex justify-between items-center">
                        <div className="text-orange-500 font-bold">
                          {lowestPrice !== null ? formatPrice(lowestPrice) : "가격 정보 없음"}
                        </div>
                        <div className="text-xs text-gray-400">자세히 보기 →</div>
                      </div>
                    </div>
                  </Link>
                );
              })}
        </div>
      </div>

      {/* 더보기 버튼 */}
      <div className={`
        flex justify-center pb-12
        transform
        transition-all
        duration-1000
        delay-500
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
      `}>
        <Link
          href={"/today/전체/전체/전체"}
          className="
            px-8
            py-3
            rounded-full
            border-2
            border-orange-400
            text-orange-500
            hover:bg-orange-400
            hover:text-white
            transition-all
            duration-300
            transform
            hover:scale-105
            font-medium
          "
        >
          더보기 +
        </Link>
      </div>
    </div>
  );
}