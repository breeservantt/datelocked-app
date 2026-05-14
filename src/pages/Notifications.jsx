import React from "react";
import { supabase } from "@/lib/supabase";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Heart,
  Lock,
  Calendar,
  CheckCircle,
  Clock,
  Loader2,
  BellOff,
  X as XIcon,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import formatDistanceToNow from "date-fns/formatDistanceToNow";
import { parseSafeDate } from "@/components/utils/dateHelpers";

export default function Notifications() {
  const [notifications, setNotifications] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  const colorClasses = React.useMemo(
    () => ({
      rose: "bg-rose-100 text-rose-600",
      green: "bg-green-100 text-green-600",
      amber: "bg-amber-100 text-amber-600",
      blue: "bg-blue-100 text-blue-600",
    }),
    []
  );

  const buildNotifications = React.useCallback((currentUser, profile, receivedInvites, sentInvites, eventInvites) => {
    const notifs = [];

    (receivedInvites || []).forEach((inv) => {
      if (inv.status === "pending") {
        notifs.push({
          id: inv.id,
          title: "Relationship Invitation",
          message: `${inv.sender_name || inv.sender_email} wants to Date-Lock with you!`,
          time: inv.created_at || inv.created_date,
          icon: Heart,
          color: "rose",
        });
      }

      if (inv.status === "accepted") {
        notifs.push({
          id: `${inv.id}_accepted`,
          title: "Date-Locked!",
          message: `You are now Date-Locked with ${inv.sender_name || inv.sender_email}`,
          time: inv.updated_at || inv.updated_date || inv.created_at || inv.created_date,
          icon: Lock,
          color: "green",
        });
      }
    });

    (sentInvites || []).forEach((inv) => {
      if (inv.status === "accepted") {
        notifs.push({
          id: `${inv.id}_partner_accepted`,
          title: "Invitation Accepted!",
          message: `${inv.recipient_email} accepted your Date-Lock invitation!`,
          time: inv.updated_at || inv.updated_date || inv.created_at || inv.created_date,
          icon: CheckCircle,
          color: "green",
        });
      }

      if (inv.status === "pending") {
        notifs.push({
          id: `${inv.id}_pending`,
          title: "Invitation Pending",
          message: `Waiting for ${inv.recipient_email} to respond`,
          time: inv.created_at || inv.created_date,
          icon: Clock,
          color: "amber",
        });
      }
    });

    (eventInvites || []).forEach((event) => {
      if (event.invitation_status === "pending" && event.invited_by !== currentUser.email) {
        notifs.push({
          id: `${event.id}_event_invite`,
          title: "Event Invitation",
          message: `You're invited to ${event.title}`,
          time: event.created_at || event.created_date,
          icon: Calendar,
          color: "amber",
        });
      }

      if (event.invitation_status === "accepted" && event.invited_by === currentUser.email) {
        notifs.push({
          id: `${event.id}_event_accepted`,
          title: "Event Accepted!",
          message: `Your partner accepted your invitation to ${event.title}`,
          time: event.updated_at || event.updated_date || event.created_at || event.created_date,
          icon: CheckCircle,
          color: "green",
        });
      }

      if (event.invitation_status === "declined" && event.invited_by === currentUser.email) {
        notifs.push({
          id: `${event.id}_event_declined`,
          title: "Event Declined",
          message: `Your partner declined the invitation to ${event.title}`,
          time: event.updated_at || event.updated_date || event.created_at || event.created_date,
          icon: Calendar,
          color: "rose",
        });
      }
    });

    return notifs.sort((a, b) => {
      const da = parseSafeDate(a.time)?.getTime() ?? 0;
      const db = parseSafeDate(b.time)?.getTime() ?? 0;
      return db - da;
    });
  }, []);

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const {
        data: { user: currentUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!currentUser?.email) throw new Error("Unable to load your profile.");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, email, full_name, couple_profile_id")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (profileError) throw profileError;

      const coupleId = profile?.couple_profile_id || null;

      const [receivedResult, sentResult, eventsResult] = await Promise.all([
        supabase
          .from("relationship_invitations")
          .select("*")
          .eq("recipient_email", currentUser.email)
          .order("created_at", { ascending: false })
          .limit(10),

        supabase
          .from("relationship_invitations")
          .select("*")
          .eq("sender_email", currentUser.email)
          .order("created_at", { ascending: false })
          .limit(10),

        coupleId
          ? supabase
              .from("couple_goals")
              .select("*")
              .eq("couple_profile_id", coupleId)
              .eq("type", "event")
              .order("created_at", { ascending: false })
              .limit(20)
          : Promise.resolve({ data: [], error: null }),
      ]);

      if (receivedResult.error) throw receivedResult.error;
      if (sentResult.error) throw sentResult.error;
      if (eventsResult.error) throw eventsResult.error;

      const nextNotifications = buildNotifications(
        currentUser,
        profile,
        receivedResult.data || [],
        sentResult.data || [],
        eventsResult.data || []
      );

      setNotifications(nextNotifications);
    } catch (e) {
      console.error("Error loading notifications:", e);
      setError(e?.message || "Couldn't load notifications. Please try again.");
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, [buildNotifications]);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-rose-50 via-white to-pink-50">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-rose-50 via-white to-pink-50 p-4">
        <Card className="w-full max-w-md border-0 p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XIcon className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-slate-800">Something went wrong</h3>
          <p className="mb-6 text-slate-600">{error}</p>
          <Button onClick={loadData} className="bg-gradient-to-r from-rose-500 to-pink-500">
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-pink-50 pb-24">
      <div className="sticky top-0 z-10 border-b bg-white">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-4">
          <Link to={createPageUrl("Home")}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>

          <h1 className="text-xl font-semibold text-slate-800">Notifications</h1>

          <div className="ml-auto">
            <Button variant="outline" size="sm" onClick={loadData}>
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-md px-4 py-6">
        {notifications.length > 0 ? (
          <div className="space-y-3">
            <AnimatePresence>
              {notifications.map((notification) => {
                const Icon = notification.icon;
                const timeDate = parseSafeDate(notification.time);

                return (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.18 }}
                  >
                    <Card className="border-0 p-4 shadow-md">
                      <div className="flex items-start gap-4">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                            colorClasses[notification.color] || colorClasses.blue
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-slate-800">{notification.title}</p>
                          <p className="mt-0.5 text-sm text-slate-500">{notification.message}</p>

                          {timeDate ? (
                            <p className="mt-2 text-xs text-slate-400">
                              {formatDistanceToNow(timeDate, { addSuffix: true })}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <Card className="border-0 p-12 text-center shadow-md">
            <BellOff className="mx-auto mb-4 h-16 w-16 text-slate-200" />
            <h3 className="mb-2 text-lg font-semibold text-slate-700">No notifications</h3>
            <p className="text-slate-500">You're all caught up!</p>
          </Card>
        )}
      </div>
    </div>
  );
}