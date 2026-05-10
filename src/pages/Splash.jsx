import React from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import DateLockedLogo from "@/components/DateLockedLogo";

export default function Splash() {
  const navigate = useNavigate();

  React.useEffect(() => {
    const timer = setTimeout(async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        navigate("/home", { replace: true });
      } else {
        navigate("/login", { replace: true });
      }
    }, 1800);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0f172a] via-[#172033] to-[#2f6df0]">
      <div className="text-center">
        <div className="mb-5 flex justify-center">
          <DateLockedLogo className="h-[120px] w-[120px] drop-shadow-[0_0_18px_rgba(94,156,255,0.6)]" />
        </div>

        <h1 className="text-[30px] font-black tracking-[-0.04em] text-white">
          DATE-LOCKED
        </h1>

        <p className="mt-1 text-[14px] text-white/70">Where love stays</p>
      </div>

      <div className="absolute bottom-6 text-[11px] text-white/40">
        Date-Locked
      </div>
    </div>
  );
}