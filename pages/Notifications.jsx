import React from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Heart,
  Lock,
  Calendar,
  CheckCircle,
  Clock,
  Loader2,
  BellOff,
  X as XIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { parseSafeDate } from '@/components/utils/dateHelpers';

export default function Notifications() {
  const [notifications, setNotifications] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const colorClasses = React.useMemo(
    () => ({
      rose: 'bg-rose-100 text-rose-600',
      green: 'bg-green-100 text-green-600',
      amber: 'bg-amber-100 text-amber-600',
      blue: 'bg-blue-100 text-blue-600'
    }),
    []
  );

  const loadData = React.useCallback(async () => {
    setIsLoading(true);
    setError('');

    try {
      const currentUser = await base44.auth.me();
      if (!currentUser?.email) throw new Error('Unable to load your profile.');

      const notifs = [];

      // Fetch all notification sources in parallel
      const [receivedInvitations, sentInvitations, eventInvites] = await Promise.all([
        base44.entities.RelationshipInvitation.filter(
          { recipient_email: currentUser.email },
          '-created_date',
          10
        ),
        base44.entities.RelationshipInvitation.filter(
          { sender_email: currentUser.email },
          '-created_date',
          10
        ),
        currentUser.couple_profile_id
          ? base44.entities.CoupleGoal.filter(
              { couple_profile_id: currentUser.couple_profile_id, is_event: true },
              '-created_date',
              20
            )
          : Promise.resolve([])
      ]);

      // Received relationship invitations
      (receivedInvitations || []).forEach((inv) => {
        if (inv.status === 'pending') {
          notifs.push({
            id: inv.id,
            type: 'invitation_received',
            title: 'Relationship Invitation',
            message: `${inv.sender_name || inv.sender_email} wants to Date-Lock with you!`,
            time: inv.created_date,
            icon: Heart,
            color: 'rose'
          });
        } else if (inv.status === 'accepted') {
          notifs.push({
            id: `${inv.id}_accepted`,
            type: 'invitation_accepted',
            title: 'Date-Locked!',
            message: `You are now Date-Locked with ${inv.sender_name || inv.sender_email}`,
            time: inv.updated_date || inv.created_date,
            icon: Lock,
            color: 'green'
          });
        }
      });

      // Sent relationship invitations
      (sentInvitations || []).forEach((inv) => {
        if (inv.status === 'accepted') {
          notifs.push({
            id: `${inv.id}_partner_accepted`,
            type: 'partner_accepted',
            title: 'Invitation Accepted!',
            message: `${inv.recipient_email} accepted your Date-Lock invitation!`,
            time: inv.updated_date || inv.created_date,
            icon: CheckCircle,
            color: 'green'
          });
        } else if (inv.status === 'pending') {
          notifs.push({
            id: `${inv.id}_pending`,
            type: 'invitation_pending',
            title: 'Invitation Pending',
            message: `Waiting for ${inv.recipient_email} to respond`,
            time: inv.created_date,
            icon: Clock,
            color: 'amber'
          });
        }
      });

      // Event invitations
      (eventInvites || []).forEach((event) => {
        if (event.invitation_status === 'pending' && event.invited_by !== currentUser.email) {
          notifs.push({
            id: `${event.id}_event_invite`,
            type: 'event_invitation',
            title: 'Event Invitation',
            message: `You're invited to ${event.title}`,
            time: event.created_date,
            icon: Calendar,
            color: 'amber'
          });
        }

        if (event.invitation_status === 'accepted' && event.invited_by === currentUser.email) {
          notifs.push({
            id: `${event.id}_event_accepted`,
            type: 'event_accepted',
            title: 'Event Accepted!',
            message: `Your partner accepted your invitation to ${event.title}`,
            time: event.updated_date || event.created_date,
            icon: CheckCircle,
            color: 'green'
          });
        }

        if (event.invitation_status === 'declined' && event.invited_by === currentUser.email) {
          notifs.push({
            id: `${event.id}_event_declined`,
            type: 'event_declined',
            title: 'Event Declined',
            message: `Your partner declined the invitation to ${event.title}`,
            time: event.updated_date || event.created_date,
            icon: Calendar,
            color: 'rose'
          });
        }
      });

      // Sort by time (safe date parsing)
      notifs.sort((a, b) => {
        const da = parseSafeDate(a.time)?.getTime() ?? 0;
        const db = parseSafeDate(b.time)?.getTime() ?? 0;
        return db - da;
      });

      setNotifications(notifs);
    } catch (e) {
      console.error('Error loading notifications:', e);
      setError(e?.message || "Couldn't load notifications. Please try again.");
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await loadData();
    })();
    return () => {
      mounted = false;
    };
  }, [loadData]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-rose-50 via-white to-pink-50">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-rose-50 via-white to-pink-50 p-4">
        <Card className="max-w-md w-full p-8 text-center border-0 shadow-lg">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XIcon className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Something went wrong</h3>
          <p className="text-slate-600 mb-6">{error}</p>
          <Button
            onClick={loadData}
            className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
          >
            Try Again
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-pink-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
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

      <div className="max-w-md mx-auto px-4 py-6">
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
                    <Card className="p-4 border-0 shadow-md">
                      <div className="flex items-start gap-4">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            colorClasses[notification.color] || colorClasses.blue
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-800">{notification.title}</p>
                          <p className="text-sm text-slate-500 mt-0.5">{notification.message}</p>

                          {timeDate ? (
                            <p className="text-xs text-slate-400 mt-2">
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
          <Card className="p-12 text-center border-0 shadow-md">
            <BellOff className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-2">No notifications</h3>
            <p className="text-slate-500">You're all caught up!</p>
          </Card>
        )}
      </div>
    </div>
  );
}
