// app/(main)/(homefunction)/layout.js (하위 레이아웃)

import NavBar from "@/components/navigation";
import MobileTopBar from "@/components/MobileBack";
import Footer from "@/components/Footer"; // 만약 여기에 푸터를 쓰고 싶다면 import

export const metadata = {
  title: "여기닷 - 하위 레이아웃",
  description: "나이트 클럽, 1인샵, ...",
};

export default function SubLayout({ children }) {
  return (
    <>
      {/* (A) 하위 전용 헤더 */}
      <header>
        <NavBar />
        <div className="block md:hidden fixed top-0 left-0 right-0 z-50">
          <MobileTopBar />
        </div>
        {/* 혹은 모바일 바텀 Nav 등 */}
      </header>

      {/* (B) 메인 콘텐츠 
          최상위 layout의 <main className="flex-1"> 내에 들어갈 것이므로,
          여기서는 그냥 children 출력. 
          스크롤 이슈나 헤더 높이 보정 용도로 pt-[56px] 등 사용 가능
      */}
      <main className="pt-[56px] pb-[60px] md:pb-0 md:pt-[116px] flex-1">
        {children}
      </main>

      {/* (C) 이 하위 레이아웃에서만 쓰는 Footer가 필요하면 여기에 <Footer/> 
          단, 최상위 layout에서 이미 Footer를 넣는다면 여기서 또 넣으면 중복됩니다.
          => 중복 사용은 보통 원치 않으므로, 아래는 예시로 주석. 
      */}
      <Footer />
    </>
  );
}