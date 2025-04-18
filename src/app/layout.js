// app/layout.js (최상위 레이아웃)
import "./globals.css"; // Tailwind reset 등
import { Geist } from "next/font/google";
const geist = Geist({ subsets: ["latin"] });

export const metadata = {
  title: "전국 나이트, 클럽, 라운지바, 사주타로, 애견펜션까지 중개 플랫폼 - 여기닷",
  description: "나이트클럽, 클럽, 라운지바, 바, 성인용품, 눈썹문신, 사주·타로, 애견펜션까지! 라이프스타일과 유흥을 한눈에 비교하고 예약할 수 있는 중개 플랫폼, 여기닷에서 지금 원하는 서비스를 찾아보세요.",
  viewport: "initial-scale=1.0, user-scalable=no, maximum-scale=1, width=device-width, viewport-fit=cover",
  icons: {
    icon: "/logo/favicon.ico",
  },
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