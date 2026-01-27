"use client";

import { useEffect, useRef } from "react";

type SfxKey = "click";

const SFX_FILES: Record<SfxKey, string> = {
  click: "/se/click.mp3",
};

function closestInteractive(el: HTMLElement | null): HTMLElement | null {
  if (!el) return null;

  // 入力中に鳴るのうざいので除外
  const inInput = el.closest('input, textarea, select, [contenteditable="true"]');
  if (inInput) return null;

  // ボタン/リンク/role=button などを対象にする
  return (
    el.closest("button") ||
    el.closest('a[href]') ||
    el.closest('[role="button"]') ||
    el.closest('input[type="button"], input[type="submit"]')
  ) as HTMLElement | null;
}

export default function SfxGlobal() {
  const audiosRef = useRef<Partial<Record<SfxKey, HTMLAudioElement>>>({});

  useEffect(() => {
    // 音を事前に作っておく（初回クリックで遅延しにくい）
    const aClick = new Audio(SFX_FILES.click);
    aClick.preload = "auto";
    aClick.volume = 0.5;

    audiosRef.current.click = aClick;

    const onPointerDown = (e: PointerEvent) => {
      // 左クリック/タップだけ
      if (e.button !== 0) return;

      const target = e.target as HTMLElement | null;
      const hit = closestInteractive(target);
      if (!hit) return;

      const a = audiosRef.current.click;
      if (!a) return;

      try {
        a.currentTime = 0;
        void a.play();
      } catch {
        // 無音でOK（ブラウザ制限など）
      }
    };

    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, []);

  return null;
}
