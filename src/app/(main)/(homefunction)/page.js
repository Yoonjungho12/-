//src/app/%28main%29/%28homefunction%29/page.js

import RecommendedShopsServer from "@/components/main/RecommendedShopsServer";
import NewArrivalsSection from "@/components/main/newbie";
import MainoneServer from "@/components/main/MainoneServer";
import BannerClient from "@/components/main/BannerClient";

export default function Home() {
  return (
    <>
    <div className="mt-15 md:mt-0">

      <BannerClient />
    </div>
      
      <div className="container mx-auto pt-15 md:pt-[30px]">
        <MainoneServer />
        <RecommendedShopsServer />
        <NewArrivalsSection />
      </div>
    </>
  );
}

export const dynamic = "force-dynamic"; 