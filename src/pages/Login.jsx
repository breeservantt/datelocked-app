import React from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, Mail, LockKeyhole, Chrome } from "lucide-react";

const createPageUrl = (pageName) => {
  const routes = {
    Home: "/",
    Terms: "/terms",
    Privacy: "/privacy",
  };

  return routes[pageName] || `/${pageName.toLowerCase()}`;
};

export default function Login() {
  const [email, setEmail] = React.useState("");
  const [acceptedTerms, setAcceptedTerms] = React.useState(false);
  const [isEmailLoading, setIsEmailLoading] = React.useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");

  const TERMS_URL = createPageUrl("Terms");
  const PRIVACY_URL = createPageUrl("Privacy");

  const clearFeedback = () => {
    setMessage("");
    setError("");
  };

  const validateBeforeLogin = () => {
    clearFeedback();

    if (!acceptedTerms) {
      setError("You must accept the Terms and Conditions before continuing.");
      return false;
    }

    return true;
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();

    if (!validateBeforeLogin()) return;

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    setIsEmailLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: cleanEmail,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });

      if (error) throw error;

      setMessage("We sent you a login link or OTP email. Please check your inbox.");
      setEmail("");
    } catch (err) {
      console.error("Email login failed:", err);
      setError(err.message || "Could not send login email.");
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    if (!validateBeforeLogin()) return;

    setIsGoogleLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });

      if (error) throw error;
    } catch (err) {
      console.error("Google login failed:", err);
      setError(err.message || "Could not continue with Google.");
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-pink-50 px-4 py-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-sm items-center justify-center">
        <Card className="w-full rounded-3xl border-0 bg-white p-6 shadow-xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 shadow-md">
              <LockKeyhole className="h-7 w-7 text-white" />
            </div>

            <h1 className="text-2xl font-bold text-slate-800">DateLocked</h1>
            <p className="mt-2 text-sm text-slate-500">
              Sign in to continue to your relationship space
            </p>
          </div>

          <div className="space-y-4">
            <Button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || isEmailLoading}
              variant="outline"
              className="h-12 w-full rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50"
            >
              {isGoogleLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Chrome className="mr-2 h-4 w-4" />
              )}
              Continue with Google
            </Button>

            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs font-medium uppercase tracking-wide text-slate-400">
                or
              </span>
              <Separator className="flex-1" />
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error || message) clearFeedback();
                    }}
                    className="h-12 rounded-xl border-slate-200 pl-10"
                    disabled={isEmailLoading || isGoogleLoading}
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={isEmailLoading || isGoogleLoading}
                className="h-12 w-full rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:from-rose-600 hover:to-pink-600"
              >
                {isEmailLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  "Continue with Email"
                )}
              </Button>
            </form>

            {error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            {message ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {message}
              </div>
            ) : null}
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 p-4">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => {
                  setAcceptedTerms(e.target.checked);
                  if (error) setError("");
                }}
                className="mt-1 h-4 w-4 rounded border-slate-300 text-rose-500 focus:ring-rose-500"
              />
              <span className="text-xs leading-5 text-slate-600">
                I agree to the{" "}
                <Link to={TERMS_URL} className="font-medium text-rose-600 hover:underline">
                  Terms and Conditions
                </Link>{" "}
                and{" "}
                <Link to={PRIVACY_URL} className="font-medium text-rose-600 hover:underline">
                  Privacy Policy
                </Link>.
              </span>
            </label>
          </div>
        </Card>
      </div>
    </div>
  );
}