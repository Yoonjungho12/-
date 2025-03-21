import NavBar from "@/components/navigation";
import MobileTopBar from "@/components/MobileBack";

export default function Home({ children }) {
  return (
    <>  
 <NavBar />
       
        
      <div className="container mx-auto mt-27">
        {children}
      </div>


    </>
  );
}