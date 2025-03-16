// src/app/layout.js
import "./globals.css";
import MobileBottomNav from "./components/MobileNavigation";
import Footer from "@/components/Footer";
import { Geist } from "next/font/google";

export const metadata = {
  title: "여기닷",
  description: "스웨디시, 1인샵, 여기닷 등의 정보를 확인하세요.",
};

const geist = Geist({ subsets: ["latin"] });

// Server Component
export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      {/* 1) html, body 높이 채우고, flex 컨테이너로 만듦 */}
      <body className={`${geist.className} min-h-screen flex flex-col`}>
        
        {/* 2) 콘텐츠 영역: flex-1 */}
        <div className="flex-1">
          {children}
        </div>

        {/* 3) 푸터: children 아래에 고정적으로 위치 */}
        <Footer />

        {/* 4) 모바일 하단 바 (fixed) */}
        <div className="block md:hidden fixed bottom-0 left-0 right-0 z-50">
          <MobileBottomNav />
        </div>
      </body>
    </html>
  );
}