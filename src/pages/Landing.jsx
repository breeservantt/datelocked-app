import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ShieldCheck,
  LockKeyhole,
  CheckCircle2,
} from "lucide-react";
import { loginWithGoogle } from "@/lib/googleSignIn";

export default function Landing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleGoogleSignIn = async () => {
  if (loading) return;

  setLoading(true);
  setErrorMessage("");

  try {
    const data = await loginWithGoogle();

    // Native Android login returns a Supabase session.
if (data && "session" in data && data.session?.user) {
  navigate("/home", { replace: true });
  return;
}

// Website login continues through Google's OAuth redirect.
if (data && "url" in data && data.url) {
  return;
}

    throw new Error("Google sign-in did not return a session.");
  } catch (error) {
    console.error("Google sign-in failed:", error);
    setErrorMessage(
      error?.message ||
        "Unable to sign in with Google. Please try again."
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f8f2f5] text-[#342633]">
      {/* Header */}
      <header className="border-b border-[#eadce5] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <a
            href="#home"
            className="flex min-w-0 items-center gap-2"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white">
              <img
                src="/Datelocked%20Logo.png"
                alt="Date-Locked Logo"
                className="h-full w-full object-contain"
              />
            </div>

            <span className="truncate text-lg font-extrabold tracking-tight sm:text-xl">
              Date-Locked
            </span>
          </a>

          <nav className="flex shrink-0 items-center gap-3 text-sm font-semibold sm:gap-6">
            <a
              href="#home"
              className="hidden hover:text-[#a53c70] sm:inline"
            >
              Home
            </a>

            <a
              href="#features"
              className="hidden hover:text-[#a53c70] sm:inline"
            >
              Features
            </a>

            <Link
              to="/login"
              className="rounded-full border border-[#dfb8cd] px-4 py-2 hover:bg-[#f8eaf1]"
            >
              Log In
            </Link>
          </nav>
        </div>
      </header>

      {/* Main */}
      <main id="home">
        {/* Hero Section */}
        <section className="mx-auto grid max-w-6xl items-center gap-8 px-4 py-10 sm:px-6 sm:py-16 lg:grid-cols-2 lg:gap-12 lg:py-20">
          {/* Hero Text */}
          <div className="text-center lg:text-left">
            <span className="mb-2 block text-4xl font-bold text-[#b34d80]">
              ONE LOCKED-IN JOURNEY.
            </span>

            <h1 className="text-center text-base font-extrabold leading-tight tracking-tight sm:text-lg lg:text-left">
              TWO HEARTS.
            </h1>

            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[#ead3e0] bg-white px-4 py-2 text-xs font-semibold text-[#985078] sm:text-sm">
              <img
                src="/Datelocked%20Logo.png"
                alt="Date-Locked Logo"
                className="h-[15px] w-[15px] object-contain"
              />
              A space for two
            </div>

            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-[#74616f] sm:text-lg lg:mx-0">
              Build your connection, keep your memories, plan
              meaningful moments, and create a relationship that
              belongs to the two of you.
            </p>

            {/* Authentication Buttons */}
            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="flex min-h-12 items-center justify-center gap-3 rounded-full bg-[#b34d80] px-6 py-3 font-bold text-white shadow-sm transition hover:bg-[#963b69] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 48 48"
                  className="h-5 w-5 rounded-full bg-white p-0.5"
                >
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 3.01 13.22l7.98 6.19C12.88 13.72 17.99 9.5 24 9.5Z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 38.01 46.98 31.93 46.98 24.55Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.99 28.59A14.5 14.5 0 0 1 10.23 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.88.93 7.55 3.01 10.78l7.98-6.19Z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.9 2.3-8.18 2.3-6.01 0-11.12-4.22-13.01-9.91l-7.98 6.19C6.51 43.62 14.62 48 24 48Z"
                  />
                </svg>

                {loading
                  ? "Connecting..."
                  : "Continue with Google"}

                {!loading && <ArrowRight size={18} />}
              </button>

              <Link
                to="/login"
                className="flex min-h-12 items-center justify-center rounded-full border border-[#dfb8cd] bg-white px-6 py-3 font-bold text-[#8f3b68] transition hover:bg-[#fff2f8]"
              >
                Log In
              </Link>
            </div>

            {/* Authentication Error */}
            {errorMessage && (
              <p
                role="alert"
                className="mt-4 text-sm text-red-700"
              >
                {errorMessage}
              </p>
            )}

            <p className="mt-4 text-xs leading-5 text-[#8b7786]">
              Sign in securely with your Google account to get
              started.
            </p>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-3 text-sm text-[#74616f] lg:justify-start">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck
                  size={17}
                  className="text-[#b34d80]"
                />
                Privacy-minded
              </span>

              <span className="inline-flex items-center gap-2">
                <LockKeyhole
                  size={16}
                  className="text-[#b34d80]"
                />
                Made for two
              </span>
            </div>
          </div>

          {/* Hero Image */}
          <div className="mx-auto w-full max-w-md">
            <div className="overflow-hidden rounded-[2rem] border border-white bg-white shadow-[0_20px_60px_rgba(115,61,91,0.12)]">
              <div className="relative aspect-[4/5] overflow-hidden bg-[#f4e6ee]">
                <img
                  src="/datelocked-couple.jpg"
                  alt="Couple"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>

              <div className="px-3 pb-3 pt-5 text-center">
                <div className="flex items-center justify-center gap-2 text-[#b34d80]">
                  <img
                    src="/Datelocked%20Logo.png"
                    alt="Date-Locked Logo"
                    className="h-6 w-6 object-contain"
                  />

                  <span className="text-xs font-bold uppercase tracking-[0.2em]">
                    Date-Locked
                  </span>

                  <img
                    src="/Datelocked%20Logo.png"
                    alt="Date-Locked Logo"
                    className="h-6 w-6 object-contain"
                  />
                </div>

                <p className="mt-2 text-xl font-bold sm:text-2xl">
                  Your story. Your space. The two of you.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="border-y border-[#eadce5] bg-white px-4 py-14 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#b34d80]">
              About Date-Locked
            </p>

            <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
              Make room for your relationship.
            </h2>

            <p className="mx-auto mt-4 max-w-2xl leading-7 text-[#74616f]">
              Date-Locked gives couples a dedicated place to share
              memories, work towards goals, plan time together,
              and nurture their connection in one private
              couple-focused experience.
            </p>
          </div>
        </section>

        {/* Features Section */}
        <section
          id="features"
          className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16"
        >
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#b34d80]">
              Built for connection
            </p>

            <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
              Grow closer, one moment at a time.
            </h2>
          </div>

          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <article className="rounded-3xl border border-[#eadce5] bg-white p-6">
              <div className="h-12 w-12 overflow-hidden rounded-2xl">
                <img
                  src="/Datelocked%20Logo.png"
                  alt="Date-Locked Logo"
                  className="h-full w-full object-cover"
                />
              </div>

              <h3 className="mt-4 text-lg font-bold">
                Your shared space
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#74616f]">
                Create a couple identity and build a space for
                the experiences you share together.
              </p>
            </article>

            {/* Feature 2 */}
            <article className="rounded-3xl border border-[#eadce5] bg-white p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f8e7f0] text-[#b34d80]">
                <CheckCircle2 size={23} />
              </div>

              <h3 className="mt-4 text-lg font-bold">
                Goals together
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#74616f]">
                Set relationship goals, plan meaningful dates,
                and keep track of the moments that matter.
              </p>
            </article>

            {/* Feature 3 */}
            <article className="rounded-3xl border border-[#eadce5] bg-white p-6 sm:col-span-2 lg:col-span-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f8e7f0] text-[#b34d80]">
                <ShieldCheck size={23} />
              </div>

              <h3 className="mt-4 text-lg font-bold">
                Memories and verification
              </h3>

              <p className="mt-2 text-sm leading-6 text-[#74616f]">
                Keep shared memories in one place and use the
                app's couple verification features as you build
                your shared space.
              </p>
            </article>
          </div>
        </section>

        {/* Google Sign-In Section */}
        <section className="bg-[#f0e2eb] px-4 py-14 sm:px-6 sm:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[#b34d80]">
              <ShieldCheck size={24} />
            </div>

            <h2 className="mt-4 text-3xl font-extrabold">
              Simple, secure sign-in.
            </h2>

            <p className="mt-4 leading-7 text-[#74616f]">
              Use Google to sign in. Date-Locked uses its
              authentication system to manage your session and
              return you to the app. Only share personal
              information you are comfortable providing.
            </p>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="mt-6 inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#b34d80] px-6 py-3 font-bold text-white transition hover:bg-[#963b69] disabled:opacity-60"
            >
              {loading ? "Connecting..." : "Get Started"}
              {!loading && <ArrowRight size={18} />}
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#eadce5] bg-[#fffafd] px-4 py-7 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <p className="text-sm font-bold">Date-Locked</p>

          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-[#74616f]">
            <Link
              to="/privacy"
              className="hover:text-[#b34d80]"
            >
              Privacy Policy
            </Link>

            <Link
              to="/terms"
              className="hover:text-[#b34d80]"
            >
              Terms of Service
            </Link>

            <a
              href="mailto:support@datelocked.app"
              className="hover:text-[#b34d80]"
            >
              Support
            </a>
          </div>

          <p className="text-xs text-[#8b7786]">
            © {new Date().getFullYear()} Date-Locked
          </p>
        </div>
      </footer>
    </div>
  );
}
