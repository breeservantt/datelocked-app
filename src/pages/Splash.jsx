import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, LockKeyhole, ShieldCheck, UsersRound } from "lucide-react";

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/home");
    }, 3200);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-gradient-to-b from-[#d9a8ff] via-[#ffd3e7] to-[#6b5cff]">
      {/* floating glow background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_28%,rgba(255,255,255,0.75),transparent_34%),radial-gradient(circle_at_10%_85%,rgba(255,145,219,0.55),transparent_28%),radial-gradient(circle_at_90%_82%,rgba(118,74,255,0.65),transparent_30%)]" />

      {/* soft clouds */}
      <div className="absolute -bottom-24 -left-20 h-72 w-72 rounded-full bg-[#ffb1ef]/45 blur-2xl" />
      <div className="absolute -bottom-28 right-[-90px] h-80 w-80 rounded-full bg-[#6b5cff]/55 blur-2xl" />
      <div className="absolute bottom-20 left-[-70px] h-52 w-52 rounded-full bg-[#f5b4ff]/35 blur-xl" />
      <div className="absolute bottom-24 right-[-80px] h-56 w-56 rounded-full bg-[#ffc8ea]/35 blur-xl" />

      {/* small hearts / stars */}
      <motion.div
        className="absolute left-[14%] top-[13%] text-3xl"
        animate={{ y: [0, -10, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 2.8, repeat: Infinity }}
      >
        💗
      </motion.div>

      <motion.div
        className="absolute right-[25%] top-[22%] text-2xl"
        animate={{ y: [0, 12, 0], rotate: [0, 8, 0] }}
        transition={{ duration: 3.2, repeat: Infinity }}
      >
        💕
      </motion.div>

      <motion.div
        className="absolute left-[15%] top-[44%] text-2xl"
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 3, repeat: Infinity }}
      >
        💗
      </motion.div>

      <motion.div
        className="absolute right-[20%] top-[64%] text-2xl"
        animate={{ y: [0, -10, 0], scale: [1, 1.12, 1] }}
        transition={{ duration: 2.7, repeat: Infinity }}
      >
        💗
      </motion.div>

      <div className="absolute left-[24%] top-[7%] h-2 w-2 rounded-full bg-white/80 shadow-[0_0_12px_rgba(255,255,255,0.9)]" />
      <div className="absolute right-[15%] top-[15%] h-2 w-2 rounded-full bg-white/80 shadow-[0_0_12px_rgba(255,255,255,0.9)]" />
      <div className="absolute left-[10%] top-[31%] h-1.5 w-1.5 rounded-full bg-white/80" />
      <div className="absolute right-[8%] top-[38%] h-3 w-3 rounded-full bg-white/80 shadow-[0_0_14px_rgba(255,255,255,0.95)]" />

      {/* orbit lines */}
      <div className="absolute left-[-10%] top-[29%] h-[160px] w-[120%] rotate-[-15deg] rounded-[100%] border border-white/35" />
      <div className="absolute left-[5%] top-[22%] h-[170px] w-[90%] rotate-[12deg] rounded-[100%] border border-white/20" />

      <div className="relative z-10 flex min-h-screen flex-col items-center px-7 pb-10 pt-[17vh] text-center">
        {/* logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.75, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 14 }}
          className="relative flex h-[190px] w-[190px] items-center justify-center"
        >
          <motion.div
            className="absolute inset-0 rounded-full border-[5px] border-white/85 shadow-[0_0_34px_rgba(255,255,255,0.65)]"
            animate={{ scale: [1, 1.04, 1] }}
            transition={{ duration: 2.4, repeat: Infinity }}
          />

          <div className="absolute inset-5 rounded-full border border-white/45" />

          <div className="relative flex h-[116px] w-[116px] items-center justify-center">
            <div className="absolute top-0 h-[74px] w-[76px] rounded-t-full border-[15px] border-[#5a22b8] border-b-0 shadow-[inset_0_8px_18px_rgba(255,255,255,0.25)]" />

            <div className="absolute bottom-0 flex h-[92px] w-[118px] items-center justify-center">
              <Heart className="h-[118px] w-[118px] fill-[#f8329f] text-[#f8329f] drop-shadow-[0_14px_16px_rgba(93,31,154,0.28)]" />
              <div className="absolute left-1/2 top-[43%] h-7 w-7 -translate-x-1/2 rounded-full bg-[#22105f]" />
              <div className="absolute left-1/2 top-[56%] h-12 w-5 -translate-x-1/2 rounded-b-full bg-[#22105f]" />
            </div>

            <div className="absolute -bottom-1 -right-5">
              <Heart className="h-14 w-14 fill-[#ff45b0] text-[#ff45b0] drop-shadow-[0_8px_12px_rgba(93,31,154,0.22)]" />
            </div>
          </div>
        </motion.div>

        {/* title */}
        <motion.h1
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.55 }}
          className="mt-7 text-[43px] font-black leading-none tracking-[-0.055em]"
        >
          <span className="text-[#21106f]">Date-</span>
          <span className="text-[#f02d9a]">Locked</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.75 }}
          className="mt-4 text-[16px] font-semibold text-[#6d5b86]"
        >
          Our love. Our space. Our story.
        </motion.p>

        <div className="mt-4 flex items-center gap-3 text-[#f02d9a]">
          <div className="h-px w-14 bg-white/45" />
          <Heart className="h-4 w-4 fill-[#f02d9a]" />
          <div className="h-px w-14 bg-white/45" />
        </div>

        {/* loading section */}
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 1 }}
          className="mt-[10vh] flex w-full flex-col items-center"
        >
          <div className="flex h-[78px] w-[78px] items-center justify-center rounded-full bg-white/25 shadow-[0_12px_35px_rgba(255,255,255,0.24)] backdrop-blur-md">
            <UsersRound className="h-10 w-10 fill-[#d833b6]/20 text-[#c82eb5]" />
          </div>

          <p className="mt-5 text-[16px] font-semibold text-[#43316f]">
            Preparing your couple space...
          </p>

          <div className="mt-5 flex h-6 w-full max-w-[280px] items-center rounded-full bg-white/65 px-2 shadow-[0_8px_22px_rgba(255,255,255,0.25)] backdrop-blur-md">
            <motion.div
              className="h-3.5 rounded-full bg-gradient-to-r from-[#ff477d] via-[#f02d9a] to-[#8d4cff]"
              initial={{ width: "8%" }}
              animate={{ width: "85%" }}
              transition={{ duration: 2.8, ease: "easeInOut" }}
            />
            <span className="ml-auto pr-1 text-[13px] font-black text-[#f02d9a]">
              85%
            </span>
          </div>
        </motion.div>

        {/* bottom values */}
        <motion.div
          initial={{ opacity: 0, y: 26 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 1.25 }}
          className="mt-auto grid w-full max-w-[330px] grid-cols-3 items-start gap-4 pb-3"
        >
          <div className="flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/38 shadow-[0_10px_28px_rgba(255,255,255,0.24)] backdrop-blur-md">
              <ShieldCheck className="h-8 w-8 text-[#6a35bb]" />
            </div>
            <p className="mt-3 text-[15px] font-semibold text-[#20105f]">
              Secure
            </p>
          </div>

          <div className="flex flex-col items-center border-x border-white/35">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/38 shadow-[0_10px_28px_rgba(255,255,255,0.24)] backdrop-blur-md">
              <Heart className="h-8 w-8 fill-[#f02d9a] text-[#f02d9a]" />
            </div>
            <p className="mt-3 text-[15px] font-semibold text-[#20105f]">
              Private
            </p>
          </div>

          <div className="flex flex-col items-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/38 shadow-[0_10px_28px_rgba(255,255,255,0.24)] backdrop-blur-md">
              <LockKeyhole className="h-8 w-8 text-[#7a35c9]" />
            </div>
            <p className="mt-3 text-[15px] font-semibold text-[#20105f]">
              Yours
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}