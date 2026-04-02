import React from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate, Link, useLocation } from 'react-router-dom';
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
import { useQuery, useQueryClient } from '@tanstack/react-query';

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  const fileInputRef = React.useRef(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = React.useState(false);
  const [avatarPreviewOpen, setAvatarPreviewOpen] = React.useState(false);

  const openPhotoPicker = () => fileInputRef.current?.click();

  // ✅ USER
  const { data: user, isLoading } = useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user;
    }
  });

  const coupleId = user?.user_metadata?.couple_profile_id;
  const isDateLocked = user?.user_metadata?.relationship_status === 'date_locked';

  // ✅ PROFILE PHOTO UPLOAD
  const handleProfilePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingPhoto(true);

    try {
      const { data } = await supabase.storage
        .from('avatars')
        .upload(`public/${user.id}`, file, { upsert: true });

      const publicUrl = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/avatars/${data.path}`;

      await supabase.auth.updateUser({
        data: { profile_photo: publicUrl }
      });

      queryClient.invalidateQueries(['currentUser']);
    } catch (err) {
      console.error(err);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // ✅ STATS
  const { data: stats = { memories: 0, goals: 0 } } = useQuery({
    queryKey: ['stats', coupleId],
    enabled: !!coupleId,
    queryFn: async () => {
      const [memories, goals] = await Promise.all([
        supabase.from('Memory').select('*', { count: 'exact', head: true }).eq('couple_profile_id', coupleId),
        supabase.from('CoupleGoal').select('*', { count: 'exact', head: true }).eq('couple_profile_id', coupleId),
      ]);

      return {
        memories: memories.count || 0,
        goals: goals.count || 0
      };
    }
  });

  // ✅ NEXT EVENT
  const { data: nextEvent } = useQuery({
    queryKey: ['nextEvent', coupleId],
    enabled: !!coupleId,
    queryFn: async () => {
      const { data } = await supabase
        .from('CoupleGoal')
        .select('*')
        .eq('couple_profile_id', coupleId)
        .eq('is_event', true)
        .eq('invitation_status', 'accepted')
        .order('event_datetime', { ascending: true })
        .limit(1);

      return data?.[0] || null;
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4">

      <input type="file" ref={fileInputRef} onChange={handleProfilePhotoUpload} className="hidden" />

      {/* Avatar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="relative">
          <Avatar className="w-20 h-20">
            <AvatarImage src={user?.user_metadata?.profile_photo} />
            <AvatarFallback>{user?.email?.[0]}</AvatarFallback>
          </Avatar>

          <button onClick={openPhotoPicker} className="absolute bottom-0 right-0">
            {isUploadingPhoto ? <Loader2 /> : <Camera />}
          </button>
        </div>

        <div>
          <h2 className="font-bold">{user?.email}</h2>
        </div>
      </div>

      {/* Stats */}
      {isDateLocked && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          <Card className="p-3 text-center">
            <p className="font-bold">{stats.memories}</p>
            <p className="text-xs">Memories</p>
          </Card>

          <Card className="p-3 text-center">
            <p className="font-bold">{stats.goals}</p>
            <p className="text-xs">Goals</p>
          </Card>

          <Card className="p-3 text-center">
            <p className="font-bold">
              {nextEvent ? 'Upcoming' : '--'}
            </p>
            <p className="text-xs">{nextEvent?.title || 'No Event'}</p>
          </Card>
        </div>
      )}

      {/* Navigation */}
      <div className="space-y-3">
        <Link to="/memories">
          <Card className="p-4 flex justify-between">
            <span>Memories</span>
            <ChevronRight />
          </Card>
        </Link>

        <Link to="/goals">
          <Card className="p-4 flex justify-between">
            <span>Goals</span>
            <ChevronRight />
          </Card>
        </Link>

        {!isDateLocked && (
          <Card className="p-4 text-center">
            <Lock className="mx-auto mb-2" />
            <p>Invite your partner to unlock features</p>
          </Card>
        )}
      </div>
    </div>
  );
}
