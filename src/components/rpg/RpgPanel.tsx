"use client";

export function RpgPanel({
  title,
  subtitle,
  right,
  children
}: {
  title: string;
  subtitle?: string;
  right?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rpg-frame p-5 space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs opacity-70 pixel">{subtitle ?? "ASTRAIA STATUS v1.0"}</div>
          <div className="text-xl font-bold pixel">{title}</div>
        </div>
        {right ? <div className="text-xs opacity-70 pixel">{right}</div> : null}
      </header>
      {children}
    </section>
  );
}
