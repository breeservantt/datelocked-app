import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  MessageCircle,
  Send,
  Check,
  CheckCheck,
  Image as ImageIcon,
  Home as HomeIcon,
  Heart,
  Target,
  MapPin,
  Fingerprint,
} from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/lib/supabase";
import { createPageUrl } from "@/utils";
import { parseSafeDate } from "@/components/utils/dateHelpers";

const LOCAL_PARTNER_CHAT_KEY = "datelocked_local_partner_chat_v3";

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
      <div className="mx-auto w-full max-w-[550px] overflow-hidden rounded-[16px] border border-[#ece6ea] bg-[#f7f4f6] shadow-[0_6px_18px_rgba(15,23,42,0.06)]">
        {children}
      </div>
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
            location.pathname === href || (href === "/" && location.pathname === "/");
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

function AvatarCircle({ src, fallback = "C", className = "" }) {
  if (src) {
    return <img src={src} alt="" className={`rounded-full object-cover ${className}`} />;
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-gradient-to-br from-[#dcecff] to-[#edf5ff] text-[13px] font-semibold text-[#77aef7] ${className}`}
    >
      {fallback}
    </div>
  );
}

function ChatHeader({ partner, onBack }) {
  return (
    <div className="absolute left-0 right-0 top-0 z-20 h-[64px] border-b border-white/35 bg-white/18 px-3 backdrop-blur-xl flex items-center">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/88 text-slate-700 shadow-[0_4px_12px_rgba(15,23,42,0.08)]"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#34d399] via-[#25d366] to-[#0ea85f] text-white shadow-[0_6px_14px_rgba(37,211,102,0.35)]">
          <MessageCircle className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[16px] font-semibold text-white">Chat</h1>
          <p className="truncate text-[12px] text-white/80">
            {partner?.full_name || partner?.name || "Conversation"}
          </p>
        </div>

        <AvatarCircle
          src={partner?.profile_picture || partner?.avatar_url || partner?.photo_url || ""}
          fallback={(partner?.full_name || partner?.name || "P").charAt(0).toUpperCase()}
          className="h-11 w-11 shrink-0 border border-white/45"
        />
      </div>
    </div>
  );
}

function ChatBubble({ msg, isMe }) {
  const createdDate = parseSafeDate(msg.created_date || msg.created_at);

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div className={`flex max-w-[82%] flex-col ${isMe ? "items-end" : "items-start"}`}>
        {!isMe && msg.sender_name ? (
          <p className="mb-1 px-2 text-[11px] font-medium text-white/85">{msg.sender_name}</p>
        ) : null}

        <div
          className={`rounded-[20px] border px-3 py-2.5 shadow-[0_8px_22px_rgba(15,23,42,0.08)] ${
            isMe
              ? "rounded-br-[7px] border-[#a7efbf] bg-[#d9fdd3] text-slate-800"
              : "rounded-bl-[7px] border-[#f3dfe5] bg-[#fff8fa] text-slate-800"
          }`}
        >
          {msg.content?.startsWith("📷 ") ? (
            <img
              src={msg.content.slice(3)}
              alt="Shared"
              className="max-w-full rounded-[14px] object-cover"
              style={{ maxHeight: "320px" }}
            />
          ) : msg.content?.startsWith("🎥 ") ? (
            <video
              src={msg.content.slice(3)}
              controls
              className="max-w-full rounded-[14px]"
              style={{ maxHeight: "320px" }}
            />
          ) : (
            <p className="break-words text-[14px] leading-6">{msg.content}</p>
          )}

          <div
            className={`mt-1.5 flex items-center gap-1 text-[10px] ${
              isMe ? "justify-end text-slate-500" : "justify-end text-slate-400"
            }`}
          >
            {createdDate ? <span>{format(createdDate, "h:mm a")}</span> : null}
            {isMe ? (
              msg.read ? (
                <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
              ) : (
                <Check className="h-3.5 w-3.5" />
              )
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur">
        <MessageCircle className="h-8 w-8 text-white/85" />
      </div>
      <h3 className="text-[18px] font-semibold text-white">No messages yet</h3>
      <p className="mt-2 text-[13px] leading-6 text-white/80">
        Start the conversation below.
      </p>
    </div>
  );
}

function ChatComposer({
  newMessage,
  setNewMessage,
  handleSend,
  handleFileUpload,
  fileInputRef,
  inputRef,
  isSending,
  isUploading,
}) {
  const [showEmoji, setShowEmoji] = React.useState(false);

  const emojiList = [
    "❤️",
    "💕",
    "💖",
    "💘",
    "💝",
    "💞",
    "😍",
    "🥰",
    "😘",
    "😊",
    "😂",
    "😭",
    "🔥",
    "✨",
    "🙏",
    "👍",
  ];

  return (
    <div className="absolute bottom-0 left-0 right-0 z-20 px-3 pb-2 pt-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {showEmoji ? (
        <div className="mb-2 rounded-[22px] border border-white/30 bg-white/16 p-2 backdrop-blur-xl">
          <div className="grid grid-cols-8 gap-2">
            {emojiList.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => {
                  setNewMessage((prev) => prev + emoji);
                  inputRef.current?.focus();
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/18 text-[16px]"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-[28px] border border-white/35 bg-white/14 p-2 shadow-[0_14px_34px_rgba(15,23,42,0.18)] backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowEmoji((prev) => !prev)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/88 text-[18px] text-slate-700 shadow-[0_4px_12px_rgba(15,23,42,0.08)]"
          >
            😊
          </button>

          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-white/45 bg-white/85 px-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)]">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
              placeholder="Type a message"
              className="h-11 w-full bg-transparent text-[14px] text-slate-800 outline-none placeholder:text-slate-500"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#16a34a]"
            >
              {isUploading ? (
                <Loader2 className="h-4.5 w-4.5 animate-spin" />
              ) : (
                <ImageIcon className="h-5 w-5" />
              )}
            </button>
          </div>

          <button
            type="button"
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending || isUploading}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#075e54] text-white shadow-[0_8px_18px_rgba(7,94,84,0.34)] disabled:opacity-55"
          >
            {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          </button>
        </div>
      </div>
    </div>
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

function loadLocalPartnerMessages() {
  try {
    const raw = localStorage.getItem(LOCAL_PARTNER_CHAT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalPartnerMessages(messages) {
  localStorage.setItem(LOCAL_PARTNER_CHAT_KEY, JSON.stringify(messages));
}

function createLocalMessage({ sender_email, content, read = false, sender_name = "You" }) {
  return {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    sender_email,
    sender_name,
    content,
    read,
    created_date: new Date().toISOString(),
  };
}

export default function Chat() {
  const [user, setUser] = React.useState(null);
  const [partner, setPartner] = React.useState(null);
  const [messages, setMessages] = React.useState([]);
  const [newMessage, setNewMessage] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSending, setIsSending] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);

  const messagesEndRef = React.useRef(null);
  const fileInputRef = React.useRef(null);
  const inputRef = React.useRef(null);

  const coupleIdRef = React.useRef(null);
  const channelRef = React.useRef(null);

  const scrollToBottom = React.useCallback(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    });
  }, []);

  const loadMessages = React.useCallback(async (coupleId, currentUser) => {
    if (coupleId) {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("couple_profile_id", coupleId)
        .order("created_date", { ascending: true });

      if (!error) {
        setMessages(data || []);
        return;
      }
    }

    const local = loadLocalPartnerMessages();
    setMessages(local);

    if (!currentUser && local.length === 0) {
      setMessages([]);
    }
  }, []);

  const loadPage = React.useCallback(async () => {
    setIsLoading(true);

    try {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !authUser) {
        setUser(null);
        setPartner(null);
        setMessages([]);
        return;
      }

      let profile = await tryProfileTablesById(authUser.id);

      if (!profile) {
        const fallbackProfile = {
          id: authUser.id,
          email: authUser.email,
          full_name:
            authUser.user_metadata?.full_name ||
            authUser.user_metadata?.name ||
            authUser.email?.split("@")[0] ||
            "User",
        };

        await supabase.from("profiles").upsert(fallbackProfile, { onConflict: "id" });
        await supabase.from("users").upsert(fallbackProfile, { onConflict: "id" });
        profile = fallbackProfile;
      }

      const mergedUser = {
        ...authUser,
        ...profile,
        email: authUser.email,
      };

      setUser(mergedUser);

      let activeCoupleId =
        mergedUser?.couple_profile_id || mergedUser?.user_metadata?.couple_profile_id || null;

      if (!activeCoupleId) {
        const { data: foundProfile } = await supabase
          .from("profiles")
          .select("couple_profile_id")
          .eq("id", authUser.id)
          .maybeSingle();

        activeCoupleId = foundProfile?.couple_profile_id || null;
      }

      coupleIdRef.current = activeCoupleId || null;

      if (activeCoupleId && mergedUser?.email) {
        const { data: coupleProfile } = await supabase
          .from("couple_profiles")
          .select("*")
          .eq("id", activeCoupleId)
          .maybeSingle();

        if (coupleProfile) {
          const partnerEmail =
            coupleProfile.partner1_email === mergedUser.email
              ? coupleProfile.partner2_email
              : coupleProfile.partner1_email;

          const partnerProfile = await tryProfileTablesByEmail(partnerEmail);
          setPartner(partnerProfile || { email: partnerEmail, full_name: "Partner" });
        } else {
          setPartner(null);
        }
      } else {
        setPartner(null);
      }

      await loadMessages(activeCoupleId, mergedUser);
    } catch (error) {
      console.error("Error loading chat:", error);
      setUser(null);
      setPartner(null);
      setMessages([]);
    } finally {
      setIsLoading(false);
    }
  }, [loadMessages]);

  React.useEffect(() => {
    loadPage();
  }, [loadPage]);

  React.useEffect(() => {
    if (!coupleIdRef.current) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channel = supabase
      .channel(`messages-${coupleIdRef.current}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `couple_profile_id=eq.${coupleIdRef.current}`,
        },
        async () => {
          await loadMessages(coupleIdRef.current, user);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user, loadMessages]);

  React.useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSend = async () => {
    if (!user) return;

    const content = newMessage.trim();
    if (!content) return;

    setIsSending(true);

    try {
      if (coupleIdRef.current) {
        const { error } = await supabase.from("messages").insert({
          couple_profile_id: coupleIdRef.current,
          sender_email: user.email,
          sender_name: user.full_name || user.name || "You",
          content,
          read: false,
        });

        if (error) throw error;
        await loadMessages(coupleIdRef.current, user);
      } else {
        const next = [
          ...messages,
          createLocalMessage({
            sender_email: user.email,
            sender_name: user.full_name || user.name || "You",
            content,
            read: true,
          }),
        ];
        setMessages(next);
        saveLocalPartnerMessages(next);
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
      alert("Please select an image or video file.");
      return;
    }

    setIsUploading(true);

    try {
      let content = "";
      const prefix = isImage ? "📷 " : "🎥 ";

      if (coupleIdRef.current) {
        const fileExt = file.name.split(".").pop();
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("chat-media")
          .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from("chat-media").getPublicUrl(filePath);
        content = `${prefix}${data.publicUrl}`;

        const { error: insertError } = await supabase.from("messages").insert({
          couple_profile_id: coupleIdRef.current,
          sender_email: user.email,
          sender_name: user.full_name || user.name || "You",
          content,
          read: false,
        });

        if (insertError) throw insertError;

        await loadMessages(coupleIdRef.current, user);
      } else {
        const localUrl = URL.createObjectURL(file);
        content = `${prefix}${localUrl}`;

        const next = [
          ...messages,
          createLocalMessage({
            sender_email: user.email,
            sender_name: user.full_name || user.name || "You",
            content,
            read: true,
          }),
        ];

        setMessages(next);
        saveLocalPartnerMessages(next);
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
      <>
        <AppShell>
          <div className="flex min-h-[640px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-[#25d366]" />
          </div>
        </AppShell>
        <BottomNav />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <AppShell>
          <div className="flex min-h-[640px] items-center justify-center px-6 text-center">
            <div>
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                <MessageCircle className="h-8 w-8 text-slate-300" />
              </div>
              <h3 className="text-[18px] font-semibold text-slate-800">Couldn’t load chat</h3>
              <p className="mt-2 text-[14px] text-slate-500">Please sign in and try again.</p>
            </div>
          </div>
        </AppShell>
        <BottomNav />
      </>
    );
  }

  return (
    <>
      <AppShell>
        <div className="relative h-[calc(100dvh-88px)] overflow-hidden bg-gradient-to-b from-[#0ea85f] via-[#25d366] to-[#128c7e]">
          <div className="absolute inset-0 opacity-[0.12]">
            <div className="absolute -left-10 top-10 h-40 w-40 rounded-full bg-white blur-3xl" />
            <div className="absolute right-0 top-28 h-48 w-48 rounded-full bg-[#dcfce7] blur-3xl" />
            <div className="absolute bottom-16 left-8 h-44 w-44 rounded-full bg-[#bbf7d0] blur-3xl" />
          </div>

          <ChatHeader partner={partner} onBack={() => window.history.back()} />

          <div className="absolute inset-0 overflow-y-auto px-3 pt-[72px] pb-[120px] scroll-smooth">
            <div className="space-y-3">
              {messages.length > 0 ? (
                <>
                  {messages.map((msg) => (
                    <ChatBubble
                      key={msg.id}
                      msg={msg}
                      isMe={msg.sender_email === user.email}
                    />
                  ))}
                  <div ref={messagesEndRef} />
                </>
              ) : (
                <EmptyState />
              )}
            </div>
          </div>

          <ChatComposer
            newMessage={newMessage}
            setNewMessage={setNewMessage}
            handleSend={handleSend}
            handleFileUpload={handleFileUpload}
            fileInputRef={fileInputRef}
            inputRef={inputRef}
            isSending={isSending}
            isUploading={isUploading}
          />
        </div>
      </AppShell>

      <BottomNav />
    </>
  );
}