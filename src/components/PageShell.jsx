import React from "react";

export default function PageShell({
  children,
  className = "",
  contentClassName = "",
  showBottomNav = false,
  bottomNav = null,
  backgroundClassName = "bg-gradient-to-b from-rose-50 via-white to-pink-50",
}) {
  return (
    <div className={`h-screen w-full ${backgroundClassName} flex justify-center overflow-hidden`}>
      <div
        className={`relative flex h-screen w-full max-w-[480px] flex-col overflow-hidden bg-transparent ${className}`}
      >
        <main
          className={`flex-1 overflow-y-auto px-3 pt-3 ${
            showBottomNav || bottomNav ? "pb-24" : "pb-6"
          } ${contentClassName}`}
        >
          {children}
        </main>

        {(showBottomNav || bottomNav) && (
          <div className="absolute bottom-0 left-0 right-0 z-50 border-t border-rose-100 bg-white/95 backdrop-blur-sm">
            {bottomNav}
          </div>
        )}
      </div>
    </div>
  );
}