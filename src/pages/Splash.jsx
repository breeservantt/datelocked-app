import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, LockKeyhole, UsersRound } from "lucide-react";

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/home");
    }, 3200);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#f7f1f4] px-2 py-2">
      <div className="relative mx-auto h-[calc(100vh-16px)] w-full max-w-[375px] overflow-hidden rounded-[16px] bg-gradient-to-b from-[#9c45ff] via-[#ff9add] to-[#d76aff] shadow-[0_6px_18px_rgba(15,23,42,0.06)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_32%,rgba(255,255,255,0.74),transparent_27%),radial-gradient(circle_at_50%_55%,rgba(255,224,247,0.70),transparent_38%),radial-gradient(circle_at_50%_100%,rgba(255,255,255,0.18),transparent_28%)]" />

        <div className="absolute -left-24 bottom-20 h-52 w-52 rounded-full bg-white/16 blur-xl" />
        <div className="absolute -right-24 bottom-20 h-52 w-52 rounded-full bg-white/16 blur-xl" />
        <div className="absolute -left-16 bottom-0 h-44 w-44 rounded-full bg-white/14 blur-xl" />
        <div className="absolute -right-16 bottom-0 h-44 w-44 rounded-full bg-white/14 blur-xl" />

        <div className="absolute left-[-18%] top-[20%] h-[140px] w-[136%] rotate-[-12deg] rounded-[100%] border border-white/45" />
        <div className="absolute left-[5%] top-[17%] h-[132px] w-[90%] rotate-[12deg] rounded-[100%] border border-white/30" />

        <motion.div
          className="absolute left-[7%] top-[12%] text-[24px] text-white"
          animate={{ scale: [1, 1.15, 1], opacity: [0.75, 1, 0.75] }}
          transition={{ duration: 2.4, repeat: Infinity }}
        >
          ✦
        </motion.div>

        <motion.div
          className="absolute right-[8%] top-[8%] text-[18px] text-white"
          animate={{ scale: [1, 1.18, 1], opacity: [0.75, 1, 0.75] }}
          transition={{ duration: 2.6, repeat: Infinity }}
        >
          ✦
        </motion.div>

        <motion.div
          className="absolute left-[20%] top-[10%] text-[22px]"
          animate={{ y: [0, -8, 0], scale: [1, 1.06, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
        >
          💗
        </motion.div>

        <motion.div
          className="absolute right-[15%] top-[14%] text-[29px]"
          animate={{ y: [0, 8, 0], rotate: [0, 6, 0] }}
          transition={{ duration: 3.2, repeat: Infinity }}
        >
          💗
        </motion.div>

        <motion.div
          className="absolute left-[12%] top-[33%] text-[25px]"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 2.8, repeat: Infinity }}
        >
          💗
        </motion.div>

        <motion.div
          className="absolute right-[17%] top-[31%] text-[20px]"
          animate={{ y: [0, -8, 0], scale: [1, 1.12, 1] }}
          transition={{ duration: 2.7, repeat: Infinity }}
        >
          💗
        </motion.div>

        <div className="absolute left-[21%] top-[5%] h-1.5 w-1.5 rotate-45 bg-white/90 shadow-[0_0_12px_rgba(255,255,255,1)]" />
        <div className="absolute right-[24%] top-[6%] h-1.5 w-1.5 rotate-45 bg-white/90 shadow-[0_0_12px_rgba(255,255,255,1)]" />
        <div className="absolute right-[18%] top-[38%] h-1.5 w-1.5 rotate-45 bg-white/90" />
        <div className="absolute left-[14%] top-[45%] h-1.5 w-1.5 rotate-45 bg-white/90" />

        <div className="relative z-10 flex h-full flex-col items-center px-7 pb-3 pt-[6vh] text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.78, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 120, damping: 14 }}
            className="relative flex h-[150px] w-[150px] items-center justify-center"
          >
            <motion.div
              className="absolute inset-0 rounded-full border-[5px] border-white/85 shadow-[0_0_38px_rgba(255,255,255,0.78)]"
              animate={{ scale: [1, 1.04, 1] }}
              transition={{ duration: 2.5, repeat: Infinity }}
            />
            <div className="absolute inset-7 rounded-full border border-white/50" />

            <div className="relative flex h-[112px] w-[150px] items-center justify-center">
  <motion.div
    animate={{ rotate: [0, 2, 0, -2, 0] }}
    transition={{ duration: 4, repeat: Infinity }}
    className="relative"
  >
    <div className="absolute inset-0 rounded-full bg-white/20 blur-xl" />

    <svg
      width="150"
      height="72"
      viewBox="0 0 150 72"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-[0_16px_20px_rgba(96,20,120,0.26)]"
    >
      <defs>
        <linearGradient id="keyGradient" x1="0" y1="0" x2="150" y2="72">
          <stop offset="0%" stopColor="#ffe0f0" />
          <stop offset="40%" stopColor="#ff9fd1" />
          <stop offset="75%" stopColor="#ff5db2" />
          <stop offset="100%" stopColor="#ff2b96" />
        </linearGradient>
      </defs>

      <circle
        cx="34"
        cy="36"
        r="28"
        stroke="url(#keyGradient)"
        strokeWidth="8"
        fill="transparent"
      />

      <circle
        cx="34"
        cy="36"
        r="7"
        fill="#ff85c4"
      />

      <rect
        x="58"
        y="31"
        width="72"
        height="10"
        rx="5"
        fill="url(#keyGradient)"
      />

      <rect
        x="118"
        y="41"
        width="10"
        height="16"
        rx="2"
        fill="#ff5aac"
      />

      <rect
        x="132"
        y="41"
        width="10"
        height="24"
        rx="2"
        fill="#ff5aac"
      />
    </svg>
  </motion.div>
</div>
          </motion.div>

          <motion.h1
  initial={{ opacity: 0, y: 14 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.55, delay: 0.55 }}
  className="mt-3 text-[34px] font-black leading-none tracking-[-0.055em]"
>
  <span className="text-[#2b0f73]">Date-</span>
  <span className="text-[#f2178f]">Locked</span>
</motion.h1>

<motion.p
  initial={{ opacity: 0, y: 12 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.55, delay: 0.72 }}
  className="mt-2 text-[13px] font-semibold text-[#3b246f]"
>
  Our love. Our space. Our story.
</motion.p>

<motion.div
  initial={{ opacity: 0, y: 12 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.55, delay: 0.86 }}
  className="mt-3 flex items-center gap-3 text-[#f2178f]"
>
  <div className="h-px w-12 bg-[#5d338f]/50" />
  <Heart className="h-5 w-5 fill-[#f2178f] text-[#f2178f] drop-shadow-[0_4px_8px_rgba(242,23,143,0.28)]" />
  <div className="h-px w-12 bg-[#5d338f]/50" />
</motion.div>

<motion.div
  initial={{ opacity: 0, y: 16 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.55, delay: 1 }}
  className="mt-4 flex w-full flex-col items-center"
>
  <p className="text-[13px] font-semibold text-[#40335d]">
    Loading your love space...
  </p>

  <div className="mt-2.5 h-2.5 w-full max-w-[220px] overflow-hidden rounded-full bg-white/75 shadow-[0_8px_20px_rgba(255,255,255,0.24)]">
    <motion.div
      className="h-full rounded-full bg-gradient-to-r from-[#ff197c] via-[#f2178f] to-[#d319d4]"
      initial={{ width: "8%" }}
      animate={{ width: "64%" }}
      transition={{ duration: 2.8, ease: "easeInOut" }}
    />
  </div>
</motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 1.12 }}
            className="mt-auto grid w-full max-w-[310px] grid-cols-3 overflow-hidden rounded-[18px] bg-white/96 px-1.5 py-2 shadow-[0_10px_22px_rgba(77,24,126,0.16)]"
          >
            <div className="flex flex-col items-center px-1 py-0.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f4ecff]">
                <Heart className="h-3 w-3 fill-[#8e35e8] text-[#8e35e8]" />
              </div>

              <p className="mt-1 text-[8.5px] font-black leading-none text-[#2b0f73]">
                Our Space
              </p>

              <p className="mt-0.5 text-center text-[6.5px] leading-[1.2] text-[#746b8c]">
                A private place
                <br />
                just for us
              </p>
            </div>

            <div className="flex flex-col items-center border-x border-[#ece4f2] px-1 py-0.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#fff0f8]">
                <LockKeyhole className="h-3 w-3 text-[#f2178f]" />
              </div>

              <p className="mt-1 text-[8.5px] font-black leading-none text-[#2b0f73]">
                Secure
              </p>

              <p className="mt-0.5 text-center text-[6.5px] leading-[1.2] text-[#746b8c]">
                Protected by
                <br />
                love & security
              </p>
            </div>

            <div className="flex flex-col items-center px-1 py-0.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f4ecff]">
                <UsersRound className="h-3 w-3 text-[#8e35e8]" />
              </div>

              <p className="mt-1 text-[8.5px] font-black leading-none text-[#2b0f73]">
                Together
              </p>

              <p className="mt-0.5 text-center text-[6.5px] leading-[1.2] text-[#746b8c]">
                Stronger together
                <br />
                every day
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}