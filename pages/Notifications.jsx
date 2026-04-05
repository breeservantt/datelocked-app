import React from 'react';
import { supabase } from '@/lib/supabase';
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
  const [user, setUser] = React.useState(null);

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
      // ✅ GET USER
      const { data } = await supabase.auth.getUser();
      const currentUser = data.user;

      if (!currentUser) throw new Error('User not authenticated');
      setUser(currentUser);

      const notifs = [];

      // ✅ RELATIONSHIP INVITATIONS (RECEIVED)
      const { data: receivedInvitations } = await supabase
        .from('RelationshipInvitation')
        .select('*')
        .eq('recipient_email', currentUser.email)
        .order('created_at', { ascending: false })
        .limit(10);

      // ✅ RELATIONSHIP INVITATIONS (SENT)
      const { data: sentInvitations } = await supabase
        .from('RelationshipInvitation')
        .select('*')
        .eq('sender_email', currentUser.email)
        .order('created_at', { ascending: false })
        .limit(10);

      // ✅ EVENTS
      let eventInvites = [];
      const coupleId = currentUser.user_metadata?.couple_profile_id;

      if (coupleId) {
        const { data } = await supabase
          .from('CoupleGoal')
          .select('*')
          .eq('couple_profile_id', coupleId)
          .eq('is_event', true)
          .order('created_at', { ascending: false });

        eventInvites = data || [];
      }

      // BUILD NOTIFICATIONS

      (receivedInvitations || []).forEach((inv) => {
        if (inv.status === 'pending') {
          notifs.push({
            id: inv.id,
            type: 'invitation_received',
            title: 'Relationship Invitation',
            message: `${inv.sender_name || inv.sender_email} wants to Date-Lock with you!`,
            time: inv.created_at,
            icon: Heart,
            color: 'rose'
          });
        }

        if (inv.status === 'accepted') {
          notifs.push({
            id: `${inv.id}_accepted`,
            type: 'invitation_accepted',
            title: 'Date-Locked!',
            message: `You are now Date-Locked with ${inv.sender_name || inv.sender_email}`,
            time: inv.updated_at || inv.created_at,
            icon: Lock,
            color: 'green'
          });
        }
      });

      (sentInvitations || []).forEach((inv) => {
        if (inv.status === 'accepted') {
          notifs.push({
            id: `${inv.id}_partner_accepted`,
            type: 'partner_accepted',
            title: 'Invitation Accepted!',
            message: `${inv.recipient_email} accepted your Date-Lock invitation!`,
            time: inv.updated_at || inv.created_at,
            icon: CheckCircle,
            color: 'green'
          });
        }

        if (inv.status === 'pending') {
          notifs.push({
            id: `${inv.id}_pending`,
            type: 'invitation_pending',
            title: 'Invitation Pending',
            message: `Waiting for ${inv.recipient_email}`,
            time: inv.created_at,
            icon: Clock,
            color: 'amber'
          });
        }
      });

      (eventInvites || []).forEach((event) => {
        if (event.invitation_status === 'pending' && event.invited_by !== currentUser.email) {
          notifs.push({
            id: `${event.id}_event_invite`,
            type: 'event_invitation',
            title: 'Event Invitation',
            message: `You're invited to ${event.title}`,
            time: event.created_at,
            icon: Calendar,
            color: 'amber'
          });
        }

        if (event.invitation_status === 'accepted' && event.invited_by === currentUser.email) {
          notifs.push({
            id: `${event.id}_event_accepted`,
            type: 'event_accepted',
            title: 'Event Accepted!',
            message: `Your partner accepted ${event.title}`,
            time: event.updated_at || event.created_at,
            icon: CheckCircle,
            color: 'green'
          });
        }

        if (event.invitation_status === 'declined' && event.invited_by === currentUser.email) {
          notifs.push({
            id: `${event.id}_event_declined`,
            type: 'event_declined',
            title: 'Event Declined',
            message: `Your partner declined ${event.title}`,
            time: event.updated_at || event.created_at,
            icon: Calendar,
            color: 'rose'
          });
        }
      });

      // SORT
      notifs.sort((a, b) => {
        const da = parseSafeDate(a.time)?.getTime() ?? 0;
        const db = parseSafeDate(b.time)?.getTime() ?? 0;
        return db - da;
      });

      setNotifications(notifs);
    } catch (e) {
      console.error(e);
      setError(e.message || 'Failed to load notifications');
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  // LOADING
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  // ERROR
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="p-6 text-center">
          <XIcon className="mx-auto mb-3 text-red-500" />
          <p>{error}</p>
          <Button onClick={loadData}>Retry</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto">

      <div className="flex items-center justify-between mb-4">
        <Link to={createPageUrl('Home')}>
          <Button variant="ghost"><ArrowLeft /></Button>
        </Link>
        <h2 className="font-bold">Notifications</h2>
        <Button onClick={loadData}>Refresh</Button>
      </div>

      {notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((n) => {
            const Icon = n.icon;

            return (
              <Card key={n.id} className="p-3">
                <div className="flex gap-3">
                  <Icon />
                  <div>
                    <p className="font-medium">{n.title}</p>
                    <p className="text-sm">{n.message}</p>
                    {n.time && (
                      <p className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(n.time), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-6 text-center">
          <BellOff className="mx-auto mb-3" />
          <p>No notifications</p>
        </Card>
      )}
    </div>
  );
}
