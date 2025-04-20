"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";

export default function NewArrivalsSectionClient({ shopCards }) {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const cardsRef = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target === sectionRef.current) {
              entry.target.classList.add("animate-fadeIn");
            } else if (entry.target === titleRef.current) {
              entry.target.classList.add("animate-slideIn");
            } else if (entry.target.classList.contains("card")) {
              entry.target.classList.add("animate-slideUp");
            }
          }
        });
      },
      { 
        threshold: 0.1,
        root: null,
        rootMargin: "0px 0px -50px 0px"
      }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    if (titleRef.current) observer.observe(titleRef.current);
    cardsRef.current.forEach((card) => {
      if (card) observer.observe(card);
    });

    return () => observer.disconnect();
  }, [shopCards]);

  if (!shopCards || shopCards.length === 0) {
    return (
      <section className="w-full bg-gradient-to-b from-orange-50/50 to-white py-16">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="mb-2 text-2xl font-bold text-gray-800">
            신규 입점 했어요
          </h2>
          <p className="text-gray-500">데이터가 없습니다.</p>
        </div>
      </section>
    );
  }

  return (
    <section 
      ref={sectionRef}
      className="w-full bg-gradient-to-b from-orange-50/50 to-white py-16 flex flex-col items-center opacity-0"
    >
      <div className="w-full px-4">
        <div ref={titleRef} className="max-w-3xl mx-auto text-center mb-12 opacity-0">
          <h2 className="mb-4 text-3xl md:text-4xl font-bold text-gray-800">
            신규 제휴 파트너
          </h2>
          <p className="text-lg text-gray-600">
            여기닷에 등록한 신규 제휴사를 만나보세요!
          </p>
        </div>

        <div className="max-w-7xl mx-auto hide-scrollbar">
          {/* 모바일 뷰 */}
          <div className="block sm:hidden px-2">
            <div
              className="flex overflow-x-auto gap-6 snap-x snap-mandatory hide-scrollbar"
              style={{ scrollBehavior: "smooth" }}
            >
              {shopCards.map((shop, index) => (
                <div
                  key={shop.id}
                  ref={(el) => (cardsRef.current[index] = el)}
                className="card shrink-0 w-[270px] snap-start overflow-hidden rounded-xl border border-gray-200/50 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1"
                >
                  <Link href={`/board/details/${shop.id}`}>
                    <div className="w-[240px] h-[130px] mx-auto mt-3 overflow-hidden rounded-xl flex relative group">
                      <Image
                        src={shop.imgSrc}
                        alt={shop.title}
                        width={240}
                        height={130}
                        style={{ objectFit: "cover" }}
                        quality={70}
                        sizes="240px"
                        className="group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    </div>

                    <div className="p-4 w-[260px] box-border">
                      <h3 className="mb-1 text-base font-semibold text-gray-800 group-hover:text-orange-500 transition-colors duration-300">
                        {shop.company_name}
                      </h3>
                      <p className="text-sm text-gray-600">{shop.address}</p>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* 데스크톱 뷰 */}
          <div className="hidden sm:grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {shopCards.map((shop, index) => (
              <div
                key={shop.id}
                ref={(el) => (cardsRef.current[index] = el)}
                className="card block overflow-hidden rounded-xl border border-gray-200/50 bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1"
              >
                <Link href={`/board/details/${shop.id}`}>
                  <div className="h-[153px] w-[263px] overflow-hidden mx-auto mt-3 rounded-xl flex relative group">
                    <Image
                      src={shop.imgSrc}
                      alt={shop.title}
                      width={263}
                      height={153}
                      style={{ objectFit: "cover" }}
                      quality={70}
                      className="group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  </div>

                  <div className="p-4">
                    <h3 className="mb-1 text-base font-semibold text-gray-800 group-hover:text-orange-500 transition-colors duration-300">
                      {shop.company_name}
                    </h3>
                    <p className="text-sm text-gray-600">{shop.address}</p>
                  </div>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Link
        href={"/board/전체/전체/전체"}
        className="mt-16 rounded-full border border-gray-300 px-8 py-3 text-gray-600 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-500 transition-all duration-300 font-medium"
      >
        더보기 +
      </Link>
    </section>
  );
} 