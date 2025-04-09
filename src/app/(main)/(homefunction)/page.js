//src/app/%28main%29/%28homefunction%29/page.js

import Image from "next/image";
import RecommendedShopsServer from "@/components/main/RecommendedShopsServer";
import NewArrivalsSection from "@/components/main/newbie";
import MainoneServer from "@/components/main/MainoneServer";
import RootLayout from "./layout";

export default function Home() {
  return (
    <>
      <div className="hidden md:block w-full relative">
        <Image
          src="/logo/banner1.gif"
          alt="Banner-Desktop"
          width={1920}
          height={550}
          priority
          className="w-full h-auto"
        />
      </div>
      
      <div className="container mx-auto pt-15 md:pt-[24px]">
        <div
          className="relative w-full overflow-hidden md:hidden"
          style={{ aspectRatio: "1250 / 450" }}
        >
          <Image
            src="/logo/banner1.gif"
            alt="Banner-Mobile"
            fill
            style={{ objectFit: "cover" }}
          />
        </div>

        <MainoneServer />
        <RecommendedShopsServer />
        <NewArrivalsSection />
      </div>
    </>
  );
}

export const dynamic = "force-dynamic"; 