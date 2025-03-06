// src/app/layout.js (또는 /app/(main)/layout.js 등, 루트 레이아웃 위치)
// ESM 형식
import "./globals.css";
import NavBar from "./components/navigation";

// (선택) 폰트 불러오기
import { Geist, Geist_Mono } from "next/font/google";

// **metadata**를 export 하면 Next.js가 head를 자동 생성
export const metadata = {
  title: "건마 - 스웨디시 1인샵 정보",
  description: "스웨디시, 1인샵, 건마 등의 정보를 확인하세요.",
  keywords: ["스웨디시", "마사지", "1인샵", "건마", "SEO 테스트"],
  // (옵션) Open Graph / Twitter 등
  openGraph: {
    title: "예시 사이트 - OG 타이틀",
    description: "OG 설명, 스웨디시 관련",
    url: "https://예시사이트주소.com",
    siteName: "예시 사이트명",
  },
  // ... 더 다양한 옵션 가능
};

// 폰트 사용 (예시)
const geist = Geist({ subsets: ["latin"] }); // 필요하다면

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body className={geist.className}>
        {children}
      </body>
    </html>
  );
}