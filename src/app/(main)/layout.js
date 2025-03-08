import NavBar from "@/components/navigation";
import MobileTopBar from "@/components/MobileBack";

export default function Home({ children }) {
  return (
    <>
     
      <div className="container mx-auto">
        {children}
      </div>
      

    </>
  );
}