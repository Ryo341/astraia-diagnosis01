"use client";

export function RpgButton({
  children,
  onClick,
  variant = "primary"
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost";
}) {
  const base =
    "pixel rounded-lg px-4 py-2 border transition active:translate-y-[1px]";

  const cls =
    variant === "primary"
      ? `${base} bg-white/10 hover:bg-white/15 border-white/40`
      : `${base} bg-transparent hover:bg-white/10 border-white/25`;

  return (
    <button className={cls} onClick={onClick}>
      {children}
    </button>
  );
}
