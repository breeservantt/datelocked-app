
import React, { Suspense, lazy, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigate,
  Navigate,
} from "react-router-dom";
import { App as CapacitorApp } from "@capacitor/app";
import { supabase } from "@/lib/supabase";
import Layout from "./components/Layout";
import PinLock from "./components/PinLock";

const Home = lazy(() => import("./pages/Home"));
const AuthCallback = lazy(() => import("./pages/AuthCallback"));
const Chat = lazy(() => import("./pages/Chat"));
const Dating = lazy(() => import("./pages/Dating"));
const Goals = lazy(() => import("./pages/Goals"));
const InvitePartner = lazy(() => import("./pages/InvitePartner"));
const Memories = lazy(() => import("./pages/Memories"));
const NightIn = lazy(() => import("./pages/NightIn"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Security = lazy(() => import("./pages/Security"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Refunds = lazy(() => import("./pages/Refunds"));
const RelationshipInsights = lazy(() => import("./pages/RelationshipInsights"));
const Settings = lazy(() => import("./pages/Settings"));
const Terms = lazy(() => import("./pages/Terms"));
const VerifyStatus = lazy(() => import("./pages/VerifyStatus"));
const Login = lazy(() => import("./pages/Login"));
const Landing = lazy(() => import("./pages/Landing"));

function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="h-7 w-7 animate-spin text-[#5e9cff]" />
    </div>
  );
}

function NotFound() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-sm text-slate-500">Page not found</div>
    </div>
  );
}

function AppRoutes() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;

    const listener = CapacitorApp.addListener("appUrlOpen", async ({ url }) => {
      try {
        const callbackUrl = new URL(url);

        if (
          callbackUrl.protocol !== "com.datelocked.app:" ||
          callbackUrl.hostname !== "auth"
        ) {
          return;
        }

        const code = callbackUrl.searchParams.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else {
          const errorDescription = callbackUrl.searchParams.get("error_description");
          if (errorDescription) throw new Error(errorDescription);

          const accessToken = callbackUrl.hash.match(/access_token=([^&]+)/)?.[1];
          const refreshToken = callbackUrl.hash.match(/refresh_token=([^&]+)/)?.[1];

          if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: decodeURIComponent(accessToken),
              refresh_token: decodeURIComponent(refreshToken),
            });
            if (error) throw error;
          }
        }

        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error || !user) throw error || new Error("Google sign-in did not create a session.");

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("full_name, date_of_birth, gender, location, account_status, deactivated_at")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        if (
          profile?.account_status === "deactivated" ||
          profile?.deactivated_at
        ) {
          await supabase.auth.signOut();
          throw new Error("This account has been deactivated.");
        }

        if (active) {
          navigate(
            profile?.full_name?.trim() &&
              profile?.date_of_birth &&
              profile?.gender &&
              profile?.location
              ? "/home"
              : "/onboarding",
            { replace: true }
          );
        }
      } catch (error) {
        console.error("Google deep-link sign-in failed:", error);
        if (active) navigate("/login", { replace: true });
      }
    });

    return () => {
      active = false;
      listener.then((handle) => handle.remove());
    };
  }, [navigate]);

  const noLayoutRoutes = [
    "/",
    "/login",
    "/chat",
    "/goals",
    "/memories",
    "/verifystatus",
    "/onboarding",
    "/auth/callback",
  ];

  const shouldUseLayout = !noLayoutRoutes.includes(location.pathname);

  const routes = (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/dating" element={<Dating />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/invite-partner" element={<InvitePartner />} />
        <Route path="/memories" element={<Memories />} />
        <Route path="/nightin" element={<NightIn />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/security" element={<Security />} />
        <Route path="/refunds" element={<Refunds />} />
        <Route path="/relationship-insights" element={<RelationshipInsights />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/verifystatus" element={<VerifyStatus />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );

  if (!shouldUseLayout) return routes;

  return <Layout>{routes}</Layout>;
}

export default function App() {
  return (
    <Router>
      <PinLock>
        <AppRoutes />
      </PinLock>
    </Router>
  );
}
