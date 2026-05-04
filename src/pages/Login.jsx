import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, Chrome, User, Calendar, MapPin } from "lucide-react";

function DateLockedLogo({ className = "h-40 w-40" }) {
  return (
    <svg viewBox="0 0 260 260" className={className}>
      <defs>
        <linearGradient id="heart3d" x1="45" y1="38" x2="210" y2="220">
          <stop offset="0%" stopColor="#ff5f8f" />
          <stop offset="50%" stopColor="#ef4f75" />
          <stop offset="100%" stopColor="#d83d91" />
        </linearGradient>

        <linearGradient id="lockGold" x1="80" y1="100" x2="175" y2="200">
          <stop offset="0%" stopColor="#ffe08a" />
          <stop offset="45%" stopColor="#e5a528" />
          <stop offset="100%" stopColor="#b46b05" />
        </linearGradient>

        <linearGradient id="keyGold" x1="145" y1="130" x2="220" y2="185">
          <stop offset="0%" stopColor="#ffe08a" />
          <stop offset="55%" stopColor="#d99016" />
          <stop offset="100%" stopColor="#8a4f04" />
        </linearGradient>

        <filter id="logoShadow" x="-25%" y="-25%" width="150%" height="150%">
          <feDropShadow
            dx="0"
            dy="10"
            stdDeviation="8"
            floodColor="#d83d91"
            floodOpacity="0.22"
          />
        </filter>
      </defs>

      <g filter="url(#logoShadow)">
        <path
          d="M130 220S43 165 31 96C22 49 73 24 107 62C118 74 124 89 130 102C136 89 142 74 153 62C187 24 238 49 229 96C217 165 130 220 130 220Z"
          fill="url(#heart3d)"
        />

        <path
          d="M58 91C53 66 77 50 99 65"
          fill="none"
          stroke="white"
          strokeWidth="9"
          strokeLinecap="round"
          opacity="0.78"
        />

        <path
          d="M91 132V108C91 84 108 67 130 67C152 67 169 84 169 108V132"
          fill="none"
          stroke="#1b2847"
          strokeWidth="13"
          strokeLinecap="round"
        />

        <rect
          x="73"
          y="124"
          width="114"
          height="78"
          rx="26"
          fill="url(#lockGold)"
          stroke="#1b2847"
          strokeWidth="8"
        />

        <path
          d="M93 140H138"
          stroke="white"
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.55"
        />

        <circle cx="130" cy="156" r="11" fill="#1b2847" />
        <path d="M123 164H137L142 188H118L123 164Z" fill="#1b2847" />

        <g transform="rotate(-35 175 160)">
          <rect
            x="156"
            y="150"
            width="65"
            height="16"
            rx="8"
            fill="url(#keyGold)"
            stroke="#1b2847"
            strokeWidth="5"
          />
          <circle
            cx="151"
            cy="158"
            r="16"
            fill="none"
            stroke="#1b2847"
            strokeWidth="6"
          />
          <path
            d="M206 166V178M218 166V176"
            stroke="#1b2847"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M164 153H206"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            opacity="0.5"
          />
        </g>
      </g>
    </svg>
  );
}

export default function Login() {
  const navigate = useNavigate();

  const [mode, setMode] = React.useState("landing");
  const [authUser, setAuthUser] = React.useState(null);

  const [email, setEmail] = React.useState("");
  const [fullName, setFullName] = React.useState("");
  const [age, setAge] = React.useState("");
  const [gender, setGender] = React.useState("");
  const [location, setLocation] = React.useState("");

  const [isGoogleLoading, setIsGoogleLoading] = React.useState(false);
  const [isEmailLoading, setIsEmailLoading] = React.useState(false);
  const [isSavingProfile, setIsSavingProfile] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    const finishAuthFlow = async () => {
      const { data, error: userError } = await supabase.auth.getUser();
      const user = data?.user;

      if (userError || !user) return;

      setAuthUser(user);

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, age, gender, location")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        setError(profileError.message);
        return;
      }

      if (
        profile?.full_name &&
        profile?.age &&
        profile?.gender &&
        profile?.location
      ) {
        navigate("/home", { replace: true });
        return;
      }

      setFullName(profile?.full_name || "");
      setAge(profile?.age ? String(profile.age) : "");
      setGender(profile?.gender || "");
      setLocation(profile?.location || "");
      setMode("profile");
    };

    finishAuthFlow();
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

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setError("");

    if (!authUser?.id) return setError("No authenticated user found.");
    if (!fullName.trim()) return setError("Enter your full names.");
    if (!age || Number(age) < 13) return setError("Enter a valid age.");
    if (!gender.trim()) return setError("Select your gender.");
    if (!location.trim()) return setError("Enter your location.");

    setIsSavingProfile(true);

    try {
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: authUser.id,
          email: authUser.email || "",
          full_name: fullName.trim(),
          age: Number(age),
          gender: gender.trim(),
          location: location.trim(),
          relationship_status: "single",
          profile_photo: authUser.user_metadata?.avatar_url || "",
          couple_profile_id: null,
          partner_email: null,
          insights_consent: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );

      if (profileError) throw profileError;

      navigate("/home", { replace: true });
    } catch (err) {
      setError(err.message || "Could not save profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (mode === "profile") {
    return (
      <div className="min-h-screen bg-[#fff7fb] px-5 py-6">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-[390px] flex-col justify-center rounded-[34px] bg-white px-5 py-7 shadow-[0_18px_45px_rgba(216,61,145,0.10)]">
          <div className="mb-6 text-center">
            <div className="mb-2 flex justify-center">
              <DateLockedLogo className="h-32 w-32" />
            </div>

            <h1 className="text-[34px] font-black tracking-[-0.04em] text-[#1b2847]">
              Date-Locked
            </h1>

            <p className="mt-2 text-base font-medium text-slate-500">
              Complete your profile
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Full names"
                className="h-14 rounded-full border-slate-200 bg-white pl-11 text-base shadow-[0_5px_14px_rgba(15,23,42,0.04)]"
                disabled={isSavingProfile}
              />
            </div>

            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="number"
                min="13"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="Age"
                className="h-14 rounded-full border-slate-200 bg-white pl-11 text-base shadow-[0_5px_14px_rgba(15,23,42,0.04)]"
                disabled={isSavingProfile}
              />
            </div>

            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              disabled={isSavingProfile}
              className="h-14 w-full rounded-full border border-slate-200 bg-white px-5 text-base text-slate-700 outline-none shadow-[0_5px_14px_rgba(15,23,42,0.04)]"
            >
              <option value="">Gender</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>

            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Location"
                className="h-14 rounded-full border-slate-200 bg-white pl-11 text-base shadow-[0_5px_14px_rgba(15,23,42,0.04)]"
                disabled={isSavingProfile}
              />
            </div>

            {error ? (
              <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            <Button
              type="submit"
              disabled={isSavingProfile}
              className="h-14 w-full rounded-full bg-gradient-to-r from-[#ef4f75] to-[#d83d91] text-base font-black text-white shadow-[0_10px_24px_rgba(216,61,145,0.24)]"
            >
              {isSavingProfile ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Continue"
              )}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff7fb] px-5 py-6">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-[390px] flex-col rounded-[34px] bg-white px-5 py-7 shadow-[0_18px_45px_rgba(216,61,145,0.10)]">
        <div className="flex flex-1 flex-col justify-center">
          <div className="mb-8 text-center">
            <div className="mb-1 flex justify-center">
              <DateLockedLogo className="h-36 w-36" />
            </div>

            <h1 className="text-[42px] font-black leading-none tracking-[-0.07em] text-[#1b2847]">
              Date-Locked
            </h1>

            <p className="mt-4 text-lg font-medium text-[#111111]">
              Find the reason to stay in love
            </p>
          </div>

          <div className="mb-14 space-y-3">
            <Button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isGoogleLoading || isEmailLoading}
              className="mx-auto flex h-11 w-[92%] items-center justify-center rounded-full bg-gradient-to-r from-[#ef4f75] to-[#d83d91] text-sm font-black text-white shadow-[0_8px_18px_rgba(216,61,145,0.24)]"
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
              className="mx-auto flex h-11 w-[92%] items-center justify-center rounded-full bg-[#111111] text-sm font-black text-white hover:bg-[#111111]"
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
                  className="mx-auto flex h-11 w-[92%] rounded-full border-2 border-[#d83d91] bg-white text-sm font-black text-[#d83d91] hover:bg-white"
                >
                  {isEmailLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Send Login Link"
                  )}
                </Button>
              </form>
            ) : null}

            {error ? (
              <div className="mx-auto w-[92%] rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            ) : null}

            {message ? (
              <div className="mx-auto w-[92%] rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
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