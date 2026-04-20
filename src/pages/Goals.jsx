import React from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Target,
  Send,
  Calendar,
  MapPin,
  X,
  CheckCircle2,
  Clock3,
  Home as HomeIcon,
  Heart,
  Image as ImageIcon,
  MessageCircle,
  Fingerprint,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { supabase } from "@/lib/supabase";

const navItems = [
  { label: "Home", icon: HomeIcon, page: "Home" },
  { label: "Dating", icon: Heart, page: "Dating" },
  { label: "Memories", icon: ImageIcon, page: "Memories" },
  { label: "Goals", icon: Target, page: "Goals" },
  { label: "NightIn", icon: MapPin, page: "NightIn" },
  { label: "Chat", icon: MessageCircle, page: "Chat" },
  { label: "Verify", icon: Fingerprint, page: "VerifyStatus" },
];

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

function Modal({ open, onClose, title, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-3">
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

        <div className="space-y-4 px-4 py-4">{children}</div>
      </div>
    </div>
  );
}

function StatusBadge({ item }) {
  if (item.type === "event") {
    if (item.invitationStatus === "pending") {
      return (
        <div className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[11px] font-medium text-amber-700">
          <Clock3 className="h-3 w-3" />
          Pending
        </div>
      );
    }

    if (item.invitationStatus === "accepted") {
      return (
        <div className="inline-flex items-center gap-1 rounded-full bg-[#eaf3ff] px-2 py-1 text-[11px] font-medium text-[#77aef7]">
          <CheckCircle2 className="h-3 w-3" />
          Active
        </div>
      );
    }

    if (item.invitationStatus === "declined") {
      return (
        <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
          Declined
        </div>
      );
    }
  }

  if (item.status === "completed") {
    return (
      <div className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-[11px] font-medium text-green-700">
        <CheckCircle2 className="h-3 w-3" />
        Done
      </div>
    );
  }

  if (item.status === "in_progress") {
    return (
      <div className="inline-flex items-center gap-1 rounded-full bg-[#eaf3ff] px-2 py-1 text-[11px] font-medium text-[#77aef7]">
        Active
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-600">
      Planned
    </div>
  );
}

function BottomNav() {
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#ece6ea] bg-white/95 pb-2 pt-2 shadow-[0_-6px_18px_rgba(15,23,42,0.06)] backdrop-blur">
      <div className="mx-auto grid w-full max-w-[390px] grid-cols-7 gap-1 px-2">
        {navItems.map((item) => {
          const href = createPageUrl(item.page);
          const active =
            location.pathname === href || (href === "/" && location.pathname === "/");
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              to={href}
              className={`flex min-h-[64px] flex-col items-center justify-center rounded-[16px] px-1 py-2 transition ${
                active ? "bg-[#fdecef]" : "bg-transparent"
              }`}
            >
              <Icon
                className={`mb-1 h-5 w-5 ${
                  active ? "text-[#ef4f75]" : "text-slate-400"
                }`}
                strokeWidth={2.1}
              />
              <span
                className={`truncate text-[9px] leading-tight ${
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

function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function Goals() {
  const [items, setItems] = React.useState([]);
  const [statusFilter, setStatusFilter] = React.useState("all");

  const [showGoalModal, setShowGoalModal] = React.useState(false);
  const [showEventModal, setShowEventModal] = React.useState(false);

  const [goalTitle, setGoalTitle] = React.useState("");
  const [goalDescription, setGoalDescription] = React.useState("");
  const [goalDate, setGoalDate] = React.useState("");

  const [eventTitle, setEventTitle] = React.useState("");
  const [eventLocation, setEventLocation] = React.useState("");

  React.useEffect(() => {
    const loadGoals = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.error("LOAD AUTH ERROR:", userError);
        return;
      }

      const coupleId = user?.user_metadata?.couple_profile_id || null;

      let query = supabase
        .from("couple_goals")
        .select("*")
        .order("created_at", { ascending: false });

      if (coupleId) {
        query = query.eq("couple_profile_id", coupleId);
      } else {
        query = query.eq("owner_id", user.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error("LOAD ERROR:", error);
        return;
      }

      if (data) {
        const mapped = data.map((item) => ({
          ...item,
          targetDate: item.target_date ?? item.targetDate ?? "",
          invitationStatus: item.invitation_status ?? item.invitationStatus ?? "",
        }));

        setItems(mapped);
      }
    };

    loadGoals();
  }, []);

  const filteredItems = React.useMemo(() => {
    if (statusFilter === "all") return items;

    return items.filter((item) => {
      if (statusFilter === "planned") {
        if (item.type === "event") return item.invitationStatus === "pending";
        return item.status === "planned";
      }

      if (statusFilter === "in_progress") {
        if (item.type === "event") return item.invitationStatus === "accepted";
        return item.status === "in_progress";
      }

      if (statusFilter === "completed") {
        if (item.type === "event") return false;
        return item.status === "completed";
      }

      return true;
    });
  }, [items, statusFilter]);

  const stats = React.useMemo(() => {
    let planned = 0;
    let inProgress = 0;
    let completed = 0;
    let pending = 0;

    for (const item of items) {
      if (item.type === "event") {
        if (item.invitationStatus === "pending") pending += 1;
        else if (item.invitationStatus === "accepted") inProgress += 1;
      } else {
        if (item.status === "planned") planned += 1;
        else if (item.status === "in_progress") inProgress += 1;
        else if (item.status === "completed") completed += 1;
      }
    }

    return { planned, inProgress, completed, pending };
  }, [items]);

  const handleAddGoal = async () => {
    if (!goalTitle.trim()) {
      alert("Enter a goal title first.");
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("AUTH ERROR:", userError);
      alert("Could not get logged in user.");
      return;
    }

    const coupleId = user?.user_metadata?.couple_profile_id || null;
    console.log("USER:", user);
    console.log("COUPLE ID:", coupleId);

    const newGoal = {
      id: crypto.randomUUID(),
      owner_id: user.id,
      couple_profile_id: coupleId,
      title: goalTitle.trim(),
      description: goalDescription.trim(),
      target_date: goalDate || null,
      status: "planned",
      type: "goal",
    };

    const { data, error } = await supabase
      .from("couple_goals")
      .insert(newGoal)
      .select()
      .single();

    console.log("ADD GOAL RESULT:", { data, error });

    if (error) {
      console.error("ADD GOAL ERROR:", error);
      alert(error.message || "Failed to save goal.");
      return;
    }

    setItems((prev) => [
      {
        ...data,
        targetDate: data.target_date ?? "",
        invitationStatus: data.invitation_status ?? "",
      },
      ...prev,
    ]);

    setGoalTitle("");
    setGoalDescription("");
    setGoalDate("");
    setShowGoalModal(false);
  };

  const handleCreateInvitation = async () => {
    if (!eventTitle.trim()) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const coupleId = user?.user_metadata?.couple_profile_id;
    if (!coupleId) return;

    const newEvent = {
      id: crypto.randomUUID(),
      couple_profile_id: coupleId,
      title: eventTitle.trim(),
      description: eventLocation.trim()
        ? `Location: ${eventLocation.trim()}`
        : "Waiting for partner response",
      status: "pending",
      invitation_status: "pending",
      type: "event",
      invitedPartner: true,
    };

    const { data, error } = await supabase
      .from("couple_goals")
      .insert(newEvent)
      .select()
      .single();

    if (error) {
      console.error("CREATE EVENT ERROR:", error);
      return;
    }

    setItems((prev) => [
      {
        ...data,
        targetDate: data.target_date ?? "",
        invitationStatus: data.invitation_status ?? "",
      },
      ...prev,
    ]);

    setEventTitle("");
    setEventLocation("");
    setShowEventModal(false);
  };

  const acceptInvitation = async (id) => {
    const { data, error } = await supabase
      .from("couple_goals")
      .update({
        invitation_status: "accepted",
        status: "in_progress",
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("ACCEPT ERROR:", error);
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              ...data,
              invitationStatus: "accepted",
              status: "in_progress",
            }
          : item
      )
    );
  };

  const declineInvitation = async (id) => {
    const { data, error } = await supabase
      .from("couple_goals")
      .update({
        invitation_status: "declined",
        status: "declined",
        description: "Invitation declined",
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("DECLINE ERROR:", error);
      return;
    }

    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              ...data,
              invitationStatus: "declined",
              status: "declined",
              description: "Invitation declined",
            }
          : item
      )
    );
  };

  return (
    <>
      <AppShell>
        <AppHeader title="Our Goals" />

        <div className="space-y-4 px-3 py-3">
          <div className="grid grid-cols-2 gap-2">
            <SmallActionButton
              onClick={() => setShowGoalModal(true)}
              icon={<Target className="h-4 w-4 text-slate-700" />}
              text="Add a Goal"
            />

            <SmallActionButton
              onClick={() => setShowEventModal(true)}
              icon={<Send className="h-4 w-4 text-slate-700" />}
              text="Event Invitation"
            />
          </div>

          <div className="grid grid-cols-4 gap-2">
            <StatCard value={stats.planned} label="Planned" tone="slate" />
            <StatCard value={stats.pending} label="Pending" tone="amber" />
            <StatCard value={stats.inProgress} label="Active" tone="blue" />
            <StatCard value={stats.completed} label="Done" tone="green" />
          </div>

          <AppCard className="bg-slate-100 p-1">
            <div className="flex gap-1">
              {[
                { key: "all", label: "All" },
                { key: "planned", label: "Planned" },
                { key: "in_progress", label: "Active" },
                { key: "completed", label: "Done" },
              ].map((tab) => (
                <TabButton
                  key={tab.key}
                  active={statusFilter === tab.key}
                  onClick={() => setStatusFilter(tab.key)}
                >
                  {tab.label}
                </TabButton>
              ))}
            </div>
          </AppCard>

          <div className="space-y-3">
            <SectionTitle>
              {statusFilter === "all"
                ? "All Goals & Invitations"
                : statusFilter === "planned"
                ? "Planned & Pending"
                : statusFilter === "in_progress"
                ? "Active Items"
                : "Completed Goals"}
            </SectionTitle>

            {filteredItems.length > 0 ? (
              <div className="space-y-3">
                {filteredItems.map((item) => (
                  <AppCard key={item.id} className="p-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] ${
                          item.type === "event"
                            ? "bg-[#eaf3ff] text-[#77aef7]"
                            : "bg-slate-100 text-slate-700"
                        }`}
                      >
                        {item.type === "event" ? (
                          <Calendar className="h-4 w-4" />
                        ) : (
                          <Target className="h-4 w-4" />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-800">
                              {item.title}
                            </div>

                            {item.description ? (
                              <p className="mt-1 text-xs text-slate-500">
                                {item.description}
                              </p>
                            ) : null}

                            {item.type === "goal" && item.targetDate ? (
                              <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-600">
                                <Calendar className="h-3 w-3" />
                                {formatDate(item.targetDate)}
                              </div>
                            ) : null}
                          </div>

                          <StatusBadge item={item} />
                        </div>

                        {item.type === "event" &&
                        item.invitationStatus === "pending" ? (
                          <div className="mt-3 flex gap-2">
                            <button
                              type="button"
                              onClick={() => acceptInvitation(item.id)}
                              className="inline-flex h-8 items-center justify-center rounded-[9px] bg-gradient-to-r from-[#8ec5ff] to-[#a9bfff] px-3 text-xs font-medium text-black shadow-[0_4px_10px_rgba(142,197,255,0.24)] hover:from-[#7ab8ff] hover:to-[#98b4ff]"
                            >
                              Accept
                            </button>

                            <button
                              type="button"
                              onClick={() => declineInvitation(item.id)}
                              className="inline-flex h-8 items-center justify-center rounded-[9px] border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 shadow-[0_2px_8px_rgba(15,23,42,0.05)] hover:bg-slate-50"
                            >
                              Decline
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </AppCard>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Target className="h-8 w-8 text-slate-300" />}
                title="No goals yet"
                text="Start building your future together"
              />
            )}
          </div>
        </div>
      </AppShell>

      <Modal
        open={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        title="Add a Goal"
      >
        <AppCard className="p-4">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Goal Title
          </label>
          <input
            type="text"
            value={goalTitle}
            onChange={(e) => setGoalTitle(e.target.value)}
            placeholder="Enter your goal..."
            className="mb-4 h-10 w-full rounded-[10px] border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#8ec5ff]"
          />

          <label className="mb-2 block text-sm font-medium text-slate-700">
            Description
          </label>
          <textarea
            value={goalDescription}
            onChange={(e) => setGoalDescription(e.target.value)}
            placeholder="Add more detail..."
            className="mb-4 min-h-[90px] w-full rounded-[10px] border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#8ec5ff]"
          />

          <label className="mb-2 block text-sm font-medium text-slate-700">
            Goal Date
          </label>
          <input
            type="date"
            value={goalDate}
            onChange={(e) => setGoalDate(e.target.value)}
            className="h-10 w-full rounded-[10px] border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#8ec5ff]"
          />
        </AppCard>

        <Button
          type="button"
          onClick={handleAddGoal}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[10px] bg-gradient-to-r from-[#8ec5ff] to-[#a9bfff] text-black shadow-[0_4px_10px_rgba(142,197,255,0.24)] hover:from-[#7ab8ff] hover:to-[#98b4ff]"
        >
          <Target className="h-4 w-4" />
          <span>Save Goal</span>
        </Button>
      </Modal>

      <Modal
        open={showEventModal}
        onClose={() => setShowEventModal(false)}
        title="Event Invitation"
      >
        <AppCard className="p-4">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Event Title
          </label>
          <input
            type="text"
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            placeholder="Enter event title..."
            className="mb-4 h-10 w-full rounded-[10px] border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#8ec5ff]"
          />

          <label className="mb-2 block text-sm font-medium text-slate-700">
            Location
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={eventLocation}
              onChange={(e) => setEventLocation(e.target.value)}
              placeholder="Add location..."
              className="h-10 w-full rounded-[10px] border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#8ec5ff]"
            />
          </div>
        </AppCard>

        <Button
          type="button"
          onClick={handleCreateInvitation}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-[10px] bg-gradient-to-r from-[#8ec5ff] to-[#a9bfff] text-black shadow-[0_4px_10px_rgba(142,197,255,0.24)] hover:from-[#7ab8ff] hover:to-[#98b4ff]"
        >
          <Send className="h-4 w-4" />
          <span>Create Invitation</span>
        </Button>
      </Modal>

      <BottomNav />
    </>
  );
}