import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Heart, ShieldCheck } from "lucide-react";
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

  return (
    <div
      id="top"
      className="min-h-screen overflow-x-hidden bg-[#dfd0cc] px-4 py-5 text-[#342b30] sm:px-8 sm:py-8"
    >
      <div className="mx-auto w-full max-w-[1120px]">

        {/* App header */}
        <header className="flex min-h-[76px] items-center justify-between gap-3 rounded-t-2xl border-b border-[#eadbd7] bg-[#f8f2ef] px-5 sm:px-9">
          <a
            href="#top"
            aria-label="Date-Locked home"
            className="flex items-center gap-2.5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0d9d8]">
              <Heart
                size={24}
                strokeWidth={1.8}
                fill="#d85b78"
                className="text-[#b83f60]"
              />
            </div>

            <span className="text-lg font-bold tracking-tight text-[#49343c] sm:text-xl">
              Date-Locked
            </span>
          </a>

          <div className="flex items-center gap-3 sm:gap-5">
            <Link
              to="/login"
              className="text-sm font-semibold text-[#59464c] transition hover:text-[#c9436d]"
            >
              Sign In
            </Link>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="rounded-full bg-[#c95a76] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#b94a67] disabled:cursor-not-allowed disabled:opacity-60 sm:px-5"
            >
              {loading ? "Connecting..." : "Register"}
            </button>
          </div>
        </header>

        {/* Main page */}
        <main className="overflow-hidden rounded-b-2xl bg-[#f8f2ef] shadow-[0_12px_35px_rgba(65,42,42,0.12)]">

          {/* Centred introduction */}
          <section className="relative px-5 pb-8 pt-10 text-center sm:px-10 sm:pb-10 sm:pt-14">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#f0d9d8]">
              <Heart
                size={25}
                fill="#d85b78"
                className="text-[#b83f60]"
              />
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-[#49343c] sm:text-5xl">
              Love with intention.
            </h1>

            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[#79666c] sm:text-base">
              Love, trust and commitment — build your connection,
              celebrate your memories, and choose each other every day.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#c95a76] px-7 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#b94a67] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Connecting..." : "Start Your Journey"}
                {!loading && <ArrowRight size={17} />}
              </button>

              <a
                href="#features"
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#e4ceca] px-6 py-3 text-sm font-semibold text-[#59464c] transition hover:bg-white"
              >
                Explore Features
              </a>
            </div>

            {errorMessage && (
              <p
                role="alert"
                className="mx-auto mt-4 max-w-md break-words text-sm text-red-600"
              >
                {errorMessage}
              </p>
            )}

            <p className="mt-4 text-xs text-[#8a737b]">
              Already together?{" "}
              <Link
                to="/login"
                className="font-bold text-[#b94a67] underline underline-offset-2"
              >
                Sign in
              </Link>
            </p>
          </section>

          {/* Attached couple image */}
          <section className="px-4 pb-8 sm:px-8 sm:pb-12">
            <div className="relative mx-auto max-w-[920px] overflow-hidden rounded-2xl border border-[#eadbd7] bg-white shadow-sm">
              <img
                src="/datelocked-couple.png"
                alt="A couple enjoying their connection while using their phones at home"
                className="block h-[340px] w-full object-cover object-center sm:h-[460px] md:h-[520px]"
                loading="eager"
              />

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#302329]/65 via-[#302329]/20 to-transparent px-5 pb-6 pt-16 sm:px-8 sm:pb-8">
                <div className="flex items-center gap-2 text-white">
                  <Heart
                    size={19}
                    fill="#f5b6c5"
                    className="text-[#f5b6c5]"
                  />
                  <p className="text-sm font-semibold sm:text-base">
                    Made for two. Built on trust.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Features */}
          <section
            id="features"
            className="border-t border-[#eadbd7] bg-[#f4e9e5] px-5 py-9 sm:px-10 sm:py-12"
          >
            <div className="mx-auto grid max-w-[850px] grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-7">

              <div className="flex flex-col items-center text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white">
                  <ShieldCheck
                    size={24}
                    className="text-[#c95a76]"
                  />
                </div>
                <h2 className="text-base font-bold text-[#49343c]">
                  Verify
                </h2>
                <p className="mt-2 max-w-[230px] text-sm leading-6 text-[#79666c]">
                  Encourage trust and transparency in your relationship.
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white">
                  <Heart
                    size={24}
                    fill="#e58aa0"
                    className="text-[#c95a76]"
                  />
                </div>
                <h2 className="text-base font-bold text-[#49343c]">
                  Connect
                </h2>
                <p className="mt-2 max-w-[230px] text-sm leading-6 text-[#79666c]">
                  Keep your shared memories and meaningful moments together.
                </p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white">
                  <ShieldCheck
                    size={24}
                    className="text-[#c95a76]"
                  />
                </div>
                <h2 className="text-base font-bold text-[#49343c]">
                  Commit
                </h2>
                <p className="mt-2 max-w-[230px] text-sm leading-6 text-[#79666c]">
                  Lock your relationship when both partners are ready.
                </p>
              </div>

            </div>
          </section>

          {/* Footer */}
          <footer className="border-t border-[#eadbd7] bg-[#f8f2ef] px-5 py-6">
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-[#79666c]">
              <Link
                to="/privacy"
                className="transition hover:text-[#b94a67]"
              >
                Privacy Policy
              </Link>

              <Link
                to="/terms"
                className="transition hover:text-[#b94a67]"
              >
                Terms &amp; Conditions
              </Link>

              <a
                href="mailto:support@datelocked.app"
                className="transition hover:text-[#b94a67]"
              >
                Contact Support
              </a>
            </div>

            <p className="mt-4 text-center text-[10px] text-[#a28d93]">
              © 2026 Date-Locked. All rights reserved.
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}