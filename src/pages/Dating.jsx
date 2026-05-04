import React from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Loader2, Video } from "lucide-react";
import { generateId } from "@/lib/generateId";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Camera,
  Eye,
  Image as ImageIcon,
  Plus,
  MapPin,
  X,
  Trash2,
  Heart,
  Sparkles,
  Play,
  MoreHorizontal,
  Flag,
  Home as HomeIcon,
  Target,
  MessageCircle,
  Fingerprint,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";

const STORAGE_BUCKET = "profile-photos";
const STORAGE_KEY = "dating_wall_content";

const navItems = [
  { label: "Home", icon: HomeIcon, page: "Home" },
  { label: "Dating", icon: Heart, page: "Dating" },
  { label: "Memories", icon: ImageIcon, page: "Memories" },
  { label: "Goals", icon: Target, page: "Goals" },
  { label: "NightIn", icon: MapPin, page: "NightIn" },
  { label: "Chat", icon: MessageCircle, page: "Chat" },
  { label: "Verify", icon: Fingerprint, page: "VerifyStatus" },
];

const ROMANTIC_MESSAGES = [
  "Love grows strongest in the quiet moments when you choose each other again and again.",
  "A beautiful relationship is built through small daily acts of kindness, not grand gestures alone.",
  "Romance lasts longer when two people keep learning how to love each other better.",
  "Every shared laugh, gentle word, and honest moment becomes part of your love story.",
  "Strong couples protect the peace between them and nurture joy on purpose.",
  "Healthy love is not perfection. It is patience, effort, forgiveness, and consistency.",
  "The best relationships feel safe, warm, playful, and deeply intentional.",
  "Affection, attention, and appreciation can turn ordinary days into meaningful memories.",
  "Love becomes powerful when both people feel seen, heard, and valued.",
  "A thriving relationship is often the result of two people choosing softness over ego.",
];

const DEFAULT_CONTENT = [
  {
    id: "content-1",
    owner_email: "you@example.com",
    content_url:
      "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=1200&auto=format&fit=crop",
    content_type: "IMAGE",
    visibility: "PUBLIC_WALL",
    moderation_status: "APPROVED",
    caption: "A beautiful moment together.",
    location: "Johannesburg",
    view_count: 12,
  },
  {
    id: "content-2",
    owner_email: "partner@example.com",
    content_url:
      "https://images.unsplash.com/photo-1511988617509-a57c8a288659?q=80&w=1200&auto=format&fit=crop",
    content_type: "IMAGE",
    visibility: "PUBLIC_WALL",
    moderation_status: "APPROVED",
    caption: "Date night vibes.",
    location: "Pretoria",
    view_count: 21,
  },
];

function getFiveHourMessage() {
  const now = new Date();
  const bucket = Math.floor(now.getTime() / (5 * 60 * 60 * 1000));
  return ROMANTIC_MESSAGES[bucket % ROMANTIC_MESSAGES.length];
}

function getNextFiveHourRefreshMs() {
  const now = Date.now();
  const windowMs = 5 * 60 * 60 * 1000;
  const nextBoundary = Math.ceil(now / windowMs) * windowMs;
  return Math.max(nextBoundary - now, 1000);
}

function loadStoredContent() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_CONTENT));
      return DEFAULT_CONTENT;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_CONTENT;
  } catch {
    return DEFAULT_CONTENT;
  }
}

function saveStoredContent(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

async function getCurrentDatingUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) throw error;
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email,
    full_name:
      profile?.full_name ||
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "User",
    ...(profile || {}),
  };
}

async function uploadDatingFile(file, folder = "dating/photos") {
  if (!file) throw new Error("No file selected");

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const filePath = `${folder}/${fileName}`;

  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) throw error;

  const { data: publicUrlData } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(data.path);

  if (!publicUrlData?.publicUrl) {
    throw new Error("Upload succeeded but no public URL was returned");
  }

  return publicUrlData.publicUrl;
}

const wallApi = {
  content: {
    async listMine(email) {
      const items = loadStoredContent();
      return items.filter((x) => x.owner_email === email);
    },

    async listPublic() {
      return loadStoredContent();
    },

    async remove(contentId) {
      const items = loadStoredContent();
      const next = items.filter((x) => x.id !== contentId);
      saveStoredContent(next);
      return true;
    },

    async report() {
      return { success: true };
    },

    async createMany(payload) {
      const items = loadStoredContent();

      const imageItems = (payload.photos || []).map((url) => ({
        id: generateId(),
        owner_email: payload.owner_email,
        content_url: url,
        content_type: "IMAGE",
        visibility: "PUBLIC_WALL",
        moderation_status: "APPROVED",
        caption: payload.caption || "",
        location: payload.location || "",
        view_count: 0,
      }));

      const videoItems = (payload.videos || []).map((url) => ({
        id: generateId(),
        owner_email: payload.owner_email,
        content_url: url,
        content_type: "VIDEO",
        visibility: "PUBLIC_WALL",
        moderation_status: "APPROVED",
        caption: payload.caption || "",
        location: payload.location || "",
        view_count: 0,
      }));

      const createdItems = [...imageItems, ...videoItems];
      const next = [...createdItems, ...items];
      saveStoredContent(next);

      return {
        success: true,
        items: createdItems,
      };
    },
  },

  reactions: {
    async list() {
      return [
        {
          id: "r1",
          content_id: "content-2",
          user_email: "you@example.com",
          reaction_type: "heart",
        },
      ];
    },

    async toggle() {
      return { success: true };
    },
  },
};

function MediaFrame({ children }) {
  return <div className="relative block w-full overflow-hidden bg-black">{children}</div>;
}

function VideoPreview({ src }) {
  return (
    <MediaFrame>
      <video
        src={src}
        preload="metadata"
        muted
        playsInline
        className="block w-full h-auto max-h-[78vh] object-contain bg-black"
      />

      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/45">
          <Play className="h-6 w-6 text-white" />
        </div>
      </div>
    </MediaFrame>
  );
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 px-3">
      <div className="w-full max-w-[390px] overflow-hidden rounded-[20px] border border-[#ece6ea] bg-[#f7f3f6] shadow-[0_12px_30px_rgba(15,23,42,0.14)]">
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

        <div className="max-h-[78vh] space-y-4 overflow-y-auto px-4 py-4">{children}</div>
      </div>
    </div>
  );
}

function FloatingUploadButton({ disabled = false, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`group fixed bottom-28 right-6 z-40 ${
        disabled ? "pointer-events-none opacity-60" : ""
      }`}
      aria-label="Open upload modal"
    >
      <div className="relative">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-[0_10px_22px_rgba(244,63,94,0.25)] transition-all duration-200 group-hover:scale-[1.03] group-hover:from-rose-600 group-hover:to-pink-600">
          <Camera className="h-6 w-6" strokeWidth={2.2} />
        </div>

        <div className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border border-white/80 bg-white shadow-[0_6px_16px_rgba(15,23,42,0.12)]">
          <Plus className="h-3.5 w-3.5 text-rose-500" strokeWidth={2.4} />
        </div>
      </div>
    </button>
  );
}

function BottomNav() {
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#ece6ea] bg-white/95 pb-[max(6px,env(safe-area-inset-bottom))] pt-1 shadow-[0_-6px_18px_rgba(15,23,42,0.05)] backdrop-blur">
      <div className="mx-auto grid w-full max-w-[390px] grid-cols-7 gap-0.5 px-2">
        {navItems.map((item) => {
          const href = createPageUrl(item.page);
          const active = location.pathname === href || (href === "/" && location.pathname === "/");
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
                  active ? "font-semibold text-[#ef4f75]" : "font-medium text-slate-400"
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

export default function Dating() {
  const queryClient = useQueryClient();

  const [user, setUser] = React.useState(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [showMyContent, setShowMyContent] = React.useState(false);
  const [zoomedImage, setZoomedImage] = React.useState(null);
  const [activeVideo, setActiveVideo] = React.useState(null);
  const [dailyAdvice, setDailyAdvice] = React.useState("");
  const [showAdvice, setShowAdvice] = React.useState(true);
  const [openMenuId, setOpenMenuId] = React.useState(null);
  const [showAddModal, setShowAddModal] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [newPost, setNewPost] = React.useState({
    caption: "",
    location: "",
    photos: [],
    videos: [],
  });

  const [myContentState, setMyContentState] = React.useState([]);
  const [publicContentState, setPublicContentState] = React.useState([]);
  const [allReactionsState, setAllReactionsState] = React.useState([]);

  React.useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const currentUser = await getCurrentDatingUser();
        if (mounted) setUser(currentUser);
      } catch (error) {
        console.error("Failed to load user:", error);
        if (mounted) setUser(null);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  React.useEffect(() => {
    const updateMessage = () => setDailyAdvice(getFiveHourMessage());
    updateMessage();

    let timer;
    const schedule = () => {
      timer = setTimeout(() => {
        updateMessage();
        schedule();
      }, getNextFiveHourRefreshMs());
    };
    schedule();

    return () => clearTimeout(timer);
  }, []);

  React.useEffect(() => {
    const onDocClick = () => setOpenMenuId(null);
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const { data: myContent = [] } = useQuery({
    queryKey: ["myDateContent", user?.email],
    queryFn: () => wallApi.content.listMine(user.email),
    enabled: !!user?.email && showMyContent,
  });

  const { data: publicContent = [], isLoading: publicLoading } = useQuery({
    queryKey: ["publicDateContent"],
    queryFn: () => wallApi.content.listPublic(),
    enabled: !!user?.email,
    refetchInterval: false,
    staleTime: 5 * 60 * 1000,
  });

  const { data: allReactions = [] } = useQuery({
    queryKey: ["contentReactions"],
    queryFn: () => wallApi.reactions.list(),
    enabled: !!user?.email,
    refetchInterval: isUploading ? false : 15000,
  });

  React.useEffect(() => {
    setMyContentState(myContent);
  }, [myContent]);

  React.useEffect(() => {
    setPublicContentState(publicContent);
  }, [publicContent]);

  React.useEffect(() => {
    setAllReactionsState(allReactions);
  }, [allReactions]);

  const handleReaction = async (contentId, reactionType) => {
    try {
      await wallApi.reactions.toggle({ contentId, reactionType });

      setAllReactionsState((current) => {
        const existing = current.find(
          (r) =>
            r.content_id === contentId &&
            r.user_email === user?.email &&
            r.reaction_type === reactionType
        );

        if (existing) {
          return current.filter((r) => r.id !== existing.id);
        }

        return [
          ...current,
          {
            id: generateId(),
            content_id: contentId,
            user_email: user?.email,
            reaction_type: reactionType,
          },
        ];
      });

      queryClient.invalidateQueries({ queryKey: ["contentReactions"] });
    } catch {
      toast.error("Failed to react");
    }
  };

  const handleDelete = async (contentId) => {
    if (!window.confirm("Are you sure you want to delete this content?")) return;

    try {
      await wallApi.content.remove(contentId);
      setMyContentState((current) => current.filter((x) => x.id !== contentId));
      setPublicContentState((current) => current.filter((x) => x.id !== contentId));
      toast.success("Content deleted");
      queryClient.invalidateQueries({ queryKey: ["myDateContent"] });
      queryClient.invalidateQueries({ queryKey: ["publicDateContent"] });
    } catch {
      toast.error("Failed to delete content");
    }
  };

  const handleQuickReport = async (content) => {
    try {
      await wallApi.content.report({
        contentId: content.id,
        reason: "inappropriate",
      });
      toast.success("Content reported");
    } catch {
      toast.error("Failed to report content");
    }
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;
    if (!user?.email) {
      toast.error("User not loaded yet");
      return;
    }

    const sizeMB = file.size / (1024 * 1024);
    const maxImageMB = 8;

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are allowed");
      return;
    }

    if (sizeMB > maxImageMB) {
      toast.error(`Image too large (${sizeMB.toFixed(1)}MB). Max ${maxImageMB}MB.`);
      return;
    }

    setIsUploading(true);

    try {
      const url = await uploadDatingFile(file, "dating/photos");
      setNewPost((prev) => ({
        ...prev,
        photos: [...prev.photos, url],
      }));
    } catch (error) {
      console.error("Photo upload failed:", error);
      toast.error(error?.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleVideoUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;
    if (!user?.email) {
      toast.error("User not loaded yet");
      return;
    }

    const sizeMB = file.size / (1024 * 1024);
    const maxVideoMB = 30;

    if (!file.type.startsWith("video/")) {
      toast.error("Only video files are allowed");
      return;
    }

    if (sizeMB > maxVideoMB) {
      toast.error(`Video too large (${sizeMB.toFixed(1)}MB). Max ${maxVideoMB}MB.`);
      return;
    }

    setIsUploading(true);

    try {
      const url = await uploadDatingFile(file, "dating/videos");
      setNewPost((prev) => ({
        ...prev,
        videos: [...prev.videos, url],
      }));
    } catch (error) {
      console.error("Video upload failed:", error);
      toast.error(error?.message || "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  const removePhoto = (index) => {
    setNewPost((prev) => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index),
    }));
  };

  const removeVideo = (index) => {
    setNewPost((prev) => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index),
    }));
  };

  const handleSavePost = async () => {
    if (!user?.email) {
      toast.error("User not loaded yet");
      return;
    }

    if (
      !newPost.caption.trim() &&
      newPost.photos.length === 0 &&
      newPost.videos.length === 0
    ) {
      toast.error("Add media or a caption before saving");
      return;
    }

    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      const result = await wallApi.content.createMany({
        owner_email: user.email,
        caption: newPost.caption.trim(),
        location: newPost.location.trim(),
        photos: newPost.photos,
        videos: newPost.videos,
      });

      if (!result?.success || !Array.isArray(result.items)) {
        toast.error("Upload failed");
        return;
      }

      const createdItems = result.items;
      setPublicContentState((current) => [...createdItems, ...current]);

      if (showMyContent) {
        setMyContentState((current) => [...createdItems, ...current]);
      }

      toast.success("Post uploaded successfully!");
      queryClient.invalidateQueries({ queryKey: ["publicDateContent"] });
      if (showMyContent) {
        queryClient.invalidateQueries({ queryKey: ["myDateContent"] });
      }

      setShowAddModal(false);
      setNewPost({
        caption: "",
        location: "",
        photos: [],
        videos: [],
      });
    } catch (error) {
      toast.error(error?.message || "Upload failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (user === null) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <>
      <div className="min-h-screen w-screen bg-[#f3edf1] px-0 py-0 pb-[74px] overflow-x-hidden">
        <div className="mx-auto w-full max-w-[390px] overflow-hidden rounded-[28px] border border-[#e8e2e7] bg-[#f7f3f6] shadow-[0_12px_40px_rgba(15,23,42,0.10)]">
          <div className="bg-gradient-to-r from-[#5e9cff] via-[#2f6df0] to-[#6aa7ff] px-5 pb-8 pt-7">
            <div className="min-w-0">
              <p className="text-[14px] text-white/80"></p>
              <h1 className="truncate text-[22px] font-semibold text-white">Dating</h1>
              <p className="mt-1 text-[12px] text-white/80"></p>
            </div>
          </div>

          <div className="-mt-7 space-y-4 px-4 pt-1 pb-6">
            <AnimatePresence>
              {showAdvice && dailyAdvice && (
                <motion.div
                  initial={{ opacity: 0, y: -16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                >
                  <Card className="overflow-hidden rounded-[20px] border border-rose-100 bg-gradient-to-r from-pink-50 via-rose-50 to-red-50 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-rose-400 to-pink-500">
                          <Sparkles className="h-4 w-4 text-white" />
                        </div>

                        <div className="flex-1">
                          <p className="mb-1 text-xs font-semibold text-rose-600">
                            💕 Relationship Insight
                          </p>
                          <p className="text-sm leading-relaxed text-slate-700">
                            {dailyAdvice}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setShowAdvice(false)}
                          className="rounded-[10px] p-1 text-slate-400 transition hover:bg-white hover:text-slate-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              {publicLoading ? (
                <div className="text-sm text-slate-500">Loading public content...</div>
              ) : publicContentState.length === 0 ? (
                <Card className="rounded-[20px] border border-slate-100 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
                  <CardContent className="p-12 text-center text-slate-500">
                    No public content yet. Be the first to share!
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {publicContentState.map((content) => (
                    <div
                      key={content.id}
                      className="overflow-hidden rounded-[20px] bg-white shadow-[0_10px_24px_rgba(15,23,42,0.06)]"
                    >
                      <div className="relative">
                        {content.content_type === "VIDEO" ? (
                          <button
                            type="button"
                            onClick={() => setActiveVideo(content.content_url)}
                            className="block w-full"
                          >
                            <div className="relative block w-full overflow-hidden bg-black">
                              <video
                                src={content.content_url}
                                preload="none"
                                muted
                                playsInline
                                className="block w-full h-auto max-h-[78vh] object-contain bg-black"
                              />

                              <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black/45">
                                  <Play className="h-6 w-6 text-white" />
                                </div>
                              </div>
                            </div>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setZoomedImage(content.content_url)}
                            className="block w-full"
                          >
                            <div className="relative block w-full overflow-hidden bg-black">
                              <img
  src={content.content_url}
  alt=""
  loading="lazy"
  className="block w-full h-auto object-cover bg-black"
/>
                            </div>
                          </button>
                        )}

                        {content.owner_email !== user.email ? (
                          <div
                            className="absolute right-3 top-3 z-20"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setOpenMenuId((prev) =>
                                  prev === content.id ? null : content.id
                                )
                              }
                              className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/92 shadow-sm backdrop-blur"
                              aria-label="Open post options"
                            >
                              <MoreHorizontal className="h-5 w-5 text-slate-700" />
                            </button>

                            {openMenuId === content.id && (
                              <div className="absolute right-0 mt-2 w-48 overflow-hidden rounded-[12px] border border-slate-200 bg-white shadow-lg">
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleQuickReport(content);
                                    setOpenMenuId(null);
                                  }}
                                  className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50"
                                >
                                  <Flag className="h-4 w-4 text-rose-500" />
                                  Report Content
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div
                            className="absolute right-3 top-3 z-20"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => handleDelete(content.id)}
                              className="flex h-10 w-10 items-center justify-center rounded-full border border-red-200 bg-white/92 shadow-sm backdrop-blur"
                              aria-label="Delete post"
                            >
                              <MoreHorizontal className="h-5 w-5 text-slate-700" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="space-y-3 p-4">
                        {content.caption ? (
                          <p className="text-sm text-slate-700">{content.caption}</p>
                        ) : null}

                        {content.location ? (
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                            <MapPin className="h-3 w-3" />
                            {content.location}
                          </div>
                        ) : null}

                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-slate-700">
                            {content.owner_email.split("@")[0]}
                          </span>

                          <Badge variant="outline" className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            {content.view_count || 0}
                          </Badge>
                        </div>

                        {content.owner_email !== user.email ? (
                          <div className="border-t border-slate-100 pt-2"></div>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <FloatingUploadButton
          onClick={() => setShowAddModal(true)}
          disabled={isUploading || isSubmitting}
        />

        <AnimatePresence>
          {zoomedImage && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4"
              onClick={() => setZoomedImage(null)}
            >
              <button
                type="button"
                onClick={() => setZoomedImage(null)}
                className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </button>

              <img
                src={zoomedImage}
                alt=""
                className="max-h-[90vh] max-w-full rounded-[18px] object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {activeVideo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 p-4"
              onClick={() => setActiveVideo(null)}
            >
              <button
                type="button"
                onClick={() => setActiveVideo(null)}
                className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </button>

              <video
                src={activeVideo}
                controls
                autoPlay
                playsInline
                className="max-h-[90vh] max-w-full rounded-[18px] object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Modal
        open={showAddModal}
        onClose={() => {
          if (isSubmitting) return;
          setShowAddModal(false);
          setNewPost({
            caption: "",
            location: "",
            photos: [],
            videos: [],
          });
        }}
        title="Add a Post"
      >
        <Card className="rounded-[16px] border border-slate-100 bg-white shadow-[0_4px_12px_rgba(15,23,42,0.06)]">
          <CardContent className="p-4">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Caption
            </label>
            <textarea
              value={newPost.caption}
              onChange={(e) =>
                setNewPost((prev) => ({ ...prev, caption: e.target.value }))
              }
              placeholder="Write something romantic..."
              className="mb-4 min-h-[96px] w-full rounded-[12px] border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#ef4f75]"
            />

            <label className="mb-2 block text-sm font-medium text-slate-700">
              Location
            </label>
            <div className="relative mb-4">
              <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={newPost.location}
                onChange={(e) =>
                  setNewPost((prev) => ({ ...prev, location: e.target.value }))
                }
                placeholder="Where was this?"
                className="h-11 w-full rounded-[12px] border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-[#ef4f75]"
              />
            </div>

            <label className="mb-2 block text-sm font-medium text-slate-700">
              Photos
            </label>
            <div className="mb-4 space-y-3">
              {newPost.photos.map((photo, index) => (
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
              {newPost.videos.map((video, index) => (
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
          </CardContent>
        </Card>

        <Button
          type="button"
          onClick={handleSavePost}
          disabled={
            isSubmitting ||
            isUploading ||
            (!newPost.caption.trim() &&
              newPost.photos.length === 0 &&
              newPost.videos.length === 0)
          }
          className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-[#ef4f75] text-white hover:bg-[#e24469]"
        >
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Heart className="h-4 w-4" />
              <span>Save Post</span>
            </>
          )}
        </Button>
      </Modal>

      <BottomNav />
    </>
  );
}