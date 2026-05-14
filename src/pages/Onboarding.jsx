import React from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2, Search, MapPin, CheckCircle, Lock } from "lucide-react";
import { motion } from "framer-motion";

const LOCATION_OPTIONS = [
  "Gauteng, South Africa",
  "Western Cape, South Africa",
  "KwaZulu-Natal, South Africa",
  "Eastern Cape, South Africa",
  "Limpopo, South Africa",
  "Mpumalanga, South Africa",
  "North West, South Africa",
  "Free State, South Africa",
  "Northern Cape, South Africa",
  "Johannesburg, South Africa",
  "Pretoria, South Africa",
  "Cape Town, South Africa",
  "Durban, South Africa",
];

export default function Onboarding() {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = React.useState(true);
  const [isSaving, setIsSaving] = React.useState(false);
  const [authUser, setAuthUser] = React.useState(null);

  const [formData, setFormData] = React.useState({
    full_name: "",
    date_of_birth: "",
    location: "",
    gender: "",
  });

  const [locationSearch, setLocationSearch] = React.useState("");
  const [locationSuggestions, setLocationSuggestions] = React.useState([]);
  const [isSearching, setIsSearching] = React.useState(false);

  const locationTimerRef = React.useRef(null);

  const isProfileComplete = React.useCallback((profile) => {
    return Boolean(
      profile?.full_name?.trim() &&
        profile?.date_of_birth &&
        profile?.gender &&
        profile?.location
    );
  }, []);

  React.useEffect(() => {
    let alive = true;

    const loadUser = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) throw error;

        if (!user) {
          navigate("/login", { replace: true });
          return;
        }

        if (!alive) return;

        setAuthUser(user);

        const { data: profile } = await supabase
          .from("profiles")
          .select("id, email, full_name, date_of_birth, gender, location, account_status, deactivated_at")
          .eq("id", user.id)
          .maybeSingle();

        if (isProfileComplete(profile)) {
        navigate("/home", { replace: true });
        return;
      }  
         

        setFormData({
          full_name: profile?.full_name || "",
          date_of_birth: profile?.date_of_birth || "",
          location: profile?.location || "",
          gender: profile?.gender || "",
        });

        setLocationSearch(profile?.location || "");
      } catch (err) {
        console.error("Onboarding load failed:", err);
        navigate("/login", { replace: true });
      } finally {
        if (alive) setIsLoading(false);
      }
    };

    loadUser();

    return () => {
      alive = false;
      if (locationTimerRef.current) clearTimeout(locationTimerRef.current);
    };
  }, [navigate, isProfileComplete]);

  const searchLocations = (query) => {
    const q = (query || "").trim().toLowerCase();

    if (q.length < 2) {
      setLocationSuggestions([]);
      return;
    }

    setIsSearching(true);

    try {
      const results = LOCATION_OPTIONS.filter((loc) =>
        loc.toLowerCase().includes(q)
      ).slice(0, 5);

      setLocationSuggestions(results);
    } catch (err) {
      console.error("Location search failed:", err);
      setLocationSuggestions([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleLocationSelect = (loc) => {
    setFormData((prev) => ({
      ...prev,
      location: loc,
    }));

    setLocationSearch(loc);
    setLocationSuggestions([]);
  };

  const canProceed = () => {
    return Boolean(
      formData.full_name.trim() &&
        formData.date_of_birth &&
        (formData.location || locationSearch).trim() &&
        formData.gender
    );
  };

  const handleCompleteOnboarding = async () => {
    if (!authUser) {
      navigate("/login", { replace: true });
      return;
    }

    if (!canProceed()) {
      alert("Please complete all fields before continuing.");
      return;
    }

    setIsSaving(true);

    try {
      const birthDate = new Date(formData.date_of_birth);

      if (Number.isNaN(birthDate.getTime())) {
        alert("Invalid date of birth.");
        return;
      }

      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (
        monthDiff < 0 ||
        (monthDiff === 0 && today.getDate() < birthDate.getDate())
      ) {
        age--;
      }

      if (age < 18) {
        alert("You must be 18 or older to use Date-Locked.");
        return;
      }

      const payload = {
        id: authUser.id,
        email: authUser.email,
        full_name: formData.full_name.trim(),
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        location: (formData.location || locationSearch).trim(),
        relationship_status: "single",
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("profiles")
        .upsert(payload, { onConflict: "id" });

      if (error) throw error;

      navigate("/home", { replace: true });
    } catch (err) {
      console.error("Onboarding save failed:", err);
      alert(err.message || "Failed to complete setup.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f3edf1]">
        <Loader2 className="h-8 w-8 animate-spin text-[#5e9cff]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3edf1] px-4 py-5">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] w-full max-w-[390px] flex-col overflow-hidden rounded-[30px] border border-[#e8e2e7] bg-[#f8f4f7] shadow-[0_16px_40px_rgba(15,23,42,0.10)]">
        <div className="bg-gradient-to-r from-[#5e9cff] via-[#2f6df0] to-[#6aa7ff] px-5 pb-8 pt-7 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[20px] bg-white/20 shadow-[0_8px_20px_rgba(15,23,42,0.12)] backdrop-blur">
            <Lock className="h-7 w-7 text-white" />
          </div>

          <h1 className="text-[26px] font-black tracking-[-0.04em] text-white">
            Complete Profile
          </h1>

          <p className="mt-2 text-[14px] font-medium text-white/85">
            Tell us a bit about yourself
          </p>
        </div>

        <div className="-mt-5 flex-1 px-4 pb-6">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="rounded-[24px] border border-white/70 bg-white px-4 py-5 shadow-[0_12px_30px_rgba(15,23,42,0.08)]">
              <div className="space-y-4">
                <div>
                  <Label className="mb-2 block text-[13px] font-semibold text-slate-700">
                    Full Name
                  </Label>

                  <Input
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        full_name: e.target.value,
                      }))
                    }
                    placeholder="Your full name"
                    className="h-12 rounded-[15px] border border-slate-200 bg-[#fafafa] px-4 text-[14px] text-slate-800 placeholder:text-slate-400 focus:border-[#5e9cff]"
                  />
                </div>

                <div>
                  <Label className="mb-2 block text-[13px] font-semibold text-slate-700">
                    Date of Birth
                  </Label>

                  <Input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        date_of_birth: e.target.value,
                      }))
                    }
                    className="h-12 rounded-[15px] border border-slate-200 bg-[#fafafa] px-4 text-[14px] text-slate-800 focus:border-[#5e9cff]"
                  />

                  <p className="mt-1.5 text-[12px] font-medium text-slate-500">
                    You must be 18 or older
                  </p>
                </div>

                <div>
                  <Label className="mb-2 block text-[13px] font-semibold text-slate-700">
                    Gender
                  </Label>

                  <select
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        gender: e.target.value,
                      }))
                    }
                    className="h-12 w-full rounded-[15px] border border-slate-200 bg-[#fafafa] px-4 text-[14px] text-slate-800 outline-none focus:border-[#5e9cff]"
                  >
                    <option value="">Select your gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non-binary">Non-binary</option>
                    <option value="prefer_not_to_say">Prefer not to say</option>
                  </select>
                </div>

                <div>
                  <Label className="mb-2 block text-[13px] font-semibold text-slate-700">
                    Location
                  </Label>

                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <Input
                      value={locationSearch}
                      onChange={(e) => {
                        const val = e.target.value;

                        setLocationSearch(val);
                        setFormData((prev) => ({
                          ...prev,
                          location: val,
                        }));

                        if (locationTimerRef.current) {
                          clearTimeout(locationTimerRef.current);
                        }

                        locationTimerRef.current = setTimeout(() => {
                          searchLocations(val);
                        }, 300);
                      }}
                      placeholder="State, Country"
                      className="h-12 rounded-[15px] border border-slate-200 bg-[#fafafa] pl-11 pr-4 text-[14px] text-slate-800 placeholder:text-slate-400 focus:border-[#5e9cff]"
                    />

                    {isSearching ? (
                      <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-slate-400" />
                    ) : null}

                    {locationSuggestions.length > 0 ? (
                      <div className="absolute top-full z-20 mt-2 max-h-60 w-full overflow-auto rounded-[16px] border border-slate-200 bg-white shadow-[0_10px_24px_rgba(15,23,42,0.10)]">
                        {locationSuggestions.map((loc, index) => (
                          <button
                            key={`${loc}-${index}`}
                            type="button"
                            onClick={() => handleLocationSelect(loc)}
                            className="flex w-full items-center gap-2 px-4 py-3 text-left text-[14px] text-slate-700 transition hover:bg-slate-50"
                          >
                            <MapPin className="h-4 w-4 text-slate-400" />
                            <span>{loc}</span>
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>

                <Button
                  type="button"
                  onClick={handleCompleteOnboarding}
                  disabled={isSaving}
                  className={`mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-[18px] text-[15px] font-black text-white shadow-[0_10px_22px_rgba(168,85,247,0.28)] transition ${
                    canProceed()
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      : "bg-gradient-to-r from-slate-300 to-slate-400"
                  }`}
                >
                  {isSaving ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle className="h-5 w-5" />
                      <span>Complete Setup</span>
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}