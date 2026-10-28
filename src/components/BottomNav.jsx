import { createPageUrl } from "@/utils";
import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home as HomeIcon,
  Heart,
  Image as ImageIcon,
  Target,
  MapPin,
  MessageCircle,
  Fingerprint,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const navItems = [
  { label: "Home", icon: HomeIcon, page: "Home" },
  { label: "Dating", icon: Heart, page: "Dating" },
  { label: "Memories", icon: ImageIcon, page: "Memories" },
  { label: "Goals", icon: Target, page: "Goals" },
  { label: "NightIn", icon: MapPin, page: "NightIn" },
  { label: "Chat", icon: MessageCircle, page: "Chat" },
  { label: "Verify", icon: Fingerprint, page: "VerifyStatus" },
];

const hiddenRoutes = ["/terms", "/security", "/privacy", "/refunds"];

export default function BottomNav() {
  const location = useLocation();
  const pathname = location.pathname.toLowerCase();

  const [unreadChatCount, setUnreadChatCount] = React.useState(0);
  const [chatIdentity, setChatIdentity] = React.useState(null);

  const unreadRequestRef = React.useRef(null);

  const shouldHideBottomNav = hiddenRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Resolve the authenticated user's couple only when the user changes.
  React.useEffect(() => {
    let active = true;
    let generation = 0;

    const resolveChatIdentity = async (session) => {
      const requestGeneration = ++generation;

      setChatIdentity(null);
      setUnreadChatCount(0);

      const authUser = session?.user;

      if (!authUser) return;

      try {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("couple_profile_id")
          .eq("id", authUser.id)
          .maybeSingle();

        if (error) throw error;

        if (!active || requestGeneration !== generation) return;

        setChatIdentity({
          userId: authUser.id,
          email: authUser.email || "",
          coupleProfileId: profile?.couple_profile_id || null,
        });
      } catch (error) {
        if (!active || requestGeneration !== generation) return;

        console.error("Error resolving BottomNav profile:", error);
        setChatIdentity(null);
      }
    };

    const initialize = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (!active) return;

      if (error) {
        console.error("Error loading BottomNav session:", error);
        return;
      }

      resolveChatIdentity(data.session);
    };

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (
          event === "SIGNED_IN" ||
          event === "SIGNED_OUT" ||
          event === "USER_UPDATED"
        ) {
          resolveChatIdentity(session);
        }
      }
    );

    initialize();

    return () => {
      active = false;
      generation += 1;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const userId = chatIdentity?.userId || null;
  const userEmail = chatIdentity?.email || "";
  const coupleProfileId = chatIdentity?.coupleProfileId || null;

  // Fetch only the unread message count, not the profile.
  const loadUnreadChatCount = React.useCallback(async () => {
    if (!coupleProfileId || !userEmail) {
      setUnreadChatCount(0);
      return;
    }

    const requestKey = `${userId}:${coupleProfileId}:${userEmail}`;

    if (unreadRequestRef.current?.key === requestKey) {
      return unreadRequestRef.current.promise;
    }

    const request = (async () => {
      try {
        const { count, error } = await supabase
          .from("messages")
          .select("id", { count: "exact", head: true })
          .eq("couple_profile_id", coupleProfileId)
          .neq("sender_email", userEmail)
          .eq("read", false);

        if (error) throw error;

        setUnreadChatCount(count || 0);
      } catch (error) {
        console.error("Error loading unread chat count:", error);
      }
    })();

    unreadRequestRef.current = {
      key: requestKey,
      promise: request,
    };

    try {
      await request;
    } finally {
      if (unreadRequestRef.current?.promise === request) {
        unreadRequestRef.current = null;
      }
    }
  }, [userId, userEmail, coupleProfileId]);

  // Keep the badge current when the page changes.
  React.useEffect(() => {
    loadUnreadChatCount();
  }, [location.pathname, loadUnreadChatCount]);

  // Subscribe to messages once for the active couple.
  React.useEffect(() => {
    if (!coupleProfileId) return;

    const channel = supabase
      .channel(`bottom-nav-messages-${coupleProfileId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `couple_profile_id=eq.${coupleProfileId}`,
        },
        () => {
          loadUnreadChatCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [coupleProfileId, loadUnreadChatCount]);

  if (shouldHideBottomNav) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#ece6ea] bg-white/95 pb-[max(6px,env(safe-area-inset-bottom))] pt-1 shadow-[0_-6px_18px_rgba(15,23,42,0.05)] backdrop-blur">
      <div className="mx-auto w-full max-w-[390px] px-2">
        <div className="grid grid-cols-7 gap-0.5">
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
                <div className="relative">
                  <Icon
                    className={`mb-0.5 h-[18px] w-[18px] ${
                      active ? "text-[#ef4f75]" : "text-slate-400"
                    }`}
                    strokeWidth={2}
                  />

                  {item.page === "Chat" && unreadChatCount > 0 ? (
                    <span className="absolute -right-3 -top-2 flex min-h-[15px] min-w-[15px] items-center justify-center rounded-full bg-[#ef4f75] px-1 text-[9px] font-bold leading-none text-white">
                      {unreadChatCount > 99 ? "99+" : unreadChatCount}
                    </span>
                  ) : null}
                </div>

                <span
                  className={`truncate text-[8px] leading-none tracking-[-0.01em] ${
                    active
                      ? "font-semibold text-[#ef4f75]"
                      : "font-medium text-slate-400"
                  }`}
                >
                  {item.label}
                  {item.page === "Chat" && unreadChatCount > 0
                    ? ` (${unreadChatCount})`
                    : ""}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
