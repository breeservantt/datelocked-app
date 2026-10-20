
import React from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export default function AuthCallback() {
  const navigate = useNavigate();

  React.useEffect(() => {
    let active = true;

    const handleAuth = async () => {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error) throw error;
        if (!user) throw new Error("Google sign-in did not create a session.");

        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("full_name, date_of_birth, gender, location, account_status, deactivated_at")
          .eq("id", user.id)
          .maybeSingle();

        if (profileError) throw profileError;

        if (
          profile?.account_status === "deactivated" ||
          profile?.deactivated_at
        ) {
          await supabase.auth.signOut();
          throw new Error("This account has been deactivated.");
        }

        if (!active) return;

        const profileComplete =
          profile?.full_name?.trim() &&
          profile?.date_of_birth &&
          profile?.gender &&
          profile?.location;

        navigate(profileComplete ? "/home" : "/onboarding", {
          replace: true,
        });
      } catch (error) {
        console.error("Auth callback failed:", error);
        if (active) navigate("/login", { replace: true });
      }
    };

    handleAuth();

    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f3edf1]">
      <Loader2 className="h-8 w-8 animate-spin text-[#5e9cff]" />
    </div>
  );
}
