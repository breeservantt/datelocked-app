import React from "react";
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
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const PUBLIC_MAX_H = "max-h-[1200px]";
const MY_MAX_H = "max-h-[750px]";

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

function MediaFrame({ children, maxHClass = PUBLIC_MAX_H }) {
  return (
    <div className="relative w-full overflow-hidden bg-black">
      <div className="w-full">{children}</div>
      <div className="pointer-events-none absolute inset-0 border border-white/20" />
    </div>
  );
}

function VideoPreview({ src, maxHClass = PUBLIC_MAX_H }) {
  return (
    <MediaFrame maxHClass={maxHClass}>
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

const STORAGE_KEY = "dating_wall_content";

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

const wallApi = {
  auth: {
    async me() {
      return {
        id: "user-1",
        email: "you@example.com",
        full_name: "Your Name",
      };
    },
  },

  integrations: {
    async uploadFile(file) {
      return {
        file_url: URL.createObjectURL(file),
      };
    },
  },

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

    async create(payload) {
      const items = loadStoredContent();

      const newItem = {
        id: crypto.randomUUID(),
        owner_email: payload.owner_email,
        content_url: payload.content_url,
        content_type: payload.content_type,
        visibility: "PUBLIC_WALL",
        moderation_status: "APPROVED",
        caption: payload.caption || "",
        location: payload.location || "",
        view_count: 0,
      };

      const next = [newItem, ...items];
      saveStoredContent(next);

      return {
        success: true,
        item: newItem,
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

function FloatingUploadButton({ onClick, disabled = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="group fixed bottom-28 right-6 z-40 disabled:opacity-60"
      aria-label="Upload photo or video"
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

export default function Dating() {
  const queryClient = useQueryClient();
  const fileInputRef = React.useRef(null);

  const [user, setUser] = React.useState(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [showMyContent, setShowMyContent] = React.useState(false);
  const [zoomedImage, setZoomedImage] = React.useState(null);
  const [activeVideo, setActiveVideo] = React.useState(null);
  const [dailyAdvice, setDailyAdvice] = React.useState("");
  const [showAdvice, setShowAdvice] = React.useState(true);
  const [openMenuId, setOpenMenuId] = React.useState(null);

  const [myContentState, setMyContentState] = React.useState([]);
  const [publicContentState, setPublicContentState] = React.useState([]);
  const [allReactionsState, setAllReactionsState] = React.useState([]);

  React.useEffect(() => {
    (async () => {
      const currentUser = await wallApi.auth.me();
      setUser(currentUser);
    })();
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

  const { data: myContent = [], isLoading: myContentLoading } = useQuery({
    queryKey: ["myDateContent", user?.email],
    queryFn: () => wallApi.content.listMine(user.email),
    enabled: !!user?.email && showMyContent,
  });

  const { data: publicContent = [], isLoading: publicLoading } = useQuery({
    queryKey: ["publicDateContent"],
    queryFn: () => wallApi.content.listPublic(),
    enabled: !!user?.email,
    refetchInterval: isUploading ? false : 15000,
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

  const getHeartCount = (contentId) =>
    allReactionsState.filter(
      (r) => r.content_id === contentId && r.reaction_type === "heart"
    ).length;

  const hasUserHearted = (contentId) =>
    allReactionsState.some(
      (r) =>
        r.content_id === contentId &&
        r.user_email === user?.email &&
        r.reaction_type === "heart"
    );

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
            id: crypto.randomUUID(),
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

  const getUploadErrorMessage = (error) => {
    return error?.message || "Upload failed";
  };

  const handleFloatingUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleImmediateUpload = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;
    if (!user?.email) {
      toast.error("User not loaded yet");
      return;
    }

    const sizeMB = file.size / (1024 * 1024);
    const isVideo = file.type.startsWith("video/");
    const isImage = file.type.startsWith("image/");
    const maxImageMB = 8;
    const maxVideoMB = 30;

    if (!isImage && !isVideo) {
      toast.error("Only image or video files are allowed");
      return;
    }

    if (isImage && sizeMB > maxImageMB) {
      toast.error(`Image too large (${sizeMB.toFixed(1)}MB). Max ${maxImageMB}MB.`);
      return;
    }

    if (isVideo && sizeMB > maxVideoMB) {
      toast.error(`Video too large (${sizeMB.toFixed(1)}MB). Max ${maxVideoMB}MB.`);
      return;
    }

    setIsUploading(true);

    try {
      const { file_url } = await wallApi.integrations.uploadFile(file);
      const contentType = isVideo ? "VIDEO" : "IMAGE";

      const result = await wallApi.content.create({
        owner_email: user.email,
        content_url: file_url,
        content_type: contentType,
        caption: "",
        location: "",
      });

      if (!result?.success || !result?.item) {
        toast.error("Upload failed");
        return;
      }

      const newContent = result.item;
      setPublicContentState((current) => [newContent, ...current]);

      if (showMyContent) {
        setMyContentState((current) => [newContent, ...current]);
      }

      toast.success(isVideo ? "Video uploaded successfully!" : "Photo uploaded successfully!");
      queryClient.invalidateQueries({ queryKey: ["publicDateContent"] });
      if (showMyContent) {
        queryClient.invalidateQueries({ queryKey: ["myDateContent"] });
      }
    } catch (error) {
      toast.error(getUploadErrorMessage(error));
    } finally {
      setIsUploading(false);
    }
  };

  if (!user) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-[#f7f1f4] px-3 py-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleImmediateUpload}
        className="hidden"
      />

      <div className="mx-auto w-full max-w-[430px] overflow-hidden rounded-[18px] border border-[#ece6ea] bg-[#f7f4f6] shadow-[0_6px_18px_rgba(15,23,42,0.06)]">
        <div className="border-b border-slate-200 bg-[#f8f6f7] px-5 py-5">
          <h1 className="text-[1.9rem] font-semibold tracking-[-0.02em] text-slate-800">
            Date-Locking
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Share your special moments safely
          </p>
        </div>

        <div className="space-y-4 px-4 py-4">
          <AnimatePresence>
            {showAdvice && dailyAdvice && (
              <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
              >
                <Card className="overflow-hidden rounded-[14px] border border-rose-100 bg-gradient-to-r from-pink-50 via-rose-50 to-red-50 shadow-[0_4px_12px_rgba(15,23,42,0.06)]">
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
            <button
              type="button"
              onClick={() => setShowMyContent((v) => !v)}
              className="flex w-full items-center justify-between rounded-[14px] bg-white px-4 py-4 text-left shadow-[0_4px_12px_rgba(15,23,42,0.06)] transition hover:bg-slate-50"
            >
              <span className="text-lg font-semibold text-slate-800">My Content</span>
              <span className="text-xl text-slate-500">{showMyContent ? "▼" : "▶"}</span>
            </button>

            {showMyContent && (
              <div>
                {myContentLoading ? (
                  <div className="text-sm text-slate-500">Loading your content...</div>
                ) : myContentState.length === 0 ? (
                  <Card className="rounded-[14px] border border-slate-100 bg-white shadow-[0_4px_12px_rgba(15,23,42,0.06)]">
                    <CardContent className="p-6 text-center text-slate-500">
                      No content yet.
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {myContentState.map((content) => (
                      <Card
                        key={content.id}
                        className="overflow-hidden rounded-[14px] border border-slate-100 bg-white shadow-[0_4px_12px_rgba(15,23,42,0.06)]"
                      >
                        <CardContent className="p-0">
                          <div className="relative">
                            {content.content_type === "VIDEO" ? (
                              <button
                                type="button"
                                onClick={() => setActiveVideo(content.content_url)}
                                className="block w-full"
                              >
                                <VideoPreview src={content.content_url} maxHClass={MY_MAX_H} />
                              </button>
                            ) : (
                              <MediaFrame maxHClass={MY_MAX_H}>
                                <img
                                  src={content.content_url}
                                  alt=""
                                  loading="lazy"
                                  className="w-full h-auto cursor-pointer object-contain"
                                  onClick={() => setZoomedImage(content.content_url)}
                                />
                              </MediaFrame>
                            )}
                          </div>

                          <div className="space-y-3 p-4">
                            <div className="flex items-center justify-between">
                              <Badge
                                variant={
                                  content.visibility === "PUBLIC_WALL"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {content.visibility === "PUBLIC_WALL" ? "Public" : "Private"}
                              </Badge>

                              <div className="flex items-center gap-1 text-xs text-slate-500">
                                <Eye className="h-3 w-3" />
                                {content.view_count || 0}
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDelete(content.id)}
                              className="flex h-10 w-full items-center justify-center rounded-[12px] border border-red-200 bg-white text-red-600 transition hover:bg-red-50 hover:text-red-700"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">Public Wall</h2>

            {publicLoading ? (
              <div className="text-sm text-slate-500">Loading public content...</div>
            ) : publicContentState.length === 0 ? (
              <Card className="rounded-[14px] border border-slate-100 bg-white shadow-[0_4px_12px_rgba(15,23,42,0.06)]">
                <CardContent className="p-12 text-center text-slate-500">
                  No public content yet. Be the first to share!
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {publicContentState.map((content) => (
                  <Card
                    key={content.id}
                    className="overflow-hidden rounded-[14px] border border-slate-100 bg-white shadow-[0_4px_12px_rgba(15,23,42,0.06)]"
                  >
                    <CardContent className="p-0">
                      <div className="relative">
                        {content.content_type === "VIDEO" ? (
                          <button
                            type="button"
                            onClick={() => setActiveVideo(content.content_url)}
                            className="block w-full"
                          >
                            <VideoPreview src={content.content_url} maxHClass={PUBLIC_MAX_H} />
                          </button>
                        ) : (
                          <MediaFrame maxHClass={PUBLIC_MAX_H}>
                            <img
                              src={content.content_url}
                              alt=""
                              loading="lazy"
                              className="h-full w-full cursor-pointer object-cover"
                              onClick={() => setZoomedImage(content.content_url)}
                            />
                          </MediaFrame>
                        )}

                        {content.owner_email !== user.email ? (
                          <div
                            className="absolute right-5 top-5 z-20"
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
                            className="absolute right-5 top-5 z-20"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => handleDelete(content.id)}
                              className="flex h-10 w-10 items-center justify-center rounded-full border border-red-200 bg-white/92 shadow-sm backdrop-blur"
                              aria-label="Delete post"
                            >
                              <Trash2 className="h-5 w-5 text-red-600" />
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
                          <div className="border-t border-slate-100 pt-2">
                            <button
                              type="button"
                              onClick={() => handleReaction(content.id, "heart")}
                              className={`flex items-center gap-1.5 rounded-full px-3 py-2 transition-all ${
                                hasUserHearted(content.id)
                                  ? "bg-rose-100 text-rose-600"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                            >
                              <Heart
                                className={`h-4 w-4 ${
                                  hasUserHearted(content.id) ? "fill-rose-600" : ""
                                }`}
                              />
                              <span className="text-sm font-medium">
                                {getHeartCount(content.id)}
                              </span>
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <FloatingUploadButton
        onClick={handleFloatingUploadClick}
        disabled={isUploading}
      />
    </div>
  );
}