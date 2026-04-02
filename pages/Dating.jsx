import React from "react";
import { supabase } from "@/lib/supabase";
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

const PUBLIC_MAX_H = "max-h-[820px]";
const MY_MAX_H = "max-h-[320px]";

function MediaFrame({ children, maxHClass = PUBLIC_MAX_H }) {
  return (
    <div className="relative w-full bg-black">
      <div className={`w-full ${maxHClass} overflow-auto`}>{children}</div>
      <div className="absolute inset-0 pointer-events-none border border-white/20" />
    </div>
  );
}

function VideoPreview({ src, maxHClass = PUBLIC_MAX_H }) {
  return (
    <MediaFrame maxHClass={maxHClass}>
      <div className="w-full flex items-center justify-center">
        <video src={src} preload="metadata" muted playsInline className="w-full h-auto object-contain" />
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

  const [uploadDialog, setUploadDialog] = React.useState(false);
  const [reportDialog, setReportDialog] = React.useState(false);
  const [selectedContent, setSelectedContent] = React.useState(null);

  const [uploadFile, setUploadFile] = React.useState(null);
  const [caption, setCaption] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [reportReason, setReportReason] = React.useState("inappropriate");
  const [reportDetails, setReportDetails] = React.useState("");

  const [isUploading, setIsUploading] = React.useState(false);
  const [showMyContent, setShowMyContent] = React.useState(false);
  const [zoomedImage, setZoomedImage] = React.useState(null);
  const [activeVideo, setActiveVideo] = React.useState(null);

  const [dailyAdvice, setDailyAdvice] = React.useState("");
  const [showAdvice, setShowAdvice] = React.useState(true);

  const [confirmNoMinors, setConfirmNoMinors] = React.useState(false);
  const [confirmRights, setConfirmRights] = React.useState(false);

  const [openMenuId, setOpenMenuId] = React.useState(null);

  React.useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
    })();
  }, []);

  React.useEffect(() => {
    const today = new Date().toDateString();
    const cached = localStorage.getItem("dailyAdvice");
    const cachedDate = localStorage.getItem("dailyAdviceDate");

    if (cached && cachedDate === today) {
      setDailyAdvice(cached);
    } else {
      const fallback = "Love grows stronger when nurtured daily with small acts of kindness.";
      setDailyAdvice(fallback);
      localStorage.setItem("dailyAdvice", fallback);
      localStorage.setItem("dailyAdviceDate", today);
    }
  }, []);

  const { data: myContent = [] } = useQuery({
    queryKey: ["myContent"],
    queryFn: async () => {
      const { data } = await supabase.from("DateContent").select("*").eq("owner_id", user.id);
      return data || [];
    },
    enabled: !!user && showMyContent
  });

  const { data: publicContent = [] } = useQuery({
    queryKey: ["publicContent"],
    queryFn: async () => {
      const { data } = await supabase.from("DateContent").select("*").eq("visibility", "PUBLIC_WALL");
      return data || [];
    },
    enabled: !!user
  });

  const handleReaction = async (contentId) => {
    await fetch("/api/functions/toggleReaction", {
      method: "POST",
      body: JSON.stringify({ contentId, reactionType: "heart" })
    });

    queryClient.invalidateQueries({ queryKey: ["publicContent"] });
  };

  const handleDelete = async (id) => {
    await supabase.from("DateContent").delete().eq("id", id);
    queryClient.invalidateQueries();
  };

  const handleUpload = async () => {
    if (!uploadFile) return;

    setIsUploading(true);

    try {
      const { data } = await supabase.storage.from("uploads").upload(`public/${uploadFile.name}`, uploadFile);

      const url = data?.path;

      await fetch("/api/functions/uploadDateContent", {
        method: "POST",
        body: JSON.stringify({
          content_url: url,
          caption,
          location
        })
      });

      toast.success("Uploaded");
      setUploadDialog(false);
    } catch {
      toast.error("Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Dating</h1>

      {publicContent.map((content) => (
        <Card key={content.id} className="mb-4">
          <CardContent>
            {content.content_type === "VIDEO" ? (
              <VideoPreview src={content.content_url} />
            ) : (
              <img src={content.content_url} className="w-full object-contain" />
            )}

            <div className="flex justify-between mt-2">
              <Button onClick={() => handleReaction(content.id)}>
                <Heart className="w-4 h-4" />
              </Button>

              {content.owner_id === user.id && (
                <Button onClick={() => handleDelete(content.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      <Button onClick={() => setUploadDialog(true)}>Upload</Button>

      <Dialog open={uploadDialog} onOpenChange={setUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload</DialogTitle>
          </DialogHeader>

          <Input type="file" onChange={(e) => setUploadFile(e.target.files[0])} />
          <Textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Caption" />
          <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Location" />

          <Button onClick={handleUpload} disabled={isUploading}>
            Upload
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
