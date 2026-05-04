import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Layout from "./components/Layout";

const Home = lazy(() => import("./pages/Home"));
const Chat = lazy(() => import("./pages/Chat"));
const Consent = lazy(() => import("./pages/Consent"));
const Dating = lazy(() => import("./pages/Dating"));
const Goals = lazy(() => import("./pages/Goals"));
const InvitePartner = lazy(() => import("./pages/InvitePartner"));
const Memories = lazy(() => import("./pages/Memories"));
const NightIn = lazy(() => import("./pages/NightIn"));
const Notifications = lazy(() => import("./pages/Notifications"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Places = lazy(() => import("./pages/Places"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Refunds = lazy(() => import("./pages/Refunds"));
const RelationshipInsights = lazy(() => import("./pages/RelationshipInsights"));
const Settings = lazy(() => import("./pages/Settings"));
const Terms = lazy(() => import("./pages/Terms"));
const VerifyStatus = lazy(() => import("./pages/VerifyStatus"));
const Login = lazy(() => import("./pages/Login"));

function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="text-sm text-slate-500">Loading...</div>
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

  const noLayoutRoutes = [
    "/login",
    "/chat",
    "/goals",
    "/memories",
    "/verifystatus",
  ];

  const shouldUseLayout = !noLayoutRoutes.includes(location.pathname);

  const routes = (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/home" element={<Home />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/consent" element={<Consent />} />
        <Route path="/dating" element={<Dating />} />
        <Route path="/goals" element={<Goals />} />
        <Route path="/invite-partner" element={<InvitePartner />} />
        <Route path="/memories" element={<Memories />} />
        <Route path="/nightin" element={<NightIn />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/places" element={<Places />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/refunds" element={<Refunds />} />
        <Route path="/relationship-insights" element={<RelationshipInsights />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/verifystatus" element={<VerifyStatus />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );

  if (!shouldUseLayout) {
    return routes;
  }

  return <Layout>{routes}</Layout>;
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}