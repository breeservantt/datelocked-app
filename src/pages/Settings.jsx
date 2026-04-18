import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
      biometric_enabled: false,
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
    async invoke(name) {
      switch (name) {
        case 'webauthnBeginRegistration':
          return {
            publicKey: {
              challenge: 'dGVzdC1jaGFsbGVuZ2U',
              rp: { name: 'Date-Locked' },
              user: {
                id: 'dXNlci0x',
                name: 'you@example.com',
                displayName: 'Your Name',
              },
              pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
              timeout: 60000,
              attestation: 'none',
            },
          };
        default:
          return { success: true };
      }
    },
  },
};

/* -----------------------
   WebAuthn helpers
------------------------ */
function base64urlToUint8Array(base64url) {
  const pad = '='.repeat((4 - (base64url.length % 4)) % 4);
  const base64 = (base64url + pad).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

function uint8ArrayToBase64url(bytes) {
  let str = '';
  bytes.forEach((b) => (str += String.fromCharCode(b)));
  const base64 = btoa(str);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function normalizeCredentialForServer(cred) {
  return {
    id: cred.id,
    type: cred.type,
    rawId: uint8ArrayToBase64url(new Uint8Array(cred.rawId)),
    response: {
      clientDataJSON: uint8ArrayToBase64url(new Uint8Array(cred.response.clientDataJSON)),
      attestationObject: cred.response.attestationObject
        ? uint8ArrayToBase64url(new Uint8Array(cred.response.attestationObject))
        : null,
      authenticatorData: cred.response.authenticatorData
        ? uint8ArrayToBase64url(new Uint8Array(cred.response.authenticatorData))
        : null,
      signature: cred.response.signature
        ? uint8ArrayToBase64url(new Uint8Array(cred.response.signature))
        : null,
      userHandle: cred.response.userHandle
        ? uint8ArrayToBase64url(new Uint8Array(cred.response.userHandle))
        : null,
    },
  };
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
  const [biometricEnabled, setBiometricEnabled] = React.useState(false);
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
    setBiometricEnabled(Boolean(u?.biometric_enabled));
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

  const webauthnSupported = typeof window !== 'undefined' && !!window.PublicKeyCredential;
  const secureContext = typeof window !== 'undefined' ? window.isSecureContext : false;

  const extractPublicKeyOptions = (begin) => {
    return (
      begin?.data?.publicKey ||
      begin?.publicKey ||
      (begin?.data && begin?.data?.challenge ? begin.data : null) ||
      (begin?.challenge ? begin : null) ||
      null
    );
  };

  const enableBiometric = async () => {
    const ok = window.confirm(
      'Enable Biometric/Passkey sign-in?\n\nYour device handles biometrics. Date-Locked does not store your fingerprint/face data.'
    );
    if (!ok) return;

    if (!webauthnSupported) {
      alert('This browser/device does not support passkeys (WebAuthn).');
      return;
    }

    if (!secureContext) {
      alert('Passkeys require HTTPS (secure context). Open the app on HTTPS / in a secure environment.');
      return;
    }

    setIsAuthSaving(true);
    try {
      const begin = await safeInvoke('webauthnBeginRegistration', {});
      const opts = extractPublicKeyOptions(begin);

      if (!opts?.challenge || !opts?.rp || !opts?.user) {
        alert('Biometric setup is not configured correctly on the server.');
        return;
      }

      const publicKey = {
        ...opts,
        challenge: base64urlToUint8Array(opts.challenge),
        user: { ...opts.user, id: base64urlToUint8Array(opts.user.id) },
        excludeCredentials: Array.isArray(opts.excludeCredentials)
          ? opts.excludeCredentials.map((c) => ({ ...c, id: base64urlToUint8Array(c.id) }))
          : [],
      };

      const cred = await navigator.credentials.create({ publicKey });
      if (!cred) throw new Error('Passkey creation cancelled.');

      await safeInvoke('webauthnFinishRegistration', {
        credential: normalizeCredentialForServer(cred),
      });

      await settingsApi.updateMe({
        biometric_enabled: true,
        auth_preference: 'BIOMETRIC',
        biometric_enabled_at: new Date().toISOString(),
      });

      await refreshUser();
    } catch (e) {
      console.error(e);
      const name = e?.name;
      if (name === 'NotAllowedError') {
        alert('Passkey setup was cancelled or timed out. Please try again and complete the prompt.');
      } else if (name === 'InvalidStateError') {
        alert('A passkey already exists for this account/device. Try disabling then enabling again.');
      } else {
        const msg = getServerErrorMessage(e);
        const status = e?.response?.status;
        alert(status ? `Could not enable biometric/passkey (${status}): ${msg}` : `Could not enable biometric/passkey: ${msg}`);
      }
    } finally {
      setIsAuthSaving(false);
    }
  };

  const disableBiometric = async () => {
    setIsAuthSaving(true);
    try {
      await safeInvoke('webauthnDisable', {});
      await settingsApi.updateMe({
        biometric_enabled: false,
        auth_preference: pinEnabled ? 'PIN' : 'PASSWORD',
      });
      await refreshUser();
    } catch (e) {
      console.error(e);
      const msg = getServerErrorMessage(e);
      const status = e?.response?.status;
      alert(status ? `Could not disable biometric/passkey (${status}): ${msg}` : `Could not disable biometric/passkey: ${msg}`);
    } finally {
      setIsAuthSaving(false);
    }
  };

  const handleToggleBiometric = async (checked) => {
    if (isAuthSaving) return;
    if (checked) return enableBiometric();
    return disableBiometric();
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
        auth_preference: biometricEnabled ? 'BIOMETRIC' : 'PIN',
        pin_last_set_at: new Date().toISOString(),
      });

      setPinNew('');
      setPinConfirm('');
      await refreshUser();
    } catch (e) {
      console.error(e);
      const msg = getServerErrorMessage(e);
      const status = e?.response?.status;
      alert(status ? `Could not set PIN (${status}): ${msg}` : `Could not set PIN: ${msg}`);
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
          auth_preference: biometricEnabled ? 'BIOMETRIC' : 'PASSWORD',
        });
      } else {
        await settingsApi.updateMe({
          pin_enabled: true,
          auth_preference: biometricEnabled ? 'BIOMETRIC' : 'PIN',
        });
      }
      await refreshUser();
    } catch (e) {
      console.error(e);
      const msg = getServerErrorMessage(e);
      const status = e?.response?.status;
      alert(status ? `Could not update PIN setting (${status}): ${msg}` : `Could not update PIN setting: ${msg}`);
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

  const FolderRow = ({ icon: Icon, title, subtitle, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center">
          <Icon className="w-5 h-5 text-slate-600" />
        </div>
        <div>
          <p className="font-semibold text-slate-800">{title}</p>
          {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-slate-400" />
    </button>
  );

  const BackToFolders = () => (
    <div className="mb-3">
      <Button variant="outline" className="w-full" onClick={() => setOpenFolder(null)}>
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-rose-50 via-white to-pink-50">
        <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-rose-50 via-white to-pink-50 p-4">
        <Card className="max-w-md w-full p-8 text-center border-0 shadow-lg">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XIcon className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-slate-800 mb-2">Could not load Settings</h3>
          <p className="text-slate-600 mb-6">Please try again.</p>
          <Button onClick={() => window.location.reload()} className="bg-rose-500 hover:bg-rose-600">
            Retry
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-pink-50 pb-24">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center gap-3">
          <Link to={createPageUrl('Home')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-xl font-semibold text-slate-800">Settings</h1>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-6 space-y-6">
        {pendingTermination && (
          <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-4 border-0 shadow-lg bg-gradient-to-r from-red-50 to-rose-50">
              <div className="flex items-start gap-3 mb-3">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-slate-800 mb-1">Termination Request</p>
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
                  {isBusyAction ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm'}
                </Button>
                <Button
                  onClick={handleDeclineTermination}
                  disabled={isBusyAction}
                  variant="outline"
                  className="flex-1"
                >
                  {isBusyAction ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Decline'}
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
                subtitle="Biometric/passkey and PIN"
                onClick={() => setOpenFolder('security')}
              />

              <Card className="p-4 border-0 shadow-md">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-slate-600" />
                  <p className="font-semibold text-slate-800">Policies</p>
                </div>
                <p className="text-sm text-slate-500 mb-3">
                  Review how we handle privacy and security.
                </p>
                <div className="flex flex-col gap-2">
                  <Link to={PRIVACY_POLICY_URL} className="text-rose-600 hover:underline text-sm font-medium">
                    Privacy Policy
                  </Link>
                  <Link to={SECURITY_POLICY_URL} className="text-rose-600 hover:underline text-sm font-medium">
                    Security Policy
                  </Link>
                </div>
              </Card>
            </div>
          </motion.div>
        )}

        {openFolder === 'profile' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <BackToFolders />

            <Card className="p-6 border-0 shadow-md">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Profile</h2>

              <div className="flex justify-center mb-6">
                <div className="relative">
                  <Avatar className="w-24 h-24 border-4 border-white shadow-lg">
                    <AvatarImage src={formData.profile_photo} />
                    <AvatarFallback className="bg-gradient-to-br from-rose-100 to-pink-100 text-rose-500 text-2xl">
                      {formData.full_name?.[0] || <User className="w-8 h-8" />}
                    </AvatarFallback>
                  </Avatar>

                  <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:scale-105 transition-transform">
                    <Camera className="w-5 h-5 text-white" />
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
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Location</Label>
                  <div className="relative mt-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      value={formData.location}
                      onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div>
                  <Label>Email</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input value={user.email || ''} disabled className="pl-10 bg-slate-50" />
                  </div>
                </div>

                <div>
                  <Label>Date of Birth</Label>
                  <div className="relative mt-1">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      value={(() => {
                        const d = parseSafeDate(user?.date_of_birth);
                        return d ? format(d, 'MMM d, yyyy') : '';
                      })()}
                      disabled
                      className="pl-10 bg-slate-50"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
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
            <BackToFolders />

            <Card className="p-6 border-0 shadow-md">
              <h2 className="text-lg font-semibold text-slate-800 mb-1">Security</h2>
              <p className="text-sm text-slate-500 mb-4">
                Manage how you sign in. Passkeys require HTTPS and server verification.
              </p>

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Fingerprint className="w-5 h-5 text-slate-500" />
                  <div>
                    <p className="font-medium text-slate-800">Biometric / Passkey</p>
                    <p className="text-sm text-slate-500">
                      {!webauthnSupported
                        ? 'Not supported on this device'
                        : !secureContext
                        ? 'Requires HTTPS (secure context)'
                        : 'Supported on this device'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={biometricEnabled}
                  disabled={!webauthnSupported || !secureContext || isAuthSaving}
                  onCheckedChange={handleToggleBiometric}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <KeyRound className="w-5 h-5 text-slate-500" />
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
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Confirm</Label>
                      <Input
                        value={pinConfirm}
                        onChange={(e) => setPinConfirm(e.target.value.replace(/\D/g, '').slice(0, 8))}
                        placeholder="Repeat PIN"
                        inputMode="numeric"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <Button onClick={handleSetPin} disabled={isAuthSaving} className="w-full">
                    {isAuthSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Set / Update PIN'}
                  </Button>

                  <p className="text-xs text-slate-500">
                    PIN is stored securely as a server-side hash.
                  </p>
                </div>
              )}

              <Separator />

              <div className="pt-4 flex items-center justify-between">
                <span className="text-sm text-slate-600">Current preference</span>
                <span className="text-sm font-semibold text-slate-800">
                  {authPref === 'BIOMETRIC' ? 'Biometric' : authPref === 'PIN' ? 'PIN' : 'Password'}
                </span>
              </div>

              <div className="mt-5 p-4 rounded-xl border border-slate-200 bg-slate-50">
                <p className="text-sm font-semibold text-slate-800 mb-2">Policies</p>
                <div className="flex flex-col gap-2">
                  <Link to={PRIVACY_POLICY_URL} className="text-rose-600 hover:underline text-sm font-medium">
                    Privacy Policy
                  </Link>
                  <Link to={SECURITY_POLICY_URL} className="text-rose-600 hover:underline text-sm font-medium">
                    Security Policy
                  </Link>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {openFolder === null && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.06 }}>
            <Card className="p-6 border-0 shadow-md">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Insights</h2>

              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-slate-500" />
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
                    <Button variant="outline" className="w-full mt-3">
                      <Shield className="w-4 h-4 mr-2" />
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
            <Card className="p-6 border-0 shadow-md">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Relationship</h2>

              <div className="flex items-center justify-between mb-4">
                <span className="text-slate-600">Current Status</span>
                <StatusBadge status={user?.relationship_status} />
              </div>

              {user?.partner_email && (
                <div className="flex items-center justify-between mb-4">
                  <span className="text-slate-600">Partner</span>
                  <span className="font-medium text-slate-800">{user.partner_email}</span>
                </div>
              )}

              {user?.relationship_status === 'date_locked' && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setShowTerminationDialog(true)}
                    className="w-full text-red-500 border-red-200 hover:bg-red-50 mb-3"
                  >
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Request Termination (Needs Confirmation)
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setShowUnlockDialog(true)}
                    className="w-full text-amber-600 border-amber-200 hover:bg-amber-50"
                  >
                    <Unlock className="w-4 h-4 mr-2" />
                    Quick Date-Unlock
                  </Button>
                </>
              )}
            </Card>
          </motion.div>
        )}

        {openFolder === null && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
            <Card className="p-6 border-0 shadow-md">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-800">Archive</h2>
                <div className="flex items-center gap-2 text-sm text-slate-500">
                  <Archive className="w-4 h-4" />
                  <span>{archivedMemories.length} memories</span>
                </div>
              </div>

              {archivedMemories.length > 0 ? (
                <>
                  <Button variant="outline" onClick={() => setShowArchive((v) => !v)} className="w-full">
                    <Archive className="w-4 h-4 mr-2" />
                    {showArchive ? 'Hide' : 'View'} Archived Memories
                  </Button>

                  {showArchive && (
                    <div className="mt-4 space-y-3">
                      {archivedMemories.slice(0, 50).map((memory) => (
                        <div key={memory.id} className="flex gap-3 p-3 rounded-lg border border-slate-200 bg-slate-50">
                          {memory.photos?.[0] ? (
                            <img src={memory.photos[0]} alt="" className="w-16 h-16 rounded-lg object-cover" />
                          ) : (
                            <div className="w-16 h-16 bg-slate-200 rounded-lg flex items-center justify-center">
                              <ImageIcon className="w-6 h-6 text-slate-400" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-800 truncate">{memory.title}</p>
                            <p className="text-sm text-slate-500 truncate">{memory.description}</p>
                            {(() => {
                              const d = parseSafeDate(memory.date);
                              return d ? <p className="text-xs text-slate-400 mt-1">{format(d, 'MMM d, yyyy')}</p> : null;
                            })()}
                          </div>
                        </div>
                      ))}
                      {archivedMemories.length > 50 && (
                        <p className="text-xs text-slate-500 text-center">Showing latest 50.</p>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">No archived memories yet</p>
              )}
            </Card>
          </motion.div>
        )}

        {openFolder === null && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
            <Card className="p-6 border-0 shadow-md border-red-100">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Account</h2>

              <div className="bg-red-50 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="text-red-800 font-medium mb-1">Deactivate Account</p>
                    <p className="text-red-600">This will disable your account.</p>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                onClick={() => setShowDeactivateDialog(true)}
                className="w-full text-red-600 border-red-200 hover:bg-red-50"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Deactivate Account
              </Button>
            </Card>
          </motion.div>
        )}

        {openFolder === null && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Button variant="outline" onClick={handleLogout} className="w-full">
              <LogOut className="w-4 h-4 mr-2" />
              Log Out
            </Button>
          </motion.div>
        )}
      </div>

      <AlertDialog open={showTerminationDialog} onOpenChange={setShowTerminationDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
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
              {isBusyAction ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Request'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeactivateDialog} onOpenChange={setShowDeactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
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
              {isBusyAction ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Deactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showUnlockDialog} onOpenChange={setShowUnlockDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
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
                {isBusyAction ? <Loader2 className="w-4 h-4 animate-spin" /> : <Unlock className="w-4 h-4" />}
                Date-Unlock
              </span>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}