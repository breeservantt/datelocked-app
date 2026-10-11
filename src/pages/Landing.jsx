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
      title: "Identity & Code Verification",
      description:
        "Use mutual verification tools and match codes to help confirm who you are connecting with.",
    },
    {
      icon: CalendarCheck,
      title: "Scheduled Date Planning",
      description:
        "Plan upcoming dates together and keep your date arrangements organised in one place.",
    },
    {
      icon: LockKeyhole,
      title: "Relationship Locking",
      description:
        "When both partners are ready to commit, Date-Locked supports a shared relationship status.",
    },
  ];

  return (
    <div
      id="top"
      className="min-h-screen overflow-hidden bg-[#f7f1f4] text-slate-800"
    >
      {/* Navigation */}
      <header className="sticky top-0 z-40 border-b border-white/70 bg-[#f7f1f4]/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <a href="#top" className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[#5e9cff] to-[#2f6df0] text-white shadow-md shadow-blue-200">
              <Heart size={21} fill="currentColor" />
            </span>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">
              Date-Locked
            </span>
          </a>

          <nav className="flex items-center gap-4 text-sm font-semibold sm:gap-8">
            <a
              href="#top"
              className="hidden text-slate-600 transition hover:text-[#2f6df0] sm:inline"
            >
              Home
            </a>
            <a
              href="#features"
              className="hidden text-slate-600 transition hover:text-[#2f6df0] sm:inline"
            >
              Features
            </a>
            <Link
              to="/login"
              className="rounded-full border border-[#2f6df0]/25 px-4 py-2.5 text-[#2f6df0] transition hover:bg-blue-50 sm:px-5"
            >
              Log In
            </Link>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24">
          <div className="pointer-events-none absolute -right-24 -top-20 h-80 w-80 rounded-full bg-blue-200/40 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-24 h-72 w-72 rounded-full bg-pink-200/40 blur-3xl" />

          <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-4 py-2 text-sm font-semibold text-[#2f6df0]">
                <ShieldCheck size={17} />
                Dating with clarity and trust
              </div>

              <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Date-Locked — Secure Dating &amp; Mutual Verification
              </h1>

              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
                Build genuine connections with identity verification tools,
                date planning, and a shared way to mark your relationship
                commitment.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-[#2f6df0] px-6 py-3.5 font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-[#245bd0] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? (
                    <span className="animate-pulse">Connecting...</span>
                  ) : (
                    <>
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 48 48"
                        className="h-5 w-5 rounded-full bg-white p-0.5"
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
              </div>

              {errorMessage && (
                <p
                  role="alert"
                  className="mt-4 text-sm font-medium text-red-600"
                >
                  {errorMessage}
                </p>
              )}
            </div>

            {/* Hero illustration */}
            <div className="relative mx-auto w-full max-w-md">
              <div className="rounded-[2rem] border border-white bg-white/80 p-5 shadow-2xl shadow-blue-100/70 sm:p-7">
                <div className="rounded-[1.5rem] bg-gradient-to-br from-[#5e9cff] via-[#2f6df0] to-[#6aa7ff] p-7 text-white sm:p-9">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white/90">
                      Your shared space
                    </span>
                    <ShieldCheck size={25} />
                  </div>

                  <div className="my-10 flex items-center justify-center">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/40 bg-white/15">
                      <Heart
                        size={47}
                        strokeWidth={1.7}
                        fill="currentColor"
                      />
                    </div>
                  </div>

                  <h2 className="text-center text-2xl font-extrabold">
                    Connect. Plan. Commit.
                  </h2>
                  <p className="mx-auto mt-3 max-w-xs text-center text-sm leading-6 text-white/85">
                    Tools designed to help couples build their connection
                    with greater clarity.
                  </p>
                </div>

                <div className="mt-5 space-y-3">
                  {[
                    "Mutual verification tools",
                    "Date planning and shared goals",
                    "A shared relationship status",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3 py-1">
                      <CheckCircle2
                        size={19}
                        className="shrink-0 text-[#2f6df0]"
                      />
                      <span className="text-sm font-medium text-slate-700">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="absolute -right-3 -top-4 hidden rounded-2xl border border-blue-100 bg-white px-4 py-3 shadow-lg sm:block">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                  <ShieldCheck size={18} className="text-[#2f6df0]" />
                  Trust starts here
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About and features */}
        <section
          id="features"
          className="scroll-mt-24 bg-white px-5 py-20 sm:px-8 sm:py-24"
        >
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-3xl text-center">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#2f6df0]">
                About the application
              </p>
              <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                What is Date-Locked?
              </h2>
              <p className="mt-6 text-base leading-8 text-slate-600">
                Date-Locked is a dating application designed to support safer,
                more transparent connections. It brings together identity
                verification tools, date planning, shared experiences, and
                relationship status features in one place.
              </p>
            </div>

            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {features.map((feature) => {
                const Icon = feature.icon;

                return (
                  <article
                    key={feature.title}
                    className="rounded-3xl border border-slate-100 bg-[#f7f1f4]/65 p-7 transition hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-100/60"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-[#2f6df0]">
                      <Icon size={25} />
                    </div>

                    <h3 className="mt-5 text-lg font-extrabold text-slate-900">
                      {feature.title}
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-slate-600">
                      {feature.description}
                    </p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Google sign-in explanation */}
        <section className="px-5 py-20 sm:px-8 sm:py-24">
          <div className="mx-auto grid max-w-6xl items-start gap-8 md:grid-cols-[0.8fr_1.2fr]">
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-[#2f6df0]">
                <ShieldCheck size={30} />
              </div>

              <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-slate-950">
                Why We Use Google Sign-In
              </h2>
            </div>

            <div className="rounded-3xl border border-white bg-white/80 p-7 shadow-sm sm:p-9">
              <p className="text-base leading-8 text-slate-600">
                Date-Locked offers Google Sign-In to let users authenticate
                their accounts. Through this sign-in process, the application
                may receive basic profile information, such as the user's name
                and email address, as permitted by the Google authentication
                process.
              </p>

              <p className="mt-4 text-base leading-8 text-slate-600">
                Google Sign-In helps users access their accounts. It does not,
                by itself, confirm a person's real-world identity or guarantee
                that a dating profile is genuine. Date-Locked's verification
                tools are separate features within the application.
              </p>

              <div className="mt-6 flex items-start gap-3 rounded-2xl bg-blue-50 p-4">
                <LockKeyhole
                  size={21}
                  className="mt-0.5 shrink-0 text-[#2f6df0]"
                />
                <p className="text-sm leading-6 text-slate-700">
                  For details about the information collected, how it is used,
                  and your privacy choices, please read our{" "}
                  <Link
                    to="/privacy"
                    className="font-bold text-[#2f6df0] underline underline-offset-2"
                  >
                    Privacy Policy
                  </Link>
                  .
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-5 pb-20 sm:px-8">
          <div className="mx-auto max-w-6xl rounded-[2rem] bg-gradient-to-r from-[#2f6df0] to-[#6aa7ff] px-6 py-12 text-center text-white sm:px-12 sm:py-16">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Make space for a genuine connection.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl leading-7 text-white/90">
              Start your Date-Locked journey and explore tools for building
              connections, planning dates, and sharing your relationship
              journey.
            </p>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 font-bold text-[#2f6df0] transition hover:bg-blue-50 disabled:opacity-60"
            >
              {loading ? "Connecting..." : "Get Started with Google"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white px-5 py-8 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            © 2026 Date-Locked. All rights reserved.
          </p>

          <nav
            aria-label="Footer navigation"
            className="flex flex-wrap gap-x-6 gap-y-3 text-sm font-semibold text-slate-600"
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
```