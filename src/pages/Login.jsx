import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, Chrome } from "lucide-react";
import DateLockedLogo from "@/components/DateLockedLogo";

export default function Login() {
  const navigate = useNavigate();

  const [mode, setMode] = React.useState("landing");
  const [checkingSession, setCheckingSession] = React.useState(true);
  const [authUser, setAuthUser] = React.useState(null);

  const [email, setEmail] = React.useState("");
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const [isEmailLoading, setIsEmailLoading] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let alive = true;

    const checkSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (alive) {
          setAuthUser(data?.session?.user || null);
        }
      } catch (err) {
        console.error("Session check failed:", err);
        if (alive) setAuthUser(null);
      } finally {
        if (alive) setCheckingSession(false);
      }
    };

    checkSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setAuthUser(session?.user || null);

        if (session?.user) {
          navigate("/home", { replace: true });
        }
      }
    );

    return () => {
      alive = false;
      listener?.subscription?.unsubscribe();
    };
  }, [navigate]);

  const handleGoogleLogin = async () => {
    setError("");
    setMessage("");
    setIsGoogleLoading(true);

    try {
      const { error: googleError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/login`,
        },
      });

      if (googleError) throw googleError;
    } catch (err) {
      setError(err.message || "Could not continue with Google.");
      setIsGoogleLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();

    setError("");
    setMessage("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Enter your email address.");
      return;
    }

    setIsEmailLoading(true);

    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });

      if (otpError) throw otpError;

      setMessage("Login link sent. Check your email inbox.");
      setEmail("");
    } catch (err) {
      setError(err.message || "Could not send login email.");
    } finally {
      setIsEmailLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3edf1]">
        <Loader2 className="h-8 w-8 animate-spin text-[#5e9cff]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3edf1] px-5 py-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-[390px] flex-col rounded-[34px] bg-white px-5 py-7 shadow-[0_18px_45px_rgba(47,109,240,0.12)]">
        <div className="flex flex-1 flex-col justify-center">
          <div className="mb-8 text-center">
            <div className="mb-1 flex justify-center">
              <DateLockedLogo className="h-36 w-36" />
            </div>

            <h1 className="text-[42px] font-black leading-none tracking-[-0.07em] text-[#172033]">
              Date-Locked
            </h1>

            <p className="mt-4 text-lg font-medium text-[#172033]">
              Find the reason to stay in love
            </p>
          </div>

          <div className="mb-14 space-y-3">
            {authUser ? (
              <Button
                type="button"
                onClick={() => navigate("/home", { replace: true })}
                className="mx-auto flex h-11 w-[92%] items-center justify-center rounded-full bg-gradient-to-r from-[#8ec5ff] via-[#5e9cff] to-[#2f6df0] text-sm font-black text-white shadow-[0_8px_18px_rgba(47,109,240,0.24)]"
              >
                Continue to Home
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={isGoogleLoading || isEmailLoading}
                  className="mx-auto flex h-11 w-[92%] items-center justify-center rounded-full bg-gradient-to-r from-[#8ec5ff] via-[#5e9cff] to-[#2f6df0] text-sm font-black text-white shadow-[0_8px_18px_rgba(47,109,240,0.24)]"
                >
                  {isGoogleLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Chrome className="mr-2 h-4 w-4" />
                  )}
                  Sign in with Google
                </Button>

                <Button
                  type="button"
                  onClick={() => {
                    setMode(mode === "email" ? "landing" : "email");
                    setError("");
                    setMessage("");
                  }}
                  disabled={isGoogleLoading || isEmailLoading}
                  className="mx-auto flex h-11 w-[92%] items-center justify-center rounded-full bg-[#172033] text-sm font-black text-white hover:bg-[#172033]"
                >
                  Continue with Email
                </Button>

                {mode === "email" ? (
                  <form onSubmit={handleEmailLogin} className="space-y-3 pt-2">
                    <div className="relative mx-auto w-[92%]">
                      <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="h-11 rounded-full border-slate-200 pl-11 text-sm"
                        disabled={isEmailLoading || isGoogleLoading}
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isEmailLoading || isGoogleLoading}
                      className="mx-auto flex h-11 w-[92%] rounded-full border-2 border-[#5e9cff] bg-white text-sm font-black text-[#2f6df0] hover:bg-white"
                    >
                      {isEmailLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Send Login Link"
                      )}
                    </Button>
                  </form>
                ) : null}
              </>
            )}

            {error ? (
              <div className="mx-auto w-[92%] rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            {message ? (
              <div className="mx-auto w-[92%] rounded-2xl bg-blue-50 px-4 py-3 text-sm text-blue-700">
                {message}
              </div>
            ) : null}
          </div>
        </div>

        <div className="pb-2 text-center text-xs text-slate-500">
          By continuing, you accept our{" "}
          <Link to="/terms" className="underline">
            terms
          </Link>{" "}
          and{" "}
          <Link to="/privacy" className="underline">
            privacy policy
          </Link>
        </div>
      </div>
    </div>
  );
}