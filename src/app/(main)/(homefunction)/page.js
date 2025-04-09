//src/app/%28main%29/%28homefunction%29/page.js

"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import RecommendedShopsServer from "@/components/main/RecommendedShopsServer";
import NewArrivalsSection from "@/components/main/newbie";
import MainoneServer from "@/components/main/MainoneServer";

export default function Home() {
  const [currentBanner, setCurrentBanner] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner(prev => prev === 1 ? 2 : 1);
    }, 7000); // 7초마다 전환

    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {/* 1) 데스크톱 배너 */}
      <div className="hidden md:block">
        <div className="w-full h-[600px] relative">
          {currentBanner === 1 ? (
            <Image
              src="/banner/banner1.jpeg"
              alt="배너1"
              fill
              className="object-cover"
              priority
            />
          ) : (
            <Image
              src="/banner/banner2.jpeg"
              alt="배너2"
              fill
              className="object-cover"
              priority
            />
          )}
        </div>
      </div>

      {/* 2) 모바일 배너 */}
      <div className="block md:hidden">
        <div className="w-full h-[300px] relative">
          {currentBanner === 1 ? (
            <Image
              src="/banner/banner1.jpeg"
              alt="배너1"
              fill
              className="object-cover"
              priority
            />
          ) : (
            <Image
              src="/banner/banner2.jpeg"
              alt="배너2"
              fill
              className="object-cover"
              priority
            />
          )}
        </div>
      </div>

      <div className="container mx-auto pt-15 md:pt-[30px]">
        <MainoneServer />
        <RecommendedShopsServer />
        <NewArrivalsSection />
      </div>
    </>
  );
}

export const dynamic = "force-dynamic"; 