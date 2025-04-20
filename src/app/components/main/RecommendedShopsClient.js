"use client";
import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabaseF";

export default function RecommendedShopsClient({ initialTag, initialShops }) {
  // 사용할 태그(테마) 목록
  const tags = ["라운지바", "네일샵", "애견미용", "타로", "태닝샵"];

  // 서버에서 받은 초기 태그와 초기 샵 목록
  const [selectedTag, setSelectedTag] = useState(initialTag || "라운지바");
  const [shops, setShops] = useState(initialShops || []);
  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (sectionRef.current) {
        const rect = sectionRef.current.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const progress = Math.min(Math.max(1 - (rect.top + rect.height) / (viewportHeight + rect.height), 0), 1);
        setScrollProgress(progress * 3);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
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
          "id, post_title, company_name, address, address_street, thumbnail_url, comment"
        )
        .in("id", submitIds)
        .limit(4);

      if (!subRows || subRows.length === 0) {
        setShops([]);
        return;
      }

      // 4) 받아온 데이터 변환
      const newShops = subRows.map((item) => {
        const finalUrl = `${process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL}/${item.thumbnail_url}`;
        console.log('이미지 최종 URL 레코멘디드:', finalUrl);

        return {
          id: item.id,
          imgSrc: finalUrl,
          company_name: item.company_name || item.post_title,
          title: item.post_title || "제목 없음",
          address: item.address || "주소 미기재",
          reviewCount: item.comment || 0,
        };
      });

      setShops(newShops);
    } catch (err) {
      console.error("handleClickTag error:", err);
      setShops([]);
    }
  }

  return (
    <section
      ref={sectionRef}
      className={`
        mb-10
        mt-10
        md:mt-20
        relative 
        left-1/2 
        -translate-x-1/2 
        w-screen 
        py-9
        flex 
        flex-col 
        items-center 
        overflow-hidden
      `}
    >
      {/* 배경 레이어 */}
      <div 
        className="absolute inset-0 bg-gradient-to-r from-red-400 to-orange-400"
        style={{
          transform: `scaleX(${1 + scrollProgress})`,
          transition: 'transform 0.3s ease-out',
          transformOrigin: 'center',
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-4">
        {/* 제목 섹션 */}
        <div className={`
          text-center 
          mb-8
          transition-all 
          duration-1000 
          delay-300
          transform
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
        `}>
          <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
            여기닷! 테마별 제휴점 추천
          </h2>
          <p className="text-white/90 text-xs md:text-sm">
            회원님께서 필요한 제휴점을 테마별로 빠르게 찾아보세요!
          </p>
        </div>

        {/* 태그 버튼들 */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {tags.map((tag, index) => {
            const isSelected = tag === selectedTag;
            return (
              <button
                key={tag}
                onClick={() => handleClickTag(tag)}
                className={`
                  transform 
                  transition-all 
                  duration-700
                  ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
                  hover:scale-105
                  ${isSelected
                    ? "rounded-full bg-white shadow-lg px-4 py-1.5 md:px-6 md:py-2.5 text-orange-500 font-semibold border-2 border-white text-xs md:text-sm"
                    : "rounded-full bg-white/20 backdrop-blur-sm px-4 py-1.5 md:px-6 md:py-2.5 text-white hover:bg-white/30 text-xs md:text-sm"
                  }
                `}
                style={{
                  transitionDelay: `${index * 100 + 600}ms`
                }}
              >
                {tag}
              </button>
            );
          })}
        </div>

        {/* 카드 그리드 */}
        <div className="mt-8">
          {/* 모바일 슬라이드 */}
          <div className="block sm:hidden">
            <div
              className="
                flex
                overflow-x-auto
                gap-3
                snap-x 
                snap-mandatory
                hide-scrollbar
                pb-4
              "
              style={{ scrollBehavior: "smooth" }}
            >
              {shops.map((shop, index) => (
                <Link
                  key={shop.id}
                  href={`/board/details/${shop.id}`}
                  className={`
                    shrink-0
                    w-[220px]
                    h-[260px]
                    snap-start
                    rounded-xl
                    shadow-lg
                    relative
                    overflow-hidden
                    transition-all
                    duration-700
                    transform
                    ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
                    hover:scale-[1.02]
                    hover:shadow-2xl
                    bg-black
                  `}
                  style={{
                    transitionDelay: `${index * 50 + 300}ms`
                  }}
                >
                  <div className="w-full h-full transition-transform duration-300 ease-out hover:scale-105">
                    <Image
                      src={shop.imgSrc}
                      alt={shop.title}
                      fill
                      unoptimized
                      style={{ objectFit: "cover", opacity: "0.9" }}
                      quality={30}
                      priority
                      sizes="220px"
                      className="transition-all duration-300 ease-out hover:opacity-100"
                    />
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
                    <h3 className="text-base font-bold text-white mb-1">
                      {shop.company_name}
                    </h3>
                    <p className="text-gray-200 text-xs mb-1">{shop.address}</p>
                    <p className="text-gray-300 text-xs">
                      리뷰 {shop.reviewCount}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* 데스크톱 그리드 */}
          <div className="hidden sm:grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {shops.map((shop, index) => (
              <Link
                key={shop.id}
                href={`/board/details/${shop.id}`}
                className={`
                  block
                  overflow-hidden
                  rounded-2xl
                  shadow-lg
                  relative
                  h-[362px]
                  w-[293px]
                  mx-auto
                  transition-all
                  duration-700
                  transform
                  ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
                  hover:scale-[1.02]
                  hover:shadow-2xl
                  bg-black
                  group
                `}
                style={{
                  transitionDelay: `${index * 50 + 300}ms`
                }}
              >
                <div className="w-full h-full transition-transform duration-300 ease-out group-hover:scale-105">
                  <Image
                    src={shop.imgSrc}
                    alt={shop.title}
                    fill
                    unoptimized
                    style={{ objectFit: "cover", opacity: "0.9" }}
                    quality={70}
                    className="transition-all duration-300 ease-out group-hover:opacity-100"
                  />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent transform transition-all duration-300 ease-out group-hover:translate-y-0">
                  <h3 className="text-lg font-bold text-white mb-2 transform transition-all duration-300 ease-out group-hover:translate-y-0">
                    {shop.company_name}
                  </h3>
                  <p className="text-gray-200 text-sm mb-1 transform transition-all duration-300 ease-out group-hover:translate-y-0">{shop.address}</p>
                  <p className="text-gray-300 text-sm transform transition-all duration-300 ease-out group-hover:translate-y-0">
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
        className={`
          relative z-10
          mt-12
          px-8
          py-3
          rounded-full
          border-2
          border-white
          text-white
          transition-all
          duration-700
          transform
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
          hover:bg-white/10
          hover:scale-105
          text-sm
          md:text-base
        `}
        style={{
          transitionDelay: '1200ms'
        }}
      >
        더보기 +
      </Link>
    </section>
  );
}