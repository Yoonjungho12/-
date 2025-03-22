// src/app/layout.js
import "./globals.css";

import { Geist } from "next/font/google"; 

export const metadata = {
  title: "여기닷",
  description: "여기닷 등의 정보를 확인하세요.",
  viewport: "initial-scale=1.0, user-scalable=no, maximum-scale=1, width=device-width",
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

  
      </body>
    </html>
  );
}