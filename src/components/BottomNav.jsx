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
  const channelRef = React.useRef(null);

  const shouldHideBottomNav = hiddenRoutes.some((route) =>
    pathname.startsWith(route)
  );

  const loadUnreadChatCount = React.useCallback(async () => {
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setUnreadChatCount(0);
        return;
      }

      let coupleProfileId = null;

      const { data: profile } = await supabase
        .from("profiles")
        .select("couple_profile_id")
        .eq("id", user.id)
        .maybeSingle();

      coupleProfileId = profile?.couple_profile_id || null;

      if (!coupleProfileId) {
        const { data: userProfile } = await supabase
          .from("users")
          .select("couple_profile_id")
          .eq("id", user.id)
          .maybeSingle();

        coupleProfileId = userProfile?.couple_profile_id || null;
      }

      if (!coupleProfileId) {
        setUnreadChatCount(0);
        return;
      }

      const { count, error } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("couple_profile_id", coupleProfileId)
        .neq("sender_email", user.email)
        .eq("read", false);

      if (error) {
        console.error("Error loading unread chat count:", error);
        return;
      }

      setUnreadChatCount(count || 0);
    } catch (error) {
      console.error("Error loading unread chat count:", error);
      setUnreadChatCount(0);
    }
  }, []);

  React.useEffect(() => {
    loadUnreadChatCount();

    const authChannel = supabase.auth.onAuthStateChange(() => {
      loadUnreadChatCount();
    });

    return () => {
      authChannel.data.subscription.unsubscribe();
    };
  }, [loadUnreadChatCount]);

  React.useEffect(() => {
    let isMounted = true;

    const subscribeToMessages = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || !isMounted) return;

      let coupleProfileId = null;

      const { data: profile } = await supabase
        .from("profiles")
        .select("couple_profile_id")
        .eq("id", user.id)
        .maybeSingle();

      coupleProfileId = profile?.couple_profile_id || null;

      if (!coupleProfileId) {
        const { data: userProfile } = await supabase
          .from("users")
          .select("couple_profile_id")
          .eq("id", user.id)
          .maybeSingle();

        coupleProfileId = userProfile?.couple_profile_id || null;
      }

      if (!coupleProfileId || !isMounted) return;

      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }

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

      channelRef.current = channel;
    };

    subscribeToMessages();

    return () => {
      isMounted = false;

      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [loadUnreadChatCount]);

  React.useEffect(() => {
    loadUnreadChatCount();
  }, [location.pathname, loadUnreadChatCount]);

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