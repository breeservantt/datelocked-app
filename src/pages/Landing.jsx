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
   className="min-h-screen overflow-x-hidden bg-[#dfd0cc] px-4 py-6 text-[#342b30] sm:px-8 sm:py-8"
 >
  {/* Presentation heading */}
  <div className="mb-6 text-center">
  <h1 className="text-4xl font-bold tracking-tight text-[#211a1e]">
    Date-Locked
  </h1>
</div>
<p className="mt-1 text-[11px] tracking-wide text-[#76666c]">
Love, trust & commitment
</p>
</div>

  {/* Main landing page */}
  <div className="relative mx-auto w-full max-w-[1120px]">
    <main className="relative min-h-[580px] overflow-hidden bg-white shadow-[5px_6px_3px_rgba(65,42,42,0.22)] sm:min-h-[600px]">
      {/* Decorative background shapes */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-[43%] bg-[#fff8f5]"
        style={{
          clipPath: "polygon(0 0, 75% 0, 100% 24%, 48% 76%, 0 100%)",
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 h-[72%] w-[43%] bg-[#ffc9cf]"
        style={{
          clipPath: "polygon(0 0, 100% 0, 100% 100%)",
        }}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 h-[65%] w-[35%] opacity-40"
        style={{
          backgroundImage:
            "repeating-linear-gradient(135deg, transparent 0px, transparent 8px, #ffe1e4 9px, #ffe1e4 11px)",
        }}
      />

      {/* Left-side decorative lines */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-0 top-0 hidden w-[30%] space-y-[9px] pt-4 sm:block"
      >
        {Array.from({ length: 22 }, (_, i) => (
          <div
            key={i}
            className="h-[2px] bg-[#f8d5d0]"
            style={{
              width: `${24 + ((i * 17) % 76)}%`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="relative z-20 flex min-h-[82px] items-center justify-between gap-3 border-b border-[#f5e7e5] bg-white/80 px-5 sm:px-10 lg:px-12">
        <a
          href="#top"
          className="flex shrink-0 items-center gap-2"
          aria-label="Date-Locked home"
        >
          <div className="relative flex h-10 w-10 items-center justify-center">
            <Heart
              size={35}
              strokeWidth={1.6}
              fill="#f16c91"
              className="text-[#a52e59]"
            />
            <Heart
              size={18}
              fill="#ffc2d0"
              className="absolute -right-1 -top-1 text-[#e64c7d]"
            />
          </div>

          <span className="text-base font-extrabold tracking-tight text-[#d53d69] sm:text-lg">
            Date-Locked
          </span>
        </a>

        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-5 text-[12px] font-medium text-[#55464c] md:flex lg:gap-7"
        >
          <a href="#top" className="transition hover:text-[#e84f79]">
            Home
          </a>
          <a href="#features" className="transition hover:text-[#e84f79]">
            Features
          </a>
          <a href="#story" className="transition hover:text-[#e84f79]">
            Our Story
          </a>
          <a
            href="mailto:support@datelocked.app"
            className="transition hover:text-[#e84f79]"
          >
            Contact Us
          </a>
        </nav>

        <div className="flex shrink-0 items-center gap-3 sm:gap-5">
          <Link
            to="/login"
            className="text-xs font-semibold text-[#493a40] transition hover:text-[#df426e] sm:text-sm"
          >
            Sign In
          </Link>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="rounded-full bg-[#e94f79] px-4 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#d83d68] disabled:cursor-not-allowed disabled:opacity-60 sm:px-5"
          >
            {loading ? "Connecting..." : "Register"}
          </button>
        </div>
      </header>

      {/* Hero section */}
      <section
        id="story"
        className="relative z-10 grid min-h-[475px] grid-cols-1 items-center gap-8 px-6 py-10 sm:px-10 md:grid-cols-2 md:gap-5 md:px-12 md:py-12 lg:min-h-[500px] lg:px-16"
      >
        {/* Left: message */}
        <div className="relative z-20 order-2 flex flex-col items-center text-center md:order-1 md:items-start md:pl-0 md:text-left">
          <div className="relative -ml-2 mb-6 w-full max-w-[370px] sm:mb-8 md:-ml-6">
            <div
              aria-hidden="true"
              className="absolute -bottom-1 left-2 right-2 h-2 bg-[#e7b2b6]"
            />

            <div className="relative bg-[#f15d82] px-5 py-4 text-white shadow-[0_5px_9px_rgba(110,42,61,0.23)] sm:px-6 sm:py-5">
              <h2 className="text-2xl font-medium leading-tight tracking-tight sm:text-[29px]">
                Love with intention.
              </h2>
            </div>

            <div
              aria-hidden="true"
              className="absolute -left-1 top-0 h-0 w-0 -translate-x-1/2 border-b-[16px] border-l-[16px] border-b-transparent border-l-[#d83f68]"
            />
          </div>

          <p className="max-w-[330px] text-base leading-7 text-[#dc6a72] sm:text-lg sm:leading-8 md:pl-7">
            Build trust.
            <br />
            Celebrate your connection.
            <br />
            Choose each other, every day.
          </p>

          <div className="mt-7 flex flex-col items-center gap-3 md:ml-7 md:items-start">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-[#e94f79] px-7 py-3 text-sm font-bold text-white shadow-md transition hover:bg-[#d83d68] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Connecting..." : "Start Your Journey"}
              {!loading && <ArrowRight size={17} />}
            </button>

            {errorMessage && (
              <p
                role="alert"
                className="max-w-[300px] break-words text-sm text-red-600"
              >
                {errorMessage}
              </p>
            )}

            <p className="text-xs text-[#8a737b]">
              Already together?{" "}
              <Link
                to="/login"
                className="font-bold text-[#d84470] underline underline-offset-2"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Right: romantic hero image */}
        <div className="relative order-1 mx-auto w-full max-w-[480px] md:order-2 md:ml-auto">
          <div
            aria-hidden="true"
            className="absolute -bottom-3 -left-3 right-5 top-5 rounded-bl-[75px] rounded-tr-[90px] bg-[#e9dfe1]"
          />

          <div className="relative h-[250px] overflow-hidden rounded-bl-[70px] rounded-tl-[18px] rounded-tr-[85px] border-[6px] border-white bg-[#f9dfe4] shadow-sm sm:h-[310px] md:h-[300px] lg:h-[340px]">
            <img
              src="https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?auto=format&fit=crop&w=1200&q=85"
              alt="A couple sharing a romantic moment"
              className="h-full w-full object-cover object-center"
              loading="eager"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-[#492532]/20 via-transparent to-transparent" />

            <div className="absolute bottom-4 left-4 rounded-full border border-white/60 bg-white/90 px-4 py-2 text-xs font-semibold text-[#c9436d] shadow-sm">
              <Heart
                size={13}
                fill="#ed6085"
                className="mr-1 inline-block text-[#ed6085]"
              />
              Made for two
            </div>
          </div>

          {/* Floating hearts */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-2 -top-7 flex rotate-[-12deg] items-center gap-1 sm:-right-4 sm:-top-8"
          >
            <Heart
              size={24}
              fill="#e84d7a"
              className="text-[#d93b69]"
            />
            <Heart
              size={43}
              fill="#ff8eaa"
              className="text-[#f15d87]"
            />
            <Heart
              size={31}
              fill="#ffb1c2"
              className="text-[#f0809e]"
            />
          </div>

          <Heart
            aria-hidden="true"
            size={29}
            fill="#ed5c87"
            className="pointer-events-none absolute -left-5 top-2 rotate-[-20deg] text-[#ed5c87] sm:-left-7"
          />

          <Heart
            aria-hidden="true"
            size={23}
            fill="#ffb4c7"
            className="pointer-events-none absolute -right-3 top-[46%] rotate-[15deg] text-[#f58ca8] sm:-right-6"
          />

          <Heart
            aria-hidden="true"
            size={17}
            fill="#f7a6ba"
            className="pointer-events-none absolute -bottom-5 right-[30%] rotate-[10deg] text-[#f7a6ba]"
          />
        </div>

        {/* Decorative gift */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-8 left-7 hidden h-[62px] w-[70px] sm:block lg:bottom-10 lg:left-12"
        >
          <div className="absolute left-1/2 top-[-13px] h-5 w-10 -translate-x-1/2">
            <div className="absolute left-1 top-0 h-5 w-5 -rotate-12 rounded-t-full rounded-br-full bg-[#ed4c78]" />
            <div className="absolute right-1 top-0 h-5 w-5 rotate-12 rounded-t-full rounded-bl-full bg-[#f77799]" />
          </div>

          <div className="absolute inset-x-0 bottom-0 top-3 rounded-b-sm bg-[#f36b8c] shadow-sm">
            <div className="absolute bottom-0 left-[42%] top-0 w-3 bg-[#d83c69]" />
          </div>

          <div className="absolute -left-1 right-[-4px] top-1 h-3 rounded-sm bg-[#ed4c78]" />
        </div>

        {/* Soft decorative heart cluster */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-7 left-[12%] hidden items-end gap-1 sm:flex"
        >
          <Heart
            size={35}
            fill="#f2a0b4"
            className="rotate-[-15deg] text-[#ee88a4]"
          />
          <Heart
            size={48}
            fill="#f7bfd0"
            className="rotate-[8deg] text-[#f5b3c7]"
          />
          <Heart
            size={28}
            fill="#ee6d94"
            className="rotate-[18deg] text-[#e95d85]"
          />
        </div>
      </section>

      {/* Features */}
      <section
        id="features"
        className="relative z-10 border-t border-[#f5e6e5] bg-white/90 px-6 py-7 sm:px-10 md:px-12 lg:px-16"
      >
        <div className="mx-auto grid max-w-[800px] grid-cols-1 gap-5 text-center sm:grid-cols-3 sm:gap-7">
          <div className="flex items-center justify-center gap-3 sm:flex-col sm:gap-2">
            <ShieldCheck
              size={23}
              className="shrink-0 text-[#e6537c]"
            />
            <div className="text-left sm:text-center">
              <h3 className="text-sm font-bold text-[#493840]">
                Verify
              </h3>
              <p className="mt-1 text-xs leading-5 text-[#8b777f]">
                Encourage trust and transparency.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 sm:flex-col sm:gap-2">
            <Heart
              size={23}
              className="shrink-0 text-[#e6537c]"
            />
            <div className="text-left sm:text-center">
              <h3 className="text-sm font-bold text-[#493840]">
                Connect
              </h3>
              <p className="mt-1 text-xs leading-5 text-[#8b777f]">
                Keep your shared memories together.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 sm:flex-col sm:gap-2">
            <ShieldCheck
              size={23}
              className="shrink-0 text-[#e6537c]"
            />
            <div className="text-left sm:text-center">
              <h3 className="text-sm font-bold text-[#493840]">
                Commit
              </h3>
              <p className="mt-1 text-xs leading-5 text-[#8b777f]">
                Lock your relationship when both are ready.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-[#f2e5e3] bg-white px-5 py-4">
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] text-[#8b777f]">
          <Link
            to="/privacy"
            className="transition hover:text-[#d84470]"
          >
            Privacy Policy
          </Link>

          <Link
            to="/terms"
            className="transition hover:text-[#d84470]"
          >
            Terms &amp; Conditions
          </Link>

          <a
            href="mailto:support@datelocked.app"
            className="transition hover:text-[#d84470]"
          >
            Contact Support
          </a>
        </div>

        <p className="mt-3 text-center text-[10px] text-[#b09ba2]">
          © 2026 Date-Locked. All rights reserved.
        </p>
      </footer>
    </main>
  </div>
</div>

);
}