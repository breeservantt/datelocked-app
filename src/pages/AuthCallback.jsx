import React from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const navigate = useNavigate();

  React.useEffect(() => {
    const handleAuth = async () => {
      try {
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error || !user) {
          navigate("/login", { replace: true });
          return;
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, date_of_birth, gender, location")
          .eq("id", user.id)
          .maybeSingle();

        const profileComplete =
          profile?.full_name?.trim() &&
          profile?.date_of_birth &&
          profile?.gender &&
          profile?.location;

        navigate(profileComplete ? "/home" : "/onboarding", {
          replace: true,
        });
      } catch (err) {
        console.error("Auth callback failed:", err);
        navigate("/login", { replace: true });
      }
    };

    handleAuth();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f3edf1]">
      <Loader2 className="h-8 w-8 animate-spin text-[#5e9cff]" />
    </div>
  );
}