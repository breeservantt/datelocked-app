import React from "react";
import { LockKeyhole, Fingerprint, Loader2 } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { useLocation } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { isBiometricAvailable, verifyBiometric } from "@/lib/biometrics";

const PUBLIC_PATHS = new Set([
  "/", "/splash", "/landing", "/login", "/signup", "/auth/callback",
  "/onboarding", "/terms", "/privacy", "/refunds", "/security",
]);

export default function PinLock({ children }) {
  const location = useLocation();
  const currentPath = location.pathname.replace(/\/+$/, "") || "/";
  const isPublicPage = PUBLIC_PATHS.has(currentPath);

  const [checking, setChecking] = React.useState(false);
  const [locked, setLocked] = React.useState(false);
  const [pinEnabled, setPinEnabled] = React.useState(false);
  const [biometricEnabled, setBiometricEnabled] = React.useState(false);
  const [pin, setPin] = React.useState("");
  const [error, setError] = React.useState("");
  const [verifying, setVerifying] = React.useState(false);
  const [biometricAttempted, setBiometricAttempted] = React.useState(false);
  const [securityCheckFailed, setSecurityCheckFailed] = React.useState(false);

  const busyRef = React.useRef(false);
  const lastBackgroundRef = React.useRef(null);
  const biometricRef = React.useRef(false);
  const pinEnabledRef = React.useRef(false);
  const authenticatedRef = React.useRef(false);
  const biometricPromptStarted = React.useRef(false);
  const checkedUserRef = React.useRef(null);
  const unlockedUserRef = React.useRef(null);
  const requestIdRef = React.useRef(0);

  const unlock = React.useCallback(() => {
    unlockedUserRef.current = checkedUserRef.current;
    setLocked(false);
    setPin("");
    setError("");
    setBiometricAttempted(false);
    biometricPromptStarted.current = false;
  }, []);

  const attemptBiometric = React.useCallback(async () => {
    if (busyRef.current || !biometricRef.current) return;
    busyRef.current = true;
    setVerifying(true);
    setError("");
    try {
      if (!(await isBiometricAvailable())) {
        throw new Error("Biometric authentication is unavailable.");
      }
      await verifyBiometric();
      unlock();
    } catch (e) {
      console.warn("Biometric verification failed:", e);
      setError(
        "Biometric verification was not completed. Try again" +
          (pinEnabledRef.current ? " or use your PIN." : ".")
      );
      setBiometricAttempted(true);
    } finally {
      busyRef.current = false;
      setVerifying(false);
    }
  }, [unlock]);

  const checkLockStatus = React.useCallback(async () => {
    const requestId = ++requestIdRef.current;
    const isCurrent = () => requestId === requestIdRef.current;
    const startTime = performance.now();
    setChecking(true);
    setSecurityCheckFailed(false);
    setError("");

    try {
      const { data: { session }, error: authError } =
  await supabase.auth.getSession();

if (!isCurrent()) return;

if (authError) {
  if (authError.name === "AuthSessionMissingError") {
    checkedUserRef.current = null;
    unlockedUserRef.current = null;
    authenticatedRef.current = false;
    pinEnabledRef.current = false;
    biometricRef.current = false;

    setPinEnabled(false);
    setBiometricEnabled(false);
    setLocked(false);
    setSecurityCheckFailed(false);
    setError("");
    return;
  }

  throw authError;
}

      const user = session?.user;
      if (!user) {
        checkedUserRef.current = null;
        unlockedUserRef.current = null;
        authenticatedRef.current = false;
        pinEnabledRef.current = false;
        biometricRef.current = false;
        setPinEnabled(false);
        setBiometricEnabled(false);
        setLocked(false);
        setSecurityCheckFailed(false);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("pin_enabled")
        .eq("id", user.id)
        .maybeSingle();
      if (profileError) throw profileError;
      if (!isCurrent()) return;

      // No profile is normal for a user who has not finished onboarding.
      const hasPin = Boolean(profile?.pin_enabled);
      const wantsBiometric =
        Capacitor.isNativePlatform() &&
        localStorage.getItem(`datelocked.biometricEnabled.${user.id}`) === "true";
      const hasBiometric = wantsBiometric && (await isBiometricAvailable());
      if (!isCurrent()) return;

      const accountChanged = checkedUserRef.current !== user.id;
      checkedUserRef.current = user.id;
      authenticatedRef.current = true;
      pinEnabledRef.current = hasPin;
      biometricRef.current = hasBiometric;
      setPinEnabled(hasPin);
      setBiometricEnabled(hasBiometric);
      if (accountChanged) {
        unlockedUserRef.current = null;
        biometricPromptStarted.current = false;
        setBiometricAttempted(false);
        setPin("");
      }
      // Refreshing a session must not relock an already-unlocked user.
      setLocked((hasPin || hasBiometric) && unlockedUserRef.current !== user.id);
      setSecurityCheckFailed(false);
    } catch (e) {
      if (!isCurrent()) return;
      console.error("App lock check failed:", e);
      // Do not bypass PIN/biometric protection when security status is unknown.
      setSecurityCheckFailed(true);
      setLocked(true);
      setError("Unable to verify security settings. Please retry.");
    } finally {
      if (isCurrent()) {
        console.log("[PERFORMANCE] PinLock startup:", Math.round(performance.now() - startTime), "ms");
        setChecking(false);
      }
    }
  }, []);

  // Public pages never trigger the PIN security lookup. Protected routes do.
  React.useEffect(() => {
    if (isPublicPage) {
      ++requestIdRef.current;
      setChecking(false);
      return;
    }
    void checkLockStatus();
  }, [isPublicPage, checkLockStatus]);

  React.useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        ++requestIdRef.current;
        checkedUserRef.current = null;
        unlockedUserRef.current = null;
        authenticatedRef.current = false;
        pinEnabledRef.current = false;
        biometricRef.current = false;
        setPinEnabled(false);
        setBiometricEnabled(false);
        setLocked(false);
        setSecurityCheckFailed(false);
        setChecking(false);
        setPin("");
        setError("");
        biometricPromptStarted.current = false;
        return;
      }
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        // Avoid calling Supabase APIs synchronously inside its auth callback.
        // The protected-route effect also checks when navigating from login.
        if (!isPublicPage) Promise.resolve().then(checkLockStatus);
      }
    });
    return () => subscription.unsubscribe();
  }, [checkLockStatus, isPublicPage]);

  React.useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let listener;
    let cancelled = false;
    App.addListener("appStateChange", ({ isActive }) => {
      if (!isActive) {
        lastBackgroundRef.current = Date.now();
        return;
      }
      const backgroundAt = lastBackgroundRef.current;
      lastBackgroundRef.current = null;
      if (
        backgroundAt && Date.now() - backgroundAt >= 30000 &&
        authenticatedRef.current &&
        (pinEnabledRef.current || biometricRef.current) &&
        !busyRef.current
      ) {
        unlockedUserRef.current = null;
        biometricPromptStarted.current = false;
        setBiometricAttempted(false);
        setLocked(true);
        setPin("");
        setError("");
      }
    }).then((handle) => {
      if (cancelled) void handle.remove();
      else listener = handle;
    }).catch((e) => console.error("App lock listener failed:", e));
    return () => {
      cancelled = true;
      void listener?.remove();
    };
  }, []);

  React.useEffect(() => {
    if (isPublicPage || checking || !locked || !biometricEnabled || securityCheckFailed) return;
    if (biometricPromptStarted.current) return;
    biometricPromptStarted.current = true;
    void attemptBiometric();
  }, [isPublicPage, checking, locked, biometricEnabled, securityCheckFailed, attemptBiometric]);

  const verifyPin = async () => {
    if (verifying) return;
    if (!/^\d{4,8}$/.test(pin)) {
      setError("Enter your 4–8 digit PIN.");
      return;
    }
    setVerifying(true);
    setError("");
    try {
      const { data, error: rpcError } = await supabase.rpc("verify_profile_pin", { input_pin: pin });
      if (rpcError) throw rpcError;
      if (!data) {
        setError("Incorrect PIN.");
        setPin("");
        return;
      }
      unlock();
    } catch (e) {
      console.error("PIN verification failed:", e);
      setError(e?.message || "Could not verify PIN.");
    } finally {
      setVerifying(false);
    }
  };

  if (isPublicPage) return children;

  if (checking) {
    return <div className="flex min-h-screen items-center justify-center bg-[#f7f1f4]"><Loader2 className="h-8 w-8 animate-spin text-slate-500" /></div>;
  }

  if (securityCheckFailed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f1f4] px-4">
        <div className="w-full max-w-[340px] rounded-[22px] bg-white p-6 text-center shadow-lg">
          <LockKeyhole className="mx-auto h-8 w-8 text-[#2f6df0]" />
          <h1 className="mt-4 text-xl font-semibold text-slate-900">Security Check</h1>
          <p className="mt-3 text-sm text-red-500">{error}</p>
          <button type="button" onClick={checkLockStatus} className="mt-5 h-11 w-full rounded-[14px] bg-[#2f6df0] text-sm font-semibold text-white">Retry Security Check</button>
        </div>
      </div>
    );
  }

  if (!locked) return children;
  if (biometricEnabled && !biometricAttempted && !error) {
    return <div className="min-h-screen bg-[#f7f1f4]" />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f1f4] px-4">
      <div className="w-full max-w-[340px] rounded-[22px] bg-white p-5 text-center shadow-[0_12px_30px_rgba(15,23,42,0.12)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[16px] bg-[#eaf3ff] text-[#2f6df0]">
          {biometricEnabled ? <Fingerprint className="h-7 w-7" /> : <LockKeyhole className="h-7 w-7" />}
        </div>
        <h1 className="mt-4 text-xl font-semibold text-slate-900">Unlock Date-Locked</h1>
        <p className="mt-1 text-sm text-slate-500">Verify your identity to continue.</p>
        {biometricEnabled && (
          <button type="button" onClick={attemptBiometric} disabled={verifying} className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-[#8ec5ff] to-[#a9bfff] text-sm font-semibold text-black disabled:opacity-60">
            {verifying ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Fingerprint className="h-5 w-5" />Retry Biometrics</>}
          </button>
        )}
        {pinEnabled && (
          <>
            <input type="password" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 8))} inputMode="numeric" autoComplete="off" className="mt-5 h-12 w-full rounded-[14px] border border-slate-200 bg-white text-center text-lg font-semibold tracking-[6px] text-slate-900 outline-none focus:border-[#8ec5ff]" placeholder="Enter PIN" onKeyDown={(e) => { if (e.key === "Enter") void verifyPin(); }} />
            <button type="button" onClick={verifyPin} disabled={verifying} className="mt-3 flex h-11 w-full items-center justify-center rounded-[14px] border border-slate-200 bg-white text-sm font-semibold text-slate-800 disabled:opacity-60">Unlock with PIN</button>
          </>
        )}
        {error && <p className="mt-3 text-sm font-medium text-red-500">{error}</p>}
      </div>
    </div>
  );
}
