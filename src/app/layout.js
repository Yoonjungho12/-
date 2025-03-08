// src/app/layout.js
import "./globals.css";
import MobileBottomNav from "./components/MobileNavigation";
import MobileTopBar from "./components/MobileBack";
// (선택) 폰트
import { Geist } from "next/font/google";

export const metadata = {
  title: "건마 - 스웨디시 1인샵 정보",
  description: "스웨디시, 1인샵, 건마 등의 정보를 확인하세요.",
};

const geist = Geist({ subsets: ["latin"] });

// Server Component (기본)
export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className={`${geist.className} min-h-screen`}>
        {/* (1) 모바일 상단 바 (fixed) */}
        <div className="block md:hidden fixed top-0 left-0 right-0 z-50">
          <MobileTopBar />
        </div>

        {/* 
          (2) 본문: 모바일에서 상단바+하단바 공간을 확보
          - pb-[60px]: 하단 Nav 높이만큼 패딩
          - pt-[56px]: 상단바 높이만큼 패딩 (예: 56px)
          - md:pt-0, md:pb-0 → 데스크톱에서는 패딩 없앰
        */}
        <main className="pt-[56px] pb-[60px] md:pt-0 md:pb-0">
          {children}
        </main>

        {/* (3) 모바일 하단 바 (fixed) */}
        <div className="block md:hidden fixed bottom-0 left-0 right-0 z-50">
          <MobileBottomNav />
        </div>
      </body>
    </html>
  );
}