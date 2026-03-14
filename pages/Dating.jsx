import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Camera,
  Shield,
  Flag,
  Ban,
  Eye,
  Image as ImageIcon,
  Plus,
  MapPin,
  X,
  Trash2,
  Heart,
  Sparkles,
  Play,
  MoreHorizontal
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const ADMIN_REPORT_EMAIL = "breeservantt@gmail.com";

/**
 * ✅ Soft-limit rule (shows full image, but prevents extreme tall posts)
 * - NO crop (object-contain)
 * - Soft limit: max-height with scroll for very tall images/videos
 *
 * Change these if you want:
 * - PUBLIC_MAX_H: taller makes posts larger
 * - MY_MAX_H: smaller tiles in "My Content"
 */
const PUBLIC_MAX_H = "max-h-[820px]";
const MY_MAX_H = "max-h-[320px]";

/**
 * ✅ MediaFrame: keeps "natural" full view without cutting.
 * - For normal photos: shows full image at natural ratio.
 * - For tall photos: container scrolls (not shrinks).
 */
function MediaFrame({ children, maxHClass = PUBLIC_MAX_H }) {
  return (
    <div className="relative w-full bg-black">
      <div className={`w-full ${maxHClass} overflow-auto`}>
        {children}
      </div>
      {/* thin overlay border (does not resize image) */}
      <div className="absolute inset-0 pointer-events-none border border-white/20" />
    </div>
  );
}

/**
 * Video preview (no crop) with play overlay.
 */
function VideoPreview({ src, maxHClass = PUBLIC_MAX_H }) {
  return (
    <MediaFrame maxHClass={maxHClass}>
      <div className="w-full flex items-center justify-center">
        <video
          src={src}
          preload="metadata"
          muted
          playsInline
          className="w-full h-auto object-contain"
        />
      </div>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-12 h-12 rounded-full bg-black/45 flex items-center justify-center">
          <Play className="w-6 h-6 text-white" />
        </div>
      </div>
    </MediaFrame>
  );
}

export default function Dating() {
  const queryClient = useQueryClient();

  const [user, setUser] = React.useState(null);

  // UI state
  const [uploadDialog, setUploadDialog] = React.useState(false);
  const [reportDialog, setReportDialog] = React.useState(false);
  const [selectedContent, setSelectedContent] = React.useState(null);

  const [uploadFile, setUploadFile] = React.useState(null);
  const [caption, setCaption] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [reportReason, setReportReason] = React.useState("inappropriate");
  const [reportDetails, setReportDetails] = React.useState("");

  const [isUploading, setIsUploading] = React.useState(false);

  // folders / modals
  const [showMyContent, setShowMyContent] = React.useState(false);
  const [zoomedImage, setZoomedImage] = React.useState(null);

  // single video modal
  const [activeVideo, setActiveVideo] = React.useState(null);

  // daily advice
  const [dailyAdvice, setDailyAdvice] = React.useState("");
  const [showAdvice, setShowAdvice] = React.useState(true);

  // minors / policy consent gates for upload
  const [confirmNoMinors, setConfirmNoMinors] = React.useState(false);
  const [confirmRights, setConfirmRights] = React.useState(false);

  // dotted menu (on-image)
  const [openMenuId, setOpenMenuId] = React.useState(null);

  React.useEffect(() => {
    (async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    })();
  }, []);

  // close menu on outside click
  React.useEffect(() => {
    const onDocClick = () => setOpenMenuId(null);
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  // Daily advice (cached per day)
  React.useEffect(() => {
    const loadDailyAdvice = async () => {
      const today = new Date().toDateString();
      const cachedAdvice = localStorage.getItem("dailyAdvice");
      const cachedDate = localStorage.getItem("dailyAdviceDate");

      if (cachedAdvice && cachedDate === today) {
        setDailyAdvice(cachedAdvice);
        return;
      }

      try {
        const result = await base44.integrations.Core.InvokeLLM({
          prompt:
            "Generate a short, romantic relationship advice or insight for couples (1-2 sentences max). Make it warm, positive, and actionable.",
          response_json_schema: { type: "object", properties: { advice: { type: "string" } } }
        });

        const advice = result?.advice || "Love grows stronger when nurtured daily with small acts of kindness.";
        setDailyAdvice(advice);
        localStorage.setItem("dailyAdvice", advice);
        localStorage.setItem("dailyAdviceDate", today);
      } catch {
        setDailyAdvice("Love grows stronger when nurtured daily with small acts of kindness.");
      }
    };

    loadDailyAdvice();
  }, []);

  // My Content (only when folder open)
  const { data: myContent = [], isLoading: myContentLoading } = useQuery({
    queryKey: ["myDateContent", user?.email],
    queryFn: () => base44.entities.DateContent.filter({ owner_email: user.email }),
    enabled: !!user?.email && showMyContent
  });

  // Public wall polling paused during upload
  const { data: publicContent = [], isLoading: publicLoading } = useQuery({
    queryKey: ["publicDateContent"],
    queryFn: () =>
      base44.entities.DateContent.filter({ visibility: "PUBLIC_WALL", moderation_status: "APPROVED" }),
    enabled: !!user?.email,
    refetchInterval: isUploading ? false : 15000
  });

  // Reactions polling paused during upload
  const { data: allReactions = [] } = useQuery({
    queryKey: ["contentReactions"],
    queryFn: () => base44.entities.ContentReaction.list(),
    enabled: !!user?.email,
    refetchInterval: isUploading ? false : 15000
  });

  // Keep strikes query (no UI)
  useQuery({
    queryKey: ["strikes", user?.email],
    queryFn: () => base44.entities.StrikeRecord.filter({ user_email: user.email, is_active: true }),
    enabled: !!user?.email
  });

  const getHeartCount = (contentId) =>
    allReactions.filter((r) => r.content_id === contentId && r.reaction_type === "heart").length;

  const hasUserHearted = (contentId) =>
    allReactions.some(
      (r) => r.content_id === contentId && r.user_email === user?.email && r.reaction_type === "heart"
    );

  const handleReaction = async (contentId, reactionType) => {
    try {
      await base44.functions.invoke("toggleReaction", { contentId, reactionType });
      queryClient.invalidateQueries({ queryKey: ["contentReactions"] });
    } catch {
      toast.error("Failed to react");
    }
  };

  const handleDelete = async (contentId) => {
    if (!confirm("Are you sure you want to delete this content?")) return;

    try {
      await base44.entities.DateContent.delete(contentId);
      toast.success("Content deleted");
      queryClient.invalidateQueries({ queryKey: ["myDateContent"] });
      queryClient.invalidateQueries({ queryKey: ["publicDateContent"] });
    } catch {
      toast.error("Failed to delete content");
    }
  };

  const handleReport = async () => {
    if (!selectedContent) return;

    try {
      await base44.functions.invoke("reportDateContent", {
        contentId: selectedContent.id,
        reason: reportReason,
        details: reportDetails,
        admin_email: ADMIN_REPORT_EMAIL
      });

      toast.success("Content reported");
      setReportDialog(false);
      setReportDetails("");
      setSelectedContent(null);
    } catch {
      toast.error("Failed to report content");
    }
  };

  const handleBlock = async (email) => {
    try {
      await base44.functions.invoke("blockUser", { blockedEmail: email });
      toast.success("User blocked");
      queryClient.invalidateQueries({ queryKey: ["publicDateContent"] });
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.message || "Failed to block user");
    }
  };

  const getUploadErrorMessage = (error) => {
    const data = error?.response?.data;
    return data?.error || data?.message || data?.detail || error?.message || "Upload failed";
  };

  const handleUpload = async () => {
    if (!confirmNoMinors) {
      toast.error("You must confirm there are NO minors in this content.");
      return;
    }
    if (!confirmRights) {
      toast.error("You must confirm you have rights/consent to upload this content.");
      return;
    }

    if (!uploadFile) {
      toast.error("Please select a file");
      return;
    }

    const sizeMB = uploadFile.size / (1024 * 1024);
    const isVideo = uploadFile.type.startsWith("video/");
    const maxImageMB = 8;
    const maxVideoMB = 30;

    if (!isVideo && sizeMB > maxImageMB) {
      toast.error(`Image too large (${sizeMB.toFixed(1)}MB). Max ${maxImageMB}MB.`);
      return;
    }
    if (isVideo && sizeMB > maxVideoMB) {
      toast.error(`Video too large (${sizeMB.toFixed(1)}MB). Max ${maxVideoMB}MB.`);
      return;
    }

    setIsUploading(true);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: uploadFile });
      const contentType = isVideo ? "VIDEO" : "IMAGE";

      const result = await base44.functions.invoke("uploadDateContent", {
        content_url: file_url,
        content_type: contentType,
        visibility: "PUBLIC_WALL",
        caption,
        location,
        attestation_no_minors: true,
        attestation_rights: true
      });

      if (result?.data?.success) {
        toast.success(isVideo ? "Video uploaded successfully!" : "Photo uploaded successfully!");

        queryClient.invalidateQueries({ queryKey: ["publicDateContent"] });
        if (showMyContent) queryClient.invalidateQueries({ queryKey: ["myDateContent"] });

        setUploadDialog(false);
        setUploadFile(null);
        setCaption("");
        setLocation("");
        setConfirmNoMinors(false);
        setConfirmRights(false);
      } else {
        toast.error(result?.data?.message || "Upload failed");
      }
    } catch (error) {
      const data = error?.response?.data;
      if (data?.strikes) toast.error(data?.message || "Policy violation");
      else if (data?.moderation_reason) toast.error(`Rejected: ${data.moderation_reason}`);
      else toast.error(getUploadErrorMessage(error));
    } finally {
      setIsUploading(false);
    }
  };

  React.useEffect(() => {
    if (uploadDialog) {
      setConfirmNoMinors(false);
      setConfirmRights(false);
    }
  }, [uploadDialog]);

  if (!user) return <div className="p-4">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white pb-24">
      <div className="max-w-6xl mx-auto p-4">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Date-Locking</h1>
          <p className="text-gray-600">Share your special moments safely</p>
        </div>

        {/* Daily Advice */}
        <AnimatePresence>
          {showAdvice && dailyAdvice && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-4"
            >
              <Card className="border-0 bg-gradient-to-r from-pink-50 via-rose-50 to-red-50 shadow-sm relative overflow-hidden">
                <CardContent className="p-4 relative">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-rose-400 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-rose-600 mb-1">💕 Daily Relationship Insight</p>
                      <p className="text-sm text-gray-700 leading-relaxed">{dailyAdvice}</p>
                    </div>
                    <button
                      onClick={() => setShowAdvice(false)}
                      className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Upload FAB */}
        <div className="fixed bottom-28 right-6 z-40">
          <button
            onClick={() => setUploadDialog(true)}
            className="relative w-14 h-14 bg-rose-500 hover:bg-rose-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110 group"
          >
            <Camera className="w-6 h-6" />
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
              <Plus className="w-4 h-4 text-rose-500" />
            </div>
            <span className="absolute right-16 whitespace-nowrap bg-gray-900 text-white text-xs px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              Upload
            </span>
          </button>
        </div>

        {/* My Content */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() => setShowMyContent((v) => !v)}
            className="flex items-center justify-between w-full text-xl font-bold mb-4 hover:text-rose-600 transition-colors"
          >
            <span>My Content</span>
            <span className="text-2xl">{showMyContent ? "▼" : "▶"}</span>
          </button>

          {showMyContent && (
            <div>
              {myContentLoading ? (
                <div className="text-sm opacity-70">Loading your content...</div>
              ) : myContent.length === 0 ? (
                <Card>
                  <CardContent className="p-6 text-center text-gray-500">No content yet.</CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {myContent.map((content) => (
                    <Card key={content.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        <div className="relative">
                          {content.content_type === "VIDEO" ? (
                            <button
                              type="button"
                              onClick={() => setActiveVideo(content.content_url)}
                              className="w-full block"
                            >
                              <VideoPreview src={content.content_url} maxHClass={MY_MAX_H} />
                            </button>
                          ) : (
                            <MediaFrame maxHClass={MY_MAX_H}>
                              <img
                                src={content.content_url}
                                className="w-full h-auto object-contain"
                                onClick={() => setZoomedImage(content.content_url)}
                                alt=""
                                loading="lazy"
                              />
                            </MediaFrame>
                          )}
                        </div>

                        <div className="p-3">
                          <div className="flex items-center justify-between">
                            <Badge variant={content.visibility === "PUBLIC_WALL" ? "default" : "secondary"}>
                              {content.visibility === "PUBLIC_WALL" ? "Public" : "Private"}
                            </Badge>
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Eye className="w-3 h-3" />
                              {content.view_count || 0}
                            </div>
                          </div>

                          <button
                            onClick={() => handleDelete(content.id)}
                            className="mt-2 w-full flex items-center justify-center py-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
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

        {/* Public Wall */}
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4">Public Wall</h2>

          {publicLoading ? (
            <div className="text-sm opacity-70">Loading public content...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {publicContent.map((content) => (
                <Card key={content.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="relative">
                      {content.content_type === "VIDEO" ? (
                        <button
                          type="button"
                          onClick={() => setActiveVideo(content.content_url)}
                          className="w-full block"
                        >
                          <VideoPreview src={content.content_url} maxHClass={PUBLIC_MAX_H} />
                        </button>
                      ) : (
                        <MediaFrame maxHClass={PUBLIC_MAX_H}>
                          <img
                            src={content.content_url}
                            className="w-full h-auto object-contain"
                            onClick={() => setZoomedImage(content.content_url)}
                            alt=""
                            loading="lazy"
                          />
                        </MediaFrame>
                      )}

                      {/* Dots menu ON image */}
                      {content.owner_email !== user.email && (
                        <div className="absolute top-2 right-2 z-20" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => setOpenMenuId((prev) => (prev === content.id ? null : content.id))}
                            className="w-10 h-10 rounded-full bg-white/85 backdrop-blur border border-slate-200 shadow-sm flex items-center justify-center"
                            aria-label="More options"
                            title="Options"
                          >
                            <MoreHorizontal className="w-5 h-5 text-slate-700" />
                          </button>

                          {openMenuId === content.id && (
                            <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedContent(content);
                                  setReportDialog(true);
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                              >
                                <Flag className="w-4 h-4 text-slate-600" />
                                Report
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  handleBlock(content.owner_email);
                                  setOpenMenuId(null);
                                }}
                                className="w-full px-4 py-3 text-left text-sm hover:bg-slate-50 flex items-center gap-2"
                              >
                                <Ban className="w-4 h-4 text-slate-600" />
                                Block
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Delete button ON image for owner */}
                      {content.owner_email === user.email && (
                        <div className="absolute top-2 right-2 z-20" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => handleDelete(content.id)}
                            className="w-10 h-10 rounded-full bg-white/85 backdrop-blur border border-red-200 shadow-sm flex items-center justify-center"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5 text-red-600" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="p-4">
                      {content.caption && <p className="text-sm text-gray-700 mb-2">{content.caption}</p>}

                      {content.location && (
                        <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                          <MapPin className="w-3 h-3" />
                          {content.location}
                        </div>
                      )}

                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">{content.owner_email.split("@")[0]}</span>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          {content.view_count || 0}
                        </Badge>
                      </div>

                      {content.owner_email !== user.email && (
                        <div className="pt-2 border-t border-gray-100">
                          <button
                            onClick={() => handleReaction(content.id, "heart")}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-full transition-all ${
                              hasUserHearted(content.id)
                                ? "bg-rose-100 text-rose-600"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${hasUserHearted(content.id) ? "fill-rose-600" : ""}`} />
                            <span className="text-sm font-medium">{getHeartCount(content.id)}</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {publicContent.length === 0 && !publicLoading && (
            <Card>
              <CardContent className="p-12 text-center text-gray-500">No public content yet. Be the first to share!</CardContent>
            </Card>
          )}
        </div>

        {/* Upload Dialog */}
        <Dialog open={uploadDialog} onOpenChange={setUploadDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Photo or Video</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Photo or Video</label>
                <Input
                  type="file"
                  accept="image/*,video/*"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="cursor-pointer"
                />

                {uploadFile && (
                  <div className="mt-2 p-2 bg-gray-50 rounded flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-600">{uploadFile.name}</span>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setUploadFile(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Caption</label>
                <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Write a caption..." rows={3} className="resize-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location (Optional)</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Add location..." className="pl-10" />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <div className="flex gap-2 text-sm text-blue-900">
                  <Shield className="w-4 h-4 mt-0.5" />
                  <div>
                    <p className="font-semibold mb-2">Content Policy (Required)</p>

                    <label className="flex items-start gap-2 text-xs text-blue-900">
                      <input type="checkbox" className="mt-1" checked={confirmNoMinors} onChange={(e) => setConfirmNoMinors(e.target.checked)} />
                      <span>
                        I confirm this content contains <b>NO minors</b> (no one under 18).
                      </span>
                    </label>

                    <label className="flex items-start gap-2 text-xs text-blue-900 mt-2">
                      <input type="checkbox" className="mt-1" checked={confirmRights} onChange={(e) => setConfirmRights(e.target.checked)} />
                      <span>
                        I have the <b>rights/consent</b> to upload this content and it follows the rules.
                      </span>
                    </label>

                    <ul className="text-xs space-y-1 mt-3 text-blue-800">
                      <li>• No nudity or explicit content</li>
                      <li>• No minors in content</li>
                      <li>• No violence or harassment</li>
                      <li>• View-only (no downloads allowed)</li>
                    </ul>
                  </div>
                </div>
              </div>

              <Button onClick={handleUpload} disabled={isUploading || !uploadFile || !confirmNoMinors || !confirmRights} className="w-full">
                {isUploading ? "Uploading..." : "Upload"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Image Zoom */}
        {zoomedImage && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setZoomedImage(null)}>
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <img src={zoomedImage} className="max-w-full max-h-full object-contain" onClick={(e) => e.stopPropagation()} alt="" />
          </div>
        )}

        {/* Video Modal */}
        {activeVideo && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={() => setActiveVideo(null)}>
            <button
              onClick={() => setActiveVideo(null)}
              className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <video
              src={activeVideo}
              controls
              playsInline
              autoPlay
              preload="metadata"
              className="max-w-full max-h-full rounded"
              onClick={(e) => e.stopPropagation()}
              controlsList="nodownload"
              onContextMenu={(e) => e.preventDefault()}
            />
          </div>
        )}

        {/* Report Dialog */}
        <Dialog
          open={reportDialog}
          onOpenChange={(open) => {
            setReportDialog(open);
            if (!open) {
              setSelectedContent(null);
              setReportDetails("");
              setReportReason("inappropriate");
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Report Content</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <Select value={reportReason} onValueChange={setReportReason}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="inappropriate">Inappropriate Content</SelectItem>
                  <SelectItem value="harassment">Harassment</SelectItem>
                  <SelectItem value="spam">Spam</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>

              <Textarea placeholder="Additional details (optional)" value={reportDetails} onChange={(e) => setReportDetails(e.target.value)} />

              <Button onClick={handleReport} className="w-full">
                Submit Report
              </Button>

              <p className="text-xs text-slate-500">
                Reports are sent to: <span className="font-medium">{ADMIN_REPORT_EMAIL}</span>
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
