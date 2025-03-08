import NavBar from "@/components/navigation";
import MobileTopBar from "@/components/MobileBack";

export default function Layout({ children }) {
  return (
    <>
      {/* 데스크톱 전용 NavBar */}
      <div className="hidden md:block">
        <NavBar />
      </div>

      {/* 
        여기서 모바일 전용으로 margin-top 50px (또는 mt-12 = 3rem) 
        md:mt-0 => 데스크톱에선 마진 제거 
      */}
      <div className="container mx-auto mt-[50px] md:mt-0">
        {children}
      </div>

      {/* 모바일 전용 TopBar */}
      <div className="block md:hidden">
        <MobileTopBar />
      </div>
    </>
  );
}