import NavBar from "../components/navigation";
import MobileBottomNav from "@/components/MobileNavigation";

export default function Home({ children }) {
  return (
    <>
      <NavBar />
      <div className="container mx-auto">
        {children}
      </div>
      {/* 
        Tailwind에서 "hidden md:block"은
        - md 이상(768px~)에서는 보이고
        - 그 미만에서는 숨기는 반대 식이므로,
        모바일에서만 보이게 하려면 "block md:hidden"
      */}
      <div className="block md:hidden">
        <MobileBottomNav />
      </div>
    </>
  );
}