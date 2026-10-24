import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Key,
  RefreshCw,
  User,
  MapPin,
  CheckCircle,
  Shield,
  Loader2,
  Copy,
  History,
  Home as HomeIcon,
  Heart,
  Image as ImageIcon,
  Target,
  MessageCircle,
  Fingerprint,
  Crown,
  Check,
  X,
} from "lucide-react";
import format from "date-fns/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createPageUrl } from "@/utils";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

const FREE_DAILY_VERIFY_LIMIT = 1;

const navItems = [
  { label: "Home", icon: HomeIcon, page: "Home" },
  { label: "Dating", icon: Heart, page: "Dating" },
  { label: "Memories", icon: ImageIcon, page: "Memories" },
  { label: "Goals", icon: Target, page: "Goals" },
  { label: "NightIn", icon: MapPin, page: "NightIn" },
  { label: "Chat", icon: MessageCircle, page: "Chat" },
  { label: "Verify", icon: Fingerprint, page: "VerifyStatus" },
];

function isPremiumUser(user) {
  if (!user) return false;

  if (user.account_tier === "PREMIUM") {
    if (!user.subscription_expires) return false;

    const expiryDate = new Date(user.subscription_expires);

    if (Number.isNaN(expiryDate.getTime())) return false;

    return expiryDate.getTime() > Date.now();
  }

  return false;
}

function getTodayStartIso() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.toISOString();
}

async function getCurrentProfileUser() {
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;
  if (!authUser) return null;

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", authUser.id)
    .maybeSingle();

  if (profileError) throw profileError;

  return {
    id: authUser.id,
    email: authUser.email,
    full_name:
      profile?.full_name ||
      authUser.user_metadata?.full_name ||
      authUser.user_metadata?.name ||
      "",
    location: profile?.location || "",
    profile_photo: profile?.profile_photo || "",
    account_tier: profile?.account_tier || null,
    subscription_expires: profile?.subscription_expires || null,
    couple_profile_id: profile?.couple_profile_id || null,
    verification_code: null,
    verification_code_expires: null,
  };
}

async function getCoupleVerifyCountToday(profile) {
  if (!profile?.id) return 0;

  const todayStart = getTodayStartIso();

  if (!profile.couple_profile_id) {
    const { count, error } = await supabase
      .from("verification_history")
      .select("id", { count: "exact", head: true })
      .eq("verifier_id", profile.id)
      .gte("verification_timestamp", todayStart);

    if (error) throw error;

    return count || 0;
  }

  const { data: coupleUsers, error: coupleUsersError } = await supabase
    .from("profiles")
    .select("id")
    .eq("couple_profile_id", profile.couple_profile_id);

  if (coupleUsersError) throw coupleUsersError;

  const coupleUserIds = (coupleUsers || []).map((item) => item.id);

  if (!coupleUserIds.length) return 0;

  const { count, error } = await supabase
    .from("verification_history")
    .select("id", { count: "exact", head: true })
    .in("verifier_id", coupleUserIds)
    .gte("verification_timestamp", todayStart);

  if (error) throw error;

  return count || 0;
}

const verifyApi = {
  verification: {
    async getHistory() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return [];

      const { data, error } = await supabase
        .from("verification_history")
        .select("*")
        .eq("verifier_id", user.id)
        .order("verification_timestamp", { ascending: false });

      if (error) throw error;

      return data || [];
    },

    async generateCode() {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error("Not authenticated");

      const code = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

      const { error } = await supabase.from("verification_codes").insert({
        user_id: user.id,
        user_email: user.email,
        code,
        expires_at: expiresAt.toISOString(),
      });

      if (error) throw error;

      return {
        code,
        expiresAt: expiresAt.toISOString(),
      };
    },

    async validateCode(inputCode) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("verification_codes")
        .select("*")
        .eq("code", inputCode)
        .is("used_at", null)
        .single();

      if (error || !data) throw new Error("Invalid or expired code");

      if (new Date(data.expires_at) < new Date()) {
        throw new Error("Code expired");
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", data.user_id)
        .single();

      if (profileError) throw profileError;

      const status = profile?.couple_profile_id ? "Date-Locked" : "No Data";

      await supabase.from("verification_history").insert({
        verifier_id: user.id,
        verifier_email: user.email,
        verified_user_id: data.user_id,
        verified_user_email: data.user_email,
        verified_user_name: profile?.full_name,
        verification_status: status,
        partner_name: null,
      });

      await supabase
        .from("verification_codes")
        .update({ used_at: new Date().toISOString() })
        .eq("id", data.id);

      return {
        status,
        verifiedAt: new Date().toISOString(),
        user: {
          full_name: profile?.full_name,
          location: profile?.location,
          profile_photo: profile?.profile_photo,
        },
        partner: null,
      };
    },
  },
};

function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-[#f7f1f4] px-2 py-2 pb-24">
      <div className="mx-auto w-full max-w-[375px] overflow-hidden rounded-[16px] border border-[#ece6ea] bg-[#f7f4f6] shadow-[0_6px_18px_rgba(15,23,42,0.06)]">
        {children}
      </div>
    </div>
  );
}

function AppHeader() {
  return (
    <div className="border-b border-slate-200 bg-[#f8f6f7] px-4 py-4">
      <div className="flex items-center gap-3">
        <Link to={createPageUrl("Home")}>
          <button
            type="button"
            className="rounded-[10px] p-1.5 transition hover:bg-slate-100"
          >
            <ArrowLeft className="h-5 w-5 text-slate-700" />
          </button>
        </Link>

        <h1 className="text-[1.6rem] font-semibold tracking-[-0.02em] text-slate-800">
          Date Status
        </h1>
      </div>
    </div>
  );
}

function AppCard({ children, className = "" }) {
  return (
    <div
      className={`overflow-hidden rounded-[12px] border border-slate-100 bg-white shadow-[0_4px_12px_rgba(15,23,42,0.06)] ${className}`}
    >
      {children}
    </div>
  );
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-3">
      <div className="w-full max-w-[375px] overflow-hidden rounded-[16px] border border-[#ece6ea] bg-[#f7f4f6] shadow-[0_12px_30px_rgba(15,23,42,0.14)]">
        <div className="border-b border-slate-200 bg-[#f8f6f7] px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-[10px] p-1.5 transition hover:bg-slate-100"
            >
              <X className="h-5 w-5 text-slate-600" />
            </button>
          </div>
        </div>

        <div className="max-h-[78vh] space-y-4 overflow-y-auto px-4 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, children, onClick, iconOnly = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${
        iconOnly ? "w-12" : "flex-1"
      } flex h-11 items-center justify-center rounded-[10px] px-3 text-xs font-medium transition ${
        active
          ? "bg-gradient-to-r from-[#8ec5ff] to-[#a9bfff] text-black shadow-[0_4px_10px_rgba(142,197,255,0.24)]"
          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );
}

function EmptyState({ icon, title, text }) {
  return (
    <AppCard className="px-4 py-8">
      <div className="flex min-h-[190px] flex-col items-center justify-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 shadow-[0_3px_10px_rgba(15,23,42,0.08)]">
          {icon}
        </div>

        <h3 className="text-[1.5rem] font-semibold leading-none text-slate-700">
          {title}
        </h3>

        <p className="mt-3 text-center text-sm text-slate-500">{text}</p>
      </div>
    </AppCard>
  );
}

function GradientInfoCard({ children, className = "" }) {
  return (
    <div
      className={`rounded-[12px] border border-blue-100 bg-gradient-to-r from-[#eef6ff] via-[#f4f8ff] to-[#eaf3ff] shadow-[0_4px_12px_rgba(15,23,42,0.06)] ${className}`}
    >
      {children}
    </div>
  );
}

function AvatarCircle({ src, fallback, className = "" }) {
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={`rounded-full object-cover ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-gradient-to-br from-[#eaf3ff] to-[#f3f8ff] text-[#77aef7] ${className}`}
    >
      {fallback}
    </div>
  );
}

function BottomNav() {
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#ece6ea] bg-white/95 pb-[max(6px,env(safe-area-inset-bottom))] pt-1 shadow-[0_-6px_18px_rgba(15,23,42,0.05)] backdrop-blur">
      <div className="mx-auto grid w-full max-w-[390px] grid-cols-7 gap-0.5 px-2">
        {navItems.map((item) => {
          const href = createPageUrl(item.page);
          const active =
            location.pathname === href ||
            (href === "/" && location.pathname === "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              to={href}
              className={`flex min-h-[50px] flex-col items-center justify-center rounded-[14px] px-1 py-1 transition ${
                active ? "bg-[#fdecef]" : "bg-transparent"
              }`}
            >
              <Icon
                className={`mb-0.5 h-[18px] w-[18px] ${
                  active ? "text-[#ef4f75]" : "text-slate-400"
                }`}
                strokeWidth={2}
              />
              <span
                className={`truncate text-[8px] leading-none tracking-[-0.01em] ${
                  active
                    ? "font-semibold text-[#ef4f75]"
                    : "font-medium text-slate-400"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default function VerifyStatus() {
  const [isLoading, setIsLoading] = React.useState(true);
  const [user, setUser] = React.useState(null);
  const [myCode, setMyCode] = React.useState(null);
  const [codeExpiry, setCodeExpiry] = React.useState(null);
  const [inputCode, setInputCode] = React.useState("");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isValidating, setIsValidating] = React.useState(false);
  const [verificationResult, setVerificationResult] = React.useState(null);
  const [error, setError] = React.useState("");
  const [view, setView] = React.useState("my-code");
  const [verificationHistory, setVerificationHistory] = React.useState([]);
  const [showSubscriptionModal, setShowSubscriptionModal] = React.useState(false);
  const [processingPlan, setProcessingPlan] = React.useState(null);

  const premiumActive = isPremiumUser(user);

  React.useEffect(() => {
    loadData();
  }, []);

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get("status");
    const token = urlParams.get("token");
    const plan = urlParams.get("plan");

    if (status === "success" && token && plan) {
      capturePayment(token, plan);
    } else if (status === "cancelled") {
      toast.error("Payment was cancelled.");
      window.history.replaceState({}, "", createPageUrl("VerifyStatus"));
    }
  }, []);

  const loadData = async () => {
    setIsLoading(true);

    try {
      const currentUser = await getCurrentProfileUser();

      setUser(currentUser);

      if (!currentUser?.id) {
        setVerificationHistory([]);
        setMyCode(null);
        setCodeExpiry(null);
        return;
      }

      const history = await verifyApi.verification.getHistory();
      setVerificationHistory(history);

      setMyCode(null);
      setCodeExpiry(null);
    } catch (loadError) {
      console.error("Error loading verify status page:", loadError);
      toast.error("Failed to load verification page.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayPalPayment = async (plan) => {
    setProcessingPlan(plan);

    try {
      const { data, error } = await supabase.functions.invoke(
        "createPayPalPayment",
        {
          body: {
            plan,
            returnPage: "VerifyStatus",
          },
        }
      );

      if (error) throw error;

      if (data?.success && data?.approvalUrl) {
        window.location.href = data.approvalUrl;
        return;
      }

      toast.error("Payment initialization failed. Please try again.");
      setProcessingPlan(null);
    } catch (paymentError) {
      console.error("Payment error:", paymentError);
      toast.error(paymentError?.message || "Payment failed. Please try again.");
      setProcessingPlan(null);
    }
  };

  const capturePayment = async (token, plan) => {
    setProcessingPlan(plan);

    try {
      const { data, error } = await supabase.functions.invoke(
        "capturePayPalPayment",
        {
          body: {
            orderId: token,
            plan,
          },
        }
      );

      if (error) throw error;

      if (data?.success) {
        toast.success("Subscription activated successfully");

        const refreshedUser = await getCurrentProfileUser();
        setUser(refreshedUser);

        window.history.replaceState({}, "", createPageUrl("VerifyStatus"));
        setShowSubscriptionModal(false);
        return;
      }

      toast.error("Payment capture failed. Please contact support.");
    } catch (captureError) {
      console.error("Capture error:", captureError);
      toast.error(captureError?.message || "Payment processing failed.");
    } finally {
      setProcessingPlan(null);
    }
  };

  const generateCode = async () => {
    setIsGenerating(true);
    setError("");

    try {
      const data = await verifyApi.verification.generateCode();
      setMyCode(data.code);
      setCodeExpiry(new Date(data.expiresAt));
    } catch (generateError) {
      console.error("Error generating code:", generateError);
      setError(generateError?.message || "Failed to generate code");
      toast.error(generateError?.message || "Failed to generate code");
    } finally {
      setIsGenerating(false);
    }
  };

  const validateCode = async () => {
    if (!inputCode || inputCode.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    if (!user?.id) {
      setError("Please log in first.");
      return;
    }

    setIsValidating(true);
    setError("");

    try {
      if (!premiumActive) {
        const verifyCountToday = await getCoupleVerifyCountToday(user);

        if (verifyCountToday >= FREE_DAILY_VERIFY_LIMIT) {
          setShowSubscriptionModal(true);
          toast.error("Daily verify limit reached. Free couples get 1 verification per day.");
          return;
        }
      }

      const data = await verifyApi.verification.validateCode(inputCode);
      setVerificationResult(data);
      await loadData();
    } catch (validateError) {
      setError(validateError.message || "Invalid or expired code");
    } finally {
      setIsValidating(false);
    }
  };

  const copyCode = async () => {
    if (!myCode) return;

    try {
      await navigator.clipboard.writeText(myCode);
      toast.success("Code copied");
    } catch (copyError) {
      console.error("Copy failed:", copyError);
    }
  };

  if (isLoading) {
    return (
      <>
        <AppShell>
          <div className="flex min-h-[520px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#8ec5ff]" />
          </div>
        </AppShell>
        <BottomNav />
      </>
    );
  }

  return (
    <>
      <AppShell>
        <AppHeader />

        <div className="space-y-4 px-3 py-3">
          {!verificationResult ? (
            <>
              <div className="flex gap-2">
                <TabButton
                  active={view === "my-code"}
                  onClick={() => setView("my-code")}
                >
                  My Code
                </TabButton>

                <TabButton
                  active={view === "verify-other"}
                  onClick={() => setView("verify-other")}
                >
                  Verify
                </TabButton>

                <TabButton
                  active={view === "history"}
                  onClick={() => setView("history")}
                  iconOnly
                >
                  <History className="h-5 w-5" />
                </TabButton>
              </div>

              {view === "my-code" ? (
                <>
                  <GradientInfoCard className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-sm">
                        <Key className="h-5 w-5" />
                      </div>

                      <div className="flex-1">
                        <h2 className="text-base font-semibold text-slate-800">
                          Your Verification Code
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                          Share your code for quick relationship status checks.
                        </p>
                      </div>
                    </div>
                  </GradientInfoCard>

                  {myCode ? (
                    <AppCard className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-center text-white">
                      <p className="mb-3 text-sm text-white/60">Your Code</p>

                      <div className="flex items-center justify-center gap-3">
                        <p className="font-mono text-4xl font-bold tracking-[0.22em] text-white">
                          {myCode}
                        </p>

                        <button
                          type="button"
                          onClick={copyCode}
                          className="rounded-[10px] p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
                        >
                          <Copy className="h-5 w-5" />
                        </button>
                      </div>

                      {codeExpiry ? (
                        <p className="mt-4 text-xs text-white/40">
                          Expires {format(codeExpiry, "h:mm a")}
                        </p>
                      ) : null}
                    </AppCard>
                  ) : (
                    <EmptyState
                      icon={<Key className="h-8 w-8 text-slate-300" />}
                      title="No active code"
                      text="Generate a verification code to share."
                    />
                  )}

                  <Button
                    onClick={generateCode}
                    disabled={isGenerating}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[10px] bg-gradient-to-r from-[#8ec5ff] to-[#a9bfff] text-black shadow-[0_4px_10px_rgba(142,197,255,0.24)] hover:from-[#7ab8ff] hover:to-[#98b4ff]"
                  >
                    {isGenerating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4" />
                        <span>{myCode ? "Generate New Code" : "Generate Code"}</span>
                      </>
                    )}
                  </Button>

                  <GradientInfoCard className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-[12px] bg-white text-[#77aef7] shadow-sm">
                        <Shield className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="font-medium text-slate-800">Secure</p>
                        <p className="mt-1 text-sm text-slate-500">
                          Codes expire after 5 minutes for privacy.
                        </p>
                      </div>
                    </div>
                  </GradientInfoCard>
                </>
              ) : view === "verify-other" ? (
                <>
                  <GradientInfoCard className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-gradient-to-br from-[#8ec5ff] to-[#a9bfff] text-white shadow-sm">
                        <CheckCircle className="h-5 w-5" />
                      </div>

                      <div className="flex-1">
                        <h2 className="text-base font-semibold text-slate-800">
                          Verify Status
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                          Enter a 6-digit verification code.
                        </p>
                      </div>
                    </div>
                  </GradientInfoCard>

                  <AppCard className="p-4">
                    <Input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={inputCode}
                      onChange={(e) => {
                        setInputCode(e.target.value.replace(/\D/g, ""));
                        setError("");
                      }}
                      placeholder="000000"
                      className="mb-4 h-16 w-full rounded-[12px] border border-slate-300 px-4 text-center font-mono text-[1.6rem] tracking-[0.30em] text-slate-800 placeholder:tracking-[0.30em] placeholder:text-[#bfd0e6] focus:border-[#8ec5ff] focus:ring-0"
                    />

                    {error ? (
                      <p className="mb-4 text-center text-sm text-red-500">{error}</p>
                    ) : null}

                    <Button
                      onClick={validateCode}
                      disabled={isValidating || inputCode.length !== 6}
                      className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[10px] bg-gradient-to-r from-[#8ec5ff] to-[#a9bfff] text-black shadow-[0_4px_10px_rgba(142,197,255,0.24)] hover:from-[#7ab8ff] hover:to-[#98b4ff]"
                    >
                      {isValidating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4" />
                          <span>Verify Status</span>
                        </>
                      )}
                    </Button>
                  </AppCard>

                  <GradientInfoCard className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-[12px] bg-white text-slate-500 shadow-sm">
                        <Shield className="h-5 w-5" />
                      </div>

                      <div>
                        <p className="font-medium text-slate-800">Private</p>
                        <p className="mt-1 text-sm text-slate-500">
                          Only basic status information is shared.
                        </p>
                      </div>
                    </div>
                  </GradientInfoCard>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="text-base font-semibold text-slate-800">
                    Verification History
                  </div>

                  {verificationHistory.length > 0 ? (
                    verificationHistory.map((log) => (
                      <AppCard key={log.id} className="p-4">
                        <div className="flex items-start gap-3">
                          <AvatarCircle
                            src={null}
                            fallback={log.verified_user_name?.[0] || "U"}
                            className="h-10 w-10"
                          />

                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-slate-800">
                              {log.verified_user_name}
                            </p>
                            <p className="text-sm text-slate-500">
                              {log.verification_status}
                            </p>

                            {log.partner_name ? (
                              <p className="text-xs text-slate-400">
                                with {log.partner_name}
                              </p>
                            ) : null}

                            <p className="mt-1 text-xs text-slate-400">
                              {format(
                                new Date(log.verification_timestamp),
                                "MMM d, yyyy • h:mm a"
                              )}
                            </p>
                          </div>
                        </div>
                      </AppCard>
                    ))
                  ) : (
                    <EmptyState
                      icon={<History className="h-8 w-8 text-slate-300" />}
                      title="No verification history"
                      text="Your recent verification activity will appear here."
                    />
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <GradientInfoCard className="p-5 text-center">
                <div
                  className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full ${
                    verificationResult.status === "Date-Locked"
                      ? "bg-[#eaf3ff]"
                      : "bg-slate-100"
                  }`}
                >
                  <CheckCircle
                    className={`h-10 w-10 ${
                      verificationResult.status === "Date-Locked"
                        ? "text-[#77aef7]"
                        : "text-slate-500"
                    }`}
                  />
                </div>

                <h2 className="text-2xl font-semibold text-slate-800">
                  Status Verified
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {format(new Date(verificationResult.verifiedAt), "MMMM d, yyyy • h:mm a")}
                </p>
              </GradientInfoCard>

              <AppCard className="p-6 text-center">
                <div
                  className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-lg font-semibold ${
                    verificationResult.status === "Date-Locked"
                      ? "bg-gradient-to-r from-[#8ec5ff] to-[#a9bfff] text-white"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {verificationResult.status}
                </div>
              </AppCard>

              <AppCard className="overflow-hidden">
                <div
                  className={`h-16 ${
                    verificationResult.status === "Date-Locked"
                      ? "bg-gradient-to-r from-[#b8dcff] via-[#c8d7ff] to-[#9fc9ff]"
                      : "bg-gradient-to-r from-slate-300 to-slate-400"
                  }`}
                />

                <div className="-mt-8 px-6 pb-6">
                  <AvatarCircle
                    src={verificationResult.user?.profile_photo}
                    fallback={
                      verificationResult.user?.full_name?.[0] || (
                        <User className="h-6 w-6" />
                      )
                    }
                    className="mx-auto flex h-16 w-16 border-4 border-white shadow-lg"
                  />

                  <div className="mt-4 text-center">
                    <h3 className="text-xl font-semibold text-slate-800">
                      {verificationResult.user?.full_name}
                    </h3>

                    {verificationResult.user?.location ? (
                      <div className="mt-1 flex items-center justify-center gap-1 text-sm text-slate-500">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{verificationResult.user.location}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </AppCard>

              <GradientInfoCard className="p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-white text-green-600 shadow-sm">
                    <Shield className="h-5 w-5" />
                  </div>

                  <div>
                    <p className="font-medium text-slate-800">Verified</p>
                    <p className="text-sm text-slate-500">
                      Status has been confirmed successfully.
                    </p>
                  </div>
                </div>
              </GradientInfoCard>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setVerificationResult(null);
                    setInputCode("");
                    setError("");
                  }}
                  className="h-10 flex-1 rounded-[10px] border-slate-200 bg-white text-slate-700 shadow-[0_4px_12px_rgba(15,23,42,0.06)] hover:bg-slate-50"
                >
                  Verify Another
                </Button>

                <Link to={createPageUrl("Home")} className="flex-1">
                  <Button className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[10px] bg-gradient-to-r from-[#8ec5ff] to-[#a9bfff] text-black shadow-[0_4px_10px_rgba(142,197,255,0.24)] hover:from-[#7ab8ff] hover:to-[#98b4ff]">
                    Done
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </AppShell>

      <Modal
        open={showSubscriptionModal}
        onClose={() => {
          if (processingPlan) return;
          setShowSubscriptionModal(false);
        }}
        title="Date-Locked Plus"
      >
        <AppCard className="border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50 p-5">
          <div className="mb-5 flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-gradient-to-r from-purple-600 to-pink-600">
              <Crown className="h-5 w-5 text-white" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900">
                Unlock unlimited verification
              </h3>

              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Free couples can verify once per day. Upgrade to remove the daily
                verification limit.
              </p>
            </div>
          </div>

          <div className="mb-5 space-y-3">
            {[
              "Unlimited verification checks",
              "Premium couple profile",
              "Date-Locked Plus access",
              "One subscription per couple",
            ].map((feature) => (
              <div key={feature} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-purple-600" />
                <span className="text-sm font-medium text-slate-700">
                  {feature}
                </span>
              </div>
            ))}
          </div>

          <div className="mb-4 rounded-[14px] bg-white/75 p-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-slate-900">R39</span>
              <span className="text-sm font-semibold text-slate-500">/month</span>
            </div>

            <p className="mt-1 text-xs font-medium text-slate-500">
              or R397.80/year • Save 15%
            </p>
          </div>

          <div className="space-y-2">
            <Button
              type="button"
              onClick={() => handlePayPalPayment("monthly")}
              disabled={!!processingPlan}
              className="h-11 w-full rounded-[14px] bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
            >
              {processingPlan === "monthly" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Subscribe Monthly - R39"
              )}
            </Button>

            <Button
              type="button"
              onClick={() => handlePayPalPayment("yearly")}
              disabled={!!processingPlan}
              variant="outline"
              className="h-11 w-full rounded-[14px] border-purple-200 bg-white"
            >
              {processingPlan === "yearly" ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Subscribe Yearly - R397.80"
              )}
            </Button>

            <p className="flex items-center justify-center gap-1 text-xs text-slate-500">
              <Shield className="h-3 w-3" />
              Secured by PayPal
            </p>
          </div>
        </AppCard>
      </Modal>

      <BottomNav />
    </>
  );
}