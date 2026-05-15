import React from "react";
import {
  ArrowLeft,
  Loader2,
  MessageCircle,
  Send,
  Check,
  CheckCheck,
  Image as ImageIcon,
} from "lucide-react";
import format from "date-fns/format";
import { supabase } from "@/lib/supabase";
import { parseSafeDate } from "@/components/utils/dateHelpers";

function AppShell({ children }) {
  return (
    <div className="fixed inset-0 bg-gradient-to-b from-[#0ea85f] via-[#25d366] to-[#128c7e]">
      <div className="mx-auto h-[100dvh] w-full max-w-[550px] overflow-hidden">
        {children}
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
    <div className="fixed top-0 left-1/2 z-50 flex h-[64px] w-full max-w-[550px] -translate-x-1/2 items-center border-b border-white/30 bg-white/18 px-3 backdrop-blur-xl shadow-[0_8px_24px_rgba(15,23,42,0.12)]">
      <div className="flex w-full items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/88 text-slate-700 shadow-[0_4px_12px_rgba(15,23,42,0.08)]"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>

        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <h1 className="text-[15px] font-semibold leading-none text-white">
            Love Bench
          </h1>
          <p className="text-[11px] leading-none text-white/80">
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

const ChatBubble = React.memo(function ChatBubble({ msg, isMe }) {
  const createdDate = parseSafeDate(msg.created_date || msg.created_at);
  const text = msg.content || msg.body || "";
  const isImage = text.startsWith("📷 ");
  const isVideo = text.startsWith("🎥 ");

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div className={`flex w-full flex-col ${isMe ? "items-end" : "items-start"}`}>
        {!isMe && msg.sender_name ? (
          <p className="mb-1 px-2 text-[11px] font-medium text-white/85">
            {msg.sender_name}
          </p>
        ) : null}

        <div
          className={`max-w-[82%] border shadow-[0_8px_22px_rgba(15,23,42,0.08)] ${
            isImage || isVideo
              ? isMe
                ? "overflow-hidden rounded-[20px] rounded-br-[7px] border-[#a7efbf] bg-[#d9fdd3]"
                : "overflow-hidden rounded-[20px] rounded-bl-[7px] border-[#f3dfe5] bg-[#fff8fa]"
              : isMe
              ? "rounded-[20px] rounded-br-[7px] border-[#a7efbf] bg-[#d9fdd3] px-3 py-2.5 text-slate-800"
              : "rounded-[20px] rounded-bl-[7px] border-[#f3dfe5] bg-[#fff8fa] px-3 py-2.5 text-slate-800"
          }`}
        >
          {isImage ? (
            <>
              <div className="w-[260px] max-w-full overflow-hidden rounded-[18px] bg-slate-100">
                <img
                  src={text.slice(3)}
                  alt="Shared"
                  className="block aspect-[4/5] w-full object-cover"
                  loading="lazy"
                />
              </div>
              <BubbleMeta isMe={isMe} read={msg.read} createdDate={createdDate} />
            </>
          ) : isVideo ? (
            <>
              <div className="w-[280px] max-w-full overflow-hidden rounded-[18px] bg-black">
                <video
                  src={text.slice(3)}
                  controls
                  preload="metadata"
                  playsInline
                  className="block aspect-video w-full bg-black object-contain"
                />
              </div>
              <BubbleMeta isMe={isMe} read={msg.read} createdDate={createdDate} />
            </>
          ) : (
            <>
              <p className="break-words text-[14px] leading-6">{text}</p>
              <BubbleMeta isMe={isMe} read={msg.read} createdDate={createdDate} compact />
            </>
          )}
        </div>
      </div>
    </div>
  );
}, areBubblePropsEqual);

function BubbleMeta({ isMe, read, createdDate, compact = false }) {
  return (
    <div
      className={`flex items-center justify-end gap-1 text-[10px] ${
        compact ? "mt-1.5" : "px-2.5 py-2"
      } ${isMe ? "text-slate-500" : "text-slate-400"}`}
    >
      {createdDate ? <span>{format(createdDate, "h:mm a")}</span> : null}
      {isMe ? (
        read ? (
          <CheckCheck className="h-3.5 w-3.5 text-blue-500" />
        ) : (
          <Check className="h-3.5 w-3.5" />
        )
      ) : null}
    </div>
  );
}

function areBubblePropsEqual(prev, next) {
  return (
    prev.isMe === next.isMe &&
    prev.msg?.id === next.msg?.id &&
    prev.msg?.content === next.msg?.content &&
    prev.msg?.body === next.msg?.body &&
    prev.msg?.read === next.msg?.read &&
    prev.msg?.created_date === next.msg?.created_date &&
    prev.msg?.created_at === next.msg?.created_at &&
    prev.msg?.sender_name === next.msg?.sender_name
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

function LockedChatState() {
  return (
    <AppShell>
      <div className="flex h-full items-center justify-center px-6 text-center">
        <div>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 backdrop-blur">
            <MessageCircle className="h-8 w-8 text-white/85" />
          </div>
          <h3 className="text-[18px] font-semibold text-white">
            Chat unlocks after Date-Locked
          </h3>
          <p className="mt-2 text-[14px] leading-6 text-white/80">
            Connect with your partner first to start a real two-way chat.
          </p>
        </div>
      </div>
    </AppShell>
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
    <div className="fixed bottom-[8px] left-1/2 right-auto z-50 w-full max-w-[550px] -translate-x-1/2 px-2">
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
                onMouseDown={(e) => e.preventDefault()}
                onTouchStart={(e) => e.preventDefault()}
                onClick={() => {
                  setNewMessage((prev) => prev + emoji);
                  requestAnimationFrame(() => inputRef.current?.focus());
                }}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/18 text-[16px]"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-[22px] border border-white/40 bg-white p-1 shadow-[0_6px_14px_rgba(0,0,0,0.15)]">
        <div className="flex w-full items-center justify-between gap-2">
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onTouchStart={(e) => e.preventDefault()}
            onClick={() => setShowEmoji((prev) => !prev)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-[16px] text-slate-700"
          >
            😊
          </button>

          <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-slate-200 bg-white px-3">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
              placeholder="Type a message"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              className="h-9 w-full bg-transparent text-[14px] text-slate-800 outline-none placeholder:text-slate-500"
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
            onMouseDown={(e) => e.preventDefault()}
            onTouchStart={(e) => e.preventDefault()}
            onClick={handleSend}
            disabled={!newMessage.trim() || isSending || isUploading}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#075e54] text-white disabled:opacity-55"
          >
            {isSending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
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

function normalizeMessage(row) {
  return {
    ...row,
    content: row.content ?? row.body ?? "",
    created_date: row.created_date ?? row.created_at,
  };
}

function areMessagesEqual(a, b) {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i += 1) {
    if (
      a[i]?.id !== b[i]?.id ||
      a[i]?.content !== b[i]?.content ||
      a[i]?.body !== b[i]?.body ||
      a[i]?.read !== b[i]?.read ||
      a[i]?.created_date !== b[i]?.created_date ||
      a[i]?.created_at !== b[i]?.created_at ||
      a[i]?.sender_name !== b[i]?.sender_name
    ) {
      return false;
    }
  }

  return true;
}

function sortMessages(list) {
  return [...list].sort((a, b) =>
    String(a.created_date || a.created_at || "").localeCompare(
      String(b.created_date || b.created_at || "")
    )
  );
}

export default function Chat() {
  const [user, setUser] = React.useState(null);
  const [partner, setPartner] = React.useState(null);
  const [messages, setMessages] = React.useState([]);
  const [newMessage, setNewMessage] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSending, setIsSending] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [isChatLocked, setIsChatLocked] = React.useState(false);
  const [activeCoupleId, setActiveCoupleId] = React.useState(null);

  const fileInputRef = React.useRef(null);
  const inputRef = React.useRef(null);
  const messageListRef = React.useRef(null);
  const channelRef = React.useRef(null);
  const isNearBottomRef = React.useRef(true);

  const setMessagesIfChanged = React.useCallback((next) => {
    const normalized = sortMessages((next || []).map(normalizeMessage));
    setMessages((prev) => (areMessagesEqual(prev, normalized) ? prev : normalized));
  }, []);

  const scrollToLatest = React.useCallback((behavior = "auto") => {
    const container = messageListRef.current;
    if (!container) return;

    requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior,
      });
    });
  }, []);

  const handleMessageScroll = React.useCallback(() => {
    const container = messageListRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    isNearBottomRef.current = distanceFromBottom < 120;
  }, []);

  const loadMessages = React.useCallback(
    async (coupleId) => {
      if (!coupleId) {
        setMessagesIfChanged([]);
        return;
      }

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("couple_profile_id", coupleId)
        .order("created_date", { ascending: true });

      if (error) throw error;

      setMessagesIfChanged(data || []);
      setTimeout(() => scrollToLatest("auto"), 40);
    },
    [setMessagesIfChanged, scrollToLatest]
  );

  const loadPage = React.useCallback(async () => {
    setIsLoading(true);
    setIsChatLocked(false);

    try {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !authUser) {
        setUser(null);
        setPartner(null);
        setMessages([]);
        setActiveCoupleId(null);
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

      let resolvedCoupleId =
        mergedUser?.couple_profile_id ||
        mergedUser?.user_metadata?.couple_profile_id ||
        null;

      if (!resolvedCoupleId) {
        const { data: foundProfile, error: profileError } = await supabase
          .from("profiles")
          .select("couple_profile_id")
          .eq("id", authUser.id)
          .maybeSingle();

        if (profileError) throw profileError;

        resolvedCoupleId = foundProfile?.couple_profile_id || null;
      }

      setActiveCoupleId(resolvedCoupleId || null);

      if (!resolvedCoupleId) {
        setPartner(null);
        setMessages([]);
        setIsChatLocked(true);
        return;
      }

      const { data: coupleProfile, error: coupleError } = await supabase
        .from("couple_profiles")
        .select("*")
        .eq("id", resolvedCoupleId)
        .maybeSingle();

      if (coupleError) throw coupleError;

      if (!coupleProfile) {
        setPartner(null);
        setMessages([]);
        setIsChatLocked(true);
        return;
      }

      const partnerEmail =
        coupleProfile.partner1_email === mergedUser.email
          ? coupleProfile.partner2_email
          : coupleProfile.partner1_email;

      const partnerProfile = await tryProfileTablesByEmail(partnerEmail);
      setPartner(partnerProfile || { email: partnerEmail, full_name: "Partner" });

      await loadMessages(resolvedCoupleId);

      await supabase
        .from("messages")
        .update({ read: true })
        .eq("couple_profile_id", resolvedCoupleId)
        .neq("sender_email", mergedUser.email)
        .eq("read", false);
    } catch (error) {
      console.error("Error loading chat:", error);
      setUser(null);
      setPartner(null);
      setMessages([]);
      setActiveCoupleId(null);
    } finally {
      setIsLoading(false);
    }
  }, [loadMessages]);

  React.useEffect(() => {
    loadPage();
  }, [loadPage]);

  React.useEffect(() => {
    if (isLoading || !activeCoupleId) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const channelName = `messages-${activeCoupleId}-${
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : Date.now()
    }`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `couple_profile_id=eq.${activeCoupleId}`,
        },
        (payload) => {
          const eventType = payload.eventType;
          const row = normalizeMessage(payload.new || payload.old || {});

          if (!row?.id) return;

          setMessages((prev) => {
            let next = prev;

            if (eventType === "INSERT") {
              if (prev.some((item) => item.id === row.id)) return prev;
              next = sortMessages([...prev, row]);
            } else if (eventType === "UPDATE") {
              next = prev.map((item) =>
                item.id === row.id ? normalizeMessage({ ...item, ...row }) : item
              );
            } else if (eventType === "DELETE") {
              next = prev.filter((item) => item.id !== row.id);
            }

            return areMessagesEqual(prev, next) ? prev : next;
          });

          if (eventType === "INSERT" && isNearBottomRef.current) {
            setTimeout(() => scrollToLatest("smooth"), 30);
          }
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      if (channelRef.current === channel) channelRef.current = null;
    };
  }, [isLoading, activeCoupleId, scrollToLatest]);

  const handleSend = async () => {
    if (!user || !activeCoupleId) return;

    const content = newMessage.trim();
    if (!content || isSending || isUploading) return;

    setIsSending(true);
    setNewMessage("");

    const tempId = `temp-${Date.now()}`;

    const optimisticMessage = normalizeMessage({
      id: tempId,
      couple_profile_id: activeCoupleId,
      sender_email: user.email,
      sender_name: user.full_name || user.name || "You",
      content,
      read: false,
      created_date: new Date().toISOString(),
    });

    setMessages((prev) => sortMessages([...prev, optimisticMessage]));
    setTimeout(() => scrollToLatest("smooth"), 30);

    try {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          couple_profile_id: activeCoupleId,
          sender_email: user.email,
          sender_name: user.full_name || user.name || "You",
          content,
          read: false,
        })
        .select()
        .single();

      if (error) throw error;

      const cleanData = normalizeMessage(data);

      setMessages((prev) =>
        sortMessages(prev.map((msg) => (msg.id === tempId ? cleanData : msg)))
      );

      requestAnimationFrame(() => scrollToLatest("smooth"));
    } catch (error) {
      console.error("Send failed:", error);
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
      setNewMessage(content);
      alert("Failed to send message.");
    } finally {
      setIsSending(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";

    if (!file || !user || !activeCoupleId) return;

    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      alert("Please select an image or video file.");
      return;
    }

    setIsUploading(true);

    try {
      const prefix = isImage ? "📷 " : "🎥 ";
      const fileExt = file.name.split(".").pop();
      const filePath = `${activeCoupleId}/${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("chat-media")
        .upload(filePath, file, { upsert: true, contentType: file.type });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("chat-media").getPublicUrl(filePath);
      const content = `${prefix}${data.publicUrl}`;

      const { data: insertedMessage, error: insertError } = await supabase
        .from("messages")
        .insert({
          couple_profile_id: activeCoupleId,
          sender_email: user.email,
          sender_name: user.full_name || user.name || "You",
          content,
          read: false,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      const cleanInserted = normalizeMessage(insertedMessage);

      setMessages((prev) => {
        if (prev.some((msg) => msg.id === cleanInserted.id)) return prev;
        return sortMessages([...prev, cleanInserted]);
      });

      requestAnimationFrame(() => scrollToLatest("smooth"));
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
        <div className="flex h-full items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      </AppShell>
    );
  }

  if (!user) {
    return (
      <AppShell>
        <div className="flex h-full items-center justify-center px-6 text-center">
          <div>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
              <MessageCircle className="h-8 w-8 text-white/85" />
            </div>
            <h3 className="text-[18px] font-semibold text-white">Couldn’t load chat</h3>
            <p className="mt-2 text-[14px] text-white/80">
              Please sign in and try again.
            </p>
          </div>
        </div>
      </AppShell>
    );
  }

  if (isChatLocked || !activeCoupleId) {
    return (
      <>
        <ChatHeader partner={partner} onBack={() => window.history.back()} />
        <LockedChatState />
      </>
    );
  }

  return (
    <>
      <ChatHeader partner={partner} onBack={() => window.history.back()} />

      <AppShell>
        <div className="relative h-full overflow-hidden bg-gradient-to-b from-[#0ea85f] via-[#25d366] to-[#128c7e]">
          <div className="absolute inset-0 opacity-[0.12] pointer-events-none">
            <div className="absolute -left-10 top-10 h-40 w-40 rounded-full bg-white blur-3xl" />
            <div className="absolute right-0 top-28 h-48 w-48 rounded-full bg-[#dcfce7] blur-3xl" />
            <div className="absolute bottom-16 left-8 h-44 w-44 rounded-full bg-[#bbf7d0] blur-3xl" />
          </div>

          <div
            ref={messageListRef}
            onScroll={handleMessageScroll}
            className="absolute left-0 right-0 top-[64px] bottom-[64px] z-0 overflow-y-auto overscroll-contain px-4 py-3"
          >
            <div className="flex min-h-full flex-col justify-end gap-3">
              {messages.length > 0 ? (
                messages.map((msg) => (
                  <ChatBubble
                    key={msg.id}
                    msg={msg}
                    isMe={msg.sender_email === user.email}
                  />
                ))
              ) : (
                <EmptyState />
              )}
            </div>
          </div>
        </div>
      </AppShell>

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
    </>
  );
}