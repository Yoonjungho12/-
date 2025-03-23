//src/app/(main)/(homefunction)/layout.js
import NavBar from "@/components/navigation";
import MobileTopBar from "@/components/MobileBack";
import Home from "../layout";
// Tailwind 예시 폰트 (선택)
import { Geist } from "next/font/google";
const geist = Geist({ subsets: ["latin"] });

export const metadata = {
  title: "여기닷 - 여기닷",
  description: "나이트 클럽, 1인샵, 여긷잣 등의 정보를 확인하세요.",
  viewport: "initial-scale=1.0, user-scalable=no, maximum-scale=1, width=device-width",
};

export default function RootLayout({ children }) {
  return (
<>  

      <header>
        <div className="">
                <NavBar />
              </div>

        <div className="block md:hidden fixed top-0 left-0 right-0 z-50 ">
            <MobileTopBar />
        </div>
            <div className="block md:hidden fixed bottom-0 left-0 right-0 z-50">
        
        </div>
      </header>

        <main className="pt-[56px] md:pt-[116px]">
          {children}
        </main>
      

   
    </>
  );
}