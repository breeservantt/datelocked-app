import React from 'react';
import { supabase } from '@/lib/supabase';
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
  Home as HomeIcon,
  MapPin,
  MessageCircle,
  Fingerprint,
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import PartnerCard from '@/components/profile/PartnerCard';
import { parseSafeDate } from '@/components/utils/dateHelpers';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const NOTIFY_AUDIO_SRC =
  'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt5p9NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSyBzvLZiTYIGmi77eafTRAMUKfj8LZjHAY4ktfzzXksBSR3yPDekEAKFF607OupVRQKRp/g8r5sIQUsgs/y2Ik2CBlou+3mn00QDFCn4/C2YxwGOJLX8s15LAUkd8nw3pBAChRftOzrqVUUCkaf4PK+bCEFLILP8tmJNggZaLvt5p9NEAxQqOPwtmMcBjiS1/LNeSwFJHfK8N+QQAoUX7Ts66lVFApGn+DyvmwhBSyBzvLZiTYIGmi77eafTRAMUKfj8LZjHAY4ktfyzHksBSR3yO/fkEAKFGCz7OupVRQKRp/g8r5sIQUsgs/y2Yk2CBlou+3mn00QDFCo4/C2YxwGOJPX8sx5LAUld8rw35BAChRftOzrqVUUCkaf4PK+bCEFLILP8tmJNggZaLvt5p9NEAxQqOPwtmMcBjiS1/LMeSwFJHfK8N+QQAoUX7Ts66lVFApGn+DyvmwhBSyCz/LZiTYIGWi77eafTRAMUKfj8LZjHAY4ktfyzHksBSR3ye/fkEAKFGC07OupVRQKRp/g8r5sIQUsgs/y2Ik2CBlouujln00QDFCn4/C2YxwGOJPX8sx5LAUkd8jv35BAChRgs+zrqVUUCkaf4PK+bCEFLILP8tmJNggZaLvt5p9NEAxQp+PwtmMcBjiS1/LMeSwFJHfK8N+QQAoUX7Ts66lVFApGn+DyvmwhBSyCz/LZiTYIGWi77eafTRAMT6jj8LZjHAY4k9fyzHksBSR3yO/fkEAKFGCz7OupVRQKRp/g8r5sIQUsgs/y2Yk2CBlou+3mn00QDFCn4fC2YxwGOJPX8sx5LAUkd8nw35BAChRftOzrqVUUCkaf4PK+bCEFLILP8tmJNggZaLvt5p9NEAxQp+PwtmMcBjiS1/LMeSwFJHfK8N+QQAoUX7Ts66lVFApGn+DyvmwhBSyCz/LZiTYIGWi77eafTRAMT6jj8LZjHAY4k9fyzHksBSR3yO/fkEAKFGCz7OupVRQKRp/g8r5sIQUsgs/y2Yk2CBlou+3mn00QDFCn4/C2YxwGOJPX8sx5LAUkd8nw35BAChRftOzrqVUUCkaf4PK+bCEFLILP8tmJNggZaLvt5p9NEAxQp+PwtmMcBjiS1/LMeSwFJHfK8N+QQAoUX7Ts66lVFApGn+DyvmwhBSyCz/LZiTYIG=';

const navItems = [
  { label: 'Home', icon: HomeIcon, page: 'Home' },
  { label: 'Dating', icon: Heart, page: 'Dating' },
  { label: 'Memories', icon: Image, page: 'Memories' },
  { label: 'Goals', icon: Target, page: 'Goals' },
  { label: 'NightIn', icon: MapPin, page: 'NightIn' },
  { label: 'Chat', icon: MessageCircle, page: 'Chat' },
  { label: 'Verify', icon: Fingerprint, page: 'VerifyStatus' },
];

async function tryProfileTablesById(userId) {
  for (const table of ['profiles', 'users']) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (!error && data) return data;
  }
  return null;
}

async function tryProfileTablesByEmail(email) {
  if (!email) return null;

  for (const table of ['profiles', 'users']) {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('email', email)
      .limit(1);

    if (!error && data?.[0]) return data[0];
  }

  return null;
}

function getDisplayStatus(relationshipStatus) {
  return relationshipStatus === 'date_locked' ? 'Date-Locked' : 'Date-Picking';
}

function StatusPill({ relationshipStatus }) {
  const isLocked = relationshipStatus === 'date_locked';
  const text = getDisplayStatus(relationshipStatus);

  return (
    <div
      className={`inline-flex min-h-[42px] items-center rounded-[14px] px-3 py-2 shadow-[0_6px_14px_rgba(15,23,42,0.06)] ${
        isLocked
          ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white'
          : 'bg-gradient-to-r from-[#f5e7a8] to-[#f3d9dd] text-slate-800'
      }`}
    >
      <div className="flex items-center gap-1.5">
        {isLocked ? <Lock className="h-4 w-4" /> : <Heart className="h-4 w-4" />}
        <span className="text-[12px] font-semibold leading-none">{text}</span>
      </div>
    </div>
  );
}

function StatCard({ icon, value, label, iconColor, iconWrap }) {
  return (
    <Card className="rounded-[24px] bg-white/95 px-3 py-3.5 text-center">
      <div className="flex flex-col items-center">
        <div
          className={`mb-2.5 flex h-9 w-9 items-center justify-center rounded-full ${iconWrap}`}
        >
          {React.cloneElement(icon, { className: `h-4 w-4 ${iconColor}` })}
        </div>

        <p className="text-[17px] font-bold tracking-[-0.02em] text-slate-900 leading-none">
          {value}
        </p>

        <p className="mt-2 text-[11px] font-medium tracking-[-0.01em] text-slate-500 truncate">
          {label}
        </p>
      </div>
    </Card>
  );
}

function BottomNav() {
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#ece6ea] bg-white/95 pb-2 pt-2 shadow-[0_-6px_18px_rgba(15,23,42,0.06)] backdrop-blur">
      <div className="mx-auto grid w-full max-w-[390px] grid-cols-7 gap-1 px-2">
        {navItems.map((item) => {
          const href = createPageUrl(item.page);
          const active =
            location.pathname === href || (href === '/' && location.pathname === '/');
          const Icon = item.icon;

          return (
            <Link
              key={item.label}
              to={href}
              className={`flex min-h-[64px] flex-col items-center justify-center rounded-[16px] px-1 py-2 transition ${
                active ? 'bg-[#fdecef]' : 'bg-transparent'
              }`}
            >
              <Icon
                className={`mb-1 h-5 w-5 ${
                  active ? 'text-[#ef4f75]' : 'text-slate-400'
                }`}
                strokeWidth={2.1}
              />
              <span
                className={`truncate text-[9px] leading-tight ${
                  active ? 'font-semibold text-[#ef4f75]' : 'font-medium text-slate-400'
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

function extractGoalDate(goal) {
  const possibleFields = [
    goal?.event_datetime,
    goal?.target_date,
    goal?.target_datetime,
    goal?.due_date,
    goal?.scheduled_for,
    goal?.goal_date,
    goal?.date,
  ];

  for (const value of possibleFields) {
    if (!value) continue;
    const parsed = parseSafeDate(value);
    if (parsed) return parsed;
  }

  return null;
}

function getGoalDisplayTitle(goal) {
  return (
    goal?.title ||
    goal?.name ||
    goal?.goal_title ||
    goal?.event_title ||
    'Award Celebrati...'
  );
}

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const fileInputRef = React.useRef(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = React.useState(false);
  const [avatarPreviewOpen, setAvatarPreviewOpen] = React.useState(false);

  const notifyAudioRef = React.useRef(null);
  const lastInvitationIdRef = React.useRef(null);
  const lastCountdownAlertIdRef = React.useRef(null);

  React.useEffect(() => {
    notifyAudioRef.current = new Audio(NOTIFY_AUDIO_SRC);
  }, []);

  const playNotify = React.useCallback(() => {
    notifyAudioRef.current?.play().catch(() => {});
  }, []);

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
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;
        if (!user) throw new Error('User not authenticated');

        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data } = supabase.storage.from('profile-photos').getPublicUrl(filePath);
        const publicUrl = data.publicUrl;

        const payload = {
          id: user.id,
          email: user.email,
          profile_photo: publicUrl,
          full_name:
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split('@')[0] ||
            'User',
        };

        await supabase.from('profiles').upsert(payload, { onConflict: 'id' });
        await supabase.from('users').upsert(payload, { onConflict: 'id' });

        await queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      } catch (err) {
        console.error(err);
        alert(err.message || 'Upload failed');
      } finally {
        setIsUploadingPhoto(false);
      }
    },
    [queryClient]
  );

  const [nowTick, setNowTick] = React.useState(Date.now());
  React.useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const {
    data: user,
    isLoading,
    isError,
    refetch: refetchUser,
  } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const {
        data: { user: authUser },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!authUser) return null;

      const profile = await tryProfileTablesById(authUser.id);

      return {
        ...authUser,
        ...(profile || {}),
        email: authUser.email,
      };
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  React.useEffect(() => {
    if (location.pathname.includes('Home')) {
      refetchUser();
    }
  }, [location.pathname, refetchUser]);

  React.useEffect(() => {
    if (!user) return;

    if (user.legalAccepted === false) {
      navigate(createPageUrl('Consent'), { replace: true });
      return;
    }

    if (user.onboarding_completed === false) {
      navigate(createPageUrl('Onboarding'), { replace: true });
    }
  }, [user, navigate]);

  const coupleId = user?.couple_profile_id || null;
  const myEmail = user?.email || null;
  const isDateLocked = user?.relationship_status === 'date_locked';

  const inviteToken = React.useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('invite');
  }, [location.search]);

  const { data: pendingInvitation } = useQuery({
    queryKey: ['pendingInvitationByToken', inviteToken],
    enabled: !!inviteToken && !!user,
    retry: 1,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('relationship_invitations')
        .select('*')
        .eq('invitation_token', inviteToken)
        .eq('status', 'pending')
        .limit(1);

      if (error) throw error;
      return data?.[0] || null;
    },
  });

  React.useEffect(() => {
    if (!pendingInvitation?.id) return;
    if (pendingInvitation.id === lastInvitationIdRef.current) return;

    lastInvitationIdRef.current = pendingInvitation.id;
    playNotify();
  }, [pendingInvitation?.id, playNotify]);

  const { data: coupleProfile } = useQuery({
    queryKey: ['coupleProfile', coupleId],
    enabled: !!coupleId,
    retry: 1,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('couple_profiles')
        .select('*')
        .eq('id', coupleId)
        .limit(1);

      if (error) throw error;
      return data?.[0] || null;
    },
  });

  const { data: partner } = useQuery({
    queryKey: ['partner', coupleProfile?.id, myEmail],
    enabled: !!coupleProfile?.id && !!myEmail,
    retry: 1,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const partnerEmail =
        coupleProfile?.partner1_email === myEmail
          ? coupleProfile?.partner2_email
          : coupleProfile?.partner1_email;

      return await tryProfileTablesByEmail(partnerEmail);
    },
  });

  const { data: memoryCount = 0 } = useQuery({
    queryKey: ['homeMemoryCount', coupleId],
    enabled: !!coupleId,
    retry: 1,
    staleTime: 60 * 1000,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('memories')
        .select('id', { count: 'exact', head: true })
        .eq('couple_profile_id', coupleId);

      if (error) throw error;
      return count || 0;
    },
  });

  const { data: goalsData = { count: 0, countdownGoal: null } } = useQuery({
  queryKey: ['homeGoalsData', coupleId, user?.id],
  enabled: !!user?.id,
  retry: 1,
  staleTime: 30 * 1000,
  refetchInterval: 30 * 1000,
  queryFn: async () => {
    let query = supabase.from('couple_goals').select('*');

    if (coupleId) {
      query = query.eq('couple_profile_id', coupleId);
    } else {
      query = query.eq('owner_id', user.id);
    }

    const { data: goals, error } = await query;

    if (error) throw error;

    const list = Array.isArray(goals) ? goals : [];
    const now = Date.now();

    const datedGoals = list
      .map((goal) => {
        const parsedDate = extractGoalDate(goal);
        if (!parsedDate) return null;

        return {
          ...goal,
          _dateMs: parsedDate.getTime(),
        };
      })
      .filter(Boolean);

    const upcoming = [...datedGoals]
      .filter((goal) => goal._dateMs >= now)
      .sort((a, b) => a._dateMs - b._dateMs);

    const latestDated = [...datedGoals].sort((a, b) => b._dateMs - a._dateMs);

    return {
      count: list.length,
      countdownGoal: upcoming[0] || latestDated[0] || null,
    };
  },
});

  const countdownGoal = goalsData.countdownGoal;

  const countdownText = React.useMemo(() => {
    if (!countdownGoal?._dateMs) return '--';

    const diffMs = countdownGoal._dateMs - nowTick;
    if (diffMs <= 0) return 'Today';

    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return `${days} days`;
  }, [countdownGoal?._dateMs, nowTick]);

  React.useEffect(() => {
    if (!countdownGoal?._dateMs || !countdownGoal?.id) return;
    if (lastCountdownAlertIdRef.current === countdownGoal.id) return;

    if (nowTick >= countdownGoal._dateMs) {
      playNotify();
      lastCountdownAlertIdRef.current = countdownGoal.id;
      queryClient.invalidateQueries({ queryKey: ['homeGoalsData', coupleId] });
    }
  }, [nowTick, countdownGoal?._dateMs, countdownGoal?.id, playNotify, queryClient, coupleId]);

  const handleOpenCountdownGoal = React.useCallback(() => {
    if (!countdownGoal?.id) {
      navigate(createPageUrl('Goals'));
      return;
    }
    navigate(`${createPageUrl('Goals')}?goal=${countdownGoal.id}`);
  }, [countdownGoal?.id, navigate]);

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
      const { error } = await supabase.functions.invoke('acceptInvitationByToken', {
        body: {
          invitation_token: pendingInvitation.invitation_token,
        },
      });

      if (error) throw error;

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
      <div className="min-h-screen flex items-center justify-center bg-[#f3edf1]">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    );
  }

  if (isError || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3edf1] p-4">
        <Card className="w-full max-w-md p-6 text-center">
          <p className="mb-4 text-slate-600">Unable to load your profile</p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-rose-500 hover:bg-rose-600"
          >
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  const hasProfilePhoto = Boolean(user?.profile_photo);

  return (
    <>
      <div className="min-h-screen bg-[#f3edf1] px-3 py-3 pb-[96px]">
        <div className="mx-auto w-full max-w-[390px] overflow-hidden rounded-[28px] border border-[#e8e2e7] bg-[#f7f3f6] shadow-[0_12px_40px_rgba(15,23,42,0.10)]">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleProfilePhotoUpload}
            className="hidden"
          />

          {avatarPreviewOpen && hasProfilePhoto && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
              onClick={() => setAvatarPreviewOpen(false)}
            >
              <button
                onClick={() => setAvatarPreviewOpen(false)}
                className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              >
                <X className="h-5 w-5" />
              </button>

              <img
                src={user.profile_photo}
                alt="Profile"
                className="max-h-full max-w-full rounded-[18px] object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          )}

          <div className="bg-gradient-to-r from-[#5e9cff] via-[#2f6df0] to-[#6aa7ff] px-5 pb-10 pt-7">
            <div className="flex items-start justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      if (hasProfilePhoto) setAvatarPreviewOpen(true);
                    }}
                    className="block overflow-hidden rounded-full"
                  >
                    <Avatar className="h-[84px] w-[84px] overflow-hidden rounded-full border-[3px] border-white/75 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.18)]">
                      {hasProfilePhoto ? (
                        <AvatarImage
                          src={user.profile_photo}
                          alt="Profile"
                          className="h-full w-full rounded-full object-cover object-center"
                        />
                      ) : (
                        <AvatarFallback className="h-full w-full rounded-full bg-white/20 text-[30px] font-semibold text-white">
                          {user?.full_name?.[0] || 'U'}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </button>

                  <button
                    type="button"
                    onClick={openPhotoPicker}
                    disabled={isUploadingPhoto}
                    className="absolute -bottom-1 -right-1 flex h-[36px] w-[36px] items-center justify-center rounded-full bg-white text-slate-700 shadow-[0_8px_18px_rgba(15,23,42,0.16)] active:scale-95"
                    aria-label="Upload profile photo"
                  >
                    {isUploadingPhoto ? (
                      <Loader2 className="h-4 w-4 animate-spin text-slate-600" />
                    ) : (
                      <Camera className="h-4 w-4 text-slate-700" />
                    )}
                  </button>
                </div>

                <div className="min-w-0 pt-1">
                  <p className="text-[14px] text-white/80">Welcome back</p>
                  <h2 className="truncate text-[18px] font-semibold text-white">
                    {user?.full_name}
                  </h2>
                </div>
              </div>

              <div className="flex gap-3 pt-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full text-white hover:bg-white/15"
                  onClick={() => navigate(createPageUrl('Notifications'))}
                >
                  <Bell className="h-5 w-5" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full text-white hover:bg-white/15"
                  onClick={() => navigate(createPageUrl('Settings'))}
                >
                  <Settings className="h-5 w-5" />
                </Button>
              </div>
            </div>

            <div className="mt-4 rounded-[18px] bg-white/95 px-3 py-3 shadow-[0_8px_18px_rgba(15,23,42,0.10)] backdrop-blur-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="mb-1.5 text-[12px] text-slate-500">Your Status</p>
                  <StatusPill relationshipStatus={user?.relationship_status} />
                </div>

                {isDateLocked && daysTogether > 0 && (
                  <div className="text-right">
                    <p className="text-[11px] text-slate-500">Together for</p>
                    <p className="text-[20px] font-bold leading-none text-rose-500">
                      {daysTogether} days
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="-mt-8 px-4 pt-4 pb-6">
            <div className="mb-4 grid grid-cols-3 gap-2.5">
              <Link to={createPageUrl('Memories')}>
                <StatCard
                  icon={<Image />}
                  value={memoryCount}
                  label="Memories"
                  iconColor="text-rose-400"
                  iconWrap="bg-rose-50"
                />
              </Link>

              <Link to={createPageUrl('Goals')}>
                <StatCard
                  icon={<Target />}
                  value={goalsData.count}
                  label="Goals"
                  iconColor="text-blue-400"
                  iconWrap="bg-blue-50"
                />
              </Link>

              <Card
                onClick={handleOpenCountdownGoal}
                className="cursor-pointer rounded-[24px] bg-white/95 px-3 py-3.5 text-center"
              >
                <div className="flex flex-col items-center">
                  <div className="mb-2.5 flex h-9 w-9 items-center justify-center rounded-full bg-amber-50">
                    <Clock className="h-4 w-4 text-amber-400" />
                  </div>

                  <p className="text-[17px] font-bold tracking-[-0.02em] text-slate-900 leading-none">
                    {countdownText}
                  </p>

                  <p className="mt-2 text-[11px] font-medium tracking-[-0.01em] text-slate-500 truncate">
                    {getGoalDisplayTitle(countdownGoal)}
                  </p>
                </div>
              </Card>
            </div>

            <AnimatePresence>
              {pendingInvitation && (
                <div className="mb-4">
                  <Card className="overflow-hidden border-0 bg-gradient-to-r from-amber-50 to-orange-50 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
                    <div className="p-4">
                      <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                          <Heart className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">Relationship Invitation</p>
                          <p className="text-sm text-slate-500">
                            From {pendingInvitation.sender_name || pendingInvitation.sender_email}
                          </p>
                        </div>
                      </div>

                      <Button
                        onClick={handleAcceptInvitation}
                        className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
                      >
                        <Lock className="mr-2 h-4 w-4" />
                        Accept & Date-Lock
                      </Button>
                    </div>
                  </Card>
                </div>
              )}
            </AnimatePresence>

            {!pendingInvitation && (
  <div className="mb-4 flex gap-3">
    <Button
      type="button"
      onClick={() => navigate(`${createPageUrl('InvitePartner')}?mode=invite`)}
      className="flex h-[42px] w-full items-center justify-center gap-2 rounded-[14px] bg-white px-3 text-[13px] font-medium text-rose-500 shadow-[0_6px_14px_rgba(15,23,42,0.08)]"
    >
      <Heart className="h-3.5 w-3.5 shrink-0" />
      <span className="leading-none">Invite</span>
    </Button>

    <Button
      type="button"
      onClick={() => navigate(`${createPageUrl('InvitePartner')}?mode=accept`)}
      className="flex h-[42px] w-full items-center justify-center rounded-[14px] bg-rose-500 px-3 text-[13px] font-medium text-white shadow-[0_6px_14px_rgba(15,23,42,0.08)]"
    >
      <span className="leading-none">Accept-Date</span>
    </Button>
  </div>
)}

            {partner && (
              <div className="mb-4">
                <PartnerCard
                  partner={partner}
                  coupleProfile={coupleProfile}
                  isLocked={isDateLocked}
                />
              </div>
            )}

            <div className="space-y-2">

  {/* Relationship Insights */}
  <Link to={createPageUrl('RelationshipInsights')}>
    <div className="flex items-center justify-between rounded-[16px] bg-gradient-to-r from-[#f3efff] to-[#eef2ff] px-4 py-3 shadow-[0_6px_14px_rgba(15,23,42,0.08)]">
      
      <div className="flex items-center gap-3">
        <div className="flex h-[44px] w-[44px] items-center justify-center rounded-[14px] bg-gradient-to-br from-[#8b5cf6] to-[#6366f1]">
          <CheckCircle className="h-5 w-5 text-white" strokeWidth={2.2} />
        </div>

        <div>
          <p className="text-[14px] font-semibold text-slate-800 leading-none">
            Relationship Insights
          </p>
          <p className="text-[12px] text-slate-500 mt-1">
            View your weekly health report
          </p>
        </div>
      </div>

      <ChevronRight className="h-5 w-5 text-slate-400" />
    </div>
  </Link>


  {/* Add Memory */}
  <Link to={createPageUrl('Memories')}>
    <div className="flex items-center justify-between rounded-[16px] bg-white px-4 py-3 shadow-[0_6px_14px_rgba(15,23,42,0.08)]">
      
      <div className="flex items-center gap-3">
        <div className="flex h-[44px] w-[44px] items-center justify-center rounded-[14px] bg-[#fde8ea]">
          <Plus className="h-5 w-5 text-[#ff4d6d]" strokeWidth={2.2} />
        </div>

        <div>
          <p className="text-[14px] font-semibold text-slate-800 leading-none">
            Add a Memory
          </p>
          <p className="text-[12px] text-slate-500 mt-1">
            Capture your special moments
          </p>
        </div>
      </div>

      <ChevronRight className="h-5 w-5 text-slate-400" />
    </div>
  </Link>


  {/* Set Goal */}
  <Link to={createPageUrl('Goals')}>
    <div className="flex items-center justify-between rounded-[16px] bg-white px-4 py-3 shadow-[0_6px_14px_rgba(15,23,42,0.08)]">
      
      <div className="flex items-center gap-3">
        <div className="flex h-[44px] w-[44px] items-center justify-center rounded-[14px] bg-[#e8f0ff]">
          <Target className="h-5 w-5 text-[#3b82f6]" strokeWidth={2.2} />
        </div>

        <div>
          <p className="text-[14px] font-semibold text-slate-800 leading-none">
            Set a Goal
          </p>
          <p className="text-[12px] text-slate-500 mt-1">
            Plan your future together
          </p>
        </div>
      </div>

      <ChevronRight className="h-5 w-5 text-slate-400" />
    </div>
  </Link>

</div>

            {isDateLocked && canEdit ? null : null}
          </div>
        </div>
      </div>

      <BottomNav />
    </>
  );
}