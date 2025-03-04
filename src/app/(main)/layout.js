// app/(main)/layout.js
import NavBar from "../components/navigation";

// ★ Portal을 담을 DOM
export default function HomeLayout({ children }) {
  return (
    <html lang="ko">
      <body>
        <NavBar />
        <div className="container mx-auto">{children}</div>

        {/* Portal DOM (팝업/오버레이가 들어갈 공간) */}
        <div id="portal-root"></div>
      </body>
    </html>
  );
}