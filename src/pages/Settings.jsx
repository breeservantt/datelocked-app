import { supabase } from "@/lib/supabase";
import React from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Camera,
  User,
  MapPin,
  Calendar,
  Mail,
  Fingerprint,
  Shield,
  LogOut,
  Loader2,
  Save,
  AlertTriangle,
  Unlock,
  Archive,
  Image as ImageIcon,
  Sparkles,
  X as XIcon,
  KeyRound,
  ChevronRight,
  Lock,
  FileText,
  Home as HomeIcon,
  Heart,
  Image,
  Target,
  MessageCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import StatusBadge from "@/components/ui/StatusBadge";
import { format } from "date-fns";
import { parseSafeDate } from "@/components/utils/dateHelpers";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const createPageUrl = (pageName) => {
  if (pageName === "Home") return "/";
  return `/${pageName.toLowerCase()}`;
};

const navItems = [
  { label: "Home", icon: HomeIcon, page: "Home" },
  { label: "Dating", icon: Heart, page: "Dating" },
  { label: "Memories", icon: Image, page: "Memories" },
  { label: "Goals", icon: Target, page: "Goals" },
  { label: "NightIn", icon: MapPin, page: "NightIn" },
  { label: "Chat", icon: MessageCircle, page: "Chat" },
  { label: "Verify", icon: Fingerprint, page: "VerifyStatus" },
];

/* -----------------------
   Temp adapter replacing Base44 only
------------------------ */
const settingsApi = {
  async me() {
    return {
      id: "user-1",
      email: "you@example.com",
      full_name: "Your Name",
      location: "Johannesburg",
      profile_photo: "",
      date_of_birth: "1995-06-15",
      relationship_status: "date_locked",
      partner_email: "partner@example.com",
      couple_profile_id: "couple-1",
      auth_preference: "PASSWORD",
      pin_enabled: false,
      pin_last_set_at: null,
      insights_consent: true,
    };
  },

  async updateMe(patch) {
    const current = JSON.parse(localStorage.getItem("settings.user") || "null");
    const next = { ...(current || (await this.me())), ...patch };
    localStorage.setItem("settings.user", JSON.stringify(next));
    return next;
  },

  async logout() {
    return true;
  },

  async getUser() {
    const cached = localStorage.getItem("settings.user");
    if (cached) return JSON.parse(cached);
    const fresh = await this.me();
    localStorage.setItem("settings.user", JSON.stringify(fresh));
    return fresh;
  },

  entities: {
    RelationshipTermination: {
      async filter() {
        return [];
      },
    },
    ArchivedMemory: {
      async filter() {
        return [];
      },
    },
  },

  integrations: {
    Core: {
      async UploadFile({ file }) {
        return { file_url: URL.createObjectURL(file) };
      },
    },
  },

  functions: {
    async invoke() {
      return { success: true };
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
      <div className="flex items-center justify-center">
        <h1 className="text-[1.6rem] font-semibold tracking-[-0.02em] text-slate-800">
          {title}
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

function SectionTitle({ children }) {
  return <h2 className="text-base font-semibold text-slate-800">{children}</h2>;
}

function StatCard({ value, label, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-100 text-slate-800",
    blue: "bg-[#eaf3ff] text-[#77aef7]",
    green: "bg-green-100 text-green-600",
    amber: "bg-amber-100 text-amber-600",
  };

  return (
    <div
      className={`rounded-[12px] px-2 py-3 text-center shadow-[0_4px_12px_rgba(15,23,42,0.06)] ${tones[tone]}`}
    >
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-1.5 text-xs font-medium text-slate-500">{label}</p>
    </div>
  );
}

function SmallActionButton({ onClick, icon, text }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-[52px] flex-1 items-center justify-center rounded-[14px] border border-slate-200 bg-white px-2 shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition hover:bg-slate-50"
    >
      <div className="flex items-center justify-center gap-1.5">
        {icon}
        <span className="text-[13px] font-medium text-slate-800">{text}</span>
      </div>
    </button>
  );
}

function TabButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-[10px] py-2 text-xs font-medium transition ${
        active
          ? "bg-white text-slate-800 shadow-[0_2px_8px_rgba(15,23,42,0.06)]"
          : "text-slate-500"
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

function FolderRow({ icon: Icon, title, subtitle, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left flex items-center justify-between rounded-[12px] border border-slate-100 bg-white px-4 py-4 shadow-[0_4px_12px_rgba(15,23,42,0.06)] transition hover:bg-slate-50"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-slate-100">
          <Icon className="h-5 w-5 text-slate-600" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800">{title}</p>
          {subtitle ? (
            <p className="text-xs text-slate-500">{subtitle}</p>
          ) : null}
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-slate-400" />
    </button>
  );
}

function formatDisplayDate(dateString) {
  if (!dateString) return "";
  const date = parseSafeDate(dateString);
  if (!date) return "";
  return format(date, "MMM d, yyyy");
}

export default function Settings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [user, setUser] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const [isSaving, setIsSaving] = React.useState(false);
  const [isBusyAction, setIsBusyAction] = React.useState(false);

  const [showUnlockDialog, setShowUnlockDialog] = React.useState(false);
  const [showTerminationDialog, setShowTerminationDialog] = React.useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = React.useState(false);

  const [pendingTermination, setPendingTermination] = React.useState(null);
  const [archivedMemories, setArchivedMemories] = React.useState([]);
  const [showArchive, setShowArchive] = React.useState(false);

  const [openFolder, setOpenFolder] = React.useState(null);

  const [formData, setFormData] = React.useState({
    full_name: "",
    location: "",
    profile_photo: "",
  });

  // 🔥 LOAD USER PROFILE FROM SUPABASE
const loadUserProfile = async () => {
  const { data: { user } } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!error && data) {
    setUser(data);
    setFormData({
      full_name: data.full_name || "",
      profile_photo: data.profile_photo || "",
      location: data.location || "",
    });
  }
};

  const [authPref, setAuthPref] = React.useState("PASSWORD");
  const [pinEnabled, setPinEnabled] = React.useState(false);

  const [pinNew, setPinNew] = React.useState("");
  const [pinConfirm, setPinConfirm] = React.useState("");
  const [isAuthSaving, setIsAuthSaving] = React.useState(false);

  const PRIVACY_POLICY_URL = createPageUrl("PrivacyPolicy");
  const SECURITY_POLICY_URL = createPageUrl("SecurityPolicy");

  const getServerErrorMessage = (e) =>
    e?.response?.data?.error ||
    e?.response?.data?.message ||
    e?.response?.data?.detail ||
    e?.message ||
    "Unknown error";

  const safeInvoke = React.useCallback(async (fnName, payload = {}) => {
    try {
      return await settingsApi.functions.invoke(fnName, payload);
    } catch (e) {
      console.error(`Function invoke failed: ${fnName}`, e);
      const status = e?.response?.status;
      const msg = getServerErrorMessage(e);
      alert(
        status
          ? `Request failed (${status}) in "${fnName}": ${msg}`
          : `Could not run "${fnName}": ${msg}`
      );
      throw e;
    }
  }, []);

  const refreshUser = React.useCallback(async () => {
    const u = await settingsApi.getUser();
    setUser(u);

    setFormData({
      full_name: u?.full_name || "",
      location: u?.location || "",
      profile_photo: u?.profile_photo || "",
    });

    setAuthPref(u?.auth_preference || "PASSWORD");
    setPinEnabled(Boolean(u?.pin_enabled));

    return u;
  }, []);

  const loadAll = React.useCallback(async () => {
    const currentUser = await refreshUser();
    if (!currentUser) throw new Error("Unable to load your account.");

    if (currentUser.couple_profile_id && currentUser.email) {
      const terminations = await settingsApi.entities.RelationshipTermination.filter({
        partner_email: currentUser.email,
        status: "pending",
      });
      setPendingTermination(terminations?.[0] || null);
    } else {
      setPendingTermination(null);
    }

    if (currentUser.email) {
      const archived = await settingsApi.entities.ArchivedMemory.filter({
        user_email: currentUser.email,
      });
      setArchivedMemories(Array.isArray(archived) ? archived : []);
    } else {
      setArchivedMemories([]);
    }
  }, [refreshUser]);

  React.useEffect(() => {
  let alive = true;

  (async () => {
    try {
      setIsLoading(true);

      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError) throw authError;

      const authUser = authData?.user;
      if (!authUser) {
        if (alive) setUser(null);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (error) throw error;

      if (alive) {
        setUser(data);
        setFormData({
          full_name: data?.full_name || "",
          location: data?.location || "",
          profile_photo: data?.profile_photo || "",
        });
        setPendingTermination(null);
        setArchivedMemories([]);
      }
    } catch (e) {
      console.error("Settings load error:", e);
      if (alive) setUser(null);
    } finally {
      if (alive) setIsLoading(false);
    }
  })();

  return () => {
    alive = false;
  };
}, []);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    try {
      const { file_url } = await settingsApi.integrations.Core.UploadFile({ file });
      if (!file_url) throw new Error("Upload failed");

      await settingsApi.updateMe({ profile_photo: file_url });

      setFormData((prev) => ({ ...prev, profile_photo: file_url }));
      await refreshUser();

      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      queryClient.invalidateQueries({ queryKey: ["partner"] });
    } catch (error) {
      console.error("Photo upload failed:", error);
      alert("Photo upload failed. Please try again.");
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await settingsApi.updateMe({
        full_name: (formData.full_name || "").trim(),
        location: (formData.location || "").trim(),
        profile_photo: formData.profile_photo || "",
      });

      await refreshUser();

      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      queryClient.invalidateQueries({ queryKey: ["partner"] });
      queryClient.invalidateQueries({ queryKey: ["coupleProfile"] });

      alert("Profile updated.");
    } catch (error) {
      console.error("Error saving:", error);
      alert("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetPin = async () => {
    if (isAuthSaving) return;

    const a = (pinNew || "").trim();
    const b = (pinConfirm || "").trim();

    if (!/^\d{4,8}$/.test(a)) {
      alert("PIN must be 4–8 digits.");
      return;
    }

    if (a !== b) {
      alert("PIN confirmation does not match.");
      return;
    }

    setIsAuthSaving(true);
    try {
      await safeInvoke("pinSet", { pin: a });

      await settingsApi.updateMe({
        pin_enabled: true,
        auth_preference: "PIN",
        pin_last_set_at: new Date().toISOString(),
      });

      setPinNew("");
      setPinConfirm("");
      await refreshUser();
    } catch (e) {
      console.error(e);
      const msg = getServerErrorMessage(e);
      alert(`Could not set PIN: ${msg}`);
    } finally {
      setIsAuthSaving(false);
    }
  };

  const handleTogglePin = async (checked) => {
    if (isAuthSaving) return;

    setIsAuthSaving(true);
    try {
      if (!checked) {
        await safeInvoke("pinDisable", {});
        await settingsApi.updateMe({
          pin_enabled: false,
          auth_preference: "PASSWORD",
        });
      } else {
        await settingsApi.updateMe({
          pin_enabled: true,
          auth_preference: "PIN",
        });
      }

      await refreshUser();
    } catch (e) {
      console.error(e);
      const msg = getServerErrorMessage(e);
      alert(`Could not update PIN setting: ${msg}`);
    } finally {
      setIsAuthSaving(false);
    }
  };

  const handleUnlock = async () => {
    if (isBusyAction) return;
    setIsBusyAction(true);
    try {
      await safeInvoke("quickDateUnlock", {
        couple_profile_id: user?.couple_profile_id,
      });
      setShowUnlockDialog(false);
      await settingsApi.updateMe({
        relationship_status: "single",
        partner_email: null,
        couple_profile_id: null,
      });
      navigate(createPageUrl("Home"), { replace: true });
    } finally {
      setIsBusyAction(false);
    }
  };

  const handleTerminationRequest = async () => {
    if (isBusyAction) return;
    setIsBusyAction(true);
    try {
      await safeInvoke("requestRelationshipTermination", {
        couple_profile_id: user?.couple_profile_id,
      });
      setShowTerminationDialog(false);
      alert("Termination request sent to your partner.");
      await loadAll();
    } finally {
      setIsBusyAction(false);
    }
  };

  const handleConfirmTermination = async () => {
    if (isBusyAction) return;
    setIsBusyAction(true);
    try {
      await safeInvoke("confirmRelationshipTermination", {
        couple_profile_id: user?.couple_profile_id,
      });
      setPendingTermination(null);
      await settingsApi.updateMe({
        relationship_status: "single",
        partner_email: null,
        couple_profile_id: null,
      });
      navigate(createPageUrl("Home"), { replace: true });
    } finally {
      setIsBusyAction(false);
    }
  };

  const handleDeclineTermination = async () => {
    if (isBusyAction) return;
    setIsBusyAction(true);
    try {
      await safeInvoke("declineRelationshipTermination", {
        couple_profile_id: user?.couple_profile_id,
      });
      setPendingTermination(null);
      await loadAll();
    } finally {
      setIsBusyAction(false);
    }
  };

  const handleDeactivate = async () => {
    if (isBusyAction) return;
    setIsBusyAction(true);
    try {
      await safeInvoke("deactivateAccount");
      await settingsApi.logout();
      navigate(createPageUrl("Home"));
    } finally {
      setIsBusyAction(false);
    }
  };

  const handleLogout = async () => {
    try {
      await settingsApi.logout();
      navigate(createPageUrl("Home"));
    } catch (e) {
      console.error("Logout failed:", e);
      alert("Logout failed. Please try again.");
    }
  };

  const topStats = React.useMemo(() => {
    return {
      folders: 2,
      archived: archivedMemories.length,
      relationship: user?.relationship_status === "date_locked" ? 1 : 0,
      security: pinEnabled ? 1 : 0,
    };
  }, [archivedMemories.length, user?.relationship_status, pinEnabled]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f1f4]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <AppShell>
          <AppHeader title="Settings" />
          <div className="space-y-4 px-3 py-3">
            <EmptyState
              icon={<XIcon className="h-8 w-8 text-slate-300" />}
              title="Could not load Settings"
              text="Please try again."
            />
            <Button
              onClick={() => window.location.reload()}
              className="inline-flex h-10 w-full items-center justify-center rounded-[10px] bg-gradient-to-r from-[#8ec5ff] to-[#a9bfff] text-black shadow-[0_4px_10px_rgba(142,197,255,0.24)] hover:from-[#7ab8ff] hover:to-[#98b4ff]"
            >
              Retry
            </Button>
          </div>
        </AppShell>
        <BottomNav />
      </>
    );
  }

  return (
    <>
      <AppShell>
        <AppHeader title="Settings" />

        <div className="space-y-4 px-3 py-3">


          {pendingTermination && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
              <AppCard className="p-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-amber-100 text-amber-600">
                    <AlertTriangle className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800">
                          Termination Request
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {pendingTermination.initiator_name ||
                            pendingTermination.initiator_email}{" "}
                          wants to terminate.
                        </p>
                      </div>

                      <div className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[11px] font-medium text-amber-700">
                        Pending
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={handleConfirmTermination}
                        disabled={isBusyAction}
                        className="inline-flex h-8 items-center justify-center rounded-[9px] bg-gradient-to-r from-[#8ec5ff] to-[#a9bfff] px-3 text-xs font-medium text-black shadow-[0_4px_10px_rgba(142,197,255,0.24)] hover:from-[#7ab8ff] hover:to-[#98b4ff] disabled:opacity-60"
                      >
                        {isBusyAction ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Confirm"
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleDeclineTermination}
                        disabled={isBusyAction}
                        className="inline-flex h-8 items-center justify-center rounded-[9px] border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-[0_2px_8px_rgba(15,23,42,0.05)] hover:bg-slate-50 disabled:opacity-60"
                      >
                        {isBusyAction ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Decline"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </AppCard>
            </motion.div>
          )}

          {openFolder === null && (
            <>

              <div className="space-y-3">
                <SectionTitle>Settings Overview</SectionTitle>

                <FolderRow
                  icon={User}
                  title="Profile"
                  subtitle="Photo, name, location, email, date of birth"
                  onClick={() => setOpenFolder("profile")}
                />

                <FolderRow
                  icon={Lock}
                  title="Security"
                  subtitle="PIN and sign-in settings"
                  onClick={() => setOpenFolder("security")}
                />

                <AppCard className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-slate-100 text-slate-700">
                      <Sparkles className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800">
                            AI-Powered Insights
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Allow weekly AI summaries
                          </p>
                        </div>

                        <Switch
                          checked={!!user?.insights_consent}
                          onCheckedChange={async (checked) => {
                            try {
                              await settingsApi.updateMe({ insights_consent: checked });
                              await refreshUser();
                            } catch (e) {
                              console.error(e);
                              alert("Could not update setting.");
                            }
                          }}
                        />
                      </div>

                      {user?.relationship_status === "date_locked" ? (
                        <Button
                          asChild
                          variant="outline"
                          className="mt-3 h-9 w-full rounded-[10px] border-slate-200 bg-white text-xs font-medium text-slate-700 shadow-[0_2px_8px_rgba(15,23,42,0.05)] hover:bg-slate-50"
                        >
                          <Link to={createPageUrl("RelationshipInsights")}>
                            <Shield className="mr-1.5 h-4 w-4" />
                            View Insights Dashboard
                          </Link>
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </AppCard>

                <AppCard className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#eaf3ff] text-[#77aef7]">
                      <Heart className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800">
                            Relationship
                          </p>
                          <p className="mt-1 text-xs text-slate-500">
                            Current status and partner connection
                          </p>
                        </div>

                        <StatusBadge status={user?.relationship_status} />
                      </div>

                      {user?.partner_email ? (
                        <p className="mt-2 text-xs text-slate-500">
                          Partner: {user.partner_email}
                        </p>
                      ) : null}

                      {user?.relationship_status === "date_locked" ? (
                        <div className="mt-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => setShowTerminationDialog(true)}
                            className="inline-flex h-8 items-center justify-center rounded-[9px] border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-[0_2px_8px_rgba(15,23,42,0.05)] hover:bg-slate-50"
                          >
                            <AlertTriangle className="mr-1.5 h-3.5 w-3.5" />
                            Request
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowUnlockDialog(true)}
                            className="inline-flex h-8 items-center justify-center rounded-[9px] bg-gradient-to-r from-[#8ec5ff] to-[#a9bfff] px-3 text-xs font-medium text-black shadow-[0_4px_10px_rgba(142,197,255,0.24)] hover:from-[#7ab8ff] hover:to-[#98b4ff]"
                          >
                            <Unlock className="mr-1.5 h-3.5 w-3.5" />
                            Date-Unlock
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </AppCard>

                <AppCard className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-amber-100 text-amber-600">
                      <Archive className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800">Archive</p>
                          <p className="mt-1 text-xs text-slate-500">
                            {archivedMemories.length} archived memories
                          </p>
                        </div>

                        <div className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[11px] font-medium text-amber-700">
                          {archivedMemories.length}
                        </div>
                      </div>

                      {archivedMemories.length > 0 ? (
                        <Button
                          variant="outline"
                          onClick={() => setShowArchive((v) => !v)}
                          className="mt-3 h-9 w-full rounded-[10px] border-slate-200 bg-white text-xs font-medium text-slate-700 shadow-[0_2px_8px_rgba(15,23,42,0.05)] hover:bg-slate-50"
                        >
                          <Archive className="mr-1.5 h-4 w-4" />
                          {showArchive ? "Hide Archived Memories" : "View Archived Memories"}
                        </Button>
                      ) : (
                        <p className="mt-3 text-xs text-slate-500">
                          No archived memories yet
                        </p>
                      )}

                      {showArchive && archivedMemories.length > 0 ? (
                        <div className="mt-3 space-y-2">
                          {archivedMemories.slice(0, 50).map((memory) => (
                            <div
                              key={memory.id}
                              className="flex gap-3 rounded-[10px] border border-slate-200 bg-slate-50 p-3"
                            >
                              {memory.photos?.[0] ? (
                                <img
                                  src={memory.photos[0]}
                                  alt=""
                                  className="h-14 w-14 rounded-[10px] object-cover"
                                />
                              ) : (
                                <div className="flex h-14 w-14 items-center justify-center rounded-[10px] bg-slate-200">
                                  <ImageIcon className="h-5 w-5 text-slate-400" />
                                </div>
                              )}

                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-slate-800">
                                  {memory.title}
                                </p>
                                <p className="truncate text-xs text-slate-500">
                                  {memory.description}
                                </p>
                                {memory.date ? (
                                  <p className="mt-1 text-[11px] text-slate-400">
                                    {formatDisplayDate(memory.date)}
                                  </p>
                                ) : null}
                              </div>
                            </div>
                          ))}

                          {archivedMemories.length > 50 ? (
                            <p className="text-center text-[11px] text-slate-500">
                              Showing latest 50.
                            </p>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </AppCard>

                <AppCard className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-slate-100 text-slate-700">
                      <FileText className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800">Policies</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Review privacy and security details
                      </p>

                      <div className="mt-3 flex gap-2">
                        <Button
                          asChild
                          variant="outline"
                          className="h-8 flex-1 rounded-[9px] border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-[0_2px_8px_rgba(15,23,42,0.05)] hover:bg-slate-50"
                        >
                          <Link to={PRIVACY_POLICY_URL}>Privacy Policy</Link>
                        </Button>

                        <Button
                          asChild
                          variant="outline"
                          className="h-8 flex-1 rounded-[9px] border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-[0_2px_8px_rgba(15,23,42,0.05)] hover:bg-slate-50"
                        >
                          <Link to={SECURITY_POLICY_URL}>Security Policy</Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </AppCard>

                <AppCard className="p-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-red-100 text-red-500">
                      <AlertTriangle className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800">Account</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Deactivate account or log out
                      </p>

                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowDeactivateDialog(true)}
                          className="inline-flex h-8 items-center justify-center rounded-[9px] border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-[0_2px_8px_rgba(15,23,42,0.05)] hover:bg-slate-50"
                        >
                          Deactivate
                        </button>

                        <button
                          type="button"
                          onClick={handleLogout}
                          className="inline-flex h-8 items-center justify-center rounded-[9px] bg-gradient-to-r from-[#8ec5ff] to-[#a9bfff] px-3 text-xs font-medium text-black shadow-[0_4px_10px_rgba(142,197,255,0.24)] hover:from-[#7ab8ff] hover:to-[#98b4ff]"
                        >
                          <LogOut className="mr-1.5 h-3.5 w-3.5" />
                          Log Out
                        </button>
                      </div>
                    </div>
                  </div>
                </AppCard>
              </div>
            </>
          )}

          {openFolder === "profile" && (
            <div className="space-y-3">
              <button
  type="button"
  onClick={() => setOpenFolder(null)}
  className="flex h-[44px] w-full items-center justify-center rounded-[14px] bg-slate-100 text-sm font-medium text-slate-700"
>
  Back
</button>

              <SectionTitle>Profile</SectionTitle>

              <AppCard className="p-4">
                <div className="mb-5 flex justify-center">
  <div className="relative">
    <Avatar className="h-24 w-24 overflow-hidden rounded-full border-2 border-white bg-slate-100 shadow-[0_8px_18px_rgba(15,23,42,0.10)]">
      <AvatarImage
        src={formData.profile_photo || ""}
        alt={formData.full_name || "Profile"}
        className="h-full w-full object-cover"
      />
      <AvatarFallback className="bg-gradient-to-br from-rose-100 to-pink-100 text-2xl text-rose-500">
        {formData.full_name?.[0] || <User className="h-8 w-8" />}
      </AvatarFallback>
    </Avatar>

    <label className="absolute -bottom-1 -right-1 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-[#8ec5ff] to-[#a9bfff] shadow-[0_4px_10px_rgba(142,197,255,0.24)] transition hover:scale-105">
      <Camera className="h-5 w-5 text-black" />
      <input
        type="file"
        accept="image/*"
        onChange={handlePhotoUpload}
        className="hidden"
      />
    </label>
  </div>
</div>

                <div className="space-y-4">
                  <div>
                    <Label className="block mb-1 text-sm font-medium text-slate-700">
                      Full Name
                    </Label>
                    <Input
                      value={formData.full_name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          full_name: e.target.value,
                        }))
                      }
                      className="mt-2 h-10 rounded-[10px] border-slate-200 bg-white text-sm text-slate-800"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-slate-700">
                      Location
                    </Label>
                    <div className="relative mt-2">
                      <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        value={formData.location}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            location: e.target.value,
                          }))
                        }
                        className="h-10 rounded-[10px] border-slate-200 bg-white pl-10 text-sm text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-slate-700">Email</Label>
                    <div className="relative mt-2">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        value={user.email || ""}
                        disabled
                        className="h-10 rounded-[10px] border-slate-200 bg-slate-50 pl-10 text-sm text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-slate-700">
                      Date of Birth
                    </Label>
                    <div className="relative mt-2">
                      <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        value={formatDisplayDate(user?.date_of_birth)}
                        disabled
                        className="h-10 rounded-[10px] border-slate-200 bg-slate-50 pl-10 text-sm text-slate-800"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[10px] bg-gradient-to-r from-[#8ec5ff] to-[#a9bfff] text-black shadow-[0_4px_10px_rgba(142,197,255,0.24)] hover:from-[#7ab8ff] hover:to-[#98b4ff]"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </Button>
                </div>
              </AppCard>
            </div>
          )}

          {openFolder === "security" && (
            <div className="space-y-3">
              <Button
                variant="outline"
                onClick={() => setOpenFolder(null)}
                className="h-9 w-full rounded-[10px] border-slate-200 bg-white text-xs font-medium text-slate-700 shadow-[0_2px_8px_rgba(15,23,42,0.05)] hover:bg-slate-50"
              >
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Back
              </Button>

              <SectionTitle>Security</SectionTitle>

              <AppCard className="p-4">
                <div className="space-y-4">
                  <div className="rounded-[10px] border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm font-semibold text-slate-800">
                      Biometric Login
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      Biometric login will be handled later in native Android.
                    </p>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-slate-100">
                        <KeyRound className="h-4 w-4 text-slate-600" />
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-800">PIN</p>
                        <p className="text-xs text-slate-500">
                          {pinEnabled ? "Enabled" : "Disabled"}{" "}
                          {user?.pin_last_set_at
                            ? `• last set ${format(new Date(user.pin_last_set_at), "MMM d")}`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <Switch
                      checked={pinEnabled}
                      disabled={isAuthSaving}
                      onCheckedChange={handleTogglePin}
                    />
                  </div>

                  {pinEnabled ? (
                    <>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm font-medium text-slate-700">
                            New PIN
                          </Label>
                          <Input
                            value={pinNew}
                            onChange={(e) =>
                              setPinNew(e.target.value.replace(/\D/g, "").slice(0, 8))
                            }
                            placeholder="4–8 digits"
                            inputMode="numeric"
                            className="mt-2 h-10 rounded-[10px] border-slate-200 bg-white text-sm text-slate-800"
                          />
                        </div>

                        <div>
                          <Label className="text-sm font-medium text-slate-700">
                            Confirm
                          </Label>
                          <Input
                            value={pinConfirm}
                            onChange={(e) =>
                              setPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 8))
                            }
                            placeholder="Repeat PIN"
                            inputMode="numeric"
                            className="mt-2 h-10 rounded-[10px] border-slate-200 bg-white text-sm text-slate-800"
                          />
                        </div>
                      </div>

                      <Button
                        onClick={handleSetPin}
                        disabled={isAuthSaving}
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[10px] bg-gradient-to-r from-[#8ec5ff] to-[#a9bfff] text-black shadow-[0_4px_10px_rgba(142,197,255,0.24)] hover:from-[#7ab8ff] hover:to-[#98b4ff]"
                      >
                        {isAuthSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Set / Update PIN"
                        )}
                      </Button>

                      <p className="text-[11px] text-slate-500">
                        PIN is stored securely as a server-side hash.
                      </p>
                    </>
                  ) : null}

                  <Separator />

                  <div className="rounded-[10px] border border-slate-200 bg-slate-50 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs text-slate-500">Current preference</span>
                      <span className="text-xs font-semibold text-slate-800">
                        {authPref === "PIN" ? "PIN" : "Password"}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      asChild
                      variant="outline"
                      className="h-8 flex-1 rounded-[9px] border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-[0_2px_8px_rgba(15,23,42,0.05)] hover:bg-slate-50"
                    >
                      <Link to={PRIVACY_POLICY_URL}>Privacy Policy</Link>
                    </Button>

                    <Button
                      asChild
                      variant="outline"
                      className="h-8 flex-1 rounded-[9px] border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-[0_2px_8px_rgba(15,23,42,0.05)] hover:bg-slate-50"
                    >
                      <Link to={SECURITY_POLICY_URL}>Security Policy</Link>
                    </Button>
                  </div>
                </div>
              </AppCard>
            </div>
          )}
        </div>
      </AppShell>

      <BottomNav />

    </>
  );
}