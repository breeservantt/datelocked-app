import React from 'react';
import { supabase } from '@/lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Camera,
  User,
  MapPin,
  Calendar,
  Mail,
  LogOut,
  Loader2,
  Save,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';
import { parseSafeDate } from '@/components/utils/dateHelpers';

export default function Settings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [user, setUser] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);

  const [formData, setFormData] = React.useState({
    full_name: '',
    location: '',
    profile_photo: ''
  });

  // ✅ LOAD USER FROM SUPABASE
  const loadUser = async () => {
    setIsLoading(true);
    const { data } = await supabase.auth.getUser();
    const currentUser = data.user;

    if (currentUser) {
      setUser(currentUser);
      setFormData({
        full_name: currentUser.user_metadata?.full_name || '',
        location: currentUser.user_metadata?.location || '',
        profile_photo: currentUser.user_metadata?.profile_photo || ''
      });
    }

    setIsLoading(false);
  };

  React.useEffect(() => {
    loadUser();
  }, []);

  // ✅ PHOTO UPLOAD (SUPABASE STORAGE)
  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const filePath = `profiles/${Date.now()}-${file.name}`;

    const { error } = await supabase.storage
      .from('uploads')
      .upload(filePath, file);

    if (error) {
      alert('Upload failed');
      return;
    }

    const { data } = supabase.storage
      .from('uploads')
      .getPublicUrl(filePath);

    const url = data.publicUrl;

    await supabase.auth.updateUser({
      data: { profile_photo: url }
    });

    setFormData((prev) => ({ ...prev, profile_photo: url }));
    await loadUser();
  };

  // ✅ SAVE PROFILE
  const handleSave = async () => {
    setIsSaving(true);

    await supabase.auth.updateUser({
      data: {
        full_name: formData.full_name,
        location: formData.location,
        profile_photo: formData.profile_photo
      }
    });

    await loadUser();

    queryClient.invalidateQueries();

    setIsSaving(false);
    alert('Profile updated');
  };

  // ✅ LOGOUT
  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <div className="p-6 text-center">User not found</div>;
  }

  return (
    <div className="min-h-screen bg-white p-4 pb-24">

      <div className="flex items-center gap-3 mb-6">
        <Link to={createPageUrl('Home')}>
          <Button variant="ghost">
            <ArrowLeft />
          </Button>
        </Link>
        <h1 className="text-xl font-semibold">Settings</h1>
      </div>

      <Card className="p-6 space-y-4">

        {/* PROFILE PHOTO */}
        <div className="flex justify-center">
          <div className="relative">
            <Avatar className="w-24 h-24">
              <AvatarImage src={formData.profile_photo} />
              <AvatarFallback>
                {formData.full_name?.[0] || <User />}
              </AvatarFallback>
            </Avatar>

            <label className="absolute bottom-0 right-0 cursor-pointer">
              <Camera />
              <input type="file" hidden onChange={handlePhotoUpload} />
            </label>
          </div>
        </div>

        {/* NAME */}
        <div>
          <Label>Full Name</Label>
          <Input
            value={formData.full_name}
            onChange={(e) =>
              setFormData({ ...formData, full_name: e.target.value })
            }
          />
        </div>

        {/* LOCATION */}
        <div>
          <Label>Location</Label>
          <Input
            value={formData.location}
            onChange={(e) =>
              setFormData({ ...formData, location: e.target.value })
            }
          />
        </div>

        {/* EMAIL */}
        <div>
          <Label>Email</Label>
          <Input value={user.email} disabled />
        </div>

        {/* DOB */}
        <div>
          <Label>Date of Birth</Label>
          <Input
            value={
              user.user_metadata?.date_of_birth
                ? format(
                    parseSafeDate(user.user_metadata.date_of_birth),
                    'MMM d, yyyy'
                  )
                : ''
            }
            disabled
          />
        </div>

        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="animate-spin" /> : 'Save Changes'}
        </Button>

      </Card>

      {/* LOGOUT */}
      <Button
        variant="outline"
        className="w-full mt-6"
        onClick={handleLogout}
      >
        <LogOut className="mr-2" />
        Logout
      </Button>

    </div>
  );
}
