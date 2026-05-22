import { useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";

export default function Layout({ children }) {
  const location = useLocation();

  const hideBottomNavRoutes = [
    "/",
    "/splash",
    "/login",
    "/onboarding",
    "/terms",
    "/privacy",
    "/refunds",
    "/security",
  ];

  const pathname = location.pathname.toLowerCase();

  const shouldHideBottomNav =
    pathname === "/" ||
    hideBottomNavRoutes
      .filter((route) => route !== "/")
      .some((route) => pathname.startsWith(route));

  return (
    <>
      <div className="min-h-screen overflow-x-hidden bg-[#f3edf1] pb-24">
        {children}
      </div>

      {!shouldHideBottomNav && <BottomNav />}
    </>
  );
}