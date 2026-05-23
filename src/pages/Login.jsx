import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, LockKeyhole } from "lucide-react";
import DateLockedLogo from "@/components/DateLockedLogo";

export default function Login() {
  const navigate = useNavigate();
  const routingRef = React.useRef(false);

  const [mode, setMode] = React.useState("login");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const [isEmailLoading, setIsEmailLoading] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");

  const routeLoggedInUser = React.useCallback(
    async (currentUser) => {
      if (!currentUser?.id || routingRef.current) return;

      routingRef.current = true;

      const { data: profile } = await supabase
        .from("profiles")
        .select(
          "full_name, date_of_birth, gender, location, account_status, deactivated_at"
        )
        .eq("id", currentUser.id)
        .maybeSingle();

      const isDeactivated =
        profile?.account_status === "deactivated" ||
        Boolean(profile?.deactivated_at);

      if (isDeactivated) {
        await supabase.auth.signOut();
        routingRef.current = false;
        navigate("/login", { replace: true });
        return;
      }

      const profileComplete =
        profile?.full_name?.trim() &&
        profile?.date_of_birth &&
        profile?.gender &&
        profile?.location;

      navigate(profileComplete ? "/home" : "/onboarding", { replace: true });
    },
    [navigate]
  );

  React.useEffect(() => {
    let mounted = true;

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (mounted && session?.user) {
        await routeLoggedInUser(session.user);
      }
    };

    checkSession();

    return () => {
      mounted = false;
    };
  }, [routeLoggedInUser]);

  const handleGoogleLogin = async () => {
    setError("");
    setMessage("");
    setIsGoogleLoading(true);

    const { error: googleError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (googleError) {
      setError(googleError.message || "Could not continue with Google.");
      setIsGoogleLoading(false);
    }
  };

  const handleEmailAuth = async (e) => {
    e.preventDefault();

    if (isEmailLoading || isGoogleLoading || routingRef.current) return;

    setError("");
    setMessage("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !cleanEmail.includes("@")) {
      setError("Enter a valid email address.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setIsEmailLoading(true);

    try {
      if (mode === "signup") {
        const { data, error: signupError } = await supabase.auth.signUp({
          email: cleanEmail,
          password,
          options: {
            data: { full_name: "" },
          },
        });

        if (signupError) throw signupError;

        if (data?.session?.user) {
          await routeLoggedInUser(data.session.user);
        } else if (data?.user) {
          setMessage("Account created. Please sign in to continue.");
          setMode("login");
        }

        return;
      }

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (loginError) throw loginError;

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        await routeLoggedInUser(session.user);
      } else {
        setError("Login started, but session was not ready. Try again.");
      }
    } catch (err) {
      setError(err.message || "Authentication failed.");
      routingRef.current = false;
    } finally {
      setIsEmailLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f1f4] px-2 py-2">
      <div className="mx-auto w-full max-w-[375px] overflow-hidden rounded-[16px] bg-[#f8f4f7] shadow-[0_6px_18px_rgba(15,23,42,0.06)]">
        <div className="bg-gradient-to-b from-[#5e9cff] via-[#2f6df0] to-[#6aa7ff] px-6 pb-7 pt-5 text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-[28px] bg-white/18 shadow-[0_12px_28px_rgba(15,23,42,0.16)] backdrop-blur">
            <DateLockedLogo className="h-16 w-16" />
          </div>

          <h1 className="mt-3 text-[29px] font-black leading-none tracking-[-0.06em] text-white">
            Date-Locked
          </h1>

          <p className="mt-3 text-[14px] font-semibold text-white/85">
            {mode === "signup" ? "Create your love space" : "Welcome back"}
          </p>
        </div>

        <div className="px-4 pb-6 pt-6">
          <div className="rounded-[26px] border border-white/70 bg-white px-4 py-5 pb-16 shadow-[0_14px_34px_rgba(15,23,42,0.10)]">
            <div className="grid grid-cols-2 rounded-[18px] bg-[#eef3ff] p-1">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setError("");
                  setMessage("");
                }}
                className={`h-11 rounded-[15px] text-[14px] font-black transition ${
                  mode === "login"
                    ? "bg-gradient-to-r from-[#5e9cff] to-[#2f6df0] text-white shadow-[0_8px_18px_rgba(47,109,240,0.24)]"
                    : "text-slate-500"
                }`}
              >
                Log In
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode("signup");
                  setError("");
                  setMessage("");
                }}
                className={`h-11 rounded-[15px] text-[14px] font-black transition ${
                  mode === "signup"
                    ? "bg-gradient-to-r from-[#ff4d6d] to-[#e84393] text-white shadow-[0_8px_18px_rgba(232,67,147,0.24)]"
                    : "text-slate-500"
                }`}
              >
                Sign Up
              </button>
            </div>

            <Button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || isEmailLoading}
              className="mt-5 flex h-12 w-full items-center justify-center rounded-[16px] bg-white text-[14px] font-black text-[#172033] shadow-[0_8px_18px_rgba(15,23,42,0.08)] hover:bg-white"
            >
              {isGoogleLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <img
                  src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                  alt="Google"
                  className="mr-2 h-4 w-4"
                />
              )}
              Continue with Google
            </Button>

            <div className="my-5 flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200" />
              <span className="text-[10px] font-black uppercase tracking-wide text-slate-400">
                Email
              </span>
              <div className="h-px flex-1 bg-slate-200" />
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-3">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="h-12 rounded-[16px] border border-slate-200 bg-[#f5f7ff] pl-11 text-sm"
                  disabled={isEmailLoading || isGoogleLoading}
                />
              </div>

              <div className="relative">
                <LockKeyhole className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  className="h-12 rounded-[16px] border border-slate-200 bg-[#f5f7ff] pl-11 text-sm"
                  disabled={isEmailLoading || isGoogleLoading}
                />
              </div>

              <Button
                type="submit"
                disabled={isEmailLoading || isGoogleLoading}
                className="h-12 w-full rounded-[16px] bg-gradient-to-r from-[#5e9cff] via-[#2f6df0] to-[#6aa7ff] text-[15px] font-black text-white shadow-[0_10px_22px_rgba(47,109,240,0.25)]"
              >
                {isEmailLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : mode === "signup" ? (
                  "Create Account"
                ) : (
                  "Sign In"
                )}
              </Button>
            </form>

            {error ? (
              <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            {message ? (
              <div className="mt-4 rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
                {message}
              </div>
            ) : null}
          </div>

          <div className="mt-10 text-center text-[11px] text-slate-500">
            By continuing, you accept our{" "}
            <Link to="/terms" className="font-bold text-[#2f6df0]">
              Terms
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="font-bold text-[#2f6df0]">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}