//src/app/(main)/layout.js
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileNavigation";

export default function Home({ children, h=false }) {

  return (
    <>


      
        {children}
        
      

  
         

        {/* 4) 모바일 하단 바 (fixed) */}
        <div className="block md:hidden fixed bottom-0 left-0 right-0 z-50">
          <MobileBottomNav />
        </div>
    </>
  );
}