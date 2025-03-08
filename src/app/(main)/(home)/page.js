import Image from "next/image";
import RecommendedShopsServer from "@/components/main/RecommendedShopsServer";
import NewArrivalsSection from "@/components/main/newbie";
import Footer from "@/components/Footer";
import MainoneServer from "@/components/main/MainoneServer";
// import RecommendedShops from "../components/main/recommendedShop";


export default function Home() {
  return (
    <>
    <div className="container mx-auto">
      <div
        className="relative w-full overflow-hidden md:hidden"
        style={{ aspectRatio: "1250 / 450" }}
      >
        <Image
          src="https://cdn.vipgunma.com/assets/banner/1675135222banner2.jpg"
          alt="Banner-Mobile"
          fill
          style={{ objectFit: "cover" }}
        />
      </div>
      <div className="hidden md:block">
        <Image
          src="https://cdn.vipgunma.com/assets/banner/1675135222banner2.jpg"
          alt="Banner-Desktop"
          width={1250}
          height={450}
          style={{ width: "100%", height: "auto" }}
        />
      </div>

     <MainoneServer />
     <RecommendedShopsServer />
      <NewArrivalsSection />

    </div>
          <Footer/>
          </>
  );
}