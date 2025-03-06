import Image from "next/image";

export default function Home() {
  return (
    <div className="container mx-auto">
      <Image
        src="https://cdn.vipgunma.com/assets/banner/1675135222banner2.jpg"
        alt="Banner"
        width={1250}
        height={450}
        style={{ width: "100%", height: "auto" }}
        sizes="(max-width: 768px) 100vw, 
               (max-width: 1200px) 75vw, 
               1250px"
      />
      <Mainone/>
      <RecommendedShops/>
    </div>
  );
}


