import React, { useEffect, useMemo, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home,
  Heart,
  Image,
  Target,
  MapPin,
  Fingerprint,
  MessageCircle,
  Gamepad2,
} from "lucide-react";

import ErrorBoundary from "@/components/ErrorBoundary";
import { QueryProvider } from "@/components/QueryProvider";

/**
 * ✅ CLEAN Layout (NO Base44)
 * - No auth provider yet (you will plug Supabase later)
 * - No redirect loops
 * - No external backend dependency
 */

export default function Layout({ children }) {
  return (
    <QueryProvider>
      <ErrorBoundary>
        <LayoutInner>{children}</LayoutInner>
      </ErrorBoundary>
    </QueryProvider>
  );
}

function LayoutInner({ children }) {
  const location = useLocation();

  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [hasCheckedAuth, setHasCheckedAuth] = React.useState(false);

  const [overlayOpen, setOverlayOpen] = React.useState(true);
  const [overlayLabel, setOverlayLabel] = React.useState("Loading…");
  const [overlayMode, setOverlayMode] = React.useState("unlock");

  // 👉 TEMP AUTH (replace later with Supabase)
  useEffect(() => {
    const fakeAuthCheck = async () => {
      // simulate auth check
      setTimeout(() => {
        setIsAuthenticated(true); // change later
        setHasCheckedAuth(true);
      }, 500);
    };

    fakeAuthCheck();
  }, []);

  const path = (location?.pathname || "").replace(/\/+$/, "");
  const currentPage = path.split("/").filter(Boolean).slice(-1)[0] || "Home";

  // Pages without nav
  const hideNavPages = ["Onboarding", "Login", "Signup", "Consent"];
  const showBottomNav = isAuthenticated && !hideNavPages.includes(currentPage);

  // 👉 STATIC unread count (replace later with real backend)
  const unreadCount = 0;

  const navItems = [
    { name: "Home", icon: Home, page: "Home" },
    { name: "Dating", icon: Heart, page: "Dating" },
    { name: "Memories", icon: Image, page: "Memories" },
    { name: "Goals", icon: Target, page: "Goals" },
    { name: "Places", icon: MapPin, page: "Places" },
    { name: "Night In", icon: Gamepad2, page: "NightIn" },
    { name: "Chat", icon: MessageCircle, page: "Chat" },
    { name: "Verify", icon: Fingerprint, page: "VerifyStatus" },
  ];

  // Overlay effect
  useEffect(() => {
    const timer = setTimeout(() => setOverlayOpen(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (!hasCheckedAuth) return null;

  return (
    <>
      <LockOverlay open={overlayOpen} mode={overlayMode} label={overlayLabel} />

      <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-pink-50">
        {children}

        {showBottomNav && (
          <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 shadow-lg z-50">
            <div className="max-w-md mx-auto px-1">
              <div className="flex items-center justify-between py-1.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.page;

                  return (
                    <Link key={item.page} to={`/${item.page}`} className="flex-1 min-w-0">
                      <div
                        className={`flex flex-col items-center py-1.5 px-1 rounded-lg transition-all relative ${
                          isActive ? "bg-rose-50" : "hover:bg-slate-50"
                        }`}
                      >
                        <div className="relative">
                          <Icon
                            className={`w-5 h-5 ${
                              isActive ? "text-rose-500" : "text-slate-400"
                            }`}
                          />

                          {item.page === "Chat" && unreadCount > 0 && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                              <span className="text-[9px] font-bold text-white">
                                {unreadCount > 9 ? "9+" : unreadCount}
                              </span>
                            </div>
                          )}
                        </div>

                        <span
                          className={`text-[10px] mt-0.5 truncate ${
                            isActive ? "text-rose-500 font-medium" : "text-slate-400"
                          }`}
                        >
                          {item.name}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>
        )}
      </div>
    </>
  );
}

/* SAME overlay (unchanged UI) */
function LockOverlay({ open, mode = "unlock", label = "Loading…" }) {
  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${open ? "" : "hidden"} bg-black/80`}>
      <div className="text-white text-center">
        <div className="text-xl font-bold mb-2">Date-Locked</div>
        <div className="text-sm opacity-70">{label}</div>
      </div>
    </div>
  );
}
