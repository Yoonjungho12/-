import Image from "next/image";
import NavBar from "../components/navigation";
export default function Home({ children }) {
  return (
    <>

     

 
           <NavBar/>
      <div className="container mx-auto">
        {children}
        
      </div>
   
    </>
  );
}
