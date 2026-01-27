"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Lang = "ja" | "en";

type AnswersStore = {
  v: number;
  updatedAt: number;
  answers: Record<string, number>;
  name?: string;
  lang?: Lang;
};

const KEY_ANSWERS = "astraia:answers:v1";
const KEY_LAST = "astraia:lastResult:v1";

// ===== UI（見た目だけ）：DQ風ギルドカード =====
const GUILD_FRAME_SHADOW =
  "0 30px 80px rgba(0,0,0,.55), 0 12px 25px rgba(0,0,0,.35)";
const GUILD_BEVEL_SHADOW =
  "inset 0 1px 0 rgba(255,255,255,.35), inset 0 -2px 0 rgba(0,0,0,.35)";

const guildFrameStyle: React.CSSProperties = {
  boxShadow: GUILD_FRAME_SHADOW,
  background:
    "linear-gradient(180deg, rgba(255,236,170,.95) 0%, rgba(230,188,92,.92) 40%, rgba(138,92,18,.88) 100%)",
};

const guildInnerStyle: React.CSSProperties = {
  background:
    "linear-gradient(180deg, rgba(28,18,8,.70) 0%, rgba(52,36,16,.62) 45%, rgba(18,12,6,.72) 100%)",
  boxShadow: GUILD_BEVEL_SHADOW,
  border: "1px solid rgba(0,0,0,.25)",
  backdropFilter: "blur(14px)",
};

function hasWindow() {
  return typeof window !== "undefined";
}

function safeParse<T>(s: string | null): T | null {
  if (!s) return null;
  try {
    return JSON.parse(s) as T;
  } catch {
    return null;
  }
}

/**
 * 発行完了SE（確実に鳴らす）
 * - 既存のSE基盤があればそれも活かす
 * - さらに /se/issue_done.mp3 を直接再生
 * - 画面遷移で止まらないよう window に保持
 */
function playIssueDoneSE() {
  if (!hasWindow()) return;

  const src = "/se/issue_done.mp3";
  const w = window as any;

  // 1) 既存の仕組みがあれば呼ぶ（崩さない）
  try {
    window.dispatchEvent(
      new CustomEvent("astraia:se", { detail: { name: "issue_done", src } })
    );
  } catch {}

  try {
    if (typeof w.__astraia_playSE === "function") {
      // 実装により引数が name の場合も src の場合もあるので両方試す
      try {
        w.__astraia_playSE("issue_done");
      } catch {}
      try {
        w.__astraia_playSE(src);
      } catch {}
      try {
        w.__astraia_playSE({ name: "issue_done", src });
      } catch {}
    }
  } catch {}

  // 2) 直再生（画面遷移しても止まらないよう window に保持）
  try {
    // 既に鳴らしてる途中ならそれを止めて差し替え
    if (w.__astraia_issue_audio && typeof w.__astraia_issue_audio.pause === "function") {
      try {
        w.__astraia_issue_audio.pause();
        w.__astraia_issue_audio.currentTime = 0;
      } catch {}
    }

    const audio = new Audio(src);
    audio.preload = "auto";
    audio.volume = 1.0;

    // window に保持して unmount でも再生が継続するようにする
    w.__astraia_issue_audio = audio;

    const p = audio.play();
    if (p && typeof p.catch === "function") {
      p.catch(() => {
        // 自動再生ブロックなどは無視（既存の仕組みが鳴ってる可能性もある）
      });
    }
  } catch {
    // 失敗しても壊さない
  }
}

const TEXT = {
  ja: {
    title: "ギルドカード発行中",
    sub: "冒険者登録を処理しています…",
    hint: "まもなく結果が表示されます",
    badge: "GUILD OFFICE",
    stamp: "APPROVED",
    nameLabel: "冒険者名",
  },
  en: {
    title: "Issuing Guild Card",
    sub: "Registering adventurer profile…",
    hint: "Your result will appear soon",
    badge: "GUILD OFFICE",
    stamp: "APPROVED",
    nameLabel: "Adventurer",
  },
} as const;

export default function IssuingPage() {
  const router = useRouter();

  const [lang, setLang] = useState<Lang>("ja");
  const [name, setName] = useState<string>("");

  useEffect(() => {
    if (!hasWindow()) return;

    // lang / name の表示用だけ取得（無ければ無理にいじらない）
    const last = safeParse<any>(localStorage.getItem(KEY_LAST));
    if (last) {
      setLang(last.lang === "en" ? "en" : "ja");
      setName(String(last.name ?? ""));
    } else {
      const saved = safeParse<AnswersStore>(localStorage.getItem(KEY_ANSWERS));
      setLang(saved?.lang === "en" ? "en" : "ja");
      setName(String(saved?.name ?? ""));
    }

    const t = window.setTimeout(() => {
      // ここが今回の修正：確実に issue_done.mp3 を鳴らす
      playIssueDoneSE();
      router.push("/result");
    }, 1100);

    return () => window.clearTimeout(t);
  }, [router]);

  const t = useMemo(() => TEXT[lang], [lang]);

  const displayName =
    name?.trim() ? name.trim() : lang === "en" ? "Nameless" : "名無し";

  return (
    <main className="min-h-screen text-white">
      {/* 背景：今の流れを崩さない（playと同系統） */}
      <div
        className="min-h-screen"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.28),rgba(0,0,0,0.28)),url('/play/bg.jpg'),url('/play/bg.png'),url('/title/bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
        }}
      >
        {/* ほんのりビネット */}
        <div className="pointer-events-none fixed inset-0 opacity-70 [background:radial-gradient(1200px_600px_at_50%_40%,rgba(0,0,0,0)_0%,rgba(0,0,0,.35)_70%,rgba(0,0,0,.55)_100%)]" />

        <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-4 py-10">
          {/* 金縁ギルドカード */}
          <div className="w-full max-w-3xl">
            <div className="relative rounded-[28px] p-[10px]" style={guildFrameStyle}>
              <div className="pointer-events-none absolute inset-[6px] rounded-[22px] border border-yellow-100/40" />
              <div className="pointer-events-none absolute inset-[10px] rounded-[18px] border border-black/20" />

              <div className="relative overflow-hidden rounded-[20px]" style={guildInnerStyle}>
                {/* スキャンライン */}
                <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background:repeating-linear-gradient(0deg,rgba(255,255,255,.10)_0px,rgba(255,255,255,.10)_1px,rgba(0,0,0,0)_4px,rgba(0,0,0,0)_8px)]" />
                {/* 金の照り */}
                <div className="pointer-events-none absolute inset-0 opacity-40 [background:radial-gradient(900px_240px_at_50%_0%,rgba(255,220,120,.35)_0%,rgba(255,220,120,0)_70%)]" />

                <div className="relative px-8 py-8">
                  {/* ヘッダー行 */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[12px] tracking-[0.22em] text-yellow-50/80">
                        {t.badge}
                      </div>
                      <div className="mt-2 text-3xl font-semibold text-white drop-shadow-[0_2px_0_rgba(0,0,0,.55)]">
                        {t.title}
                      </div>
                      <div className="mt-2 text-sm text-yellow-50/75">
                        {t.sub}
                      </div>
                    </div>

                    {/* スタンプっぽい装飾 */}
                    <div className="shrink-0">
                      <div
                        className="rotate-[-10deg] rounded-2xl px-4 py-3 text-center"
                        style={{
                          border: "1px solid rgba(255,236,170,.25)",
                          background:
                            "linear-gradient(180deg, rgba(255,255,255,.08) 0%, rgba(0,0,0,.20) 100%)",
                          boxShadow:
                            "inset 0 1px 0 rgba(255,255,255,.12), inset 0 -1px 0 rgba(0,0,0,.35)",
                        }}
                      >
                        <div className="text-[11px] tracking-[0.22em] text-yellow-50/80">
                          {t.stamp}
                        </div>
                        <div className="mt-1 text-xs text-yellow-50/65">
                          ASTRAIA
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 冒険者名 */}
                  <div className="mt-6 rounded-2xl border border-yellow-100/20 bg-white/5 px-5 py-4">
                    <div className="text-xs text-yellow-50/70">{t.nameLabel}</div>
                    <div className="mt-1 text-lg text-white drop-shadow-[0_2px_0_rgba(0,0,0,.55)]">
                      {displayName}
                    </div>
                  </div>

                  {/* ローディング演出 */}
                  <div className="mt-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-[12px] text-yellow-50/70">{t.hint}</div>
                      <div className="flex items-center gap-2 text-yellow-50/70">
                        <span className="inline-block h-2 w-2 rounded-full bg-yellow-100/50 animate-pulse" />
                        <span
                          className="inline-block h-2 w-2 rounded-full bg-yellow-100/40 animate-pulse"
                          style={{ animationDelay: "120ms" }}
                        />
                        <span
                          className="inline-block h-2 w-2 rounded-full bg-yellow-100/30 animate-pulse"
                          style={{ animationDelay: "240ms" }}
                        />
                      </div>
                    </div>

                    {/* 進捗バー（フェイクでも気分が上がる） */}
                    <div className="mt-3 h-2 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full bg-yellow-100/45"
                        style={{
                          width: "55%",
                          animation: "astraiaIssuing 1.1s ease-in-out infinite",
                        }}
                      />
                    </div>

                    <style>{`
                      @keyframes astraiaIssuing {
                        0% { transform: translateX(-60%); opacity: .55; }
                        50% { transform: translateX(10%); opacity: 1; }
                        100% { transform: translateX(120%); opacity: .55; }
                      }
                    `}</style>
                  </div>

                  {/* フッター小テキスト */}
                  <div className="mt-6 text-[11px] text-white/35">
                    debug: issuing / next=/result
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* /金縁ギルドカード */}
        </div>
      </div>
    </main>
  );
}
