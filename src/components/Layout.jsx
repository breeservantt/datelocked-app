import { useLocation } from "react-router-dom";

import BottomNav from "./BottomNav";
import { useLocation } from "react-router-dom";

export default function Layout({ children }) {
  const location = useLocation();

  const hideBottomNavRoutes = [
    "/",
    "/splash",
    "/login",
  ];

  const shouldHideBottomNav =
    hideBottomNavRoutes.includes(location.pathname);

  return (
    <>
      <div className="min-h-screen overflow-x-hidden bg-[#f3edf1] pb-24">
        {children}
      </div>

      {!shouldHideBottomNav && <BottomNav />}
    </>
  );
}