"use client";
import React from "react";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  // 1) /messages/[something] 라우팅이면 Footer 표시 안 함
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] === "messages" && segments.length > 1) {
    return null;
  }

  // 2) /mypage, /all 라우팅이면 "모바일 푸터"만 숨기기
  //    => PC 푸터는 보임
  const hideMobileFooterRoutes = ["mypage", "all","messages"];
  const shouldHideMobileFooter = hideMobileFooterRoutes.includes(segments[0]);

  return (
    <>
      {/* (A) 모바일용 (md:hidden)
          - 만약 shouldHideMobileFooter가 true라면 표시 안 함
      */}
      {!shouldHideMobileFooter && (
        <div className="block md:hidden pb-[100px] py-6 bg-gray-50 text-center text-gray-700 text-sm">
          <div className="px-4">
            {/* 상단 (개인정보취급방침, 서비스이용약관) */}
            <div className="mb-3 space-x-2">
              <button
                onClick={() => alert("개인정보취급방침 페이지로 이동")}
                className="text-gray-700 underline"
              >
                개인정보취급방침
              </button>
              <span>|</span>
              <button
                onClick={() => alert("서비스이용약관 페이지로 이동")}
                className="text-gray-700 underline"
              >
                서비스이용약관
              </button>
            </div>

            {/* “여기닷” 문구 */}
            <div className="text-gray-700 mb-2">
              <p className="font-bold">여기닷 ▼</p>
              <p>여기닷는 통신판매중개자로서 통신판매의 당사자가 아니며,</p>
              <p>서비스예약 이용 및 환불 등과 관련된 의무와 책임은</p>
              <p>각 서비스 제공자에게 있습니다</p>
            </div>

            {/* Copyright */}
            <div className="text-gray-500">
              Copyright© 여기닷 All rights reserved.
            </div>
          </div>
        </div>
      )}

      {/* (B) PC용 (hidden md:block) */}
      <footer className="hidden md:block mb-[60px] md:mb-0 bg-gray-100 text-gray-600 text-sm py-10">
        <div className="mx-auto max-w-7xl px-4">
          {/* 상단 정보 (기존 코드 그대로) */}
          <p className="text-sm">© 2025 All Rights Reserved.</p>
          <div className="flex justify-between my-5">
            <div>
             

              <div className="flex justify-between my-5">
                <div>
             

                  <div>
              <div className="text-sm">
                <p>사업자명 : 여기닷</p>
                <p>대표자명 : 윤정호</p>
                <p>사업자등록번호 : 476-14-02880</p>
                <p>대표번호 : 010-2117-7392</p>
              </div>

              <div className="text-[13px] my-2">
                <p>법적고지</p>
                <p>※ 여기닷은 통신판매중개자로서 거래 당사자가 아니며, ...</p>
                <p>※ 등록된 업체의 신뢰성 및 품질을 보장하지 않습니다...</p>
                <p>※ 사이트 내 모든 콘텐츠 무단 도용 금지...</p>
              </div>
            </div>
                </div>
              </div>
            </div>
            <div>{/* 필요하면 다른 영역 */}</div>
          </div>

          {/* “1:1 문의”, “제휴문의” 버튼 (기존 코드) */}
          <div className="mt-0 flex space-x-2">
            <button className="cursor-pointer rounded bg-gray-500 px-3 py-2 text-white hover:bg-gray-600">
              1:1 문의
            </button>
            <button className="cursor-pointer rounded bg-gray-500 px-3 py-2 text-white hover:bg-gray-600">
              제휴문의
            </button>
          </div>
        </div>
      </footer>
    </>
  );
}