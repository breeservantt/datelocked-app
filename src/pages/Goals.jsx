import React from "react";
import { Button } from "@/components/ui/button";
import {
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
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { supabase } from "@/lib/supabase";

const GOAL_SELECT = `
  id,
  owner_id,
  couple_profile_id,
  title,
  description,
  target_date,
  status,
  type,
  invitation_status,
  place_name,
  place_photo_url,
  place_id,
  created_at
`;

const navItems = [
  { label: "Home", icon: HomeIcon, page: "Home" },
  { label: "Dating", icon: Heart, page: "Dating" },
  { label: "Memories", icon: ImageIcon, page: "Memories" },
  { label: "Goals", icon: Target, page: "Goals" },
  { label: "NightIn", icon: MapPin, page: "NightIn" },
  { label: "Chat", icon: MessageCircle, page: "Chat" },
  { label: "Verify", icon: Fingerprint, page: "VerifyStatus" },
];

function isFutureOrToday(dateString) {
  if (!dateString) return true;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const target = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(target.getTime())) return true;

  return target >= today;
}

function normalizeItem(item) {
  return {
    ...item,
    targetDate: item.target_date ?? "",
    invitationStatus: item.invitation_status ?? "",
    placeName: item.place_name ?? "",
    placePhotoUrl: item.place_photo_url ?? "",
    placeId: item.place_id ?? "",
    status: item.status || "planned",
    type: item.type || "goal",
  };
}

async function getCurrentProfileUser() {
  const {
    data: { user: authUser },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError) throw authError;
  if (!authUser) return null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id,email,couple_profile_id")
    .eq("id", authUser.id)
    .maybeSingle();

  if (error) throw error;

  return {
    id: authUser.id,
    email: authUser.email,
    couple_profile_id: profile?.couple_profile_id || null,
  };
}

async function getPlacePhoto({ locationText, titleText, selectedPlace }) {
  const query = [
    selectedPlace?.name || locationText,
    titleText,
    selectedPlace?.address,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (!query && !selectedPlace?.placeId) return null;

  try {
    const { data, error } = await supabase.functions.invoke("fetch-place-photo", {
      body: {
        query,
        placeId: selectedPlace?.placeId || null,
      },
    });

    if (error) throw error;
    return data || null;
  } catch (error) {
    console.warn("PLACE PHOTO LOOKUP FAILED:", error);
    return null;
  }
}

function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-[#f3edf1] px-2 py-2 pb-24">
      <div className="mx-auto w-full max-w-[410px] overflow-hidden rounded-[28px] border border-[#e8e2e7] bg-[#f7f3f6] shadow-[0_12px_40px_rgba(15,23,42,0.10)]">
        {children}
      </div>
    </div>
  );
}

function AppHeader({ title }) {
  return (
    <div className="bg-gradient-to-r from-[#5e9cff] via-[#2f6df0] to-[#6aa7ff] px-5 pb-6 pt-7">
      <h1 className="text-[22px] font-semibold tracking-[-0.02em] text-white">
        {title}
      </h1>
      <p className="mt-1 text-[11px] font-medium text-white/75">
        Goals, event invites, and shared plans
      </p>
    </div>
  );
}

function AppCard({ children, className = "" }) {
  return (
    <div
      className={`overflow-hidden rounded-[22px] border border-white/70 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.06)] ${className}`}
    >
      {children}
    </div>
  );
}

function SectionTitle({ children }) {
  return <h2 className="text-[15px] font-semibold text-[#172033]">{children}</h2>;
}

function StatCard({ value, label, tone = "slate" }) {
  const tones = {
    slate: "from-slate-50 to-white text-slate-800",
    blue: "from-[#eaf3ff] to-white text-[#2f6df0]",
    green: "from-green-50 to-white text-green-600",
    amber: "from-amber-50 to-white text-amber-600",
  };

  return (
    <div
      className={`rounded-[18px] bg-gradient-to-br px-2 py-3 text-center shadow-[0_8px_18px_rgba(15,23,42,0.06)] ${tones[tone]}`}
    >
      <p className="text-[20px] font-bold leading-none">{value}</p>
      <p className="mt-2 truncate text-[10px] font-medium text-slate-500">
        {label}
      </p>
    </div>
  );
}

function SmallActionButton({ onClick, icon, text, primary = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-[48px] flex-1 items-center justify-center rounded-[16px] px-3 shadow-[0_8px_18px_rgba(15,23,42,0.08)] transition active:scale-[0.98] ${
        primary
          ? "bg-gradient-to-r from-[#8ec5ff] to-[#a9bfff] text-[#172033]"
          : "bg-white text-slate-700"
      }`}
    >
      <div className="flex items-center justify-center gap-2">
        {icon}
        <span className="text-[13px] font-semibold">{text}</span>
      </div>
    </button>
  );
}

function TabButton({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-[14px] py-2 text-[11px] font-semibold transition ${
        active
          ? "bg-white text-[#2f6df0] shadow-[0_6px_14px_rgba(15,23,42,0.08)]"
          : "text-slate-500"
      }`}
    >
      {children}
    </button>
  );
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-3">
      <div className="w-full max-w-[390px] overflow-hidden rounded-[24px] border border-[#ece6ea] bg-[#f7f4f6] shadow-[0_12px_30px_rgba(15,23,42,0.14)]">
        <div className="bg-gradient-to-r from-[#5e9cff] via-[#2f6df0] to-[#6aa7ff] px-4 py-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full bg-white/90 p-1.5 text-slate-700 transition active:scale-95"
            >
              <X className="h-5 w-5" />
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
        <div className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[11px] font-semibold text-amber-700">
          <Clock3 className="h-3 w-3" />
          Pending
        </div>
      );
    }

    if (item.invitationStatus === "accepted") {
      return (
        <div className="inline-flex items-center gap-1 rounded-full bg-[#eaf3ff] px-2 py-1 text-[11px] font-semibold text-[#2f6df0]">
          <CheckCircle2 className="h-3 w-3" />
          Active
        </div>
      );
    }
  }

  if (item.status === "completed") {
    return (
      <div className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-1 text-[11px] font-semibold text-green-700">
        <CheckCircle2 className="h-3 w-3" />
        Done
      </div>
    );
  }

  if (item.status === "in_progress") {
    return (
      <div className="inline-flex items-center gap-1 rounded-full bg-[#eaf3ff] px-2 py-1 text-[11px] font-semibold text-[#2f6df0]">
        Active
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-600">
      Planned
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

function formatDate(dateString) {
  if (!dateString) return "";
  const date = new Date(`${dateString}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function EventImage({ item }) {
  if (item.type !== "event" || !item.placePhotoUrl) return null;

  return (
    <div className="mb-3 overflow-hidden rounded-[18px] bg-slate-100">
      <img
        src={item.placePhotoUrl}
        alt={item.placeName || item.title || "Event location"}
        className="h-[130px] w-full object-cover"
        loading="lazy"
      />
    </div>
  );
}

function EmptyState() {
  return (
    <AppCard className="px-4 py-8">
      <div className="flex min-h-[190px] flex-col items-center justify-center text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#eaf3ff] shadow-[0_8px_18px_rgba(15,23,42,0.08)]">
          <Target className="h-8 w-8 text-[#2f6df0]" />
        </div>
        <h3 className="text-[20px] font-semibold leading-none text-slate-700">
          No goals yet
        </h3>
        <p className="mt-3 text-center text-sm text-slate-500">
          Start building your future together
        </p>
      </div>
    </AppCard>
  );
}

const GoalItem = React.memo(function GoalItem({
  item,
  currentUserId,
  openActionsId,
  onToggleActions,
  onEdit,
  onDelete,
  onAccept,
  onDecline,
}) {
  const isInviteSender = item.type === "event" && item.owner_id === currentUserId;

  const canRespondToInvite =
    item.type === "event" &&
    item.invitationStatus === "pending" &&
    !isInviteSender;

  return (
    <AppCard className="p-3">
      <EventImage item={item} />

      <button
        type="button"
        onClick={() => onToggleActions(item.id)}
        className="block w-full text-left"
      >
        <div className="flex items-start gap-3">
          <div
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] ${
              item.type === "event"
                ? "bg-[#eaf3ff] text-[#2f6df0]"
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
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[14px] font-semibold text-[#172033]">
                  {item.title}
                </div>

                {item.description ? (
                  <p className="mt-1 text-[12px] text-slate-500">
                    {item.description}
                  </p>
                ) : null}

                {item.placeName ? (
                  <p className="mt-1 text-[11px] font-medium text-[#2f6df0]">
                    {item.placeName}
                  </p>
                ) : null}

                {item.targetDate ? (
                  <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-600">
                    <Calendar className="h-3 w-3" />
                    {formatDate(item.targetDate)}
                  </div>
                ) : null}

                {isInviteSender && item.invitationStatus === "pending" ? (
                  <div className="mt-2 inline-flex rounded-full bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-600">
                    Waiting for partner
                  </div>
                ) : null}
              </div>

              <StatusBadge item={item} />
            </div>
          </div>
        </div>
      </button>

      {openActionsId === item.id ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[12px] bg-slate-100 px-3 text-xs font-semibold text-slate-700 hover:bg-slate-200"
          >
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </button>

          <button
            type="button"
            onClick={() => onDelete(item)}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-[12px] bg-red-50 px-3 text-xs font-semibold text-red-500 hover:bg-red-100"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </button>
        </div>
      ) : null}

      {canRespondToInvite ? (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => onAccept(item.id)}
            className="inline-flex h-9 items-center justify-center rounded-[12px] bg-gradient-to-r from-[#8ec5ff] to-[#a9bfff] px-4 text-xs font-semibold text-black shadow-[0_4px_10px_rgba(142,197,255,0.24)]"
          >
            Accept
          </button>

          <button
            type="button"
            onClick={() => onDecline(item.id)}
            className="inline-flex h-9 items-center justify-center rounded-[12px] border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-700 shadow-[0_2px_8px_rgba(15,23,42,0.05)]"
          >
            Decline
          </button>
        </div>
      ) : null}
    </AppCard>
  );
});

export default function Goals() {
  const [items, setItems] = React.useState([]);
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [openActionsId, setOpenActionsId] = React.useState(null);
  const [currentUserId, setCurrentUserId] = React.useState(null);

  const [showGoalModal, setShowGoalModal] = React.useState(false);
  const [showEventModal, setShowEventModal] = React.useState(false);

  const [goalTitle, setGoalTitle] = React.useState("");
  const [goalDescription, setGoalDescription] = React.useState("");
  const [goalDate, setGoalDate] = React.useState("");

  const [eventTitle, setEventTitle] = React.useState("");
  const [eventLocation, setEventLocation] = React.useState("");
  const [eventDate, setEventDate] = React.useState("");
  const [isFetchingPlace, setIsFetchingPlace] = React.useState(false);

  const [placeSuggestions, setPlaceSuggestions] = React.useState([]);
  const [selectedPlace, setSelectedPlace] = React.useState(null);
  const [isSearchingPlaces, setIsSearchingPlaces] = React.useState(false);

  const [editingItem, setEditingItem] = React.useState(null);
  const [editTitle, setEditTitle] = React.useState("");
  const [editDescription, setEditDescription] = React.useState("");
  const [editDate, setEditDate] = React.useState("");
  const [editStatus, setEditStatus] = React.useState("planned");

  const realtimeChannelsRef = React.useRef([]);

  React.useEffect(() => {
    const query = eventLocation.trim();

    if (query.length < 3) {
      setPlaceSuggestions([]);
      setIsSearchingPlaces(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingPlaces(true);

      try {
        const { data, error } = await supabase.functions.invoke(
          "search-place-suggestions",
          { body: { query } }
        );

        if (error) throw error;
        setPlaceSuggestions(data?.suggestions || []);
      } catch (error) {
        console.warn("PLACE SEARCH FAILED:", error);
        setPlaceSuggestions([]);
      } finally {
        setIsSearchingPlaces(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [eventLocation]);

  const loadGoals = React.useCallback(async () => {
    const currentUser = await getCurrentProfileUser();
    if (!currentUser) return;

    setCurrentUserId(currentUser.id);

    const coupleId = currentUser.couple_profile_id;

    let query = supabase
      .from("couple_goals")
      .select(GOAL_SELECT)
      .order("created_at", { ascending: false });

    query = coupleId
      ? query.eq("couple_profile_id", coupleId)
      : query.eq("owner_id", currentUser.id);

    const { data, error } = await query;

    if (error) {
      console.error("LOAD ERROR:", error);
      return;
    }

    const cleanItems = (data || [])
      .map(normalizeItem)
      .filter((item) => {
        if (item.type === "event" && item.invitationStatus === "declined") {
          return false;
        }

        return isFutureOrToday(item.targetDate);
      });

    setItems(cleanItems);
  }, []);

  React.useEffect(() => {
    let isMounted = true;

    const cleanupChannels = async () => {
      for (const channel of realtimeChannelsRef.current) {
        await supabase.removeChannel(channel);
      }

      realtimeChannelsRef.current = [];
    };

    const setup = async () => {
      await cleanupChannels();

      const currentUser = await getCurrentProfileUser();

      if (!isMounted || !currentUser?.id) return;

      setCurrentUserId(currentUser.id);
      await loadGoals();

      const uniqueId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random()}`;

      const profileChannel = supabase
        .channel(`profile-watch-${currentUser.id}-${uniqueId}`)
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "profiles",
            filter: `id=eq.${currentUser.id}`,
          },
          loadGoals
        );

      profileChannel.subscribe();
      realtimeChannelsRef.current.push(profileChannel);

      const goalsChannelName = currentUser.couple_profile_id
        ? `goals-realtime-${currentUser.couple_profile_id}-${uniqueId}`
        : `goals-realtime-user-${currentUser.id}-${uniqueId}`;

      const goalsFilter = currentUser.couple_profile_id
        ? `couple_profile_id=eq.${currentUser.couple_profile_id}`
        : `owner_id=eq.${currentUser.id}`;

      const goalsChannel = supabase
        .channel(goalsChannelName)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "couple_goals",
            filter: goalsFilter,
          },
          loadGoals
        );

      goalsChannel.subscribe();
      realtimeChannelsRef.current.push(goalsChannel);
    };

    setup();

    return () => {
      isMounted = false;

      for (const channel of realtimeChannelsRef.current) {
        supabase.removeChannel(channel);
      }

      realtimeChannelsRef.current = [];
    };
  }, [loadGoals]);

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
    return items.reduce(
      (acc, item) => {
        if (item.type === "event") {
          if (item.invitationStatus === "pending") acc.pending += 1;
          if (item.invitationStatus === "accepted") acc.inProgress += 1;
          return acc;
        }

        if (item.status === "completed") acc.completed += 1;
        else if (item.status === "in_progress") acc.inProgress += 1;
        else acc.planned += 1;

        return acc;
      },
      { planned: 0, pending: 0, inProgress: 0, completed: 0 }
    );
  }, [items]);

  const sectionLabel = React.useMemo(() => {
    if (statusFilter === "planned") return "Planned & Pending";
    if (statusFilter === "in_progress") return "Active Items";
    if (statusFilter === "completed") return "Completed Goals";
    return "All Goals & Invitations";
  }, [statusFilter]);

  const resetGoalForm = React.useCallback(() => {
    setGoalTitle("");
    setGoalDescription("");
    setGoalDate("");
  }, []);

  const resetEventForm = React.useCallback(() => {
    setEventTitle("");
    setEventLocation("");
    setEventDate("");
    setSelectedPlace(null);
    setPlaceSuggestions([]);
    setIsSearchingPlaces(false);
  }, []);

  const handleAddGoal = React.useCallback(async () => {
    if (!goalTitle.trim()) {
      alert("Enter a goal title first.");
      return;
    }

    const currentUser = await getCurrentProfileUser();

    if (!currentUser?.id) {
      alert("User profile not loaded.");
      return;
    }

    const { data, error } = await supabase
      .from("couple_goals")
      .insert({
        owner_id: currentUser.id,
        couple_profile_id: currentUser.couple_profile_id || null,
        title: goalTitle.trim(),
        description: goalDescription.trim(),
        target_date: goalDate || null,
        status: "planned",
        type: "goal",
      })
      .select(GOAL_SELECT)
      .single();

    if (error) {
      console.error("ADD GOAL ERROR:", error);
      alert(error.message || "Failed to save goal.");
      return;
    }

    const newItem = normalizeItem(data);

    setItems((prev) =>
      [newItem, ...prev].filter((item) => isFutureOrToday(item.targetDate))
    );

    resetGoalForm();
    setShowGoalModal(false);
  }, [goalTitle, goalDescription, goalDate, resetGoalForm]);

  const handleCreateInvitation = React.useCallback(async () => {
    if (!eventTitle.trim()) {
      alert("Enter event title first.");
      return;
    }

    const currentUser = await getCurrentProfileUser();

    if (!currentUser?.id) {
      alert("User profile not loaded.");
      return;
    }

    if (!currentUser.couple_profile_id) {
      alert("You must be Date-Locked before creating shared event invites.");
      return;
    }

    setIsFetchingPlace(true);

    try {
      const locationText = eventLocation.trim();

      const { data, error } = await supabase
        .from("couple_goals")
        .insert({
          owner_id: currentUser.id,
          couple_profile_id: currentUser.couple_profile_id,
          title: eventTitle.trim(),
          description: locationText
            ? `Location: ${locationText}`
            : "Waiting for partner response",
          target_date: eventDate || null,
          status: "pending",
          invitation_status: "pending",
          type: "event",
          place_name: selectedPlace?.name || null,
          place_id: selectedPlace?.placeId || null,
        })
        .select(GOAL_SELECT)
        .single();

      if (error) {
        console.error("CREATE EVENT ERROR:", error);
        alert(error.message || "Failed to create invitation.");
        return;
      }

      let finalEvent = normalizeItem(data);

      const placeData = await getPlacePhoto({
        locationText,
        titleText: eventTitle.trim(),
        selectedPlace,
      });

      if (placeData?.photoUrl || placeData?.placePhotoUrl || selectedPlace?.placeId) {
        const { data: updatedEvent, error: updateError } = await supabase
          .from("couple_goals")
          .update({
            place_name:
              placeData?.placeName ||
              placeData?.name ||
              selectedPlace?.name ||
              locationText ||
              null,
            place_photo_url: placeData?.photoUrl || placeData?.placePhotoUrl || null,
            place_id:
              placeData?.placeId ||
              placeData?.id ||
              selectedPlace?.placeId ||
              null,
          })
          .eq("id", data.id)
          .select(GOAL_SELECT)
          .single();

        if (!updateError && updatedEvent) {
          finalEvent = normalizeItem(updatedEvent);
        }
      }

      setItems((prev) =>
        [finalEvent, ...prev].filter((item) => isFutureOrToday(item.targetDate))
      );

      resetEventForm();
      setShowEventModal(false);
    } finally {
      setIsFetchingPlace(false);
    }
  }, [eventTitle, eventLocation, eventDate, selectedPlace, resetEventForm]);

  const acceptInvitation = React.useCallback(async (id) => {
    const { data, error } = await supabase
      .from("couple_goals")
      .update({
        invitation_status: "accepted",
        status: "in_progress",
      })
      .eq("id", id)
      .select(GOAL_SELECT)
      .single();

    if (error) {
      console.error("ACCEPT ERROR:", error);
      alert(error.message || "Failed to accept invitation.");
      return;
    }

    setItems((prev) =>
      prev.map((item) => (item.id === id ? normalizeItem(data) : item))
    );
  }, []);

  const declineInvitation = React.useCallback(async (id) => {
    const { error } = await supabase.from("couple_goals").delete().eq("id", id);

    if (error) {
      console.error("DECLINE ERROR:", error);
      alert(error.message || "Failed to decline invitation.");
      return;
    }

    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const openEditModal = React.useCallback((item) => {
    setEditingItem(item);
    setEditTitle(item.title || "");
    setEditDescription(item.description || "");
    setEditDate(item.targetDate || "");
    setEditStatus(
      item.type === "event" ? item.status || "pending" : item.status || "planned"
    );
  }, []);

  const handleUpdateItem = React.useCallback(async () => {
    if (!editingItem?.id) return;

    if (!editTitle.trim()) {
      alert("Enter a title first.");
      return;
    }

    const payload = {
      title: editTitle.trim(),
      description: editDescription.trim(),
      status: editStatus,
      target_date: editDate || null,
    };

    if (editingItem.type === "event") {
      if (editStatus === "in_progress") payload.invitation_status = "accepted";
      if (editStatus === "pending") payload.invitation_status = "pending";
    }

    const { data, error } = await supabase
      .from("couple_goals")
      .update(payload)
      .eq("id", editingItem.id)
      .select(GOAL_SELECT)
      .single();

    if (error) {
      console.error("UPDATE ERROR:", error);
      alert(error.message || "Failed to update item.");
      return;
    }

    const updated = normalizeItem(data);

    setItems((prev) =>
      prev
        .map((item) => (item.id === editingItem.id ? updated : item))
        .filter((item) => isFutureOrToday(item.targetDate))
    );

    setEditingItem(null);
  }, [editingItem, editTitle, editDescription, editStatus, editDate]);

  const handleDeleteItem = React.useCallback(async (item) => {
    if (!item?.id) return;

    const confirmed = window.confirm("Delete this item? This cannot be undone.");
    if (!confirmed) return;

    const { error } = await supabase.from("couple_goals").delete().eq("id", item.id);

    if (error) {
      console.error("DELETE ERROR:", error);
      alert(error.message || "Failed to delete item.");
      return;
    }

    setItems((prev) => prev.filter((row) => row.id !== item.id));
  }, []);

  const toggleActions = React.useCallback((id) => {
    setOpenActionsId((current) => (current === id ? null : id));
  }, []);

  return (
    <>
      <AppShell>
        <AppHeader title="Our Goals" />

        <div className="-mt-2 space-y-4 px-4 pb-6 pt-4">
          <div className="grid grid-cols-2 gap-3">
            <SmallActionButton
              onClick={() => setShowGoalModal(true)}
              icon={<Target className="h-4 w-4" />}
              text="Add a Goal"
            />

            <SmallActionButton
              onClick={() => setShowEventModal(true)}
              icon={<Send className="h-4 w-4" />}
              text="Events"
              primary
            />
          </div>

          <div className="grid grid-cols-4 gap-2">
            <StatCard value={stats.planned} label="Planned" tone="slate" />
            <StatCard value={stats.pending} label="Pending" tone="amber" />
            <StatCard value={stats.inProgress} label="Active" tone="blue" />
            <StatCard value={stats.completed} label="Done" tone="green" />
          </div>

          <div className="flex gap-1 rounded-[18px] bg-slate-100/80 p-1">
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

          <div className="space-y-3">
            <SectionTitle>{sectionLabel}</SectionTitle>

            {filteredItems.length > 0 ? (
              <div className="space-y-3">
                {filteredItems.map((item) => (
                  <GoalItem
                    key={item.id}
                    item={item}
                    currentUserId={currentUserId}
                    openActionsId={openActionsId}
                    onToggleActions={toggleActions}
                    onEdit={openEditModal}
                    onDelete={handleDeleteItem}
                    onAccept={acceptInvitation}
                    onDecline={declineInvitation}
                  />
                ))}
              </div>
            ) : (
              <EmptyState />
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
            className="mb-4 h-10 w-full rounded-[14px] border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#8ec5ff]"
          />

          <label className="mb-2 block text-sm font-medium text-slate-700">
            Description
          </label>
          <textarea
            value={goalDescription}
            onChange={(e) => setGoalDescription(e.target.value)}
            placeholder="Add more detail..."
            className="mb-4 min-h-[90px] w-full rounded-[14px] border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#8ec5ff]"
          />

          <label className="mb-2 block text-sm font-medium text-slate-700">
            Goal Date
          </label>
          <input
            type="date"
            value={goalDate}
            onChange={(e) => setGoalDate(e.target.value)}
            className="h-10 w-full rounded-[14px] border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#8ec5ff]"
          />
        </AppCard>

        <Button
          type="button"
          onClick={handleAddGoal}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-[#8ec5ff] to-[#a9bfff] text-black shadow-[0_4px_10px_rgba(142,197,255,0.24)] hover:from-[#7ab8ff] hover:to-[#98b4ff]"
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
            placeholder="Gold Reef City, Dinner, Picnic..."
            className="mb-4 h-10 w-full rounded-[14px] border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#8ec5ff]"
          />

          <label className="mb-2 block text-sm font-medium text-slate-700">
            Event Date
          </label>
          <input
            type="date"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            className="mb-4 h-10 w-full rounded-[14px] border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#8ec5ff]"
          />

          <label className="mb-2 block text-sm font-medium text-slate-700">
            Location
          </label>

          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={eventLocation}
              onChange={(e) => {
                setEventLocation(e.target.value);
                setSelectedPlace(null);
              }}
              placeholder="Example: Gold Reef City Johannesburg"
              className="h-10 w-full rounded-[14px] border border-slate-200 bg-white pl-9 pr-9 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#8ec5ff]"
            />

            {isSearchingPlaces ? (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
            ) : null}
          </div>

          {placeSuggestions.length > 0 ? (
            <div className="mt-2 overflow-hidden rounded-[14px] border border-slate-200 bg-white shadow-[0_8px_18px_rgba(15,23,42,0.08)]">
              {placeSuggestions.map((place) => (
                <button
                  key={place.placeId || `${place.name}-${place.address}`}
                  type="button"
                  onClick={() => {
                    setSelectedPlace(place);
                    setEventLocation(place.address || place.name || "");
                    setPlaceSuggestions([]);
                  }}
                  className="block w-full border-b border-slate-100 px-3 py-2 text-left last:border-b-0"
                >
                  <p className="text-[13px] font-semibold text-slate-800">
                    {place.name}
                  </p>
                  {place.address ? (
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {place.address}
                    </p>
                  ) : null}
                </button>
              ))}
            </div>
          ) : null}

          {selectedPlace ? (
            <div className="mt-2 rounded-[14px] bg-[#eaf3ff] px-3 py-2 text-[11px] font-semibold text-[#2f6df0]">
              Selected: {selectedPlace.name}
            </div>
          ) : null}
        </AppCard>

        <Button
          type="button"
          onClick={handleCreateInvitation}
          disabled={isFetchingPlace}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-[#8ec5ff] to-[#a9bfff] text-black shadow-[0_4px_10px_rgba(142,197,255,0.24)] disabled:opacity-70"
        >
          {isFetchingPlace ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          <span>{isFetchingPlace ? "Creating..." : "Create Invitation"}</span>
        </Button>
      </Modal>

      <Modal
        open={!!editingItem}
        onClose={() => setEditingItem(null)}
        title={editingItem?.type === "event" ? "Edit Event" : "Edit Goal"}
      >
        <AppCard className="p-4">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Title
          </label>
          <input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="mb-4 h-10 w-full rounded-[14px] border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#8ec5ff]"
          />

          <label className="mb-2 block text-sm font-medium text-slate-700">
            Description
          </label>
          <textarea
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
            className="mb-4 min-h-[90px] w-full rounded-[14px] border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none focus:border-[#8ec5ff]"
          />

          <label className="mb-2 block text-sm font-medium text-slate-700">
            Date
          </label>
          <input
            type="date"
            value={editDate || ""}
            onChange={(e) => setEditDate(e.target.value)}
            className="mb-4 h-10 w-full rounded-[14px] border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#8ec5ff]"
          />

          <label className="mb-2 block text-sm font-medium text-slate-700">
            Status
          </label>
          <select
            value={editStatus}
            onChange={(e) => setEditStatus(e.target.value)}
            className="h-10 w-full rounded-[14px] border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#8ec5ff]"
          >
            {editingItem?.type === "event" ? (
              <>
                <option value="pending">Pending</option>
                <option value="in_progress">Active</option>
              </>
            ) : (
              <>
                <option value="planned">Planned</option>
                <option value="in_progress">Active</option>
                <option value="completed">Done</option>
              </>
            )}
          </select>
        </AppCard>

        <Button
          type="button"
          onClick={handleUpdateItem}
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-[#8ec5ff] to-[#a9bfff] text-black shadow-[0_4px_10px_rgba(142,197,255,0.24)]"
        >
          Save Changes
        </Button>
      </Modal>

      <BottomNav />
    </>
  );
}