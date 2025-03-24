// app/layout.js (최상위 레이아웃)
import "./globals.css"; // Tailwind reset 등
import { Geist } from "next/font/google";
const geist = Geist({ subsets: ["latin"] });

export const metadata = {
  title: "여기닷",
  description: "여기닷 info..",
  viewport: "initial-scale=1.0, user-scalable=no, maximum-scale=1, width=device-width, viewport-fit=cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko" className="h-full">
      <head>
        <meta name="viewport" content={metadata.viewport} />
      </head>

      {/* 
        1) body: min-h-screen, flex, flex-col
        2) <main className="flex-1"> → 길이가 짧아도 푸터는 아래로.
      */}
      <body className={`${geist.className} min-h-screen flex flex-col bg-white`}>
        {/* 전역 헤더를 원하시면 여기 작성 가능 
            <NavBar /> 등 */}

   
          {/* 하위 레이아웃 + 페이지 출력 */}
          {children}


        {/* 전역 푸터를 항상 맨 아래에 두고 싶다면 여기 작성 */}
        {/* <Footer /> */}
      </body>
    </html>
  );
}