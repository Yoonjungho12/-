import Image from "next/image";
import Mainone from "../components/main/main1";
import RecommendedShops from "../components/main/recommendedShop";

// pages/index.js (또는 /app/(main)/page.js 등)
export default function Home() {
  return (
    <div className="container mx-auto">
      {/* 배너 래퍼. 화면 폭에 맞춰 쭉 넓어지되, 세로 높이는 적당히 확보 */}
      <div
        className="relative w-full overflow-hidden" 
        style={{ aspectRatio: "1250 / 450" }}
        // ↑ 1250x450 = 약 2.78 : 1 비율
      >
        <Image
          src="https://cdn.vipgunma.com/assets/banner/1675135222banner2.jpg"
          alt="Banner"
          fill
          // fill 사용 시, width/height 속성은 없어도 됨
          // (단, SEO 면에서는 width/height도 써주는 게 좋을 수 있음)
          style={{ objectFit: "cover" }}
        />
      </div>

      {/* 원래 있던 컴포넌트들 */}
      <Mainone />
      <RecommendedShops />
    </div>
  );
}

