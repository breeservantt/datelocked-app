
import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarCheck,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function Landing() {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setErrorMessage("");

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            prompt: "select_account",
          },
        },
      });

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
      }
    } catch {
      setErrorMessage(
        "Unable to start Google sign-in. Please try again."
      );
      setLoading(false);
    }
  };

  const features = [
    {
      icon: ShieldCheck,
      title: "Verify",
      description: "Tools for greater trust and transparency.",
    },
    {
      icon: CalendarCheck,
      title: "Plan",
      description: "Organise dates and shared experiences.",
    },
    {
      icon: LockKeyhole,
      title: "Commit",
      description: "Lock your relationship when both are ready.",
    },
  ];

  return (
    <div
      id="top"
      className="min-h-[100svh] overflow-x-clip bg-[#f7f1f4] text-slate-800"
    >
      <div className="mx-auto flex min-h-[100svh] w-full max-w-[480px] flex-col px-5 pb-4 pt-3 sm:px-7 sm:pt-5">
        {/* Header */}
        <header className="flex items-center justify-between gap-3">
          <a href="#top" className="flex min-w-0 items-center gap-2">
            <img
              src="/Datelocked%20Logo.png"
              alt="Date-Locked Logo"
              className="h-10 w-10 shrink-0 object-contain"
            />
            <span className="truncate text-lg font-extrabold tracking-tight text-slate-900">
              Date-Locked
            </span>
          </a>

          <Link
            to="/login"
            className="shrink-0 rounded-full border border-[#2f6df0]/30 px-4 py-2 text-sm font-bold text-[#2f6df0] transition hover:bg-blue-50"
          >
            Log In
          </Link>
        </header>

        {/* Main content */}
        <main className="flex flex-1 flex-col justify-center py-5">
          <section className="text-center">
            <div className="mx-auto mb-4 flex h-[104px] w-[104px] items-center justify-center rounded-[30px] border border-white bg-white/80 shadow-lg shadow-blue-100/60">
              <img
                src="/Datelocked%20Logo.png"
                alt=""
                aria-hidden="true"
                className="h-[84px] w-[84px] object-contain"
              />
            </div>

            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-3 py-1.5 text-xs font-semibold text-[#2f6df0]">
              <ShieldCheck size={15} />
              Dating with clarity and trust
            </div>

            <h1 className="mx-auto max-w-sm text-3xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-4xl">
              What Is Date-Locked?
            </h1>

            <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-600">
              Date Locked is a relationship verification and social experience mobile application designed to promote honesty,
              commitment, and transparency between romantic partners. The app allows couples to mutually confirm and lock
              their relationship status using secure verification methods, while also enabling them to document and share their
              relationship journey with trusted audiences.
            </p>

            {/* Google sign-in */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="mx-auto mt-5 inline-flex min-h-12 w-full max-w-sm items-center justify-center gap-3 rounded-full bg-[#2f6df0] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200/60 transition hover:bg-[#245bd0] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <span className="animate-pulse">
                  Connecting...
                </span>
              ) : (
                <>
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 48 48"
                    className="h-5 w-5 shrink-0 rounded-full bg-white p-0.5"
                  >
                    <path
                      fill="#4285F4"
                      d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.6c3.9-3.6 6.1-8.8 6.1-15Z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.6-5.1c-1.8 1.2-4.1 1.9-6.9 1.9-5.3 0-9.8-3.6-11.4-8.4H5.8v5.3A20 20 0 0 0 24 44Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M12.6 27.6a12 12 0 0 1 0-7.2v-5.3H5.8a20 20 0 0 0 0 17.8l6.8-5.3Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M24 12c3 0 5.7 1 7.8 3.1l5.8-5.8C34.1 6.1 29.5 4 24 4A20 20 0 0 0 5.8 15.1l6.8 5.3C14.2 15.6 18.7 12 24 12Z"
                    />
                  </svg>
                  Continue with Google
                  <ArrowRight size={17} />
                </>
              )}
            </button>

            {errorMessage && (
              <p
                role="alert"
                className="mx-auto mt-3 max-w-sm break-words text-sm text-red-600"
              >
                {errorMessage}
              </p>
            )}

            <p className="mt-3 text-xs text-slate-500">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-bold text-[#2f6df0] underline underline-offset-2"
              >
                Log in
              </Link>
            </p>
          </section>

          {/* Compact feature cards */}
          <section
            aria-label="Date-Locked features"
            className="mt-6 grid grid-cols-3 gap-2"
          >
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  key={feature.title}
                  className="min-w-0 rounded-2xl border border-white bg-white/80 px-2 py-3 text-center shadow-sm"
                >
                  <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-xl bg-blue-100 text-[#2f6df0]">
                    <Icon size={19} />
                  </div>

                  <h2 className="mt-2 text-sm font-extrabold text-slate-900">
                    {feature.title}
                  </h2>

                  <p className="mt-1 text-[11px] leading-4 text-slate-600">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </section>

          {/* Short privacy statement */}
          <p className="mx-auto mt-4 max-w-sm text-center text-xs leading-5 text-slate-500">
            Google sign-in authenticates your account; it
            does not independently verify your real-world
            identity.{" "}
            <Link
              to="/privacy"
              className="font-semibold text-[#2f6df0] underline underline-offset-2"
            >
              Privacy Policy
            </Link>
          </p>
        </main>

        {/* Compact footer */}
        <footer className="border-t border-slate-200/80 pt-3">
          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-xs font-medium text-slate-500"
          >
            <Link
              to="/terms"
              className="hover:text-[#2f6df0]"
            >
              Terms
            </Link>

            <a
              href="mailto:support@datelocked.app"
              className="hover:text-[#2f6df0]"
            >
              Support
            </a>
          </nav>

          <p className="mt-2 text-center text-[10px] text-slate-400">
            © 2026 Date-Locked. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  );
}