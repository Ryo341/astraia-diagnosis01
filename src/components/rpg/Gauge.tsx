"use client";

export function Gauge({
  label,
  value,
  max,
  right
}: {
  label: string;
  value: number;
  max: number;
  right?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));

  return (
    <div className="flex items-center gap-3">
      <div className="w-16 text-xs opacity-80 pixel">{label}</div>
      <div className="flex-1 h-3 rounded-full border overflow-hidden">
        <div className="h-full bg-white/80" style={{ width: `${pct}%` }} />
      </div>
      <div className="w-16 text-right text-xs opacity-80 pixel">{right ?? `${value}/${max}`}</div>
    </div>
  );
}
