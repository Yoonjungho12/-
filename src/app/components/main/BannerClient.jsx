"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function BannerClient() {
  const [currentBanner, setCurrentBanner] = useState(2);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner(prev => prev === 1 ? 2 : 1);
    }, 9000); // 9초마다 전환

    return () => clearInterval(timer);
  }, []);

  return (
    <>
      {/* 1) 데스크톱 배너 */}
      <div className="hidden md:block">
        <div className="w-full h-[400px] relative">
          {currentBanner === 1 ? (
            <Image
              src="/logo/banner1.gif"
              alt="배너1"
              fill
              className="object-cover"
              priority
            />
          ) : (
            <Image
              src="/logo/banner2.gif"
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
        <div className="w-full h-[200px] relative">
          {currentBanner === 1 ? (
            <Image
              src="/logo/banner1.gif"
              alt="배너1"
              fill
              className="object-cover"
              priority
            />
          ) : (
            <Image
              src="/logo/banner2.gif"
              alt="배너2"
              fill
              className="object-cover"
              priority
            />
          )}
        </div>
      </div>
    </>
  );
} 