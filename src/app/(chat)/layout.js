//src/app/%28chat%29/layout.js
import MobileTopBar from "@/components/MobileBack";
import NavBar from "@/components/navigation";
// Tailwind 예시 폰트 (선택)
import { Geist } from "next/font/google";
const geist = Geist({ subsets: ["latin"] });

export const metadata = {
  title: "여기닷 - 여기닷",
  description: "나이트 클럽, 1인샵, 여긷잣 등의 정보를 확인하세요.",
};

export default function RootLayout({ children }) {
  return (
<>  
    <div className="h-screen flex flex-col">
      <header>
        <div className="hidden md:block">
               <NavBar />
              </div>

        <div className="block md:hidden fixed top-0 left-0 right-0 z-50">
          <MobileTopBar />
        </div>
            <div className="block md:hidden fixed bottom-0 left-0 right-0 z-50">
        
        </div>
      </header>

        <main className="pt-[50px] md:pt-0">
          {children}
        </main>

      </div>

   
    </>
  );
}