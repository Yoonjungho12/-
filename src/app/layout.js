import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import NavBar from "./components/navigation";


export default function RootLayout({ children }) {
  return (
    <>
    <html>
    <body>
       {children}
      
    </body>



    </html>

   
    </>


  );
}
