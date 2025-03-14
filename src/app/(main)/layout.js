import NavBar from "@/components/navigation";
import MobileTopBar from "@/components/MobileBack";
import Footer from "@/components/Footer";
export default function Home({ children }) {
  return (
    <>


      <div className="container mx-auto">
        {children}
      </div>
      
   

    </>
  );
}