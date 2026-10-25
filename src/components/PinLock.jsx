import React from "react";
import { LockKeyhole, Fingerprint, Loader2 } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { App } from "@capacitor/app";
import { supabase } from "@/lib/supabase";
import {
  isBiometricAvailable,
  verifyBiometric,
} from "@/lib/biometrics";

export default function PinLock({ children }) {
  const [checking, setChecking] = React.useState(true);
  const [locked, setLocked] = React.useState(false);
  const [pinEnabled, setPinEnabled] = React.useState(false);
  const [biometricEnabled, setBiometricEnabled] = React.useState(false);
  const [pin, setPin] = React.useState("");
  const [error, setError] = React.useState("");
  const [verifying, setVerifying] = React.useState(false);
  const [biometricAttempted, setBiometricAttempted] = React.useState(false);

  const busyRef = React.useRef(false);
  const lastBackgroundRef = React.useRef(null);
  const biometricRef = React.useRef(false);
  const pinEnabledRef = React.useRef(false);
  const authenticatedRef = React.useRef(false);
  const biometricPromptStarted = React.useRef(false);

  const unlock = React.useCallback(() => {
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
      const available = await isBiometricAvailable();

      if (!available) {
        throw new Error(
          "Biometric authentication is unavailable."
        );
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

  React.useEffect(() => {
    let alive = true;

    async function checkLockStatus() {
    const startTime = performance.now();

    try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;

        if (!user) {
          authenticatedRef.current = false;

          if (alive) {
            setLocked(false);
          }

          return;
        }

        authenticatedRef.current = true;

        const { data, error } = await supabase
          .from("profiles")
          .select("pin_enabled")
          .eq("id", user.id)
          .maybeSingle();

        if (error) throw error;

        const hasPin = Boolean(data?.pin_enabled);

        const wantsBiometric =
          Capacitor.isNativePlatform() &&
          localStorage.getItem(
            `datelocked.biometricEnabled.${user.id}`
          ) === "true";

        const hasBiometric =
          wantsBiometric && (await isBiometricAvailable());

        if (!alive) return;

        pinEnabledRef.current = hasPin;
        biometricRef.current = hasBiometric;

        setPinEnabled(hasPin);
        setBiometricEnabled(hasBiometric);
        setLocked(hasPin || hasBiometric);
      } catch (e) {
        console.error("App lock check failed:", e);

        if (alive) {
          setLocked(true);
          setError(
            "Unable to verify security settings. Please try again."
          );
        }
      } finally {
  console.log(
    "[PERFORMANCE] PinLock startup:",
    Math.round(performance.now() - startTime),
    "ms"
  );

        if (alive) setChecking(false);
    }
  }

  checkLockStatus();

    return () => {
      alive = false;
    };
  }, []);

  React.useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let listener;
    let cancelled = false;

    async function registerListener() {
      listener = await App.addListener(
        "appStateChange",
        ({ isActive }) => {
          if (!isActive) {
            lastBackgroundRef.current = Date.now();
            return;
          }

          const backgroundAt = lastBackgroundRef.current;
          lastBackgroundRef.current = null;

          if (
            backgroundAt &&
            Date.now() - backgroundAt >= 30000 &&
            authenticatedRef.current &&
            (pinEnabledRef.current || biometricRef.current) &&
            !busyRef.current
          ) {
            biometricPromptStarted.current = false;
            setBiometricAttempted(false);
            setLocked(true);
            setPin("");
            setError("");
          }
        }
      );

      if (cancelled) {
        await listener.remove();
      }
    }

    registerListener().catch((e) => {
      console.error("App lock listener failed:", e);
    });

    return () => {
      cancelled = true;
      listener?.remove();
    };
  }, []);

  React.useEffect(() => {
    if (checking || !locked || !biometricEnabled) return;
    if (biometricPromptStarted.current) return;

    biometricPromptStarted.current = true;

    attemptBiometric();
  }, [checking, locked, biometricEnabled, attemptBiometric]);

  const verifyPin = async () => {
    if (verifying) return;

    if (!/^\d{4,8}$/.test(pin)) {
      setError("Enter your 4–8 digit PIN.");
      return;
    }

    setVerifying(true);
    setError("");

    try {
      const { data, error } = await supabase.rpc(
        "verify_profile_pin",
        { input_pin: pin }
      );

      if (error) throw error;

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

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f1f4]">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  if (!locked) return children;

  // Hide the custom card while Android is handling
  // the initial automatic biometric verification.
  if (
    biometricEnabled &&
    !biometricAttempted &&
    !error
  ) {
    return (
      <div className="min-h-screen bg-[#f7f1f4]" />
    );
  }

  // Keep a recovery interface if biometrics fail
  // or the user cancels the Android prompt.
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f1f4] px-4">
      <div className="w-full max-w-[340px] rounded-[22px] bg-white p-5 text-center shadow-[0_12px_30px_rgba(15,23,42,0.12)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[16px] bg-[#eaf3ff] text-[#2f6df0]">
          {biometricEnabled ? (
            <Fingerprint className="h-7 w-7" />
          ) : (
            <LockKeyhole className="h-7 w-7" />
          )}
        </div>

        <h1 className="mt-4 text-xl font-semibold text-slate-900">
          Unlock Date-Locked
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Verify your identity to continue.
        </p>

        {biometricEnabled && (
          <button
            type="button"
            onClick={attemptBiometric}
            disabled={verifying}
            className="mt-5 flex h-11 w-full items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-[#8ec5ff] to-[#a9bfff] text-sm font-semibold text-black disabled:opacity-60"
          >
            {verifying ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Fingerprint className="h-5 w-5" />
                Retry Biometrics
              </>
            )}
          </button>
        )}

        {pinEnabled && (
          <>
            <input
              type="password"
              value={pin}
              onChange={(e) =>
                setPin(
                  e.target.value.replace(/\D/g, "").slice(0, 8)
                )
              }
              inputMode="numeric"
              autoComplete="off"
              className="mt-5 h-12 w-full rounded-[14px] border border-slate-200 bg-white text-center text-lg font-semibold tracking-[6px] text-slate-900 outline-none focus:border-[#8ec5ff]"
              placeholder="Enter PIN"
              onKeyDown={(e) => {
                if (e.key === "Enter") verifyPin();
              }}
            />

            <button
              type="button"
              onClick={verifyPin}
              disabled={verifying}
              className="mt-3 flex h-11 w-full items-center justify-center rounded-[14px] border border-slate-200 bg-white text-sm font-semibold text-slate-800 disabled:opacity-60"
            >
              Unlock with PIN
            </button>
          </>
        )}

        {error && (
          <p className="mt-3 text-sm font-medium text-red-500">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
