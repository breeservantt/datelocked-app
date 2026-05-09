import React from "react";

export default function DateLockedLogo({
  className = "",
}) {
  return (
    <svg
      viewBox="0 0 220 220"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient
          id="heartGradient"
          x1="30"
          y1="20"
          x2="190"
          y2="200"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#9fd0ff" />
          <stop offset="0.45" stopColor="#5e9cff" />
          <stop offset="1" stopColor="#2f6df0" />
        </linearGradient>

        <filter
          id="glow"
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
        >
          <feGaussianBlur stdDeviation="10" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* HEART */}
      <path
        d="M110 192C110 192 24 132 24 74C24 42 48 18 82 18C101 18 110 32 110 32C110 32 119 18 138 18C172 18 196 42 196 74C196 132 110 192 110 192Z"
        fill="url(#heartGradient)"
        filter="url(#glow)"
      />

      {/* LOCK BODY */}
      <rect
        x="76"
        y="92"
        width="68"
        height="56"
        rx="16"
        fill="#ffffff"
      />

      {/* LOCK TOP */}
      <path
        d="M92 92V76C92 60 100 50 110 50C120 50 128 60 128 76V92"
        stroke="#2f6df0"
        strokeWidth="10"
        strokeLinecap="round"
      />

      {/* KEYHOLE */}
      <circle
        cx="110"
        cy="118"
        r="7"
        fill="#2f6df0"
      />

      <rect
        x="106"
        y="118"
        width="8"
        height="18"
        rx="4"
        fill="#2f6df0"
      />
    </svg>
  );
}