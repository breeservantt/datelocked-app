import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  MessageCircle,
  Users,
  Plus,
  Send,
  Check,
  CheckCheck,
  Image as ImageIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import GroupChatList from "@/components/chat/GroupChatList";
import { parseSafeDate } from "@/components/utils/dateHelpers";

const NOTIFY_AUDIO_SRC =
  "data:audio/wav;base64,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";

const createPageUrl = (pageName) => {
  if (pageName === "Home") return "/";
  return `/${pageName.toLowerCase()}`;
};

function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-[#f7f1f4] px-3 py-3 pb-24">
      <div className="mx-auto w-full max-w-[390px] overflow-hidden rounded-[18px] border border-[#ece6ea] bg-[#f7f4f6] shadow-[0_6px_18px_rgba(15,23,42,0.06)]">
        {children}
      </div>
    </div>
  );
}

function AppHeader({ title, subtitle }) {
  return (
    <div className="border-b border-slate-200 bg-[#f8f6f7] px-5 py-5">
      <div className="flex items-start gap-3">
        <Link to={createPageUrl("Home")}>
          <button
            type="button"
            className="rounded-[10px] p-1.5 transition hover:bg-slate-100"
          >
            <ArrowLeft className="h-6 w-6 text-slate-700" />
          </button>
        </Link>

        <div>
          <h1 className="text-[1.9rem] font-semibold tracking-[-0.02em] text-slate-800">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function AppCard({ children, className = "" }) {
  return (
    <div
      className={`overflow-hidden rounded-[14px] border border-slate-100 bg-white shadow-[0_4px_12px_rgba(15,23,42,0.06)] ${className}`}
    >
      {children}
    </div>
  );
}

function GradientInfoCard({ children, className = "" }) {
  return (
    <div
      className={`rounded-[14px] border border-blue-100 bg-gradient-to-r from-[#eef6ff] via-[#f4f8ff] to-[#eaf3ff] shadow-[0_4px_12px_rgba(15,23,42,0.06)] ${className}`}
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
      className={[
        "h-11 rounded-[12px] text-sm font-medium transition flex items-center justify-center",
        iconOnly ? "w-11 shrink-0 px-0" : "flex-1 px-3",
        active
          ? "bg-gradient-to-r from-[#8ec5ff] to-[#a9bfff] text-black shadow-[0_4px_10px_rgba(142,197,255,0.24)]"
          : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function AvatarCircle({ src, fallback, className = "" }) {
  if (!src && !fallback) return null;

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

function ChatTrayEmpty({ title, text }) {
  return (
    <AppCard className="px-6 py-10 text-center">
      <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-slate-100">
        <MessageCircle className="h-10 w-10 text-slate-300" />
      </div>
      <h3 className="text-[17px] font-semibold text-slate-800">{title}</h3>
      <p className="mx-auto mt-3 max-w-[260px] text-[15px] leading-8 text-slate-500">
        {text}
      </p>
    </AppCard>
  );
}

function ChatInputTray({
  fileInputRef,
  isUploading,
  isSending,
  newMessage,
  setNewMessage,
  handleSend,
  handleFileUpload,
  inputRef,
}) {
  const [showEmoji, setShowEmoji] = React.useState(false);

  const emojiList = [
    "❤️","💕","💖","💘","💝","💞","💓","💗",
    "😍","🥰","😘","😚","😻","💋","🌹","🌸",
    "👩‍❤️‍👨","👨‍❤️‍👨","👩‍❤️‍👩","💑","👩‍❤️‍💋‍👨","👨‍❤️‍💋‍👨","👩‍❤️‍💋‍👩",
    "🔥","✨","🥺","😊","😂","😁","😭","🙏",
    "👍","👏","🙌","💪","👌","🤝","🎉","🎁"
  ];

  return (
    <AppCard className="p-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="relative w-full">
        {showEmoji && (
          <div className="absolute bottom-[56px] left-0 right-0 z-20 rounded-[16px] border border-slate-200 bg-white p-2 shadow-[0_8px_20px_rgba(15,23,42,0.10)]">
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-[12px] font-medium text-slate-500">Emoji</span>
              <button
                type="button"
                onClick={() => setShowEmoji(false)}
                className="text-[12px] text-slate-400"
              >
                Close
              </button>
            </div>

            <div className="grid max-h-[220px] grid-cols-8 gap-2 overflow-y-auto">
              {emojiList.map((emoji, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setNewMessage((prev) => prev + emoji);
                    setShowEmoji(false);
                    inputRef.current?.focus();
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-[8px] text-[18px] hover:bg-slate-100"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 w-full">
          <button
            type="button"
            onClick={() => setShowEmoji((prev) => !prev)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] border border-slate-200 bg-white text-[18px]"
          >
            😊
          </button>

          <input
            ref={inputRef}
            type="text"
            placeholder="Type a message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !isSending && !isUploading && newMessage.trim()) {
                handleSend();
              }
            }}
            className="flex-1 min-w-0 h-11 rounded-[12px] border border-slate-200 bg-white px-3 text-[14px] text-slate-700 outline-none placeholder:text-slate-400"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] border border-slate-200 bg-white text-slate-600 disabled:opacity-60"
          >
            <ImageIcon className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending || isUploading}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-gradient-to-r from-[#8ec5ff] to-[#d8b4fe] text-white disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </AppCard>
  );
}

async function tryProfileTablesById(userId) {
  for (const table of ["profiles", "users"]) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (!error && data) return data;
  }
  return null;
}

async function tryProfileTablesByEmail(email) {
  if (!email) return null;

  for (const table of ["profiles", "users"]) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("email", email)
      .limit(1);

    if (!error && data?.[0]) return data[0];
  }

  return null;
}

export default function Chat() {
  const [user, setUser] = React.useState(null);
  const [partner, setPartner] = React.useState(null);
  const [partnerMessages, setPartnerMessages] = React.useState([]);
  const [groupMessages, setGroupMessages] = React.useState([]);
  const [myGroups, setMyGroups] = React.useState([]);
  const [selectedGroup, setSelectedGroup] = React.useState(null);
  const [activeTab, setActiveTab] = React.useState("partner");
  const [newMessage, setNewMessage] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSending, setIsSending] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);

  const messagesEndRef = React.useRef(null);
  const inputRef = React.useRef(null);
  const fileInputRef = React.useRef(null);
  const notifyAudioRef = React.useRef(null);
  const lastPartnerNotifiedIdRef = React.useRef(null);
  const lastGroupNotifiedIdRef = React.useRef(null);

  React.useEffect(() => {
    notifyAudioRef.current = new Audio(NOTIFY_AUDIO_SRC);
  }, []);

  const playNotify = React.useCallback(() => {
    notifyAudioRef.current?.play().catch(() => {});
  }, []);

  const loadPage = React.useCallback(async () => {
    setIsLoading(true);

    try {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!authUser) {
        setUser(null);
        return;
      }

      let profile = await tryProfileTablesById(authUser.id);

      if (!profile) {
        const payload = {
          id: authUser.id,
          email: authUser.email,
          full_name:
            authUser.user_metadata?.full_name ||
            authUser.user_metadata?.name ||
            authUser.email?.split("@")[0] ||
            "User",
        };

        await supabase.from("profiles").upsert(payload, { onConflict: "id" });
        await supabase.from("users").upsert(payload, { onConflict: "id" });
        profile = payload;
      }

      const mergedUser = {
        ...authUser,
        ...profile,
        email: authUser.email,
      };

      setUser(mergedUser);

      if (mergedUser?.couple_profile_id && mergedUser?.email) {
        const { data: coupleProfile } = await supabase
          .from("couple_profiles")
          .select("*")
          .eq("id", mergedUser.couple_profile_id)
          .maybeSingle();

        if (coupleProfile) {
          const partnerEmail =
            coupleProfile.partner1_email === mergedUser.email
              ? coupleProfile.partner2_email
              : coupleProfile.partner1_email;

          const partnerProfile = await tryProfileTablesByEmail(partnerEmail);
          setPartner(partnerProfile || null);

          const { data: messages } = await supabase
            .from("messages")
            .select("*")
            .eq("couple_profile_id", mergedUser.couple_profile_id)
            .order("created_date", { ascending: true });

          setPartnerMessages(messages || []);
        } else {
          setPartner(null);
          setPartnerMessages([]);
        }
      } else {
        setPartner(null);
        setPartnerMessages([]);
      }

      if (mergedUser?.email) {
        const { data: memberships } = await supabase
          .from("chat_group_members")
          .select("*")
          .eq("user_email", mergedUser.email)
          .eq("status", "active");

        const groupIds = (memberships || [])
          .map((m) => m.chat_group_id)
          .filter(Boolean);

        if (groupIds.length) {
          const { data: groups } = await supabase
            .from("chat_groups")
            .select("*")
            .in("id", groupIds)
            .order("created_date", { ascending: false });

          const groupList = await Promise.all(
            (groups || []).map(async (group) => {
              const { count } = await supabase
                .from("chat_group_members")
                .select("id", { count: "exact", head: true })
                .eq("chat_group_id", group.id)
                .eq("status", "active");

              return {
                ...group,
                memberCount: count || 0,
              };
            })
          );

          setMyGroups(groupList);
        } else {
          setMyGroups([]);
        }
      }
    } catch (error) {
      console.error("Error loading chat page:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadPage();
  }, [loadPage]);

  React.useEffect(() => {
    if (!selectedGroup?.id) {
      setGroupMessages([]);
      return;
    }

    let mounted = true;

    const loadGroupMessages = async () => {
      const { data } = await supabase
        .from("group_messages")
        .select("*")
        .eq("chat_group_id", selectedGroup.id)
        .order("created_date", { ascending: true });

      if (mounted) setGroupMessages(data || []);
    };

    loadGroupMessages();
    const interval = setInterval(loadGroupMessages, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [selectedGroup?.id]);

  React.useEffect(() => {
    if (activeTab !== "partner" || !user?.couple_profile_id) return;

    let mounted = true;

    const loadPartnerMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .eq("couple_profile_id", user.couple_profile_id)
        .order("created_date", { ascending: true });

      if (mounted) setPartnerMessages(data || []);
    };

    loadPartnerMessages();
    const interval = setInterval(loadPartnerMessages, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [activeTab, user?.couple_profile_id]);

  React.useEffect(() => {
    if (!user?.email || !partnerMessages?.length) return;

    const last = partnerMessages[partnerMessages.length - 1];
    if (!last?.id) return;

    const isIncoming = last.sender_email !== user.email;
    const isNew = lastPartnerNotifiedIdRef.current !== last.id;

    if (isIncoming && isNew) {
      lastPartnerNotifiedIdRef.current = last.id;
      playNotify();
    } else if (isNew) {
      lastPartnerNotifiedIdRef.current = last.id;
    }
  }, [partnerMessages, user?.email, playNotify]);

  React.useEffect(() => {
    if (!user?.email || !groupMessages?.length) return;

    const last = groupMessages[groupMessages.length - 1];
    if (!last?.id) return;

    const isIncoming = last.sender_email !== user.email;
    const isNew = lastGroupNotifiedIdRef.current !== last.id;

    if (isIncoming && isNew) {
      lastGroupNotifiedIdRef.current = last.id;
      playNotify();
    } else if (isNew) {
      lastGroupNotifiedIdRef.current = last.id;
    }
  }, [groupMessages, user?.email, playNotify]);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [partnerMessages, groupMessages]);

  const displayedMessages = selectedGroup ? groupMessages : partnerMessages;

  const handleSend = async () => {
    if (!user) return;

    const content = newMessage.trim();
    if (!content) return;

    setIsSending(true);

    try {
      if (selectedGroup?.id) {
        const { error } = await supabase.from("group_messages").insert({
          chat_group_id: selectedGroup.id,
          sender_email: user.email,
          sender_name: user.full_name,
          content,
        });

        if (error) throw error;

        const { data } = await supabase
          .from("group_messages")
          .select("*")
          .eq("chat_group_id", selectedGroup.id)
          .order("created_date", { ascending: true });

        setGroupMessages(data || []);
      } else if (user?.couple_profile_id) {
        const { error } = await supabase.from("messages").insert({
          couple_profile_id: user.couple_profile_id,
          sender_email: user.email,
          content,
          read: false,
        });

        if (error) throw error;

        const { data } = await supabase
          .from("messages")
          .select("*")
          .eq("couple_profile_id", user.couple_profile_id)
          .order("created_date", { ascending: true });

        setPartnerMessages(data || []);
      } else {
        alert("No partner chat is linked yet. Use Groups to chat.");
      }

      setNewMessage("");
      inputRef.current?.focus();
    } catch (error) {
      console.error("Send failed:", error);
      alert("Failed to send message.");
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !user) return;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      alert("Please select an image or video file");
      return;
    }

    setIsUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("chat-media")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("chat-media").getPublicUrl(filePath);
      const publicUrl = data.publicUrl;
      const prefix = isImage ? "📷 " : "🎥 ";
      const content = `${prefix}${publicUrl}`;

      if (selectedGroup?.id) {
        const { error } = await supabase.from("group_messages").insert({
          chat_group_id: selectedGroup.id,
          sender_email: user.email,
          sender_name: user.full_name,
          content,
        });

        if (error) throw error;

        const { data: fresh } = await supabase
          .from("group_messages")
          .select("*")
          .eq("chat_group_id", selectedGroup.id)
          .order("created_date", { ascending: true });

        setGroupMessages(fresh || []);
      } else if (user?.couple_profile_id) {
        const { error } = await supabase.from("messages").insert({
          couple_profile_id: user.couple_profile_id,
          sender_email: user.email,
          content,
          read: false,
        });

        if (error) throw error;

        const { data: fresh } = await supabase
          .from("messages")
          .select("*")
          .eq("couple_profile_id", user.couple_profile_id)
          .order("created_date", { ascending: true });

        setPartnerMessages(fresh || []);
      } else {
        alert("No partner chat is linked yet. Use Groups to share media.");
      }
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload file.");
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex min-h-[520px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#8ec5ff]" />
        </div>
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell>
        <div className="px-4 py-4">
          <ChatTrayEmpty
            title="Couldn’t load chat"
            text="Please sign in and try again."
          />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <AppHeader title="Chat" subtitle="Partner and group conversations" />

      <div className="space-y-4 px-4 py-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${activeTab}-${selectedGroup?.id || "main"}`}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            className="space-y-4"
          >
            {!selectedGroup ? (
              <div className="flex items-center gap-2">
                <TabButton
                  active={activeTab === "partner"}
                  onClick={() => setActiveTab("partner")}
                >
                  Partner
                </TabButton>

                <TabButton
                  active={activeTab === "groups"}
                  onClick={() => setActiveTab("groups")}
                >
                  Groups
                </TabButton>

                {activeTab === "groups" ? (
                  <TabButton active={false} onClick={() => {}} iconOnly>
                    <Plus className="h-5 w-5" />
                  </TabButton>
                ) : null}
              </div>
            ) : null}

            {!selectedGroup && activeTab === "partner" ? (
              <>
                <GradientInfoCard className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-gradient-to-br from-[#8ec5ff] to-[#a9bfff] text-white shadow-sm">
                      <MessageCircle className="h-6 w-6" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-semibold text-slate-800">
                        Partner Chat
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Direct conversation with your partner.
                      </p>
                    </div>

                    <AvatarCircle
                      src={partner?.profile_photo}
                      fallback={partner?.full_name?.[0] || null}
                      className="h-12 w-12 border border-white shadow-sm"
                    />
                  </div>
                </GradientInfoCard>

                {user?.couple_profile_id && displayedMessages.length > 0 ? (
                  <>
                    <AppCard className="p-4">
                      <div className="space-y-4">
                        {displayedMessages.map((msg) => {
                          const isMe = msg.sender_email === user.email;
                          const createdDate = parseSafeDate(msg.created_date);

                          return (
                            <div
                              key={msg.id}
                              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                            >
                              <div className={`max-w-[78%] ${isMe ? "order-2" : "order-1"}`}>
                                <div
                                  className={`rounded-[18px] px-4 py-3 ${
                                    isMe
                                      ? "bg-gradient-to-r from-[#8ec5ff] to-[#a9bfff] text-black"
                                      : "border border-slate-200 bg-white text-slate-800"
                                  }`}
                                >
                                  {msg.content?.startsWith("📷 ") ? (
                                    <img
                                      src={msg.content.substring(3)}
                                      alt="Shared"
                                      className="max-w-full rounded-[12px]"
                                      style={{ maxHeight: "300px" }}
                                    />
                                  ) : msg.content?.startsWith("🎥 ") ? (
                                    <video
                                      src={msg.content.substring(3)}
                                      controls
                                      className="max-w-full rounded-[12px]"
                                      style={{ maxHeight: "300px" }}
                                    />
                                  ) : (
                                    <p className="text-sm leading-relaxed break-words">
                                      {msg.content}
                                    </p>
                                  )}
                                </div>

                                <div
                                  className={`mt-1 flex items-center gap-1 px-1 text-xs text-slate-400 ${
                                    isMe ? "justify-end" : "justify-start"
                                  }`}
                                >
                                  {createdDate ? (
                                    <span>{format(createdDate, "h:mm a")}</span>
                                  ) : null}

                                  {isMe ? (
                                    msg.read ? (
                                      <CheckCheck className="h-3 w-3 text-blue-500" />
                                    ) : (
                                      <Check className="h-3 w-3" />
                                    )
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <div ref={messagesEndRef} />
                      </div>
                    </AppCard>

                    <ChatInputTray
                      fileInputRef={fileInputRef}
                      isUploading={isUploading}
                      isSending={isSending}
                      newMessage={newMessage}
                      setNewMessage={setNewMessage}
                      handleSend={handleSend}
                      handleFileUpload={handleFileUpload}
                      inputRef={inputRef}
                    />
                  </>
                ) : (
                  <>
                    <ChatTrayEmpty
                      title={
                        user?.couple_profile_id
                          ? "No messages yet"
                          : "Partner chat not linked"
                      }
                      text={
                        user?.couple_profile_id
                          ? "Start the conversation with your partner."
                          : "This page is open to all users. You can still use group chat right now."
                      }
                    />

                    <ChatInputTray
                      fileInputRef={fileInputRef}
                      isUploading={isUploading}
                      isSending={isSending}
                      newMessage={newMessage}
                      setNewMessage={setNewMessage}
                      handleSend={handleSend}
                      handleFileUpload={handleFileUpload}
                      inputRef={inputRef}
                    />
                  </>
                )}
              </>
            ) : null}

            {!selectedGroup && activeTab === "groups" ? (
              <>
                <GradientInfoCard className="p-5">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-sm">
                      <Users className="h-6 w-6" />
                    </div>

                    <div className="flex-1">
                      <h2 className="text-lg font-semibold text-slate-800">
                        Your Groups
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        All users can create and join group chats.
                      </p>
                    </div>
                  </div>
                </GradientInfoCard>

                {myGroups.length > 0 ? (
                  <AppCard className="p-3">
                    <GroupChatList groups={myGroups} onSelectGroup={setSelectedGroup} />
                  </AppCard>
                ) : (
                  <ChatTrayEmpty
                    title="No groups yet"
                    text="Create your first group and start chatting."
                  />
                )}
              </>
            ) : null}

            {selectedGroup ? (
              <>
                <GradientInfoCard className="p-5">
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedGroup(null)}
                      className="mt-0.5 rounded-[10px] p-1.5 transition hover:bg-white"
                    >
                      <ArrowLeft className="h-5 w-5 text-slate-700" />
                    </button>

                    <div className="flex h-12 w-12 items-center justify-center rounded-[14px] bg-gradient-to-br from-slate-800 to-slate-900 text-white shadow-sm">
                      <Users className="h-6 w-6" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h2 className="truncate text-lg font-semibold text-slate-800">
                        {selectedGroup.name}
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        {selectedGroup.memberCount || 0} members
                      </p>
                    </div>
                  </div>
                </GradientInfoCard>

                {displayedMessages.length > 0 ? (
                  <AppCard className="p-4">
                    <div className="space-y-4">
                      {displayedMessages.map((msg) => {
                        const isMe = msg.sender_email === user.email;
                        const createdDate = parseSafeDate(msg.created_date);

                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                          >
                            <div className={`max-w-[78%] ${isMe ? "order-2" : "order-1"}`}>
                              {!isMe ? (
                                <p className="mb-1 px-1 text-xs text-slate-500">
                                  {msg.sender_name}
                                </p>
                              ) : null}

                              <div
                                className={`rounded-[18px] px-4 py-3 ${
                                  isMe
                                    ? "bg-gradient-to-r from-[#8ec5ff] to-[#a9bfff] text-black"
                                    : "border border-slate-200 bg-white text-slate-800"
                                }`}
                              >
                                {msg.content?.startsWith("📷 ") ? (
                                  <img
                                    src={msg.content.substring(3)}
                                    alt="Shared"
                                    className="max-w-full rounded-[12px]"
                                    style={{ maxHeight: "300px" }}
                                  />
                                ) : msg.content?.startsWith("🎥 ") ? (
                                  <video
                                    src={msg.content.substring(3)}
                                    controls
                                    className="max-w-full rounded-[12px]"
                                    style={{ maxHeight: "300px" }}
                                  />
                                ) : (
                                  <p className="text-sm leading-relaxed break-words">
                                    {msg.content}
                                  </p>
                                )}
                              </div>

                              <div
                                className={`mt-1 flex items-center gap-1 px-1 text-xs text-slate-400 ${
                                  isMe ? "justify-end" : "justify-start"
                                }`}
                              >
                                {createdDate ? (
                                  <span>{format(createdDate, "h:mm a")}</span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  </AppCard>
                ) : (
                  <ChatTrayEmpty
                    title="No group messages yet"
                    text="Start the conversation in this group."
                  />
                )}

                <ChatInputTray
                  fileInputRef={fileInputRef}
                  isUploading={isUploading}
                  isSending={isSending}
                  newMessage={newMessage}
                  setNewMessage={setNewMessage}
                  handleSend={handleSend}
                  handleFileUpload={handleFileUpload}
                  inputRef={inputRef}
                />
              </>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </div>
    </AppShell>
  );
}