import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, Chrome, User, Calendar, MapPin } from "lucide-react";

function DateLockedLogo({ className = "h-40 w-40" }) {
  return (
    <svg viewBox="0 0 320 320" className={className}>
      <defs>
        <linearGradient id="heartBlue" x1="55" y1="40" x2="260" y2="280">
          <stop offset="0%" stopColor="#b8dcff" />
          <stop offset="42%" stopColor="#5e9cff" />
          <stop offset="100%" stopColor="#2f6df0" />
        </linearGradient>

        <linearGradient id="heartDepth" x1="70" y1="55" x2="240" y2="265">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.78" />
          <stop offset="45%" stopColor="#ffffff" stopOpacity="0.16" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        <filter id="logoBlueShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow
            dx="0"
            dy="14"
            stdDeviation="12"
            floodColor="#2f6df0"
            floodOpacity="0.24"
          />
        </filter>
      </defs>

      <g filter="url(#logoBlueShadow)">
        <path
          d="M160 282S50 207 37 119C29 64 88 29 131 71C145 85 153 101 160 116C167 101 175 85 189 71C232 29 291 64 283 119C270 207 160 282 160 282Z"
          fill="url(#heartBlue)"
        />

        <path
          d="M160 282S50 207 37 119C29 64 88 29 131 71C145 85 153 101 160 116C167 101 175 85 189 71C232 29 291 64 283 119C270 207 160 282 160 282Z"
          fill="url(#heartDepth)"
        />

        <path
          d="M72 113C66 84 94 62 122 80"
          fill="none"
          stroke="#ffffff"
          strokeWidth="10"
          strokeLinecap="round"
          opacity="0.86"
        />

        <path
          d="M185 101C207 82 238 82 254 105"
          fill="none"
          stroke="#ffffff"
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.42"
        />

        <g fill="#ffffff">
          <path d="M128 218C111 207 95 191 91 172C88 156 98 142 113 144C128 146 139 160 149 180C139 187 132 200 128 218Z" />
          <path d="M197 218C214 207 230 191 234 172C237 156 227 142 212 144C197 146 186 160 176 180C186 187 193 200 197 218Z" />
          <circle cx="135" cy="141" r="15" />
          <circle cx="205" cy="141" r="15" />
          <path d="M137 159C147 160 156 168 160 180C153 178 145 174 137 168Z" />
          <path d="M203 159C193 160 184 168 180 180C187 178 195 174 203 168Z" />
          <circle cx="165" cy="174" r="7" />
          <path d="M155 187C162 195 170 195 177 187C180 200 174 214 166 223C158 214 152 200 155 187Z" />
          <path d="M159 169C155 158 159 148 169 148C179 148 183 158 179 169C175 165 171 163 169 163C167 163 163 165 159 169Z" />
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
      <div className="min-h-screen bg-[#f3edf1] px-5 py-6">
        <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-[390px] flex-col justify-center rounded-[34px] bg-white px-5 py-7 shadow-[0_18px_45px_rgba(47,109,240,0.12)]">
          <div className="mb-6 text-center">
            <div className="mb-2 flex justify-center">
              <DateLockedLogo className="h-32 w-32" />
            </div>

            <h1 className="text-[34px] font-black tracking-[-0.04em] text-[#172033]">
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
              className="h-14 w-full rounded-full bg-gradient-to-r from-[#8ec5ff] via-[#5e9cff] to-[#2f6df0] text-base font-black text-white shadow-[0_10px_24px_rgba(47,109,240,0.24)]"
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