import React, { useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, KeyRound, User, Mail, Lock, ArrowRight, RefreshCw, Heart } from "lucide-react";

/**
 * Single streamlined flow:
 * 1) splash
 * 2) auth (sign in / sign up + google)
 * 3) otp verification
 * 4) legal agreement (no checkbox; links only)
 * 5) profile completion
 *
 * NOTE: You must wire the Base44 auth functions in the section marked "WIRE THIS".
 */

const TERMS_URL = "/terms"; // change if you have real routes
const PRIVACY_URL = "/privacy";
const REFUNDS_URL = "/refunds";

const TERMS_VERSION = "v1.0";
const PRIVACY_VERSION = "v1.0";
const REFUNDS_VERSION = "v1.0";

export default function OnboardingUnified() {
  const [step, setStep] = useState("splash"); // splash | legal | auth | otp | profile | done
  const [mode, setMode] = useState("signin"); // signin | signup

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");

  const [busy, setBusy] = useState(false);

  const canAuth = useMemo(() => {
    const e = email.trim();
    const p = password.trim();
    return e.length >= 5 && e.includes("@") && p.length >= 6;
  }, [email, password]);

  const canVerifyOtp = useMemo(() => otp.trim().length >= 4, [otp]);

  const canCompleteProfile = useMemo(() => {
    return fullName.trim().length >= 2 && username.trim().length >= 3;
  }, [fullName, username]);

  // Simple cooldown timer (client-side only)
  React.useEffect(() => {
    if (otpCooldown <= 0) return;
    const t = setInterval(() => setOtpCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [otpCooldown]);

  const safeGo = (next) => {
    // Prevent double transitions while busy
    if (busy) return;
    setStep(next);
  };

  async function handleStart() {
    safeGo("legal");
  }

  async function handleGoogle() {
    if (busy) return;
    setBusy(true);
    try {
      // ===== WIRE THIS =====
      // If Base44 supports Google sign-in, use the correct method your project has.
      // Common patterns you might have:
      // await base44.auth.signInWithGoogle();
      // or await base44.auth.oauth("google");
      if (typeof base44?.auth?.signInWithGoogle === "function") {
        await base44.auth.signInWithGoogle();
      } else if (typeof base44?.auth?.oauth === "function") {
        await base44.auth.oauth("google");
      } else {
        throw new Error("Google sign-in method not found in base44.auth. Please wire it to your project.");
      }
      toast.success("Signed in with Google");
      // If Google flow returns verified email, you may skip OTP; otherwise keep OTP step.
      safeGo("otp");
    } catch (e) {
      toast.error(e?.message || "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleEmailAuth() {
    if (!canAuth || busy) return;
    setBusy(true);
    try {
      const e = email.trim().toLowerCase();
      const p = password.trim();

      // ===== WIRE THIS =====
      // Replace these with the actual Base44 methods in your project.
      // Examples you might have:
      // - await base44.auth.signInWithEmail({ email: e, password: p })
      // - await base44.auth.signUpWithEmail({ email: e, password: p })
      // - await base44.auth.login({ email: e, password: p })
      // - await base44.auth.register({ email: e, password: p })

      if (mode === "signin") {
        if (typeof base44?.auth?.signInWithEmail === "function") {
          await base44.auth.signInWithEmail({ email: e, password: p });
        } else if (typeof base44?.auth?.login === "function") {
          await base44.auth.login({ email: e, password: p });
        } else {
          throw new Error("No email sign-in method found in base44.auth. Please wire it.");
        }
        toast.success("Signed in");
      } else {
        if (typeof base44?.auth?.signUpWithEmail === "function") {
          await base44.auth.signUpWithEmail({ email: e, password: p });
        } else if (typeof base44?.auth?.register === "function") {
          await base44.auth.register({ email: e, password: p });
        } else {
          throw new Error("No email sign-up method found in base44.auth. Please wire it.");
        }
        toast.success("Account created");
      }

      // Next: send OTP
      await sendOtp();
      safeGo("otp");
    } catch (e) {
      toast.error(e?.message || "Authentication failed");
    } finally {
      setBusy(false);
    }
  }

  async function sendOtp() {
    if (busy) return;
    if (otpCooldown > 0) return;

    setBusy(true);
    try {
      const e = email.trim().toLowerCase();

      // ===== WIRE THIS =====
      // You need a function that triggers an OTP email.
      // Depending on your backend/base44 setup, this could be:
      // - await base44.auth.sendEmailOtp({ email: e })
      // - await base44.auth.sendOtp({ email: e })
      // - await base44.functions.sendOtp({ email: e })
      // If you DON'T have it yet, you must implement it server-side (recommended).
      if (typeof base44?.auth?.sendEmailOtp === "function") {
        await base44.auth.sendEmailOtp({ email: e });
      } else if (typeof base44?.auth?.sendOtp === "function") {
        await base44.auth.sendOtp({ email: e });
      } else if (typeof base44?.functions?.sendOtp === "function") {
        await base44.functions.sendOtp({ email: e });
      } else {
        // If your platform uses "magic link" / "email code" by default, you can adapt this step.
        throw new Error("OTP send method not found. Add base44.auth.sendEmailOtp (or wire to your backend).");
      }

      setOtpSent(true);
      setOtp("");
      setOtpCooldown(30);
      toast.success("OTP sent to your email");
    } catch (e) {
      toast.error(e?.message || "Failed to send OTP");
    } finally {
      setBusy(false);
    }
  }

  async function verifyOtp() {
    if (!canVerifyOtp || busy) return;
    setBusy(true);
    try {
      const e = email.trim().toLowerCase();
      const code = otp.trim();

      // ===== WIRE THIS =====
      // Needs a method that verifies the OTP for the email.
      // Examples:
      // - await base44.auth.verifyEmailOtp({ email: e, code })
      // - await base44.auth.verifyOtp({ email: e, code })
      // - await base44.functions.verifyOtp({ email: e, code })
      if (typeof base44?.auth?.verifyEmailOtp === "function") {
        await base44.auth.verifyEmailOtp({ email: e, code });
      } else if (typeof base44?.auth?.verifyOtp === "function") {
        await base44.auth.verifyOtp({ email: e, code });
      } else if (typeof base44?.functions?.verifyOtp === "function") {
        await base44.functions.verifyOtp({ email: e, code });
      } else {
        throw new Error("OTP verify method not found. Add base44.auth.verifyEmailOtp (or wire to your backend).");
      }

      // Save legal acceptance now that we're verified
      if (typeof base44?.auth?.updateMe === "function") {
        await base44.auth.updateMe({
          legalAccepted: true,
          legalAcceptedAt: new Date().toISOString(),
          termsVersion: TERMS_VERSION,
          privacyVersion: PRIVACY_VERSION,
          refundsVersion: REFUNDS_VERSION,
        });
      }
      
      toast.success("Email verified");
      safeGo("profile");
    } catch (e) {
      toast.error(e?.message || "Invalid OTP code");
    } finally {
      setBusy(false);
    }
  }

  async function acceptLegalAndContinue() {
    // Just move to auth step - we'll save acceptance after they sign in
    safeGo("auth");
  }

  async function completeProfile() {
    if (!canCompleteProfile || busy) return;
    setBusy(true);
    try {
      if (typeof base44?.auth?.updateMe === "function") {
        await base44.auth.updateMe({
          full_name: fullName.trim(),
          username: username.trim(),
          onboarding_completed: true,
          onboardingCompletedAt: new Date().toISOString(),
        });
      } else {
        throw new Error("base44.auth.updateMe not found. Please wire user profile update.");
      }

      toast.success("Profile completed");
      safeGo("done");
    } catch (e) {
      toast.error(e?.message || "Failed to complete profile");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <AnimatePresence mode="wait">
          {step === "legal" && (
            <motion.div
              key="legal"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="rounded-2xl shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <Lock className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl">Welcome to Date-Locked</CardTitle>
                      <div className="text-xs text-muted-foreground">
                        Review our terms before continuing
                      </div>
                    </div>
                    <Badge variant="secondary" className="rounded-xl">
                      Terms
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-6 pt-4 space-y-4">
                  <div className="text-sm text-muted-foreground">
                    By continuing, you confirm you've read and agree to the documents below:
                  </div>

                  <div className="space-y-2">
                    <a className="block rounded-xl border p-3 hover:bg-muted transition" href={TERMS_URL} target="_blank" rel="noreferrer">
                      <div className="font-medium">Terms of Service</div>
                      <div className="text-xs text-muted-foreground">Version {TERMS_VERSION}</div>
                    </a>

                    <a className="block rounded-xl border p-3 hover:bg-muted transition" href={PRIVACY_URL} target="_blank" rel="noreferrer">
                      <div className="font-medium">Privacy Policy</div>
                      <div className="text-xs text-muted-foreground">Version {PRIVACY_VERSION}</div>
                    </a>

                    <a className="block rounded-xl border p-3 hover:bg-muted transition" href={REFUNDS_URL} target="_blank" rel="noreferrer">
                      <div className="font-medium">Refund Policy</div>
                      <div className="text-xs text-muted-foreground">Version {REFUNDS_VERSION}</div>
                    </a>
                  </div>

                  <Button
                    className="w-full rounded-xl"
                    onClick={acceptLegalAndContinue}
                    disabled={busy}
                  >
                    {busy ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="mr-2 h-4 w-4" />
                    )}
                    I agree & continue
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full rounded-xl"
                    onClick={() => safeGo("splash")}
                    disabled={busy}
                  >
                    Back
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === "splash" && (
            <motion.div
              key="splash"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="rounded-2xl shadow-md overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-32 h-32 bg-gradient-to-br from-rose-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                      <Heart className="w-16 h-16 text-white" />
                    </div>
                    <div className="space-y-1">
                      <div className="text-2xl font-semibold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">Date-Locked</div>
                      <div className="text-sm text-muted-foreground">
                        No More Heartbreaks
                      </div>
                    </div>
                    <div className="w-full pt-2">
                      <Button
                        className="w-full rounded-xl"
                        onClick={handleStart}
                      >
                        Get Started <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Secure dating with verification, clear terms, and control.
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === "auth" && (
            <motion.div
              key="auth"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="rounded-2xl shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <Lock className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl">
                        {mode === "signin" ? "Sign in" : "Create account"}
                      </CardTitle>
                      <div className="text-xs text-muted-foreground">
                        Welcome to Date-Locked
                      </div>
                    </div>
                    <Badge variant="secondary" className="rounded-xl">
                      {mode === "signin" ? "Returning" : "New"}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-6 pt-4 space-y-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-xl"
                    onClick={handleGoogle}
                    disabled={busy}
                  >
                    {busy ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Lock className="mr-2 h-4 w-4" />
                    )}
                    Continue with Google
                  </Button>

                  <div className="flex items-center gap-3">
                    <Separator className="flex-1" />
                    <span className="text-xs text-muted-foreground">or</span>
                    <Separator className="flex-1" />
                  </div>

                  <div className="space-y-3">
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-9 rounded-xl"
                        placeholder="Email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        autoComplete="email"
                      />
                    </div>

                    <div className="relative">
                      <KeyRound className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        className="pl-9 rounded-xl"
                        placeholder="Password (min 6)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        type="password"
                        autoComplete={mode === "signin" ? "current-password" : "new-password"}
                      />
                    </div>

                    {/* ✅ No checkbox. Replace with links. */}
                    <div className="text-xs text-muted-foreground">
                      By signing in or signing up you agree to the{" "}
                      <a className="underline" href={TERMS_URL} target="_blank" rel="noreferrer">
                        Terms
                      </a>{" "}
                      and{" "}
                      <a className="underline" href={PRIVACY_URL} target="_blank" rel="noreferrer">
                        Privacy Policy
                      </a>{" "}
                      (see{" "}
                      <a className="underline" href={REFUNDS_URL} target="_blank" rel="noreferrer">
                        Refunds
                      </a>
                      ).
                    </div>

                    <Button
                      className="w-full rounded-xl"
                      onClick={handleEmailAuth}
                      disabled={!canAuth || busy}
                    >
                      {busy ? (
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowRight className="mr-2 h-4 w-4" />
                      )}
                      {mode === "signin" ? "Sign in" : "Sign up"}
                    </Button>

                    <div className="flex items-center justify-between text-sm">
                      <button
                        type="button"
                        className="text-xs underline text-muted-foreground"
                        onClick={() => setMode((m) => (m === "signin" ? "signup" : "signin"))}
                        disabled={busy}
                      >
                        {mode === "signin" ? "New here? Create account" : "Already have an account? Sign in"}
                      </button>

                      <button
                        type="button"
                        className="text-xs underline text-muted-foreground"
                        onClick={() => toast.message("Hook this to your reset password flow in Base44.")}
                        disabled={busy}
                      >
                        Forgot your password?
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === "otp" && (
            <motion.div
              key="otp"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="rounded-2xl shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <Lock className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl">Verify your email</CardTitle>
                      <div className="text-xs text-muted-foreground">
                        Enter the OTP sent to <span className="font-medium">{email || "your email"}</span>
                      </div>
                    </div>
                    <Badge variant="secondary" className="rounded-xl">
                      OTP
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-6 pt-4 space-y-4">
                  <div className="space-y-2">
                    <Input
                      className="rounded-xl text-center tracking-widest text-lg"
                      placeholder="Enter OTP code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      inputMode="numeric"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        className="w-full rounded-xl"
                        onClick={sendOtp}
                        disabled={busy || otpCooldown > 0}
                      >
                        {otpCooldown > 0 ? `Resend in ${otpCooldown}s` : "Resend code"}
                      </Button>
                      <Button
                        className="w-full rounded-xl"
                        onClick={verifyOtp}
                        disabled={!canVerifyOtp || busy}
                      >
                        {busy ? (
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Shield className="mr-2 h-4 w-4" />
                        )}
                        Verify
                      </Button>
                    </div>
                  </div>

                  {!otpSent && (
                    <Button
                      variant="secondary"
                      className="w-full rounded-xl"
                      onClick={sendOtp}
                      disabled={busy}
                    >
                      Send OTP to email
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    className="w-full rounded-xl"
                    onClick={() => safeGo("legal")}
                    disabled={busy}
                  >
                    Back
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === "legal" && (
            <motion.div
              key="legal"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="rounded-2xl shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <Lock className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl">Legal agreement</CardTitle>
                      <div className="text-xs text-muted-foreground">
                        Review the links below — no checkbox required.
                      </div>
                    </div>
                    <Badge variant="secondary" className="rounded-xl">
                      Terms
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-6 pt-4 space-y-4">
                  <div className="text-sm text-muted-foreground">
                    By continuing, you confirm you’ve read and agree to the documents below:
                  </div>

                  <div className="space-y-2">
                    <a className="block rounded-xl border p-3 hover:bg-muted transition" href={TERMS_URL} target="_blank" rel="noreferrer">
                      <div className="font-medium">Terms of Service</div>
                      <div className="text-xs text-muted-foreground">Version {TERMS_VERSION}</div>
                    </a>

                    <a className="block rounded-xl border p-3 hover:bg-muted transition" href={PRIVACY_URL} target="_blank" rel="noreferrer">
                      <div className="font-medium">Privacy Policy</div>
                      <div className="text-xs text-muted-foreground">Version {PRIVACY_VERSION}</div>
                    </a>

                    <a className="block rounded-xl border p-3 hover:bg-muted transition" href={REFUNDS_URL} target="_blank" rel="noreferrer">
                      <div className="font-medium">Refund Policy</div>
                      <div className="text-xs text-muted-foreground">Version {REFUNDS_VERSION}</div>
                    </a>
                  </div>

                  <Button
                    className="w-full rounded-xl"
                    onClick={acceptLegalAndContinue}
                    disabled={busy}
                  >
                    {busy ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="mr-2 h-4 w-4" />
                    )}
                    I agree & continue
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full rounded-xl"
                    onClick={() => safeGo("auth")}
                    disabled={busy}
                  >
                    Back
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="rounded-2xl shadow-md">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <Lock className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-xl">Complete your profile</CardTitle>
                      <div className="text-xs text-muted-foreground">
                        This helps keep the community authentic.
                      </div>
                    </div>
                    <Badge variant="secondary" className="rounded-xl">
                      Profile
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="p-6 pt-4 space-y-3">
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9 rounded-xl"
                      placeholder="Full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>

                  <div className="relative">
                    <User className="absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      className="pl-9 rounded-xl"
                      placeholder="Username (min 3)"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>

                  <Button
                    className="w-full rounded-xl"
                    onClick={completeProfile}
                    disabled={!canCompleteProfile || busy}
                  >
                    {busy ? (
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowRight className="mr-2 h-4 w-4" />
                    )}
                    Finish setup
                  </Button>

                  <Button
                    variant="ghost"
                    className="w-full rounded-xl"
                    onClick={() => safeGo("otp")}
                    disabled={busy}
                  >
                    Back
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {step === "done" && (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.25 }}
            >
              <Card className="rounded-2xl shadow-md">
                <CardContent className="p-6">
                  <div className="flex flex-col items-center text-center gap-4">
                    <div className="w-24 h-24 bg-gradient-to-br from-rose-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                      <Heart className="w-12 h-12 text-white" />
                    </div>
                    <div className="text-2xl font-semibold">You’re all set</div>
                    <div className="text-sm text-muted-foreground">
                      Welcome to Date-Locked. Enjoy a safer dating experience.
                    </div>

                    <Button
                      className="w-full rounded-xl"
                      onClick={() => toast.message("Navigate to your app home page here.")}
                    >
                      Continue to app
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}