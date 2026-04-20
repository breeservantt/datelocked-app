import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
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
  Fingerprint,
  Shield,
  LogOut,
  Loader2,
  Save,
  AlertTriangle,
  Unlock,
  Archive,
  Image as ImageIcon,
  Sparkles,
  X as XIcon,
  KeyRound,
  ChevronRight,
  Lock,
  FileText,
  Home as HomeIcon,
  Heart,
  Image,
  Target,
  MessageCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import StatusBadge from '@/components/ui/StatusBadge';
import { format } from 'date-fns';
import { parseSafeDate } from '@/components/utils/dateHelpers';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const createPageUrl = (pageName) => {
  if (pageName === 'Home') return '/';
  return `/${pageName.toLowerCase()}`;
};

const navItems = [
  { label: 'Home', icon: HomeIcon, page: 'Home' },
  { label: 'Dating', icon: Heart, page: 'Dating' },
  { label: 'Memories', icon: Image, page: 'Memories' },
  { label: 'Goals', icon: Target, page: 'Goals' },
  { label: 'NightIn', icon: MapPin, page: 'NightIn' },
  { label: 'Chat', icon: MessageCircle, page: 'Chat' },
  { label: 'Verify', icon: Fingerprint, page: 'VerifyStatus' },
];

/* -----------------------
   Temp adapter replacing Base44 only
------------------------ */
const settingsApi = {
  async me() {
    return {
      id: 'user-1',
      email: 'you@example.com',
      full_name: 'Your Name',
      location: 'Johannesburg',
      profile_photo: '',
      date_of_birth: '1995-06-15',
      relationship_status: 'date_locked',
      partner_email: 'partner@example.com',
      couple_profile_id: 'couple-1',
      auth_preference: 'PASSWORD',
      pin_enabled: false,
      pin_last_set_at: null,
      insights_consent: true,
    };
  },

  async updateMe(patch) {
    const current = JSON.parse(localStorage.getItem('settings.user') || 'null');
    const next = { ...(current || (await this.me())), ...patch };
    localStorage.setItem('settings.user', JSON.stringify(next));
    return next;
  },

  async logout() {
    return true;
  },

  async getUser() {
    const cached = localStorage.getItem('settings.user');
    if (cached) return JSON.parse(cached);
    const fresh = await this.me();
    localStorage.setItem('settings.user', JSON.stringify(fresh));
    return fresh;
  },

  entities: {
    RelationshipTermination: {
      async filter() {
        return [];
      },
    },
    ArchivedMemory: {
      async filter() {
        return [];
      },
    },
  },

  integrations: {
    Core: {
      async UploadFile({ file }) {
        return { file_url: URL.createObjectURL(file) };
      },
    },
  },

  functions: {
    async invoke() {
      return { success: true };
    },
  },
};

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

function FolderRow({ icon: Icon, title, subtitle, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left flex items-center justify-between rounded-[20px] bg-white px-4 py-4 shadow-[0_8px_20px_rgba(15,23,42,0.05)] transition hover:bg-slate-50"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-slate-100">
          <Icon className="h-5 w-5 text-slate-600" />
        </div>
        <div>
          <p className="font-semibold text-slate-800">{title}</p>
          {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-slate-400" />
    </button>
  );
}

function BackToFolders({ onClick }) {
  return (
    <div className="mb-3">
      <Button variant="outline" className="w-full rounded-[14px]" onClick={onClick}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [user, setUser] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const [isSaving, setIsSaving] = React.useState(false);
  const [isBusyAction, setIsBusyAction] = React.useState(false);

  const [showUnlockDialog, setShowUnlockDialog] = React.useState(false);
  const [showTerminationDialog, setShowTerminationDialog] = React.useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = React.useState(false);

  const [pendingTermination, setPendingTermination] = React.useState(null);
  const [archivedMemories, setArchivedMemories] = React.useState([]);
  const [showArchive, setShowArchive] = React.useState(false);

  const [openFolder, setOpenFolder] = React.useState(null);

  const [formData, setFormData] = React.useState({
    full_name: '',
    location: '',
    profile_photo: '',
  });

  const [authPref, setAuthPref] = React.useState('PASSWORD');
  const [pinEnabled, setPinEnabled] = React.useState(false);

  const [pinNew, setPinNew] = React.useState('');
  const [pinConfirm, setPinConfirm] = React.useState('');
  const [isAuthSaving, setIsAuthSaving] = React.useState(false);

  const PRIVACY_POLICY_URL = createPageUrl('PrivacyPolicy');
  const SECURITY_POLICY_URL = createPageUrl('SecurityPolicy');

  const getServerErrorMessage = (e) =>
    e?.response?.data?.error ||
    e?.response?.data?.message ||
    e?.response?.data?.detail ||
    e?.message ||
    'Unknown error';

  const safeInvoke = React.useCallback(async (fnName, payload = {}) => {
    try {
      return await settingsApi.functions.invoke(fnName, payload);
    } catch (e) {
      console.error(`Function invoke failed: ${fnName}`, e);
      const status = e?.response?.status;
      const msg = getServerErrorMessage(e);
      alert(status ? `Request failed (${status}) in "${fnName}": ${msg}` : `Could not run "${fnName}": ${msg}`);
      throw e;
    }
  }, []);

  const refreshUser = React.useCallback(async () => {
    const u = await settingsApi.getUser();
    setUser(u);

    setFormData({
      full_name: u?.full_name || '',
      location: u?.location || '',
      profile_photo: u?.profile_photo || '',
    });

    setAuthPref(u?.auth_preference || 'PASSWORD');
    setPinEnabled(Boolean(u?.pin_enabled));

    return u;
  }, []);

  const loadAll = React.useCallback(async () => {
    const currentUser = await refreshUser();
    if (!currentUser) throw new Error('Unable to load your account.');

    if (currentUser.couple_profile_id && currentUser.email) {
      const terminations = await settingsApi.entities.RelationshipTermination.filter({
        partner_email: currentUser.email,
        status: 'pending',
      });
      setPendingTermination(terminations?.[0] || null);
    } else {
      setPendingTermination(null);
    }

    if (currentUser.email) {
      const archived = await settingsApi.entities.ArchivedMemory.filter({
        user_email: currentUser.email,
      });
      setArchivedMemories(Array.isArray(archived) ? archived : []);
    } else {
      setArchivedMemories([]);
    }
  }, [refreshUser]);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setIsLoading(true);
        await loadAll();
      } catch (e) {
        console.error('Settings load error:', e);
        if (alive) setUser(null);
      } finally {
        if (alive) setIsLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [loadAll]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    try {
      const { file_url } = await settingsApi.integrations.Core.UploadFile({ file });
      if (!file_url) throw new Error('Upload failed');

      await settingsApi.updateMe({ profile_photo: file_url });

      setFormData((prev) => ({ ...prev, profile_photo: file_url }));
      await refreshUser();

      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['partner'] });
    } catch (error) {
      console.error('Photo upload failed:', error);
      alert('Photo upload failed. Please try again.');
    }
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await settingsApi.updateMe({
        full_name: (formData.full_name || '').trim(),
        location: (formData.location || '').trim(),
        profile_photo: formData.profile_photo || '',
      });

      await refreshUser();

      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['partner'] });
      queryClient.invalidateQueries({ queryKey: ['coupleProfile'] });

      alert('Profile updated.');
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save changes. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSetPin = async () => {
    if (isAuthSaving) return;

    const a = (pinNew || '').trim();
    const b = (pinConfirm || '').trim();

    if (!/^\d{4,8}$/.test(a)) {
      alert('PIN must be 4–8 digits.');
      return;
    }

    if (a !== b) {
      alert('PIN confirmation does not match.');
      return;
    }

    setIsAuthSaving(true);
    try {
      await safeInvoke('pinSet', { pin: a });

      await settingsApi.updateMe({
        pin_enabled: true,
        auth_preference: 'PIN',
        pin_last_set_at: new Date().toISOString(),
      });

      setPinNew('');
      setPinConfirm('');
      await refreshUser();
    } catch (e) {
      console.error(e);
      const msg = getServerErrorMessage(e);
      alert(`Could not set PIN: ${msg}`);
    } finally {
      setIsAuthSaving(false);
    }
  };

  const handleTogglePin = async (checked) => {
    if (isAuthSaving) return;

    setIsAuthSaving(true);
    try {
      if (!checked) {
        await safeInvoke('pinDisable', {});
        await settingsApi.updateMe({
          pin_enabled: false,
          auth_preference: 'PASSWORD',
        });
      } else {
        await settingsApi.updateMe({
          pin_enabled: true,
          auth_preference: 'PIN',
        });
      }

      await refreshUser();
    } catch (e) {
      console.error(e);
      const msg = getServerErrorMessage(e);
      alert(`Could not update PIN setting: ${msg}`);
    } finally {
      setIsAuthSaving(false);
    }
  };

  const handleUnlock = async () => {
    if (isBusyAction) return;
    setIsBusyAction(true);
    try {
      await safeInvoke('quickDateUnlock', { couple_profile_id: user?.couple_profile_id });
      setShowUnlockDialog(false);
      await settingsApi.updateMe({
        relationship_status: 'single',
        partner_email: null,
        couple_profile_id: null,
      });
      navigate(createPageUrl('Home'), { replace: true });
    } finally {
      setIsBusyAction(false);
    }
  };

  const handleTerminationRequest = async () => {
    if (isBusyAction) return;
    setIsBusyAction(true);
    try {
      await safeInvoke('requestRelationshipTermination', { couple_profile_id: user?.couple_profile_id });
      setShowTerminationDialog(false);
      alert('Termination request sent to your partner.');
      await loadAll();
    } finally {
      setIsBusyAction(false);
    }
  };

  const handleConfirmTermination = async () => {
    if (isBusyAction) return;
    setIsBusyAction(true);
    try {
      await safeInvoke('confirmRelationshipTermination', { couple_profile_id: user?.couple_profile_id });
      setPendingTermination(null);
      await settingsApi.updateMe({
        relationship_status: 'single',
        partner_email: null,
        couple_profile_id: null,
      });
      navigate(createPageUrl('Home'), { replace: true });
    } finally {
      setIsBusyAction(false);
    }
  };

  const handleDeclineTermination = async () => {
    if (isBusyAction) return;
    setIsBusyAction(true);
    try {
      await safeInvoke('declineRelationshipTermination', { couple_profile_id: user?.couple_profile_id });
      setPendingTermination(null);
      await loadAll();
    } finally {
      setIsBusyAction(false);
    }
  };

  const handleDeactivate = async () => {
    if (isBusyAction) return;
    setIsBusyAction(true);
    try {
      await safeInvoke('deactivateAccount');
      await settingsApi.logout();
      navigate(createPageUrl('Home'));
    } finally {
      setIsBusyAction(false);
    }
  };

  const handleLogout = async () => {
    try {
      await settingsApi.logout();
      navigate(createPageUrl('Home'));
    } catch (e) {
      console.error('Logout failed:', e);
      alert('Logout failed. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f3edf1]">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <div className="min-h-screen bg-[#f3edf1] px-3 py-3 pb-[96px]">
          <div className="mx-auto w-full max-w-[390px] overflow-hidden rounded-[28px] border border-[#e8e2e7] bg-[#f7f3f6] shadow-[0_12px_40px_rgba(15,23,42,0.10)]">
            <div className="bg-gradient-to-r from-[#5e9cff] via-[#2f6df0] to-[#6aa7ff] px-5 pb-8 pt-7">
              <div className="flex items-center gap-3">
                <Link to={createPageUrl('Home')}>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-white hover:bg-white/15">
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                </Link>
                <h1 className="text-[22px] font-semibold text-white">Settings</h1>
              </div>
            </div>

            <div className="-mt-4 px-4 pb-6 pt-4">
              <Card className="border-0 p-8 text-center shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                  <XIcon className="h-8 w-8 text-red-500" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-800">Could not load Settings</h3>
                <p className="mb-6 text-slate-600">Please try again.</p>
                <Button onClick={() => window.location.reload()} className="bg-rose-500 hover:bg-rose-600">
                  Retry
                </Button>
              </Card>
            </div>
          </div>
        </div>
        <BottomNav />
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#f3edf1] px-3 py-3 pb-[96px]">
        <div className="mx-auto w-full max-w-[390px] overflow-hidden rounded-[28px] border border-[#e8e2e7] bg-[#f7f3f6] shadow-[0_12px_40px_rgba(15,23,42,0.10)]">
          <div className="bg-gradient-to-r from-[#5e9cff] via-[#2f6df0] to-[#6aa7ff] px-5 pb-10 pt-7">
            <div className="flex items-center gap-3">
              <Link to={createPageUrl('Home')}>
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full text-white hover:bg-white/15">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <p className="text-[14px] text-white/80">Account management</p>
                <h1 className="text-[22px] font-semibold text-white">Settings</h1>
              </div>
            </div>

            <div className="mt-4 rounded-[18px] bg-white/95 px-4 py-4 shadow-[0_8px_18px_rgba(15,23,42,0.10)] backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <Avatar className="h-[58px] w-[58px] border-2 border-white shadow-[0_8px_18px_rgba(15,23,42,0.10)]">
                  <AvatarImage src={formData.profile_photo} />
                  <AvatarFallback className="bg-gradient-to-br from-rose-100 to-pink-100 text-rose-500 text-xl">
                    {formData.full_name?.[0] || <User className="h-6 w-6" />}
                  </AvatarFallback>
                </Avatar>

                <div className="min-w-0">
                  <p className="truncate text-[16px] font-semibold text-slate-800">
                    {user?.full_name || 'Your Profile'}
                  </p>
                  <p className="truncate text-[12px] text-slate-500">{user?.email}</p>
                  <div className="mt-2">
                    <StatusBadge status={user?.relationship_status} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="-mt-8 px-4 pb-6 pt-4">
            <div className="space-y-4">
              {pendingTermination && (
                <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
                  <Card className="border-0 bg-gradient-to-r from-red-50 to-rose-50 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
                    <div className="mb-3 flex items-start gap-3">
                      <AlertTriangle className="mt-0.5 h-5 w-5 text-red-500" />
                      <div className="flex-1">
                        <p className="mb-1 font-semibold text-slate-800">Termination Request</p>
                        <p className="text-sm text-slate-600">
                          {pendingTermination.initiator_name || pendingTermination.initiator_email} wants to terminate.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleConfirmTermination}
                        disabled={isBusyAction}
                        className="flex-1 bg-red-500 hover:bg-red-600"
                      >
                        {isBusyAction ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm'}
                      </Button>
                      <Button
                        onClick={handleDeclineTermination}
                        disabled={isBusyAction}
                        variant="outline"
                        className="flex-1"
                      >
                        {isBusyAction ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Decline'}
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              )}

              {openFolder === null && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="space-y-3">
                    <FolderRow
                      icon={User}
                      title="Profile"
                      subtitle="Photo, name, location, email, date of birth"
                      onClick={() => setOpenFolder('profile')}
                    />
                    <FolderRow
                      icon={Lock}
                      title="Security"
                      subtitle="PIN and sign-in settings"
                      onClick={() => setOpenFolder('security')}
                    />

                    <Card className="rounded-[22px] border-0 p-4 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
                      <div className="mb-2 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-slate-600" />
                        <p className="font-semibold text-slate-800">Policies</p>
                      </div>
                      <p className="mb-3 text-sm text-slate-500">
                        Review how we handle privacy and security.
                      </p>
                      <div className="flex flex-col gap-2">
                        <Link to={PRIVACY_POLICY_URL} className="text-sm font-medium text-rose-600 hover:underline">
                          Privacy Policy
                        </Link>
                        <Link to={SECURITY_POLICY_URL} className="text-sm font-medium text-rose-600 hover:underline">
                          Security Policy
                        </Link>
                      </div>
                    </Card>
                  </div>
                </motion.div>
              )}

              {openFolder === 'profile' && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                  <BackToFolders onClick={() => setOpenFolder(null)} />

                  <Card className="rounded-[22px] border-0 p-6 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
                    <h2 className="mb-4 text-lg font-semibold text-slate-800">Profile</h2>

                    <div className="mb-6 flex justify-center">
                      <div className="relative">
                        <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                          <AvatarImage src={formData.profile_photo} />
                          <AvatarFallback className="bg-gradient-to-br from-rose-100 to-pink-100 text-2xl text-rose-500">
                            {formData.full_name?.[0] || <User className="h-8 w-8" />}
                          </AvatarFallback>
                        </Avatar>

                        <label className="absolute -bottom-2 -right-2 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-rose-500 to-pink-500 shadow-lg transition-transform hover:scale-105">
                          <Camera className="h-5 w-5 text-white" />
                          <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                        </label>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label>Full Name</Label>
                        <Input
                          value={formData.full_name}
                          onChange={(e) => setFormData((prev) => ({ ...prev, full_name: e.target.value }))}
                          className="mt-1 rounded-[14px]"
                        />
                      </div>

                      <div>
                        <Label>Location</Label>
                        <div className="relative mt-1">
                          <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <Input
                            value={formData.location}
                            onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                            className="rounded-[14px] pl-10"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Email</Label>
                        <div className="relative mt-1">
                          <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <Input value={user.email || ''} disabled className="rounded-[14px] bg-slate-50 pl-10" />
                        </div>
                      </div>

                      <div>
                        <Label>Date of Birth</Label>
                        <div className="relative mt-1">
                          <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <Input
                            value={(() => {
                              const d = parseSafeDate(user?.date_of_birth);
                              return d ? format(d, 'MMM d, yyyy') : '';
                            })()}
                            disabled
                            className="rounded-[14px] bg-slate-50 pl-10"
                          />
                        </div>
                      </div>

                      <Button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full rounded-[14px] bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
                      >
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                    </div>
                  </Card>
                </motion.div>
              )}

              {openFolder === 'security' && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
                  <BackToFolders onClick={() => setOpenFolder(null)} />

                  <Card className="rounded-[22px] border-0 p-6 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
                    <h2 className="mb-1 text-lg font-semibold text-slate-800">Security</h2>
                    <p className="mb-4 text-sm text-slate-500">
                      Manage how you sign in.
                    </p>

                    <div className="mb-4 rounded-[18px] border border-slate-200 bg-slate-50 p-4">
                      <p className="mb-1 text-sm font-semibold text-slate-800">Biometric Login</p>
                      <p className="text-sm text-slate-500">
                        Biometric login will be handled later in native Android.
                      </p>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <KeyRound className="h-5 w-5 text-slate-500" />
                        <div>
                          <p className="font-medium text-slate-800">PIN</p>
                          <p className="text-sm text-slate-500">
                            {pinEnabled ? 'Enabled' : 'Disabled'}{' '}
                            {user?.pin_last_set_at ? `• last set ${format(new Date(user.pin_last_set_at), 'MMM d')}` : ''}
                          </p>
                        </div>
                      </div>
                      <Switch checked={pinEnabled} disabled={isAuthSaving} onCheckedChange={handleTogglePin} />
                    </div>

                    {pinEnabled && (
                      <div className="mt-4 space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label>New PIN</Label>
                            <Input
                              value={pinNew}
                              onChange={(e) => setPinNew(e.target.value.replace(/\D/g, '').slice(0, 8))}
                              placeholder="4–8 digits"
                              inputMode="numeric"
                              className="mt-1 rounded-[14px]"
                            />
                          </div>
                          <div>
                            <Label>Confirm</Label>
                            <Input
                              value={pinConfirm}
                              onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 8))}
                              placeholder="Repeat PIN"
                              inputMode="numeric"
                              className="mt-1 rounded-[14px]"
                            />
                          </div>
                        </div>

                        <Button onClick={handleSetPin} disabled={isAuthSaving} className="w-full rounded-[14px]">
                          {isAuthSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Set / Update PIN'}
                        </Button>

                        <p className="text-xs text-slate-500">
                          PIN is stored securely as a server-side hash.
                        </p>
                      </div>
                    )}

                    <Separator />

                    <div className="flex items-center justify-between pt-4">
                      <span className="text-sm text-slate-600">Current preference</span>
                      <span className="text-sm font-semibold text-slate-800">
                        {authPref === 'PIN' ? 'PIN' : 'Password'}
                      </span>
                    </div>

                    <div className="mt-5 rounded-[18px] border border-slate-200 bg-slate-50 p-4">
                      <p className="mb-2 text-sm font-semibold text-slate-800">Policies</p>
                      <div className="flex flex-col gap-2">
                        <Link to={PRIVACY_POLICY_URL} className="text-sm font-medium text-rose-600 hover:underline">
                          Privacy Policy
                        </Link>
                        <Link to={SECURITY_POLICY_URL} className="text-sm font-medium text-rose-600 hover:underline">
                          Security Policy
                        </Link>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              )}

              {openFolder === null && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
                  <Card className="rounded-[22px] border-0 p-6 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
                    <h2 className="mb-4 text-lg font-semibold text-slate-800">Insights</h2>

                    <div className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <Sparkles className="h-5 w-5 text-slate-500" />
                        <div>
                          <p className="font-medium text-slate-800">AI-Powered Insights</p>
                          <p className="text-sm text-slate-500">Allow weekly AI summaries</p>
                        </div>
                      </div>

                      <Switch
                        checked={!!user?.insights_consent}
                        onCheckedChange={async (checked) => {
                          try {
                            await settingsApi.updateMe({ insights_consent: checked });
                            await refreshUser();
                          } catch (e) {
                            console.error(e);
                            alert('Could not update setting.');
                          }
                        }}
                      />
                    </div>

                    {user?.relationship_status === 'date_locked' && (
                      <>
                        <Separator />
                        <Link to={createPageUrl('RelationshipInsights')}>
                          <Button variant="outline" className="mt-3 w-full rounded-[14px]">
                            <Shield className="mr-2 h-4 w-4" />
                            View Insights Dashboard
                          </Button>
                        </Link>
                      </>
                    )}
                  </Card>
                </motion.div>
              )}

              {openFolder === null && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
                  <Card className="rounded-[22px] border-0 p-6 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
                    <h2 className="mb-4 text-lg font-semibold text-slate-800">Relationship</h2>

                    <div className="mb-4 flex items-center justify-between">
                      <span className="text-slate-600">Current Status</span>
                      <StatusBadge status={user?.relationship_status} />
                    </div>

                    {user?.partner_email && (
                      <div className="mb-4 flex items-center justify-between">
                        <span className="text-slate-600">Partner</span>
                        <span className="font-medium text-slate-800">{user.partner_email}</span>
                      </div>
                    )}

                    {user?.relationship_status === 'date_locked' && (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => setShowTerminationDialog(true)}
                          className="mb-3 w-full rounded-[14px] border-red-200 text-red-500 hover:bg-red-50"
                        >
                          <AlertTriangle className="mr-2 h-4 w-4" />
                          Request Termination (Needs Confirmation)
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => setShowUnlockDialog(true)}
                          className="w-full rounded-[14px] border-amber-200 text-amber-600 hover:bg-amber-50"
                        >
                          <Unlock className="mr-2 h-4 w-4" />
                          Quick Date-Unlock
                        </Button>
                      </>
                    )}
                  </Card>
                </motion.div>
              )}

              {openFolder === null && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
                  <Card className="rounded-[22px] border-0 p-6 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
                    <div className="mb-4 flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-slate-800">Archive</h2>
                      <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Archive className="h-4 w-4" />
                        <span>{archivedMemories.length} memories</span>
                      </div>
                    </div>

                    {archivedMemories.length > 0 ? (
                      <>
                        <Button variant="outline" onClick={() => setShowArchive((v) => !v)} className="w-full rounded-[14px]">
                          <Archive className="mr-2 h-4 w-4" />
                          {showArchive ? 'Hide' : 'View'} Archived Memories
                        </Button>

                        {showArchive && (
                          <div className="mt-4 space-y-3">
                            {archivedMemories.slice(0, 50).map((memory) => (
                              <div key={memory.id} className="flex gap-3 rounded-[16px] border border-slate-200 bg-slate-50 p-3">
                                {memory.photos?.[0] ? (
                                  <img src={memory.photos[0]} alt="" className="h-16 w-16 rounded-lg object-cover" />
                                ) : (
                                  <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-200">
                                    <ImageIcon className="h-6 w-6 text-slate-400" />
                                  </div>
                                )}
                                <div className="min-w-0 flex-1">
                                  <p className="truncate font-medium text-slate-800">{memory.title}</p>
                                  <p className="truncate text-sm text-slate-500">{memory.description}</p>
                                  {(() => {
                                    const d = parseSafeDate(memory.date);
                                    return d ? <p className="mt-1 text-xs text-slate-400">{format(d, 'MMM d, yyyy')}</p> : null;
                                  })()}
                                </div>
                              </div>
                            ))}
                            {archivedMemories.length > 50 && (
                              <p className="text-center text-xs text-slate-500">Showing latest 50.</p>
                            )}
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="py-4 text-center text-sm text-slate-500">No archived memories yet</p>
                    )}
                  </Card>
                </motion.div>
              )}

              {openFolder === null && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
                  <Card className="rounded-[22px] border border-red-100 p-6 shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
                    <h2 className="mb-4 text-lg font-semibold text-slate-800">Account</h2>

                    <div className="mb-4 rounded-[16px] bg-red-50 p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
                        <div className="text-sm">
                          <p className="mb-1 font-medium text-red-800">Deactivate Account</p>
                          <p className="text-red-600">This will disable your account.</p>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => setShowDeactivateDialog(true)}
                      className="w-full rounded-[14px] border-red-200 text-red-600 hover:bg-red-50"
                    >
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      Deactivate Account
                    </Button>
                  </Card>
                </motion.div>
              )}

              {openFolder === null && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <Button variant="outline" onClick={handleLogout} className="w-full rounded-[14px] bg-white">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log Out
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      <BottomNav />

      <AlertDialog open={showTerminationDialog} onOpenChange={setShowTerminationDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Request Relationship Termination?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This sends a request to your partner. They must confirm before the relationship ends.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBusyAction}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleTerminationRequest}
              className="bg-red-500 hover:bg-red-600"
              disabled={isBusyAction}
            >
              {isBusyAction ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send Request'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Deactivate Account?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This will disable your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBusyAction}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivate}
              className="bg-red-500 hover:bg-red-600"
              disabled={isBusyAction}
            >
              {isBusyAction ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Deactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showUnlockDialog} onOpenChange={setShowUnlockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Quick Date-Unlock?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This ends your Date-Lock via a server workflow, keeping both accounts consistent.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBusyAction}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleUnlock}
              className="bg-red-500 hover:bg-red-600"
              disabled={isBusyAction}
            >
              <span className="inline-flex items-center gap-2">
                {isBusyAction ? <Loader2 className="h-4 w-4 animate-spin" /> : <Unlock className="h-4 w-4" />}
                Date-Unlock
              </span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}