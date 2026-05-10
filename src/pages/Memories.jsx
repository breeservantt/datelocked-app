import React from "react";
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
  Trash2,
  Play,
  Home as HomeIcon,
  Target,
  MessageCircle,
  Fingerprint,
  Crown,
  Check,
  Shield,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { supabase } from "@/lib/supabase";
import {
  FEATURE_KEYS,
  checkDailyLimit,
  consumeDailyLimit,
  awardCouplePoints,
} from "@/lib/monetization";
import { toast } from "sonner";
import confetti from "canvas-confetti";

const MEMORY_BUCKET = "memories-media";
const FREE_DAILY_MEMORY_LIMIT = 2;

/*
  EXACT MATCH TO DATING LIMIT SYSTEM:
  This intentionally uses DATING_WALL_POST because that is the known working limit key.
  If your profile already exceeded Dating upload/post limit, Memories will also block now.
*/
const MEMORY_LIMIT_KEY = FEATURE_KEYS.DATING_WALL_POST;

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
      authUser.email?.split("@")[0] ||
      "User",
    ...(profile || {}),
    couple_profile_id: profile?.couple_profile_id || null,
  };
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
        <div className="min-w-0 flex-1">
  <h1 className="truncate text-[24px] font-semibold tracking-[-0.02em] text-slate-800">
    {title}
  </h1>
</div>

        <div className="flex shrink-0 items-center gap-2">

          {canEdit ? (
            <button
              type="button"
              onClick={onAddMemory}
              className="inline-flex h-[40px] shrink-0 items-center justify-center gap-2 rounded-[12px] bg-gradient-to-r from-[#ff4d6d] to-[#e84393] px-4 text-[12px] font-semibold text-white shadow-[0_5px_12px_rgba(255,77,109,0.20)] transition hover:opacity-95"
            >
              <Plus className="h-4 w-4" />
              <span>Add Memories</span>
            </button>
          ) : null}
        </div>
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

function MemoryTile({ memory, onClick }) {
  const previewImage = memory.photos?.[0] || null;
  const previewVideo = memory.videos?.[0] || null;

  return (
    <button type="button" onClick={onClick} className="block w-full text-left">
      <AppCard className="overflow-hidden">
        <div className="relative">
          {previewImage ? (
            <MediaFrame>
              <img
                src={previewImage}
                alt={memory.title || "Memory"}
                loading="lazy"
                className="h-auto w-full object-contain"
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

export default function Memories() {
  const queryClient = useQueryClient();

  const [showAddModal, setShowAddModal] = React.useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = React.useState(false);
  const [selectedMemory, setSelectedMemory] = React.useState(null);
  const [filter, setFilter] = React.useState("all");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isUploadingMedia, setIsUploadingMedia] = React.useState(false);
  const [uploadingCount, setUploadingCount] = React.useState(0);
  const [processingPlan, setProcessingPlan] = React.useState(null);
  const [limitInfo, setLimitInfo] = React.useState(null);
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
    queryFn: getCurrentProfileUser,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const premiumActive = isPremiumUser(user);
  const canEdit = !!user?.id;

  React.useEffect(() => {
    if (!user?.email || premiumActive) return;

    let mounted = true;

    (async () => {
      try {
        const result = await checkDailyLimit(MEMORY_LIMIT_KEY);
        if (mounted) setLimitInfo(result);
      } catch (error) {
        console.error("Memory daily limit check failed:", error);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [user?.email, premiumActive]);

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const status = urlParams.get("status");
    const token = urlParams.get("token");
    const plan = urlParams.get("plan");

    if (status === "success" && token && plan) {
      capturePayment(token, plan);
    } else if (status === "cancelled") {
      toast.error("Payment was cancelled.");
      window.history.replaceState({}, "", createPageUrl("Memories"));
    }
  }, []);

  const handlePayPalPayment = async (plan) => {
    setProcessingPlan(plan);

    try {
      const { data, error } = await supabase.functions.invoke(
        "createPayPalPayment",
        {
          body: {
            plan,
            returnPage: "Memories",
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
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(error?.message || "Payment failed. Please try again.");
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
        queryClient.setQueryData(["user"], refreshedUser);
        await queryClient.invalidateQueries({ queryKey: ["user"] });

        window.history.replaceState({}, "", createPageUrl("Memories"));
        setShowSubscriptionModal(false);
        return;
      }

      toast.error("Payment capture failed. Please contact support.");
    } catch (error) {
      console.error("Capture error:", error);
      toast.error(error?.message || "Payment processing failed.");
    } finally {
      setProcessingPlan(null);
    }
  };

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
      toast.error(e?.message || "Failed to save memory. Please try again.");
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
      toast.error(e?.message || "Failed to delete memory. Please try again.");
    },
  });

  const handleOpenAddMemory = async () => {
    if (!user?.id) {
      toast.error("Please log in first.");
      return;
    }

    if (!premiumActive) {
      try {
        const limitResult = await checkDailyLimit(MEMORY_LIMIT_KEY);
        setLimitInfo(limitResult);

        if (!limitResult?.allowed) {
          setShowSubscriptionModal(true);
          toast.error(
            `Daily free limit reached. Free users get ${FREE_DAILY_MEMORY_LIMIT} memory uploads per day.`
          );
          return;
        }
      } catch (error) {
        console.error("Daily limit check failed:", error);
      }
    }

    setShowAddModal(true);
  };

  const handleDeleteMemory = (memoryId) => {
    if (!memoryId) return;
    if (!window.confirm("Delete this memory? This cannot be undone.")) return;
    deleteMemoryMutation.mutate(memoryId);
  };

  const compressImage = async (file) => {
    if (!file.type.startsWith("image/")) return file;

    const imageBitmap = await createImageBitmap(file);
    const maxWidth = 1600;
    const scale = Math.min(1, maxWidth / imageBitmap.width);

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(imageBitmap.width * scale);
    canvas.height = Math.round(imageBitmap.height * scale);

    const ctx = canvas.getContext("2d");
    ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);

    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, "image/jpeg", 0.78);
    });

    if (!blob) return file;

    return new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), {
      type: "image/jpeg",
    });
  };

  const uploadFile = React.useCallback(async (file, folder) => {
    if (!file) throw new Error("No file selected");

    const ext = file.name.split(".").pop()?.toLowerCase() || "file";
    const cleanName = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .slice(0, 40);

    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}-${cleanName}.${ext}`;

    const filePath = `${folder}/${fileName}`;

    const { data, error } = await supabase.storage
      .from(MEMORY_BUCKET)
      .upload(filePath, file, {
        cacheControl: "31536000",
        upsert: false,
        contentType: file.type || undefined,
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

  const handleMediaUpload = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";

    if (!files.length) return;

    if (!user?.id) {
      toast.error("Please log in first.");
      return;
    }

    if (!premiumActive) {
      const limitResult = await checkDailyLimit(MEMORY_LIMIT_KEY);
      setLimitInfo(limitResult);

      if (!limitResult?.allowed) {
        setShowSubscriptionModal(true);
        toast.error(
          `Daily free limit reached. Free users get ${FREE_DAILY_MEMORY_LIMIT} memory uploads per day.`
        );
        return;
      }
    }

    const validFiles = files.filter((file) => {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");

      if (!isImage && !isVideo) {
        toast.error(`${file.name} is not supported. Only photos and videos are allowed.`);
        return false;
      }

      if (isVideo && file.size > 25 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Videos must be less than 25MB.`);
        return false;
      }

      return true;
    });

    if (!validFiles.length) return;

    setIsUploadingMedia(true);
    setUploadingCount(validFiles.length);

    try {
      const uploaded = [];

      for (const originalFile of validFiles) {
        const isImage = originalFile.type.startsWith("image/");
        const preparedFile = isImage ? await compressImage(originalFile) : originalFile;
        const folder = isImage ? "memories/photos" : "memories/videos";
        const url = await uploadFile(preparedFile, folder);

        uploaded.push({
          type: isImage ? "photo" : "video",
          url,
        });
      }

      setNewMemory((prev) => ({
        ...prev,
        photos: [
          ...(prev.photos || []),
          ...uploaded.filter((item) => item.type === "photo").map((item) => item.url),
        ],
        videos: [
          ...(prev.videos || []),
          ...uploaded.filter((item) => item.type === "video").map((item) => item.url),
        ],
      }));

      toast.success("Media ready");
    } catch (err) {
      console.error("Media upload failed:", err);
      toast.error(err?.message || "Failed to upload media. Please try again.");
    } finally {
      setIsUploadingMedia(false);
      setUploadingCount(0);
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

  React.useEffect(() => {
    let channel;

    const setupRealtime = async () => {
      const currentUser = await getCurrentProfileUser();

      if (!currentUser?.couple_profile_id) return;

      channel = supabase
        .channel(`memories-${currentUser.couple_profile_id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "memories",
            filter: `couple_profile_id=eq.${currentUser.couple_profile_id}`,
          },
          () => {
            queryClient.invalidateQueries({ queryKey: ["memories"] });
          }
        )
        .subscribe();
    };

    setupRealtime();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const handleSubmit = async () => {
    if (!user?.id) {
      toast.error("Please log in first.");
      return;
    }

    if (!newMemory.title?.trim()) {
      toast.error("Please enter a memory title.");
      return;
    }

    if (!newMemory.photos.length && !newMemory.videos.length) {
      toast.error("Please upload at least one photo or video.");
      return;
    }

    if (isUploadingMedia) {
      toast.error("Please wait for media upload to finish.");
      return;
    }

    if (isSubmitting || createMemoryMutation.isPending) return;

    setIsSubmitting(true);

    try {
      if (!premiumActive) {
        const limitResult = await consumeDailyLimit(MEMORY_LIMIT_KEY);

        if (!limitResult?.allowed) {
          setShowSubscriptionModal(true);
          toast.error(
            `Daily free limit reached. Free users get ${FREE_DAILY_MEMORY_LIMIT} memory uploads per day.`
          );
          return;
        }

        setLimitInfo(limitResult);
      }

      await createMemoryMutation.mutateAsync({
        ...newMemory,
        title: newMemory.title.trim(),
      });

      try {
        await awardCouplePoints?.("MEMORY_UPLOAD", 5);
      } catch {
        // Points must never block saving.
      }
    } catch (err) {
      console.error("Save memory failed:", err);
      toast.error(err?.message || "Failed to save memory.");
      setIsSubmitting(false);
    }
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

  if (userError || memoriesError) {
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
                onClick={() => {
                  refetchUser();
                  refetchMemories();
                }}
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
  onAddMemory={handleOpenAddMemory}
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
        onClose={() => {
          if (isSubmitting || isUploadingMedia) return;
          setShowAddModal(false);
        }}
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
            Media
          </label>

          <div className="space-y-3">
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

            {newMemory.videos.map((video, index) => (
              <div
                key={`${video}-${index}`}
                className="relative overflow-hidden rounded-[12px] bg-black"
              >
                <video
                  src={video}
                  controls
                  preload="metadata"
                  playsInline
                  className="h-auto w-full object-contain"
                />

                <button
                  type="button"
                  onClick={() => removeVideo(index)}
                  className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/50"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
            ))}

            <label
              className={`flex min-h-[132px] w-full cursor-pointer flex-col items-center justify-center rounded-[14px] border border-dashed border-[#ffc0cb] bg-gradient-to-br from-[#fff7f9] to-[#fff0f5] text-slate-600 transition hover:border-[#ff4d6d] ${
                isUploadingMedia ? "pointer-events-none opacity-70" : ""
              }`}
            >
              {isUploadingMedia ? (
                <Loader2 className="h-7 w-7 animate-spin text-[#ff4d6d]" />
              ) : (
                <ImageIcon className="h-7 w-7 text-[#ff4d6d]" />
              )}

              <span className="mt-2 text-sm font-semibold text-slate-700">
                {isUploadingMedia
                  ? `Uploading ${uploadingCount} file${
                      uploadingCount > 1 ? "s" : ""
                    }...`
                  : "Add photos & videos"}
              </span>

              <span className="mt-1 text-xs text-slate-500">
                Photos and videos are saved to Supabase
              </span>

              <input
                type="file"
                accept="image/*,video/*"
                multiple
                disabled={isUploadingMedia}
                onChange={handleMediaUpload}
                className="hidden"
              />
            </label>
          </div>
        </AppCard>

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={
            isSubmitting ||
            isUploadingMedia ||
            createMemoryMutation.isPending ||
            !newMemory.title.trim() ||
            (!newMemory.photos.length && !newMemory.videos.length)
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
        open={selectedMemory}
        onClose={() => setSelectedMemory(null)}
        title={selectedMemory?.title || "Memory"}
      >
        {selectedMemory ? (
          <>
            <AppCard>
              <div className="space-y-3 p-4">
                {selectedMemory.photos?.map((photo, index) => (
                  <img
                    key={`${photo}-${index}`}
                    src={photo}
                    alt=""
                    className="w-full rounded-[12px] object-contain"
                  />
                ))}

                {selectedMemory.videos?.map((video, index) => (
                  <video
                    key={`${video}-${index}`}
                    src={video}
                    controls
                    playsInline
                    className="w-full rounded-[12px] bg-black object-contain"
                  />
                ))}
              </div>
            </AppCard>

            <AppCard className="p-4">
              <div className="space-y-3">
                {selectedMemory.description ? (
                  <p className="text-sm leading-6 text-slate-600">
                    {selectedMemory.description}
                  </p>
                ) : null}

                {selectedMemory.date ? (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Calendar className="h-4 w-4" />
                    {formatDate(selectedMemory.date)}
                  </div>
                ) : null}

                {selectedMemory.location ? (
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <MapPin className="h-4 w-4" />
                    {selectedMemory.location}
                  </div>
                ) : null}

                <Button
                  type="button"
                  onClick={() => handleDeleteMemory(selectedMemory.id)}
                  disabled={deleteMemoryMutation.isPending}
                  variant="outline"
                  className="h-11 w-full rounded-[14px] border-red-200 text-red-600 hover:bg-red-50"
                >
                  {deleteMemoryMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Memory
                    </>
                  )}
                </Button>
              </div>
            </AppCard>
          </>
        ) : null}
      </Modal>

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
                Unlock unlimited memories
              </h3>

              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                Free users can upload {FREE_DAILY_MEMORY_LIMIT} memories per day.
                Upgrade to remove the daily memory limit.
              </p>
            </div>
          </div>

          <div className="mb-5 space-y-3">
            {[
              "Unlimited memory uploads",
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