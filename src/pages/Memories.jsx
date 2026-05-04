import React from "react";
import { generateId } from "@/lib/generateId";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Plus,
  Image as ImageIcon,
  Calendar,
  MapPin,
  Heart,
  Plane,
  Utensils,
  Star,
  X,
  Loader2,
  Camera,
  Video,
  Trash2,
  Play,
  Home as HomeIcon,
  Target,
  MessageCircle,
  Fingerprint,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { supabase } from "@/lib/supabase";
import confetti from "canvas-confetti";

const MEMORY_BUCKET = "profile-photos";
const LOCAL_STORAGE_KEY = "datelocked_memories_testing_v3";

const categories = [
  { value: "date", label: "Date Night", icon: Heart },
  { value: "trip", label: "Trip", icon: Plane },
  { value: "anniversary", label: "Anniversary", icon: Star },
  { value: "milestone", label: "Milestone", icon: Star },
  { value: "restaurant", label: "Restaurant", icon: Utensils },
  { value: "other", label: "Other", icon: ImageIcon },
];

const navItems = [
  { label: "Home", icon: HomeIcon, page: "Home" },
  { label: "Dating", icon: Heart, page: "Dating" },
  { label: "Memories", icon: ImageIcon, page: "Memories" },
  { label: "Goals", icon: Target, page: "Goals" },
  { label: "NightIn", icon: MapPin, page: "NightIn" },
  { label: "Chat", icon: MessageCircle, page: "Chat" },
  { label: "Verify", icon: Fingerprint, page: "VerifyStatus" },
];

const emptyMemory = {
  title: "",
  description: "",
  date: "",
  location: "",
  category: "other",
  photos: [],
  videos: [],
};

function loadStoredMemories() {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStoredMemories(items) {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(items));
}

function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-[#f7f1f4] px-2 py-2 pb-24">
      <div className="mx-auto w-full max-w-[375px] overflow-hidden rounded-[16px] border border-[#ece6ea] bg-[#f7f4f6] shadow-[0_6px_18px_rgba(15,23,42,0.06)]">
        {children}
      </div>
    </div>
  );
}

function AppHeader({ title, onAddMemory, canEdit = false }) {
  return (
    <div className="border-b border-slate-200 bg-[#f8f6f7] px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Link to={createPageUrl("Home")}>
            <button
              type="button"
              className="rounded-[10px] p-1.5 transition hover:bg-slate-100"
            >
              <ArrowLeft className="h-5 w-5 text-slate-700" />
            </button>
          </Link>

          <h1 className="truncate text-[1.6rem] font-semibold tracking-[-0.02em] text-slate-800">
            {title}
          </h1>
        </div>

        {canEdit ? (
          <button
            type="button"
            onClick={onAddMemory}
            className="inline-flex h-[40px] shrink-0 items-center justify-center gap-1.5 rounded-[11px] bg-gradient-to-r from-[#ff4d6d] to-[#e84393] px-3.5 text-[11px] font-semibold text-white shadow-[0_5px_12px_rgba(255,77,109,0.20)] transition hover:opacity-95"
          >
            <Plus className="h-4 w-4" />
            <span>Add Memory</span>
          </button>
        ) : null}
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

        <div className="max-h-[78vh] space-y-4 overflow-y-auto px-4 py-4">
          {children}
        </div>
      </div>
    </div>
  );
}

function MediaFrame({ children }) {
  return (
    <div className="relative w-full overflow-hidden bg-black">
      <div className="w-full">{children}</div>
      <div className="pointer-events-none absolute inset-0 border border-white/20" />
    </div>
  );
}

function VideoPreview({ src }) {
  return (
    <MediaFrame>
      <div className="flex w-full items-center justify-center">
        <video
          src={src}
          preload="metadata"
          muted
          playsInline
          className="h-auto w-full object-contain"
        />
      </div>

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/45">
          <Play className="h-6 w-6 text-white" />
        </div>
      </div>
    </MediaFrame>
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
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatCategoryLabel(value) {
  return categories.find((c) => c.value === value)?.label || value;
}

function MemoryTile({ memory, onClick }) {
  const previewImage = memory.photos?.[0] || null;
  const previewVideo = memory.videos?.[0] || null;

  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full text-left"
    >
      <AppCard className="overflow-hidden">
        <div className="relative">
          {previewImage ? (
            <MediaFrame>
              <img
                src={previewImage}
                alt={memory.title || "Memory"}
                loading="lazy"
                className="w-full h-auto object-contain"
              />
            </MediaFrame>
          ) : previewVideo ? (
            <VideoPreview src={previewVideo} />
          ) : (
            <div className="flex h-[215px] w-full items-center justify-center bg-slate-100">
              <ImageIcon className="h-10 w-10 text-slate-300" />
            </div>
          )}

          <div className="absolute left-3 top-3">
            <div className="inline-flex items-center rounded-full bg-white/95 px-3 py-1 text-[12px] font-medium capitalize text-slate-700 shadow-[0_3px_10px_rgba(15,23,42,0.10)]">
              {memory.category || "other"}
            </div>
          </div>
        </div>

        <div className="space-y-2 px-4 py-4">
          <div className="text-[18px] font-semibold leading-tight text-slate-800">
            {memory.title || "Untitled memory"}
          </div>

          {memory.date || memory.location ? (
            <div className="flex flex-wrap items-center gap-3 text-[13px] text-slate-500">
              {memory.date ? (
                <div className="inline-flex items-center gap-1.5">
                  <Calendar className="h-4 w-4" />
                  <span>{formatDate(memory.date)}</span>
                </div>
              ) : null}

              {memory.location ? (
                <div className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  <span className="truncate">{memory.location}</span>
                </div>
              ) : null}
            </div>
          ) : null}

          {memory.description ? (
            <p className="line-clamp-2 text-[14px] leading-6 text-slate-500">
              {memory.description}
            </p>
          ) : null}
        </div>
      </AppCard>
    </button>
  );
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
    ...(profile || {}),
    couple_profile_id: profile?.couple_profile_id || null,
  };
}

export default function Memories() {
  const queryClient = useQueryClient();

  const [showAddModal, setShowAddModal] = React.useState(false);
  const [selectedMemory, setSelectedMemory] = React.useState(null);
  const [filter, setFilter] = React.useState("all");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [newMemory, setNewMemory] = React.useState(emptyMemory);
  const [locationSuggestions, setLocationSuggestions] = React.useState([]);
  const [isSearchingLocation, setIsSearchingLocation] = React.useState(false);
  const locationTimerRef = React.useRef(null);

  const {
    data: user,
    isLoading: userLoading,
    isError: userError,
    refetch: refetchUser,
  } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!authUser) return null;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .maybeSingle();

      return {
        id: authUser.id,
        email: authUser.email,
        ...(profile || {}),
      };
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const canEdit = !!user?.id;

  const {
  data: memories = [],
  isLoading: memoriesLoading,
  isError: memoriesError,
  refetch: refetchMemories,
} = useQuery({
  queryKey: ["memories", user?.couple_profile_id || user?.id],
  enabled: !!user?.id,
  staleTime: 0,
  retry: 1,
  queryFn: async () => {
    let query = supabase
      .from("memories")
      .select("*")
      .order("created_at", { ascending: false });

    if (user?.couple_profile_id) {
      query = query.eq("couple_profile_id", user.couple_profile_id);
    } else {
      query = query.eq("created_by", user.id);
    }

    const { data, error } = await query;

    if (error) throw error;

    return Array.isArray(data) ? data : [];
  },
});

  const createMemoryMutation = useMutation({
  mutationFn: async (payload) => {
    const currentUser = await getCurrentProfileUser();

    if (!currentUser?.id) {
      throw new Error("Please log in first.");
    }

    const newItem = {
      owner_id: currentUser.id,
      created_by: currentUser.id,
      owner_email: currentUser.email || "",
      couple_profile_id: currentUser.couple_profile_id || null,
      created_at: new Date().toISOString(),
      title: payload.title || "",
      description: payload.description || "",
      date: payload.date || null,
      location: payload.location || "",
      category: payload.category || "other",
      photos: payload.photos || [],
      videos: payload.videos || [],
    };

    const { data, error } = await supabase
      .from("memories")
      .insert(newItem)
      .select()
      .single();

    if (error) throw error;

    return data;
  },

  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ["memories"] });

    setShowAddModal(false);
    setNewMemory(emptyMemory);
    setLocationSuggestions([]);

    const duration = 1200;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 } });
      confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 } });

      if (Date.now() < end) requestAnimationFrame(frame);
    };

    frame();
  },

  onError: (e) => {
    console.error("Error creating memory:", e);
    alert(e?.message || "Failed to save memory. Please try again.");
  },

  onSettled: () => setIsSubmitting(false),
});

  const deleteMemoryMutation = useMutation({
  mutationFn: async (memoryId) => {
    const { error } = await supabase
      .from("memories")
      .delete()
      .eq("id", memoryId);

    if (error) throw error;

    return memoryId;
  },

  onSuccess: async () => {
    setSelectedMemory(null);
    await queryClient.invalidateQueries({ queryKey: ["memories"] });
  },

  onError: (e) => {
    console.error("Error deleting memory:", e);
    alert(e?.message || "Failed to delete memory. Please try again.");
  },
});

  const handleDeleteMemory = (memoryId) => {
    if (!memoryId) return;
    if (!window.confirm("Delete this memory? This cannot be undone.")) return;
    deleteMemoryMutation.mutate(memoryId);
  };

  const uploadFile = React.useCallback(async (file, folder = "memories/photos") => {
    if (!file) throw new Error("No file selected");

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const filePath = `${folder}/${fileName}`;

    const { data, error } = await supabase.storage
      .from(MEMORY_BUCKET)
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;

    const { data: publicUrlData } = supabase.storage
      .from(MEMORY_BUCKET)
      .getPublicUrl(data.path);

    if (!publicUrlData?.publicUrl) {
      throw new Error("Upload succeeded but no public URL was returned");
    }

    return publicUrlData.publicUrl;
  }, []);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const url = await uploadFile(file, "memories/photos");
      setNewMemory((prev) => ({ ...prev, photos: [...prev.photos, url] }));
    } catch (err) {
      console.error("Photo upload failed:", err);
      alert(err?.message || "Failed to upload photo. Please try again.");
    } finally {
      e.target.value = "";
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      alert("Video size must be less than 50MB");
      e.target.value = "";
      return;
    }

    try {
      const url = await uploadFile(file, "memories/videos");
      setNewMemory((prev) => ({ ...prev, videos: [...prev.videos, url] }));
    } catch (err) {
      console.error("Video upload failed:", err);
      alert(err?.message || "Failed to upload video. Please try again.");
    } finally {
      e.target.value = "";
    }
  };

  const removePhoto = (index) => {
    setNewMemory((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const removeVideo = (index) => {
    setNewMemory((prev) => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index),
    }));
  };

  const searchLocation = React.useCallback(async (query) => {
    const q = (query || "").trim();
    if (q.length < 3) {
      setLocationSuggestions([]);
      return;
    }

    setIsSearchingLocation(true);
    try {
      setLocationSuggestions([q]);
    } catch (err) {
      console.error("Location search failed:", err);
      setLocationSuggestions([]);
    } finally {
      setIsSearchingLocation(false);
    }
  }, []);

  const onLocationChange = (val) => {
    setNewMemory((prev) => ({ ...prev, location: val }));

    if (locationTimerRef.current) clearTimeout(locationTimerRef.current);
    locationTimerRef.current = setTimeout(() => {
      searchLocation(val);
    }, 450);
  };

  React.useEffect(() => {
    return () => {
      if (locationTimerRef.current) clearTimeout(locationTimerRef.current);
    };
  }, []);

  const handleSubmit = async () => {
    if (!user?.id) {
      alert("Please log in first.");
      return;
    }
    if (!newMemory.title?.trim()) return;
    if (isSubmitting) return;

    setIsSubmitting(true);

    createMemoryMutation.mutate({
      ...newMemory,
      title: newMemory.title.trim(),
    });
  };

  const filteredMemories = React.useMemo(() => {
    if (filter === "all") return memories;
    return memories.filter((m) => m.category === filter);
  }, [memories, filter]);

  if (userLoading || memoriesLoading) {
    return (
      <>
        <AppShell>
          <div className="flex min-h-[520px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#ff4d6d]" />
          </div>
        </AppShell>
        <BottomNav />
      </>
    );
  }

  if (userError) {
    return (
      <>
        <AppShell>
          <div className="px-4 py-4">
            <AppCard className="px-4 py-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <X className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">
                Something went wrong
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Failed to load your profile.
              </p>
              <Button
                onClick={() => refetchUser()}
                className="mt-5 h-11 w-full rounded-[14px] bg-[#ff4d6d] text-white hover:bg-[#f03d5f]"
              >
                Try Again
              </Button>
            </AppCard>
          </div>
        </AppShell>
        <BottomNav />
      </>
    );
  }

  if (memoriesError) {
    return (
      <>
        <AppShell>
          <div className="px-4 py-4">
            <AppCard className="px-4 py-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                <X className="h-8 w-8 text-red-500" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">
                Something went wrong
              </h3>
              <p className="mt-2 text-sm text-slate-500">
                Failed to load memories.
              </p>
              <Button
                onClick={() => refetchMemories()}
                className="mt-5 h-11 w-full rounded-[14px] bg-[#ff4d6d] text-white hover:bg-[#f03d5f]"
              >
                Try Again
              </Button>
            </AppCard>
          </div>
        </AppShell>
        <BottomNav />
      </>
    );
  }

  return (
    <>
      <AppShell>
        <AppHeader
          title="Our Memories"
          canEdit={canEdit}
          onAddMemory={() => setShowAddModal(true)}
        />

        <div className="space-y-4 px-4 py-4">
          <AppCard className="min-h-[118px] px-3 py-4">
            <div className="flex w-full gap-3 overflow-x-auto pb-2">
              <button
                type="button"
                onClick={() => setFilter("all")}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-[12px] px-3 py-1.5 text-[12px] font-medium shadow-sm transition ${
                  filter === "all"
                    ? "bg-[#ff4d6d] text-white"
                    : "border border-slate-200 bg-white text-slate-700"
                }`}
              >
                All
              </button>

              {categories.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setFilter(cat.value)}
                    className={`flex items-center gap-1.5 whitespace-nowrap rounded-[12px] px-3 py-1.5 text-[12px] font-medium shadow-sm transition ${
                      filter === cat.value
                        ? "bg-[#ff4d6d] text-white"
                        : "border border-slate-200 bg-white text-slate-700"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </AppCard>

          <div className="space-y-3">
            {filteredMemories.length > 0 ? (
              <div className="space-y-4">
                <AnimatePresence>
                  {filteredMemories.map((memory) => (
                    <motion.div
                      key={memory.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.18 }}
                    >
                      <MemoryTile
                        memory={memory}
                        onClick={() => setSelectedMemory(memory)}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <AppCard className="px-4 py-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50">
                  <ImageIcon className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="text-[1.35rem] font-semibold text-slate-700">
                  No memories yet
                </h3>
                <p className="mt-2 text-sm text-slate-500">
                  Start capturing your special moments
                </p>
              </AppCard>
            )}
          </div>
        </div>
      </AppShell>

      <Modal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add a Memory"
      >
        <AppCard className="p-4">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Title
          </label>
          <input
            type="text"
            value={newMemory.title}
            onChange={(e) =>
              setNewMemory((prev) => ({ ...prev, title: e.target.value }))
            }
            placeholder="What happened?"
            className="mb-4 h-11 w-full rounded-[12px] border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#ff4d6d]"
          />

          <label className="mb-2 block text-sm font-medium text-slate-700">
            Description
          </label>
          <textarea
            value={newMemory.description}
            onChange={(e) =>
              setNewMemory((prev) => ({
                ...prev,
                description: e.target.value,
              }))
            }
            placeholder="Tell the story..."
            className="mb-4 min-h-[96px] w-full rounded-[12px] border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#ff4d6d]"
          />

          <div className="mb-4 grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Date
              </label>
              <input
                type="date"
                value={newMemory.date}
                onChange={(e) =>
                  setNewMemory((prev) => ({ ...prev, date: e.target.value }))
                }
                className="h-11 w-full rounded-[12px] border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#ff4d6d]"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Category
              </label>
              <select
                value={newMemory.category}
                onChange={(e) =>
                  setNewMemory((prev) => ({ ...prev, category: e.target.value }))
                }
                className="h-11 w-full rounded-[12px] border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#ff4d6d]"
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <label className="mb-2 block text-sm font-medium text-slate-700">
            Location
          </label>
          <div className="relative mb-4">
            <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={newMemory.location}
              onChange={(e) => onLocationChange(e.target.value)}
              placeholder="Where was it?"
              className="h-11 w-full rounded-[12px] border border-slate-200 bg-white pl-9 pr-9 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#ff4d6d]"
            />
            {isSearchingLocation ? (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
            ) : null}

            {locationSuggestions.length > 0 ? (
              <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-[12px] border border-slate-200 bg-white shadow-lg">
                {locationSuggestions.map((location, idx) => (
                  <button
                    key={`${location}-${idx}`}
                    type="button"
                    onClick={() => {
                      setNewMemory((prev) => ({ ...prev, location }));
                      setLocationSuggestions([]);
                    }}
                    className="block w-full px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
                  >
                    {location}
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <label className="mb-2 block text-sm font-medium text-slate-700">
            Photos
          </label>
          <div className="mb-4 space-y-3">
            {newMemory.photos.map((photo, index) => (
              <div
                key={`${photo}-${index}`}
                className="relative overflow-hidden rounded-[12px] border border-slate-200 bg-black"
              >
                <img
                  src={photo}
                  alt=""
                  className="h-auto w-full object-contain"
                  loading="lazy"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
            ))}

            <label className="flex min-h-[110px] w-full cursor-pointer flex-col items-center justify-center rounded-[12px] border border-dashed border-slate-200 bg-white text-slate-500 hover:bg-slate-50">
              <Camera className="h-6 w-6" />
              <span className="mt-2 text-xs font-medium">Add Photo</span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
          </div>

          <label className="mb-2 block text-sm font-medium text-slate-700">
            Videos
          </label>
          <div className="space-y-3">
            {newMemory.videos.map((video, index) => (
              <div
                key={`${video}-${index}`}
                className="relative overflow-hidden rounded-[12px] bg-black"
              >
                <div className="flex w-full items-center justify-center">
                  <video
                    src={video}
                    controls
                    preload="metadata"
                    playsInline
                    className="h-auto w-full object-contain"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeVideo(index)}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
            ))}

            <label className="flex min-h-[110px] w-full cursor-pointer flex-col items-center justify-center rounded-[12px] border border-dashed border-slate-200 bg-white text-slate-500 hover:bg-slate-50">
              <Video className="h-6 w-6" />
              <span className="mt-2 text-xs font-medium">Add Video</span>
              <input
                type="file"
                accept="video/*"
                onChange={handleVideoUpload}
                className="hidden"
              />
            </label>
          </div>
        </AppCard>

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={
            !newMemory.title.trim() ||
            isSubmitting ||
            createMemoryMutation.isPending
          }
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-[#ff4d6d] text-white hover:bg-[#f03d5f]"
        >
          {isSubmitting || createMemoryMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Heart className="h-4 w-4" />
              <span>Save Memory</span>
            </>
          )}
        </Button>
      </Modal>

      <Modal
        open={!!selectedMemory}
        onClose={() => setSelectedMemory(null)}
        title={selectedMemory?.title || "Memory"}
      >
        {selectedMemory ? (
          <>
            {selectedMemory.photos?.[0] ? (
              <AppCard className="p-3">
                <MediaFrame>
                  <img
                    src={selectedMemory.photos[0]}
                    alt=""
                    loading="lazy"
                    className="h-auto w-full object-contain"
                  />
                </MediaFrame>
              </AppCard>
            ) : null}

            <AppCard className="p-4">
              {selectedMemory.description ? (
                <p className="text-sm leading-6 text-slate-600">
                  {selectedMemory.description}
                </p>
              ) : null}

              <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                {selectedMemory.date ? (
                  <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(selectedMemory.date)}
                  </div>
                ) : null}

                {selectedMemory.location ? (
                  <div className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1">
                    <MapPin className="h-3 w-3" />
                    {selectedMemory.location}
                  </div>
                ) : null}

                {selectedMemory.category ? (
                  <div className="inline-flex items-center gap-1 rounded-full bg-[#ffe4ea] px-2 py-1 text-[#ff4d6d]">
                    {formatCategoryLabel(selectedMemory.category)}
                  </div>
                ) : null}
              </div>
            </AppCard>

            {Array.isArray(selectedMemory.videos) &&
            selectedMemory.videos.length > 0 ? (
              <AppCard className="p-4">
                <div className="space-y-3">
                  <div className="text-base font-semibold text-slate-800">Videos</div>
                  {selectedMemory.videos.map((video, index) => (
                    <div
                      key={`${video}-${index}`}
                      className="overflow-hidden rounded-[12px] bg-black"
                    >
                      <div className="flex w-full items-center justify-center">
                        <video
                          src={video}
                          controls
                          preload="metadata"
                          playsInline
                          className="h-auto w-full object-contain"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </AppCard>
            ) : null}

            {Array.isArray(selectedMemory.photos) &&
            selectedMemory.photos.length > 1 ? (
              <AppCard className="p-4">
                <div className="space-y-3">
                  <div className="text-base font-semibold text-slate-800">
                    All Photos
                  </div>
                  {selectedMemory.photos.map((photo, index) => (
                    <div
                      key={index}
                      className="w-full overflow-hidden rounded-[12px] border border-slate-200 bg-black"
                    >
                      <img
                        src={photo}
                        alt=""
                        className="h-auto w-full object-contain"
                        loading="lazy"
                      />
                    </div>
                  ))}
                </div>
              </AppCard>
            ) : null}

            {selectedMemory.owner_id === user?.id ? (
              <Button
                type="button"
                onClick={() => handleDeleteMemory(selectedMemory.id)}
                disabled={deleteMemoryMutation.isPending}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[14px] border border-red-200 bg-white text-red-600 hover:bg-red-50"
              >
                {deleteMemoryMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>Delete Memory</span>
                  </>
                )}
              </Button>
            ) : null}
          </>
        ) : null}
      </Modal>

      <BottomNav />
    </>
  );
}