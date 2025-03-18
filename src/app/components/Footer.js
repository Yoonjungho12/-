"use client";
import React from "react";

export default function Footer() {
  return (
    <footer className="mb-[60px] md:mb-0 bg-gray-100 text-gray-600 text-sm py-10">
      <div className="mx-auto max-w-7xl px-4">
        {/* 상단 정보(테라피, 힐링 - VIP인포 ... ) */}
           <p className="text-sm">© 2025 All Rights Reserved. </p>
        <div className="flex justify-between my-5">

              <div className="">
              
               <div className="text-sm">
                     <p>사이트명 : 여기닷</p>
                <p>
                  사업자등록번호 : 102-02-85309
                </p>
                <p>
                  이메일 : email@naver.cmo
                </p>
               </div>
             

                <div className="text-[13px] my-2">
                    <p>법적고지</p>
                    <p>※ 여기닷은 통신판매중개자로서 거래 당사자가 아니며, 업체와 고객 간의 서비스 제공 및 이용과 관련한 책임은 해당 업체에 있습니다.</p>
                    <p>※ 여기닷은 정보 중개 및 광고 서비스를 제공하며, 등록된 업체의 신뢰성 및 서비스 품질을 보장하지 않습니다. 이용 전 충분한 검토를 권장합니다.</p>
                    <p>※ 사이트 내 모든 콘텐츠(텍스트, 이미지, 디자인 등)는 저작권 보호를 받으며 무단 도용을 금합니다.</p>
                    <p>※ 제휴 신청은 24시간 가능합니다.</p>
                </div>

            </div>

            <div className="">
            </div>
        </div>

        {/* 소셜 아이콘 (유튜브, 페이스북, 인스타, 트위터 등) */}
        {/*  */}

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