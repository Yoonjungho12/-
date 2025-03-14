
import NavBar from "@/components/navigation";
import MobileTopBar from "@/components/MobileBack";
import MobileBottomNav from "@/components/MobileNavigation";

// Tailwind 예시 폰트 (선택)
import { Geist } from "next/font/google";
const geist = Geist({ subsets: ["latin"] });

export const metadata = {
  title: "건마 - 스웨디시 1인샵 정보",
  description: "스웨디시, 1인샵, 건마 등의 정보를 확인하세요.",
};

export default function RootLayout({ children }) {
  return (
<>  

      <header>
        <div className="hidden md:block">
                <NavBar />
              </div>

              {/* 
                (B) 모바일 TopBar (fixed)
                - block md:hidden => 모바일 전용
                - fixed top-0 => 화면 상단 고정
                - z-50 => 최상위 레벨
        */}
        <div className="block md:hidden fixed top-0 left-0 right-0 z-50">
          <MobileTopBar />
        </div>
            <div className="block md:hidden fixed bottom-0 left-0 right-0 z-50">
          <MobileBottomNav />
        </div>
      </header>
      

        {/* 
          (C) 본문
          - 모바일에서 상단바 높이만큼 패딩: pt-[50px]
          - 데스크톱에선 pt-0
          - 만약 하단 바도 고정이면 pb-[50px] 등 추가
        */}
        <main className="pt-[50px] md:pt-0">
          {children}
        </main>

        {/* 
          (D) 모바일 하단 Nav (fixed)
          - block md:hidden => 모바일 전용
          - bottom-0 => 화면 하단 고정
        */}
    
    </>
  );
}