import NavBar from "@/components/navigation";
import MobileTopBar from "@/components/MobileBack";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileNavigation";
export default function Home({ children }) {
  return (
    <>


      <div className="container mx-auto">
        {children}
      </div>
      
   
          <Footer />

        {/* 4) 모바일 하단 바 (fixed) */}
        <div className="block md:hidden fixed bottom-0 left-0 right-0 z-50">
          <MobileBottomNav />
        </div>
    </>
  );
}