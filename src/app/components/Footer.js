"use client";
import React from "react";
import { usePathname } from "next/navigation";
import styles from './Footer.module.scss';

export default function Footer() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  
  if (segments[0] === "messages" && segments.length > 1) {
    return null;
  }

  const hideMobileFooterRoutes = ["mypage", "all", "messages"];
  const shouldHideMobileFooter = hideMobileFooterRoutes.includes(segments[0]);

  return (
    <>
      {!shouldHideMobileFooter && (
        <div className={styles.mobileFooter}>
          <div className={styles.mobileContent}>
            <div className={styles.mobileLinks}>
              <button onClick={() => alert("개인정보취급방침 페이지로 이동")}>
                개인정보취급방침
              </button>
              <span>|</span>
              <button onClick={() => alert("서비스이용약관 페이지로 이동")}>
                서비스이용약관
              </button>
            </div>

            <div className={styles.mobileInfo}>
              <p className={styles.brand}>여기닷 ▼</p>
              <p>여기닷는 통신판매중개자로서 통신판매의 당사자가 아니며,</p>
              <p>서비스예약 이용 및 환불 등과 관련된 의무와 책임은</p>
              <p>각 서비스 제공자에게 있습니다</p>
            </div>

            <div className={styles.copyright}>
              Copyright© 여기닷 All rights reserved.
            </div>
          </div>
        </div>
      )}

      <footer className={styles.desktopFooter}>
        <div className={styles.desktopContent}>
          <div className={styles.topSection}>
            <p className={styles.copyright}>© 2025 All Rights Reserved.</p>
            
            <div className={styles.companyInfo}>
              <div className={styles.businessInfo}>
                <p>사업자명 : 여기닷</p>
                <p>대표자명 : 윤정호</p>
                <p>사업자등록번호 : 476-14-02880</p>
                <p>대표번호 : 010-2117-7392</p>
              </div>

              <div className={styles.legalInfo}>
                <p className={styles.legalTitle}>법적고지</p>
                <p>※ 여기닷은 통신판매중개자로서 거래 당사자가 아니며, 업체와 고객 간의 서비스 제공 및 이용과 관련한 책임은 해당 업체에 있습니다.</p>
                <p>※ 여기닷은 정보 중개 및 광고 서비스를 제공하며, 등록된 업체의 신뢰성 및 서비스 품질을 보장하지 않습니다. 이용 전 충분한 검토를 권장합니다.</p>
                <p>※ 사이트 내 모든 콘텐츠(텍스트, 이미지, 디자인 등)는 저작권 보호를 받으며 무단 도용을 금합니다.</p>
                <p>※ 제휴 신청은 24시간 가능합니다.</p>
              </div>
            </div>
          </div>

          <div className={styles.bottomSection}>
            <div className={styles.buttons}>
              <button className={styles.partnershipButton}>
                1:1 문의
              </button>
              <button className={styles.partnershipButton}>
                 제휴문의
              </button>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}