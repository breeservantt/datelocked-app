import React from "react";
import { LockKeyhole, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function PinLock({ children }) {
  const [checking, setChecking] = React.useState(true);
  const [locked, setLocked] = React.useState(false);
  const [pin, setPin] = React.useState("");
  const [error, setError] = React.useState("");
  const [verifying, setVerifying] = React.useState(false);

  React.useEffect(() => {
    let alive = true;

    async function checkPinStatus() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          if (alive) setLocked(false);
          return;
        }

        const { data, error } = await supabase
          .from("profiles")
          .select("pin_enabled")
          .eq("id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (alive) setLocked(Boolean(data?.pin_enabled));
      } catch (e) {
        console.error("PIN check failed:", e);
        if (alive) setLocked(false);
      } finally {
        if (alive) setChecking(false);
      }
    }

    checkPinStatus();

    return () => {
      alive = false;
    };
  }, []);

  const verifyPin = async () => {
    if (!/^\d{4,8}$/.test(pin)) {
      setError("Enter your 4–8 digit PIN.");
      return;
    }

    setVerifying(true);
    setError("");

    try {
      const { data, error } = await supabase.rpc("verify_profile_pin", {
        input_pin: pin,
      });

      if (error) throw error;

      if (!data) {
        setError("Incorrect PIN.");
        setPin("");
        return;
      }

      setLocked(false);
      setPin("");
    } catch (e) {
      console.error("PIN verify failed:", e);
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

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f1f4] px-4">
      <div className="w-full max-w-[340px] rounded-[22px] bg-white p-5 text-center shadow-[0_12px_30px_rgba(15,23,42,0.12)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[16px] bg-[#eaf3ff] text-[#2f6df0]">
          <LockKeyhole className="h-7 w-7" />
        </div>

        <h1 className="mt-4 text-xl font-semibold text-slate-900">
          Enter PIN
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Unlock Date-Locked to continue.
        </p>

        <input
          value={pin}
          onChange={(e) =>
            setPin(e.target.value.replace(/\D/g, "").slice(0, 8))
          }
          inputMode="numeric"
          autoFocus
          className="mt-5 h-12 w-full rounded-[14px] border border-slate-200 bg-white text-center text-lg font-semibold tracking-[6px] text-slate-900 outline-none focus:border-[#8ec5ff] focus:ring-2 focus:ring-[#8ec5ff]/30"
          placeholder="••••"
          onKeyDown={(e) => {
            if (e.key === "Enter") verifyPin();
          }}
        />

        {error ? (
          <p className="mt-3 text-sm font-medium text-red-500">{error}</p>
        ) : null}

        <button
          type="button"
          onClick={verifyPin}
          disabled={verifying}
          className="mt-5 flex h-11 w-full items-center justify-center rounded-[14px] bg-gradient-to-r from-[#8ec5ff] to-[#a9bfff] text-sm font-semibold text-black shadow-[0_4px_12px_rgba(142,197,255,0.28)] disabled:opacity-60"
        >
          {verifying ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            "Unlock"
          )}
        </button>
      </div>
    </div>
  );
}