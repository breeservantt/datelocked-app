import React, { useEffect, useMemo, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
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
import { useQuery } from "@tanstack/react-query";

function LockOverlay({ open, mode = "unlock", label = "Unlocking Date-Locked…" }) {
  return (
    <div
      className={`dl-overlay ${open ? "dl-overlay--open" : ""}`}
      aria-hidden={!open}
    >
      <div className="dl-overlay__card">
        <div className="dl-logo">
          <div className={`dl-lock ${mode === "lock" ? "dl-lock--locked" : "dl-lock--unlocking"}`}>
            <div className="dl-lock__shackle" />
            <div className="dl-lock__body">
              <div className="dl-lock__keyhole" />
            </div>

          </div>
          <div className="dl-brand">
            <div className="dl-brand__name">Date-Locked</div>
            <div className="dl-brand__tag">{label}</div>
          </div>
        </div>
      </div>

      <style>{`
        .dl-overlay{
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: none;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background: radial-gradient(1200px 600px at 20% 10%, rgba(255,255,255,0.08), transparent 55%),
                      radial-gradient(900px 500px at 80% 90%, rgba(255,255,255,0.06), transparent 55%),
                      rgba(10, 12, 16, 0.92);
          backdrop-filter: blur(10px);
        }
        .dl-overlay--open{ display: flex; }

        .dl-overlay__card{
          width: min(520px, 100%);
          border-radius: 18px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.10);
          box-shadow: 0 20px 60px rgba(0,0,0,0.45);
          padding: 22px 18px;
        }

        .dl-logo{
          display: flex;
          align-items: center;
          gap: 14px;
        }

        .dl-brand__name{
          font-size: 18px;
          font-weight: 800;
          letter-spacing: 0.2px;
          color: rgba(255,255,255,0.95);
          line-height: 1.1;
        }
        .dl-brand__tag{
          margin-top: 4px;
          font-size: 13px;
          color: rgba(255,255,255,0.70);
        }

        .dl-lock{
          position: relative;
          width: 64px;
          height: 64px;
          flex: 0 0 auto;
          transform: translateZ(0);
        }
        .dl-lock__shackle{
          position: absolute;
          left: 50%;
          top: 4px;
          width: 38px;
          height: 30px;
          transform: translateX(-50%);
          border: 6px solid rgba(255,255,255,0.88);
          border-bottom: none;
          border-top-left-radius: 22px;
          border-top-right-radius: 22px;
          opacity: 0.95;
          box-shadow: 0 6px 18px rgba(0,0,0,0.25);
        }
        .dl-lock__body{
          position: absolute;
          left: 50%;
          top: 26px;
          width: 44px;
          height: 34px;
          transform: translateX(-50%);
          border-radius: 12px;
          background: rgba(255,255,255,0.88);
          box-shadow: 0 10px 20px rgba(0,0,0,0.35);
        }
        .dl-lock__keyhole{
          position: absolute;
          left: 50%;
          top: 55%;
          width: 8px;
          height: 8px;
          transform: translate(-50%, -50%);
          border-radius: 999px;
          background: rgba(10, 12, 16, 0.65);
        }
        .dl-lock__keyhole::after{
          content: "";
          position: absolute;
          left: 50%;
          top: 100%;
          width: 3px;
          height: 8px;
          transform: translateX(-50%);
          border-radius: 999px;
          background: rgba(10, 12, 16, 0.65);
        }




        @keyframes dlShacklePop {
          0%   { transform: translateX(-50%) translateY(0px); }
          55%  { transform: translateX(-50%) translateY(0px); }
          75%  { transform: translateX(-50%) translateY(-8px); }
          100% { transform: translateX(-50%) translateY(-8px); }
        }
        @keyframes dlOverlayFadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes dlOverlayFadeOut {
          0% { opacity: 1; }
          100% { opacity: 0; }
        }

        .dl-overlay--open{ animation: dlOverlayFadeIn 140ms ease-out; }
        .dl-overlay--closing{ animation: dlOverlayFadeOut 180ms ease-in; }


        .dl-lock--unlocking .dl-lock__shackle{
          animation: dlShacklePop 980ms ease-in-out forwards;
        }

        @media (prefers-reduced-motion: reduce){
          .dl-lock--unlocking .dl-lock__shackle,
          .dl-overlay--open{
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * ✅ Base44-safe Layout
 * - Keeps ONE default export named Layout (common builder expectation)
 * - Wraps QueryProvider BEFORE anything uses useQuery
 * - Prevents redirect loops inside Base44 editor (/editor, /builder, /admin)
 * - Avoids duplicate declarations (including isEditor)
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

  const [user, setUser] = React.useState(null);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [hasCheckedAuth, setHasCheckedAuth] = React.useState(false);

  const [overlayOpen, setOverlayOpen] = React.useState(true);
  const [overlayLabel, setOverlayLabel] = React.useState("Unlocking Date-Locked…");
  const [overlayMode, setOverlayMode] = React.useState("unlock");
  const authedRef = useRef(false);

  // ✅ Editor/builder protection (prevents Base44 UI being redirected)
  const isEditor =
    typeof window !== "undefined" &&
    (window.location.pathname.includes("/editor") ||
      window.location.pathname.includes("/builder") ||
      window.location.pathname.includes("/admin"));

  // ✅ More reliable current page name
  const path = (location?.pathname || "").replace(/\/+$/, "");
  const currentPage = path.split("/").filter(Boolean).slice(-1)[0] || "Home";

  // ✅ Pages that must NOT trigger redirects (pre-auth pages)
  const publicPages = ["Onboarding", "Login", "Signup", "Consent"];
  const isPublicPage = publicPages.includes(currentPage);

  const isAuthRoute = useMemo(() => {
    const p = location.pathname || "";
    return p.includes("/login") || p.includes("/auth") || p.includes("/Consent") || p.includes("/Onboarding");
  }, [location.pathname]);

  // ✅ Unread messages (safe + only when logged in)
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ["unreadMessages", user?.couple_profile_id],
    queryFn: async () => {
      if (!user?.couple_profile_id || !user?.email) return 0;

      const messages = await base44.entities.Message.filter({
        couple_profile_id: user.couple_profile_id,
        read: false,
      });

      return messages.filter((m) => m.sender_email !== user.email).length;
    },
    enabled: !!user?.couple_profile_id && !!user?.email && isAuthenticated,
    refetchInterval: 10000,
  });

  const checkAuth = async () => {
    try {
      const authenticated = await base44.auth.isAuthenticated();

      if (!authenticated) {
        setIsAuthenticated(false);

        // ✅ Never redirect Base44 editor/builder routes
        if (!isEditor && !isPublicPage) {
          base44.auth.redirectToLogin(window.location.pathname);
        }
        return false;
      }

      setIsAuthenticated(true);

      const currentUser = await base44.auth.me();

      // deactivated account
      if (currentUser?.account_status === "deactivated") {
        await base44.auth.logout();
        alert(
          "Your account has been permanently deactivated. You can no longer access Date-Locked."
        );
        return false;
      }

      // Age verification
      if (currentUser?.date_of_birth) {
        const birthDate = new Date(currentUser.date_of_birth);
        const today = new Date();

        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }

        if (age < 18) {
          await base44.auth.logout();
          alert("You must be 18 or older to use Date-Locked");
          return false;
        }
      }

      setUser(currentUser);
      return true;
    } catch (error) {
      console.error("Auth check failed:", error);
      setIsAuthenticated(false);

      // ✅ Avoid redirect loops in Base44 editor
      if (!isEditor && !isPublicPage) {
        base44.auth.redirectToLogin(window.location.pathname);
      }
      return false;
    }
  };

  // Show overlay on first load - but NOT on public pages
  useEffect(() => {
    const publicPages = ["Onboarding", "Login", "Signup", "Consent"];
    const path = (location?.pathname || "").replace(/\/+$/, "");
    const currentPage = path.split("/").filter(Boolean).slice(-1)[0] || "Home";
    const isPublicPage = publicPages.includes(currentPage);
    
    if (isPublicPage) {
      setOverlayOpen(false);
      return;
    }
    
    const t = setTimeout(() => setOverlayOpen(false), 1100);
    return () => clearTimeout(t);
  }, [location?.pathname]);

  // Show overlay after successful login - but NOT on public pages
  useEffect(() => {
    let mounted = true;

    const publicPages = ["Onboarding", "Login", "Signup", "Consent"];
    const path = (location?.pathname || "").replace(/\/+$/, "");
    const currentPage = path.split("/").filter(Boolean).slice(-1)[0] || "Home";
    const isPublicPage = publicPages.includes(currentPage);
    
    if (isPublicPage) {
      return;
    }

    const checkPostAuth = async () => {
      try {
        await base44.auth.me();
        if (!mounted) return;

        if (!authedRef.current) {
          authedRef.current = true;
          setOverlayMode("unlock");
          setOverlayLabel("Welcome back — unlocking…");
          setOverlayOpen(true);
          setTimeout(() => {
            if (mounted) setOverlayOpen(false);
          }, 900);
        }
      } catch {
        authedRef.current = false;
      }
    };

    checkPostAuth();
    return () => { mounted = false; };
  }, [location.pathname]);



  React.useEffect(() => {
    // ✅ On public pages, do not redirect or auth-loop
    if (isPublicPage) {
      setHasCheckedAuth(true);
      return;
    }

    (async () => {
      const ok = await checkAuth();
      setHasCheckedAuth(true);
    })();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPublicPage]);

  if (!hasCheckedAuth) return null;

  // Pages that don't need bottom nav
  const hideNavPages = ["Onboarding", "Login", "Signup", "Consent"];
  const showBottomNav = isAuthenticated && !hideNavPages.includes(currentPage);

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

  return (
    <>
      <LockOverlay open={overlayOpen} mode={overlayMode} label={overlayLabel} />
      <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-pink-50">
        {children}

      {showBottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-100 shadow-lg z-50 safe-area-pb">
          <div className="max-w-md mx-auto px-1">
            <div className="flex items-center justify-between py-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.page;

                return (
                  <Link key={item.page} to={createPageUrl(item.page)} className="flex-1 min-w-0">
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
                        className={`text-[10px] mt-0.5 truncate max-w-full ${
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