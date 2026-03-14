import React from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Lock,
  Heart,
  Image,
  Target,
  Bell,
  Settings,
  ChevronRight,
  Loader2,
  Plus,
  CheckCircle,
  Clock,
  Camera,
  X,
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import StatusBadge from '@/components/ui/StatusBadge';
import PartnerCard from '@/components/profile/PartnerCard';
import { parseSafeDate } from '@/components/utils/dateHelpers';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const NOTIFY_AUDIO_SRC =
  'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt5p9NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSyBzvLZiTYIGmi77eafTRAMUKfj8LZjHAY4ktfzzXksBSR3yPDekEAKFF607OupVRQKRp/g8r5sIQUsgs/y2Ik2CBlou+3mn00QDFCn4/C2YxwGOJLX8s15LAUkd8nw3pBAChRftOzrqVUUCkaf4PK+bCEFLILP8tmJNggZaLvt5p9NEAxQp+PwtmMcBjiS1/LNeSwFJHfK8N+QQAoUX7Ts66lVFApGn+DyvmwhBSyBzvLZiTYIGmi77eafTRAMUKfj8LZjHAY4ktfyzHksBSR3yO/fkEAKFGCz7OupVRQKRp/g8r5sIQUsgs/y2Yk2CBlou+3mn00QDFCo4/C2YxwGOJPX8sx5LAUld8rw35BAChRftOzrqVUUCkaf4PK+bCEFLILP8tmJNggZaLvt5p9NEAxQqOPwtmMcBjiS1/LMeSwFJHfK8N+QQAoUX7Ts66lVFApGn+DyvmwhBSyCz/LZiTYIGWi77eafTRAMUKfj8LZjHAY4ktfyzHksBSR3ye/fkEAKFGC07OupVRQKRp/g8r5sIQUsgs/y2Ik2CBlouujln00QDFCn4/C2YxwGOJPX8sx5LAUkd8jv35BAChRgs+zrqVUUCkaf4PK+bCEFLILP8tmJNggZaLvt5p9NEAxQp+PwtmMcBjiS1/LMeSwFJHfK8N+QQAoUX7Ts66lVFApGn+DyvmwhBSyCz/LZiTYIGWi77eafTRAMT6jj8LZjHAY4k9fyzHksBSR3yO/fkEAKFGCz7OupVRQKRp/g8r5sIQUsgs/y2Yk2CBlou+3mn00QDFCn4fC2YxwGOJPX8sx5LAUkd8nw35BAChRftOzrqVUUCkaf4PK+bCEFLILP8tmJNggZaLvt5p9NEAxQp+PwtmMcBjiS1/LMeSwFJHfK8N+QQAoUX7Ts66lVFApGn+DyvmwhBSyCz/LZiTYIGWi77eafTRAMT6jj8LZjHAY4k9fyzHksBSR3yO/fkEAKFGCz7OupVRQKRp/g8r5sIQUsgs/y2Yk2CBlou+3mn00QDFCn4/C2YxwGOJPX8sx5LAUkd8nw35BAChRftOzrqVUUCkaf4PK+bCEFLILP8tmJNggZaLvt5p9NEAxQp+PwtmMcBjiS1/LMeSwFJHfK8N+QQAoUX7Ts66lVFApGn+DyvmwhBSyCz/LZiTYIG=';

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // Upload profile photo from Home
  const fileInputRef = React.useRef(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = React.useState(false);

  // Avatar enlarge modal
  const [avatarPreviewOpen, setAvatarPreviewOpen] = React.useState(false);

  const openPhotoPicker = React.useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleProfilePhotoUpload = React.useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;

      setIsUploadingPhoto(true);
      try {
        const res = await base44.integrations.Core.UploadFile({ file });
        const fileUrl = res?.file_url;
        if (!fileUrl) throw new Error('Upload returned no URL');

        await base44.auth.updateMe({ profile_photo: fileUrl });
        await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      } catch (err) {
        console.error('Profile upload failed:', err);
        alert('Profile photo upload failed. Please try again.');
      } finally {
        setIsUploadingPhoto(false);
      }
    },
    [queryClient]
  );

  // Reuse single audio (faster, less lag)
  const notifyAudioRef = React.useRef(null);
  React.useEffect(() => {
    notifyAudioRef.current = new Audio(NOTIFY_AUDIO_SRC);
  }, []);
  const playNotify = React.useCallback(() => {
    notifyAudioRef.current?.play().catch(() => {});
  }, []);

  // Track already-notified invitation id
  const lastInvitationIdRef = React.useRef(null);

  // Countdown tick (every minute) — keep for COUNTDOWN only
  const [nowTick, setNowTick] = React.useState(Date.now());
  React.useEffect(() => {
    const t = setInterval(() => setNowTick(Date.now()), 60 * 1000);
    return () => clearInterval(t);
  }, []);

  // Fetch user
  const { data: user, isLoading, isError, refetch: refetchUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // Auto-refetch when returning from settings
  React.useEffect(() => {
    if (location.pathname.includes('Home')) {
      refetchUser();
    }
  }, [location.pathname, refetchUser]);

  // Redirects
  React.useEffect(() => {
    if (!user) return;

    if (user.legalAccepted !== true) {
      navigate(createPageUrl('Consent'), { replace: true });
      return;
    }

    if (!user.onboarding_completed) {
      navigate(createPageUrl('Onboarding'), { replace: true });
    }
  }, [user, navigate]);

  const coupleId = user?.couple_profile_id || null;
  const myEmail = user?.email || null;
  const isDateLocked = user?.relationship_status === 'date_locked';

  // Pending invitation token
  const inviteToken = React.useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('invite');
  }, [location.search]);

  const { data: pendingInvitation } = useQuery({
    queryKey: ['pendingInvitationByToken', inviteToken],
    enabled: !!inviteToken && !!user,
    retry: 1,
    queryFn: async () => {
      const invs = await base44.entities.RelationshipInvitation.filter({
        invitation_token: inviteToken,
        status: 'pending',
      });
      return invs?.[0] || null;
    },
  });

  // Invitation notification sound
  React.useEffect(() => {
    if (!pendingInvitation?.id) return;
    if (pendingInvitation.id === lastInvitationIdRef.current) return;

    lastInvitationIdRef.current = pendingInvitation.id;
    playNotify();
  }, [pendingInvitation?.id, playNotify]);

  // Couple profile
  const { data: coupleProfile } = useQuery({
    queryKey: ['coupleProfile', coupleId],
    enabled: !!coupleId,
    retry: 1,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const profiles = await base44.entities.CoupleProfile.filter({ id: coupleId });
      return profiles?.[0] || null;
    },
  });

  // Partner
  const { data: partner } = useQuery({
    queryKey: ['partner', coupleProfile?.id, myEmail],
    enabled: !!coupleProfile?.id && !!myEmail,
    retry: 1,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const partnerEmail =
        coupleProfile.partner1_email === myEmail ? coupleProfile.partner2_email : coupleProfile.partner1_email;

      if (!partnerEmail) return null;

      const partners = await base44.entities.User.filter({ email: partnerEmail });
      return partners?.[0] || null;
    },
  });

  // Stats
  const { data: stats = { memories: 0, goals: 0, places: 0 } } = useQuery({
    queryKey: ['homeStats', coupleId],
    enabled: !!coupleId,
    retry: 1,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const [memories, goals, places] = await Promise.all([
        base44.entities.Memory.filter({ couple_profile_id: coupleId }),
        base44.entities.CoupleGoal.filter({ couple_profile_id: coupleId }),
        base44.entities.FavoritePlace.filter({ couple_profile_id: coupleId }),
      ]);
      return { memories: memories.length, goals: goals.length, places: places.length };
    },
  });

  // Next accepted event
  const { data: nextAcceptedEvent } = useQuery({
    queryKey: ['nextAcceptedEvent', coupleId],
    enabled: !!coupleId,
    retry: 1,
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000,
    queryFn: async () => {
      const events = await base44.entities.CoupleGoal.filter({
        couple_profile_id: coupleId,
        is_event: true,
        invitation_status: 'accepted',
      });

      const now = Date.now();

      const upcoming = (Array.isArray(events) ? events : [])
        .map((e) => {
          const dt = parseSafeDate(e.event_datetime);
          return dt ? { ...e, _ms: dt.getTime() } : null;
        })
        .filter(Boolean)
        .filter((e) => e._ms > now)
        .sort((a, b) => a._ms - b._ms);

      return upcoming[0] || null;
    },
  });

  // Countdown shows DAYS only
  const eventCountdownText = React.useMemo(() => {
    if (!nextAcceptedEvent?._ms) return '--';
    const diffMs = Math.max(0, nextAcceptedEvent._ms - nowTick);
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return `${days} days`;
  }, [nextAcceptedEvent?._ms, nowTick]);

  // Sound ONCE when event hits + auto-move to next event
  const lastEventAlertIdRef = React.useRef(null);
  React.useEffect(() => {
    if (!nextAcceptedEvent?._ms || !nextAcceptedEvent?.id) return;
    if (lastEventAlertIdRef.current === nextAcceptedEvent.id) return;

    if (nowTick >= nextAcceptedEvent._ms) {
      playNotify();
      lastEventAlertIdRef.current = nextAcceptedEvent.id;
      queryClient.invalidateQueries({ queryKey: ['nextAcceptedEvent', coupleId] });
    }
  }, [nowTick, nextAcceptedEvent?._ms, nextAcceptedEvent?.id, playNotify, queryClient, coupleId]);

  // Click countdown -> open THAT event
  const handleOpenEvent = React.useCallback(() => {
    if (!nextAcceptedEvent?.id) return;
    navigate(createPageUrl('Goals') + `?event=${nextAcceptedEvent.id}`);
  }, [nextAcceptedEvent?.id, navigate]);

  // Days together
  const daysTogether = React.useMemo(() => {
    const lockedAt = coupleProfile?.date_locked_at;
    if (!lockedAt) return 0;

    const lockedDate = new Date(lockedAt);
    const today = new Date();
    return Math.max(0, Math.floor((today - lockedDate) / (1000 * 60 * 60 * 24)));
  }, [coupleProfile?.date_locked_at]);

  const canEdit =
    !!user &&
    user.relationship_status !== 'pending_verification' &&
    user.relationship_status !== 'single';

  const handleAcceptInvitation = React.useCallback(async () => {
    if (!pendingInvitation?.invitation_token) return;

    try {
      await base44.functions.invoke('acceptInvitationByToken', {
        invitation_token: pendingInvitation.invitation_token,
      });

      await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      await queryClient.invalidateQueries({ queryKey: ['coupleProfile'] });
      navigate(createPageUrl('Home'), { replace: true });
    } catch (e) {
      console.error('Error accepting invitation:', e);
      alert(e?.message || 'Failed to accept invitation. Please try again.');
    }
  }, [pendingInvitation?.invitation_token, navigate, queryClient]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-rose-50 via-white to-pink-50">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-rose-50 via-white to-pink-50 p-4">
        <Card className="p-6 text-center max-w-md w-full">
          <p className="text-slate-600 mb-4">Unable to load your profile</p>
          <Button onClick={() => window.location.reload()} className="bg-rose-500 hover:bg-rose-600">
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-pink-50 pb-24">
      {/* Hidden upload input */}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleProfilePhotoUpload} className="hidden" />

      {/* Avatar preview modal */}
      {avatarPreviewOpen && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setAvatarPreviewOpen(false)}
        >
          <button
            onClick={() => setAvatarPreviewOpen(false)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <img
            src={user?.profile_photo || ''}
            alt=""
            className="max-w-full max-h-full object-contain rounded"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <div className="bg-gradient-to-r from-blue-500 via-blue-600 to-blue-400 pt-12 pb-16 px-4 rounded-b-[2rem]">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              {/* Bigger avatar + click to enlarge */}
              <div className="relative">
                <button type="button" onClick={() => setAvatarPreviewOpen(true)} className="block">
                  <Avatar className="w-20 h-20 border-2 border-white/70 shadow-xl">
                    <AvatarImage src={user?.profile_photo} />
                    <AvatarFallback className="bg-white/20 text-white text-xl font-semibold">
                      {user?.full_name?.[0] || 'U'}
                    </AvatarFallback>
                  </Avatar>
                </button>

                {/* Upload button */}
                <button
                  type="button"
                  onClick={openPhotoPicker}
                  disabled={isUploadingPhoto}
                  className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-white shadow-md flex items-center justify-center active:scale-95"
                  aria-label="Upload profile photo"
                >
                  {isUploadingPhoto ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                  ) : (
                    <Camera className="w-4 h-4 text-slate-700" />
                  )}
                </button>
              </div>

              <div className="min-w-0">
                <p className="text-white/70 text-sm">Welcome back</p>
                <h2 className="text-white font-semibold truncate">{user?.full_name}</h2>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => navigate(createPageUrl('Notifications'))}
              >
                <Bell className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20"
                onClick={() => navigate(createPageUrl('Settings'))}
              >
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Smaller "Days and status" banner */}
          <Card className="bg-white/95 backdrop-blur-sm border-0 shadow-xl px-3 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs mb-1">Your Status</p>
                <StatusBadge status={user?.relationship_status} size="md" />
              </div>

              {isDateLocked && daysTogether > 0 && (
                <div className="text-right">
                  <p className="text-slate-500 text-xs">Together for</p>
                  <p className="text-xl font-bold text-rose-500 leading-none">{daysTogether} days</p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-6">
        <AnimatePresence>
          {pendingInvitation && (
            <div className="mb-5">
              <Card className="border-0 shadow-lg bg-gradient-to-r from-amber-50 to-orange-50 overflow-hidden">
                <div className="p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
                      <Heart className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">Relationship Invitation</p>
                      <p className="text-sm text-slate-500">From {pendingInvitation.sender_name || pendingInvitation.sender_email}</p>
                    </div>
                  </div>

                  <Button
                    onClick={handleAcceptInvitation}
                    className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
                  >
                    <Lock className="w-4 h-4 mr-2" />
                    Accept & Date-Lock
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </AnimatePresence>

        {partner && (
          <div className="mb-5">
            <PartnerCard partner={partner} coupleProfile={coupleProfile} isLocked={isDateLocked} />
          </div>
        )}

        {/* Smaller "Memories / Goals / Countdown" banners */}
        {isDateLocked && (
          <div className="grid grid-cols-3 gap-2.5 mb-5">
            <Link to={createPageUrl('Memories')}>
              <Card className="p-3 border-0 shadow-md hover:shadow-lg transition-shadow text-center">
                <Image className="w-5 h-5 text-rose-400 mx-auto mb-1" />
                <p className="text-xl font-bold text-slate-800 leading-none">{stats.memories}</p>
                <p className="text-[11px] text-slate-500">Memories</p>
              </Card>
            </Link>

            <Link to={createPageUrl('Goals')}>
              <Card className="p-3 border-0 shadow-md hover:shadow-lg transition-shadow text-center">
                <Target className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                <p className="text-xl font-bold text-slate-800 leading-none">{stats.goals}</p>
                <p className="text-[11px] text-slate-500">Goals</p>
              </Card>
            </Link>

            <Card
              onClick={handleOpenEvent}
              className="p-3 border-0 shadow-md hover:shadow-lg transition-shadow text-center cursor-pointer"
            >
              <Clock className="w-5 h-5 text-amber-400 mx-auto mb-1" />
              <p className="text-xl font-bold text-slate-800 leading-none">{eventCountdownText}</p>
              <p className="text-[10px] text-slate-500 truncate">{nextAcceptedEvent?.title || ''}</p>
            </Card>
          </div>
        )}

        <div className="space-y-3">
          {isDateLocked && (
            <>
              <Link to={createPageUrl('RelationshipInsights')}>
                <Card className="p-4 border-0 shadow-md hover:shadow-lg transition-all flex items-center justify-between bg-gradient-to-r from-purple-50 to-indigo-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">Relationship Insights</p>
                      <p className="text-sm text-slate-500">View your weekly health report</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </Card>
              </Link>

              <Link to={createPageUrl('Memories')}>
                <Card className="p-4 border-0 shadow-md hover:shadow-lg transition-all flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center">
                      <Plus className="w-5 h-5 text-rose-500" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">Add a Memory</p>
                      <p className="text-sm text-slate-500">Capture your special moments</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </Card>
              </Link>

              <Link to={createPageUrl('Goals')}>
                <Card className="p-4 border-0 shadow-md hover:shadow-lg transition-all flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <Target className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">Set a Goal</p>
                      <p className="text-sm text-slate-500">Plan your future together</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </Card>
              </Link>
            </>
          )}

          {!isDateLocked && !pendingInvitation && (
            <Card className="p-6 border-0 shadow-md text-center bg-gradient-to-r from-slate-50 to-slate-100">
              <Lock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-700 mb-2">Unlock Couple Features</h3>
              <p className="text-sm text-slate-500 mb-4">
                Date-Lock with your partner to access memories, goals, and more
              </p>
              <Link to={createPageUrl('InvitePartner')}>
                <Button className="bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600">
                  <Heart className="w-4 h-4 mr-2" />
                  Invite Partner
                </Button>
              </Link>
            </Card>
          )}
        </div>

        {isDateLocked && canEdit ? null : null}
      </div>
    </div>
  );
}