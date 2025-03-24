"use client";
import React from "react";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  // ─────────────────────────────────────────────
  // (A) /messages/[something] 라우팅이면 null
  // ─────────────────────────────────────────────
  // 예: pathname = "/messages/abc123"
  //     → segments = ["messages","abc123"]
  const segments = pathname.split("/").filter(Boolean);
  if (segments[0] === "messages" && segments.length > 1) {
    return null; // /messages/동적 라우팅일 때 푸터 표시 안 함
  }

  return (
    <footer className="mb-[60px] md:mb-0 bg-gray-100 text-gray-600 text-sm py-10">
      <div className="mx-auto max-w-7xl px-4">
        {/* 상단 정보 */}
        <p className="text-sm">© 2025 All Rights Reserved.</p>
        <div className="flex justify-between my-5">
          <div>
            <div className="text-sm">
              <p>사이트명 : 여기닷</p>
              <p>사업자등록번호 : 102-02-85309</p>
              <p>이메일 : email@naver.com</p>
            </div>

            <div className="text-[13px] my-2">
              <p>법적고지</p>
              <p>※ 여기닷은 통신판매중개자로서 거래 당사자가 아니며, ...</p>
              <p>※ 등록된 업체의 신뢰성 및 품질을 보장하지 않습니다...</p>
              <p>※ 사이트 내 모든 콘텐츠 무단 도용 금지...</p>
            </div>
          </div>

          <div>{/* 필요하다면 다른 영역 */}</div>
        </div>

        {/* “1:1 문의”, “제휴문의” 버튼 */}
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
  );
}