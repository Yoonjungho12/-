import Image from "next/image";
import Mainone from "../components/main/main1";
import RecommendedShops from "../components/main/recommendedShop";

export default function Home() {
  return (
    <>
  
     
      <div className="container mx-auto">
       

      <Image
        src="https://cdn.vipgunma.com/assets/banner/1675135222banner2.jpg"
        alt="Banner"
        width={1250}
        height={450}
      />
      <Mainone/>
      <RecommendedShops/>
      </div>
    </>
  );
}
