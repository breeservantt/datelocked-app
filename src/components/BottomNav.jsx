import React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Home as HomeIcon,
  Heart,
  Image as ImageIcon,
  Target,
  MapPin,
  MessageCircle,
  Fingerprint,
} from "lucide-react";

const createPageUrl = (pageName) => {
  if (pageName === "Home") return "/home";
  return `/${pageName.toLowerCase()}`;
};

const navItems = [
  { label: "Home", icon: HomeIcon, page: "Home" },
  { label: "Dating", icon: Heart, page: "Dating" },
  { label: "Memories", icon: ImageIcon, page: "Memories" },
  { label: "Goals", icon: Target, page: "Goals" },
  { label: "NightIn", icon: MapPin, page: "NightIn" },
  { label: "Chat", icon: MessageCircle, page: "Chat" },
  { label: "Verify", icon: Fingerprint, page: "VerifyStatus" },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#ece6ea] bg-white/95 pb-[max(6px,env(safe-area-inset-bottom))] pt-1 shadow-[0_-6px_18px_rgba(15,23,42,0.05)] backdrop-blur">
      <div className="mx-auto w-full max-w-[390px] px-2">
        <div className="grid grid-cols-7 gap-0.5">
          {navItems.map((item) => {
            const href = createPageUrl(item.page);
            const active =
              location.pathname === href ||
              (href === "/" && location.pathname === "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.label}
                to={href}
                className={`flex min-h-[50px] flex-col items-center justify-center rounded-[14px] px-1 py-1 transition ${
                  active ? "bg-[#fdecef]" : "bg-transparent"
                }`}
              >
                <Icon
                  className={`mb-0.5 h-[18px] w-[18px] ${
                    active ? "text-[#ef4f75]" : "text-slate-400"
                  }`}
                  strokeWidth={2}
                />
                <span
                  className={`truncate text-[8px] leading-none tracking-[-0.01em] ${
                    active
                      ? "font-semibold text-[#ef4f75]"
                      : "font-medium text-slate-400"
                  }`}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}