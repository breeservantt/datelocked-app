import React from "react";

export default function PageShell({
  children,
  maxWidth = "max-w-sm",
  centered = false,
  padded = true,
  className = "",
  contentClassName = "",
}) {
  return (
    <div className={`min-h-screen bg-gradient-to-b from-rose-50 via-white to-pink-50 ${className}`}>
      <div
        className={[
          "mx-auto w-full",
          maxWidth,
          padded ? "px-4 py-6" : "",
          centered ? "min-h-screen flex items-center justify-center" : "",
        ].join(" ")}
      >
        <div className={contentClassName}>{children}</div>
      </div>
    </div>
  );
}