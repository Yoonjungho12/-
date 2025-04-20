"use client";
import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (segments[0] === "messages" && segments.length > 1) {
    return null;
  }

  const hideMobileFooterRoutes = ["mypage", "all", "messages"];
  const shouldHideMobileFooter = hideMobileFooterRoutes.includes(segments[0]);

  return (
    <>
      {isMobile && !shouldHideMobileFooter && (
        <div className="block py-8 pb-[80px] bg-slate-50 text-left text-[10px] text-slate-500 relative border-t border-slate-200 md:hidden">
          <div className="px-6">
            <div className="text-slate-500 leading-[1.4] text-[10px] text-center">
              <p className="font-bold text-lg mb-6 text-slate-900">여기닷 ▼</p>
              <p className="mb-1">사업자명 : 여기닷</p>
              <p className="mb-1">대표자명 : 윤정호</p>
              <p className="mb-1">사업자등록번호 : 476-14-02880</p>
              <p className="mb-1">대표번호 : 010-2117-7392</p>
              <br />
              <p className="mb-1 mx-auto max-w-[90%]">※ 여기닷은 통신판매중개자로서 거래 당사자가 아니며, 업체와 고객 간의 서비스 제공 및 이용과 관련한 책임은 해당 업체에 있습니다.</p>
              <p className="mb-1 mx-auto max-w-[90%]">※ 여기닷은 정보 중개 및 광고 서비스를 제공하며, 등록된 업체의 신뢰성 및 서비스 품질을 보장하지 않습니다. 이용 전 충분한 검토를 권장합니다.</p>
              <p className="mb-1 mx-auto max-w-[90%]">※ 사이트 내 모든 콘텐츠(텍스트, 이미지, 디자인 등)는 저작권 보호를 받으며 무단 도용을 금합니다.</p>
              <p className="mb-1 mx-auto max-w-[90%]">※ 제휴 신청은 24시간 가능합니다.</p>
            </div>

            <div className="flex justify-center gap-6 mt-6">
              <a href="https://open.kakao.com/o/sF0jBaqh" target="_blank" rel="noopener noreferrer" className="px-6 py-2.5 rounded-full text-sm font-medium bg-white text-orange-400 border border-orange-400 flex items-center gap-1 hover:bg-orange-50">
                1:1 문의
              </a>
              <a href="https://open.kakao.com/o/sF0jBaqh" target="_blank" rel="noopener noreferrer" className="px-6 py-2.5 rounded-full text-sm font-medium bg-white text-orange-400 border border-orange-400 flex items-center gap-1 hover:bg-orange-50">
                제휴문의
              </a>
            </div>

            <div className="text-slate-400 text-[10px] mt-3 text-center">
              Copyright© 여기닷 All rights reserved.
            </div>
          </div>
        </div>
      )}

      {!isMobile && (
        <footer className="hidden bg-slate-50 text-slate-500 py-8 relative border-t border-slate-200 text-xs md:block">
          <div className="max-w-7xl mx-auto px-8">
            <div className="flex flex-col gap-6">
              <p className="text-slate-400">© 2025 All Rights Reserved.</p>

              <div className="grid grid-cols-3 gap-12 relative">
                <div className="text-slate-500 leading-[1.4] text-xs">
                  <p className="mb-1">사업자명 : 여기닷</p>
                  <p className="mb-1">대표자명 : 윤정호</p>
                  <p className="mb-1">사업자등록번호 : 476-14-02880</p>
                  <p className="mb-1">대표번호 : 010-2117-7392</p>
                </div>

                <div className="col-span-2 text-slate-500 leading-[1.4] text-xs">
                  <p className="font-semibold text-slate-900 mb-3">법적고지</p>
                  <p className="mb-1">※ 여기닷은 통신판매중개자로서 거래 당사자가 아니며, 업체와 고객 간의 서비스 제공 및 이용과 관련한 책임은 해당 업체에 있습니다.</p>
                  <p className="mb-1">※ 여기닷은 정보 중개 및 광고 서비스를 제공하며, 등록된 업체의 신뢰성 및 서비스 품질을 보장하지 않습니다. 이용 전 충분한 검토를 권장합니다.</p>
                  <p className="mb-1">※ 사이트 내 모든 콘텐츠(텍스트, 이미지, 디자인 등)는 저작권 보호를 받으며 무단 도용을 금합니다.</p>
                  <p className="mb-1">※ 제휴 신청은 24시간 가능합니다.</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-slate-200 flex justify-center gap-6">
              <div className="flex items-center gap-6">
                <a href="https://open.kakao.com/o/sF0jBaqh" target="_blank" rel="noopener noreferrer" className="px-6 py-2.5 rounded-full text-sm font-medium bg-white text-orange-400 border border-orange-400 flex items-center gap-1 hover:bg-orange-50">
                  1:1 문의
                </a>
                <a href="https://open.kakao.com/o/sF0jBaqh" target="_blank" rel="noopener noreferrer" className="px-6 py-2.5 rounded-full text-sm font-medium bg-white text-orange-400 border border-orange-400 flex items-center gap-1 hover:bg-orange-50">
                  제휴문의
                </a>
              </div>
            </div>
          </div>
        </footer>
      )}
    </>
  );
}