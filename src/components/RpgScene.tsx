import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  bgSrc?: string; // public 配下のパス 例: "/title_dot1-768x432.jpg"
};

export default function RpgScene({ children, bgSrc = "/title_dot1-768x432.jpg" }: Props) {
  return (
    <div className="min-h-screen relative overflow-hidden bg-black text-white">
      {/* Background */}
      <div
        className="absolute inset-0 bg-center bg-cover opacity-60"
        style={{ backgroundImage: `url(${bgSrc})` }}
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-black/55 to-black/75" />
      {/* Vignette */}
      <div className="absolute inset-0 pointer-events-none [box-shadow:inset_0_0_140px_rgba(0,0,0,0.95)]" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-10">
        {children}
      </div>
    </div>
  );
}
