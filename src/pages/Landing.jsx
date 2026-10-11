
import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CalendarCheck,
  CheckCircle2,
  Heart,
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
      setErrorMessage("Unable to start Google sign-in. Please try again.");
      setLoading(false);
    }
  };

  const features = [
    {
      icon: ShieldCheck,
      title: "Mutual Verification",
      description:
        "Use verification tools and match codes to help confirm who you are connecting with.",
    },
    {
      icon: CalendarCheck,
      title: "Date Planning",
      description:
        "Plan dates together and keep your arrangements organised.",
    },
    {
      icon: LockKeyhole,
      title: "Relationship Locking",
      description:
        "Choose a shared relationship status when both partners are ready.",
    },
  ];

  return (
    <div
      id="top"
      className="min-h-screen overflow-x-hidden bg-[#f7f1f4] text-slate-800"
    >
      {/* Compact mobile header */}
      <header className="sticky top-0 z-40 border-b border-white/80 bg-[#f7f1f4]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-8 sm:py-4">
          <a href="#top" className="flex min-w-0 items-center gap-2.5">
            <img
              src="/Datelocked%20Logo.png"
              alt="Date-Locked Logo"
              className="h-10 w-10 shrink-0 rounded-xl object-contain sm:h-12 sm:w-12"
            />
            <span className="truncate text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">
              Date-Locked
            </span>
          </a>

          <nav className="flex shrink-0 items-center gap-3 text-sm font-semibold sm:gap-7">
            <a
              href="#features"
              className="hidden text-slate-600 transition hover:text-[#2f6df0] sm:inline"
            >
              Features
            </a>
            <Link
              to="/login"
              className="rounded-full border border-[#2f6df0]/25 px-4 py-2 text-[#2f6df0] transition hover:bg-blue-50 sm:px-5 sm:py-2.5"
            >
              Log In
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Compact landing screen */}
        <section className="relative px-4 pb-6 pt-5 sm:px-8 sm:pb-16 sm:pt-14">
          <div className="pointer-events-none absolute -right-20 -top-12 h-48 w-48 rounded-full bg-blue-200/40 blur-3xl sm:h-80 sm:w-80" />
          <div className="pointer-events-none absolute -bottom-8 -left-16 h-40 w-40 rounded-full bg-pink-200/40 blur-3xl sm:h-72 sm:w-72" />

          <div className="relative mx-auto grid max-w-6xl items-center gap-5 sm:gap-12 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="text-center lg:text-left">
              <div className="mx-auto mb-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/85 px-3 py-1.5 text-xs font-semibold text-[#2f6df0] sm:mx-0 sm:mb-6 sm:px-4 sm:py-2 sm:text-sm">
                <ShieldCheck size={16} />
                Dating with clarity and trust
              </div>

              <h1 className="mx-auto max-w-xl text-2xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-5xl lg:mx-0 lg:text-6xl">
                Build genuine connections with Date-Locked.
              </h1>

              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-600 sm:mt-6 sm:text-lg sm:leading-8 lg:mx-0">
                Explore verification tools, plan dates together, share
                experiences, and mark your relationship commitment when
                you're both ready.
              </p>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="mt-5 inline-flex min-h-12 w-full max-w-sm items-center justify-center gap-3 rounded-full bg-[#2f6df0] px-5 py-3 font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-[#245bd0] disabled:cursor-not-allowed disabled:opacity-60 sm:mt-8 sm:w-auto sm:px-7"
              >
                {loading ? (
                  <span className="animate-pulse">Connecting...</span>
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
                    Sign Up with Google
                  </>
                )}
              </button>

              {errorMessage && (
                <p
                  role="alert"
                  className="mx-auto mt-3 max-w-sm text-sm font-medium text-red-600 sm:mx-0"
                >
                  {errorMessage}
                </p>
              )}

              <p className="mt-3 text-xs leading-5 text-slate-500 sm:mt-4 sm:text-sm">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-bold text-[#2f6df0] underline underline-offset-2"
                >
                  Log in
                </Link>
              </p>
            </div>

            {/* Compact shared-space card */}
            <div className="mx-auto w-full max-w-sm">
              <div className="rounded-3xl border border-white bg-white/85 p-3 shadow-xl shadow-blue-100/60 sm:rounded-[2rem] sm:p-6">
                <div className="rounded-2xl bg-gradient-to-br from-[#5e9cff] via-[#2f6df0] to-[#6aa7ff] px-4 py-5 text-white sm:rounded-[1.5rem] sm:px-7 sm:py-8">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white/90">
                      Your shared space
                    </span>
                    <ShieldCheck size={22} />
                  </div>

                  <div className="my-4 flex items-center justify-center sm:my-7">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/40 bg-white/15 sm:h-24 sm:w-24">
                      <img
                        src="/Datelocked%20Logo.png"
                        alt="Date-Locked Logo"
                        className="h-12 w-12 object-contain sm:h-20 sm:w-20"
                      />
                    </div>
                  </div>

                  <h2 className="text-center text-xl font-extrabold sm:text-2xl">
                    Connect. Plan. Commit.
                  </h2>
                  <p className="mx-auto mt-2 max-w-xs text-center text-xs leading-5 text-white/90 sm:mt-3 sm:text-sm sm:leading-6">
                    Tools designed to help couples build their connection
                    with greater clarity.
                  </p>
                </div>

                <div className="mt-3 grid gap-2 px-1 py-1 sm:mt-5 sm:gap-3">
                  {[
                    "Mutual verification tools",
                    "Date planning and shared goals",
                    "A shared relationship status",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-2.5">
                      <CheckCircle2
                        size={17}
                        className="shrink-0 text-[#2f6df0]"
                      />
                      <span className="text-xs font-medium text-slate-700 sm:text-sm">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section
          id="features"
          className="scroll-mt-20 bg-white px-4 py-8 sm:px-8 sm:py-20"
        >
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#2f6df0] sm:text-sm">
                About the application
              </p>
              <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-950 sm:mt-4 sm:text-4xl">
                What is Date-Locked?
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 sm:mt-6 sm:text-base sm:leading-8">
                Date Locked is a relationship verification and social experience mobile application designed to promote honesty, commitment, and transparency between romantic partners. The app allows couples to mutually confirm and lock their relationship status using secure verification methods, while also enabling them to document and share their relationship journey with trusted audiences.
              </p>
            </div>

            <div className="mt-5 grid gap-3 sm:mt-12 sm:gap-5 md:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;

                return (
                  <article
                    key={feature.title}
                    className="rounded-2xl border border-slate-100 bg-[#f7f1f4]/65 p-4 sm:rounded-3xl sm:p-7"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-[#2f6df0] sm:h-12 sm:w-12 sm:rounded-2xl">
                      <Icon size={22} />
                    </div>

                    <h3 className="mt-3 text-base font-extrabold text-slate-900 sm:mt-5 sm:text-lg">
                      {feature.title}
                    </h3>

                    <p className="mt-2 text-sm leading-6 text-slate-600 sm:mt-3 sm:leading-7">
                      {feature.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Google sign-in information */}
        <section className="px-4 py-8 sm:px-8 sm:py-20">
          <div className="mx-auto grid max-w-6xl items-start gap-4 md:grid-cols-[0.8fr_1.2fr] md:gap-8">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-100 text-[#2f6df0] sm:h-14 sm:w-14 sm:rounded-2xl">
                <ShieldCheck size={25} />
              </div>

              <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950 sm:mt-5 sm:text-3xl">
                Why We Use Google Sign-In
              </h2>
            </div>

            <div className="rounded-2xl border border-white bg-white/85 p-4 shadow-sm sm:rounded-3xl sm:p-9">
              <p className="text-sm leading-6 text-slate-600 sm:text-base sm:leading-8">
                Date-Locked offers Google Sign-In to authenticate accounts.
                Through this process, the application may receive basic
                profile information, such as the user's name and email
                address, as permitted by Google.
              </p>

              <p className="mt-3 text-sm leading-6 text-slate-600 sm:mt-4 sm:text-base sm:leading-8">
                Google Sign-In does not, by itself, confirm a person's
                real-world identity or guarantee that a dating profile is
                genuine. Date-Locked's verification tools are separate
                features within the application.
              </p>

              <div className="mt-4 flex items-start gap-3 rounded-xl bg-blue-50 p-3 sm:mt-6 sm:rounded-2xl sm:p-4">
                <LockKeyhole
                  size={19}
                  className="mt-0.5 shrink-0 text-[#2f6df0]"
                />
                <p className="text-xs leading-5 text-slate-700 sm:text-sm sm:leading-6">
                  Read our{" "}
                  <Link
                    to="/privacy"
                    className="font-bold text-[#2f6df0] underline underline-offset-2"
                  >
                    Privacy Policy
                  </Link>{" "}
                  for details about information collection, use, and privacy
                  choices.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final call to action */}
        <section className="px-4 pb-8 sm:px-8 sm:pb-20">
          <div className="mx-auto max-w-6xl rounded-3xl bg-gradient-to-r from-[#2f6df0] to-[#6aa7ff] px-5 py-7 text-center text-white sm:rounded-[2rem] sm:px-12 sm:py-16">
            <h2 className="text-2xl font-extrabold tracking-tight sm:text-4xl">
              Make space for a genuine connection.
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-white/90 sm:mt-4 sm:text-base sm:leading-7">
              Explore tools for building connections, planning dates, and
              sharing your relationship journey.
            </p>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold text-[#2f6df0] transition hover:bg-blue-50 disabled:opacity-60 sm:mt-7 sm:px-7 sm:text-base"
            >
              {loading ? "Connecting..." : "Get Started with Google"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-4 py-5 sm:px-8 sm:py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-5">
          <p className="text-xs text-slate-500 sm:text-sm">
            © 2026 Date-Locked. All rights reserved.
          </p>

          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-slate-600 sm:gap-x-6 sm:text-sm"
          >
            <Link
              to="/privacy"
              className="transition hover:text-[#2f6df0]"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="transition hover:text-[#2f6df0]"
            >
              Terms of Service
            </Link>
            <a
              href="mailto:support@datelocked.fun"
              className="transition hover:text-[#2f6df0]"
            >
              Support / Contact Us
            </a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
