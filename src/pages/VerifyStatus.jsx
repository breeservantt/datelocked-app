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
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createPageUrl } from "@/utils";

const navItems = [
  { label: "Home", icon: HomeIcon, page: "Home" },
  { label: "Dating", icon: Heart, page: "Dating" },
  { label: "Memories", icon: ImageIcon, page: "Memories" },
  { label: "Goals", icon: Target, page: "Goals" },
  { label: "NightIn", icon: MapPin, page: "NightIn" },
  { label: "Chat", icon: MessageCircle, page: "Chat" },
  { label: "Verify", icon: Fingerprint, page: "VerifyStatus" },
];

const verifyApi = {
  auth: {
    async me() {
      return {
        id: "user-1",
        email: "you@example.com",
        full_name: "Your Name",
        location: "Johannesburg",
        profile_photo: "",
        verification_code: null,
        verification_code_expires: null,
      };
    },
  },

  verification: {
    async getHistory(email) {
      if (!email) return [];
      return [];
    },

    async generateCode() {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      return {
        code,
        expiresAt,
      };
    },

    async validateCode(code) {
      if (!code || code.length !== 6) {
        throw new Error("Invalid or expired code");
      }

      if (code === "123456") {
        return {
          status: "Date-Locked",
          verifiedAt: new Date().toISOString(),
          user: {
            full_name: "Partner Name",
            location: "Pretoria",
            profile_photo: "",
          },
          partner: {
            full_name: "Your Name",
            profile_photo: "",
          },
        };
      }

      if (code === "000000") {
        return {
          status: "No Data",
          verifiedAt: new Date().toISOString(),
          user: {
            full_name: "Unknown User",
            location: "",
            profile_photo: "",
          },
          partner: null,
        };
      }

      throw new Error("Invalid or expired code");
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

function AppHeader({ title }) {
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
  const [myCode, setMyCode] = React.useState(null);
  const [codeExpiry, setCodeExpiry] = React.useState(null);
  const [inputCode, setInputCode] = React.useState("");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isValidating, setIsValidating] = React.useState(false);
  const [verificationResult, setVerificationResult] = React.useState(null);
  const [error, setError] = React.useState("");
  const [view, setView] = React.useState("my-code");
  const [verificationHistory, setVerificationHistory] = React.useState([]);

  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);

    try {
      const currentUser = await verifyApi.auth.me();
      const history = await verifyApi.verification.getHistory(currentUser.email);
      setVerificationHistory(history);

      if (
        currentUser.verification_code &&
        currentUser.verification_code_expires
      ) {
        const expiresAt = new Date(currentUser.verification_code_expires);
        if (expiresAt > new Date()) {
          setMyCode(currentUser.verification_code);
          setCodeExpiry(expiresAt);
        } else {
          setMyCode(null);
          setCodeExpiry(null);
        }
      } else {
        setMyCode(null);
        setCodeExpiry(null);
      }
    } catch (loadError) {
      console.error("Error loading verify status page:", loadError);
    } finally {
      setIsLoading(false);
    }
  };

  const generateCode = async () => {
    setIsGenerating(true);

    try {
      const data = await verifyApi.verification.generateCode();
      setMyCode(data.code);
      setCodeExpiry(new Date(data.expiresAt));
      setError("");
    } catch (generateError) {
      console.error("Error generating code:", generateError);
      setError("Failed to generate code");
    } finally {
      setIsGenerating(false);
    }
  };

  const validateCode = async () => {
    if (!inputCode || inputCode.length !== 6) {
      setError("Please enter a 6-digit code");
      return;
    }

    setIsValidating(true);
    setError("");

    try {
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
        <AppHeader title="Date Status" />

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

                  {verificationResult.status === "Date-Locked" &&
                  verificationResult.partner ? (
                    <div className="mt-6 border-t border-slate-100 pt-6">
                      <p className="mb-3 text-center text-sm text-slate-500">
                        Date-Locked with
                      </p>

                      <div className="flex items-center justify-center gap-3">
                        <AvatarCircle
                          src={verificationResult.partner.profile_photo}
                          fallback={verificationResult.partner.full_name?.[0] || "P"}
                          className="h-12 w-12"
                        />

                        <div>
                          <p className="font-semibold text-slate-800">
                            {verificationResult.partner.full_name}
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : null}
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

      <BottomNav />
    </>
  );
}