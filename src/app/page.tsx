"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DotGothic16, Press_Start_2P } from "next/font/google";

type Lang = "ja" | "en";

type AnswersStore = {
  v: number;
  updatedAt: number;
  answers: Record<string, number>;
  name?: string;
  lang?: Lang;
};

const KEY_ANSWERS = "astraia:answers:v1";
const KEY_RUN = "astraia:run:v1"; // 追加：診断の進行データ

const pixelEn = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel-en",
  display: "swap",
});

const pixelJa = DotGothic16({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel-ja",
  display: "swap",
});

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

function readSavedLang(): Lang {
  if (!hasWindow()) return "ja";
  const saved = safeParse<AnswersStore>(localStorage.getItem(KEY_ANSWERS));
  return saved?.lang === "en" ? "en" : "ja";
}

function writeSavedLang(lang: Lang) {
  if (!hasWindow()) return;
  const saved = safeParse<AnswersStore>(localStorage.getItem(KEY_ANSWERS));

  // 進捗（answers）などは絶対に壊さない。lang だけ更新する。
  const next: AnswersStore = saved
    ? {
        ...saved,
        lang,
        updatedAt: Date.now(),
        v: saved.v ?? 1,
        answers: saved.answers ?? {},
      }
    : {
        v: 1,
        updatedAt: Date.now(),
        lang,
        answers: {},
      };

  localStorage.setItem(KEY_ANSWERS, JSON.stringify(next));
}

/**
 * 追加：新規診断の開始用
 * 名前/言語は保持して、回答とrun(進行データ)だけ初期化する
 * UIや他の状態は崩さない
 */
function resetForNewDiagnosisKeepProfile() {
  if (!hasWindow()) return;

  const saved = safeParse<AnswersStore>(localStorage.getItem(KEY_ANSWERS));
  if (saved) {
    const next: AnswersStore = {
      ...saved,
      updatedAt: Date.now(),
      answers: {}, // 回答だけリセット
    };
    localStorage.setItem(KEY_ANSWERS, JSON.stringify(next));
  }
  localStorage.removeItem(KEY_RUN); // 進行データを消す（10問目からになる原因）
}

const TEXT = {
  ja: {
    subtitle: "Bright classic fantasy",
    choose: "コマンドをえらべ",
    start: "はじめる",
    pressEnter: "Enterで決定",
    terms: "利用規約",
    privacy: "プライバシーポリシー",
    xLink: "Xのリンク",
  },
  en: {
    subtitle: "Bright classic fantasy",
    choose: "Choose a command",
    start: "Start",
    pressEnter: "Press Enter",
    terms: "Terms",
    privacy: "Privacy",
    xLink: "X Link",
  },
} as const;

export default function TitlePage() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("ja");

  useEffect(() => {
    setLang(readSavedLang());
  }, []);

  const t = useMemo(() => TEXT[lang], [lang]);

  const onSetLang = useCallback((l: Lang) => {
    setLang(l);
    writeSavedLang(l);
  }, []);

  // 今まで通り：タイトルからは /setup へ（ただし開始時に進行だけリセット）
  const goStart = useCallback(() => {
    resetForNewDiagnosisKeepProfile();
    router.push("/setup");
  }, [router]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        goStart();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goStart]);

  const titleShadow = useMemo<React.CSSProperties>(
    () => ({
      textShadow:
        "0 3px 0 rgba(8,20,30,.95), 3px 0 0 rgba(8,20,30,.95), -3px 0 0 rgba(8,20,30,.95), 0 -3px 0 rgba(8,20,30,.95), 3px 3px 0 rgba(8,20,30,.95), -3px 3px 0 rgba(8,20,30,.95), 3px -3px 0 rgba(8,20,30,.95), -3px -3px 0 rgba(8,20,30,.95)",
    }),
    []
  );

  return (
    <main
      className={[
        "min-h-screen text-white",
        pixelEn.variable,
        pixelJa.variable,
      ].join(" ")}
      style={{
        fontFamily:
          "var(--font-pixel-en), var(--font-pixel-ja), ui-sans-serif, system-ui",
      }}
    >
      {/* 背景 */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: "url(/title/bg.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      {/* ほんのり暗幕 */}
      <div className="fixed inset-0 -z-10 bg-black/15" />

      <header className="fixed inset-x-0 top-0 z-30">
        <div className="mx-auto w-full max-w-6xl px-4 py-4 md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/20 bg-black/25 px-3 py-3 backdrop-blur-md md:px-4">
            <nav className="flex flex-wrap items-center gap-2">
              <Link
                href="/terms"
                className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs transition hover:bg-white/15"
              >
                {t.terms}
              </Link>
              <Link
                href="/privacy"
                className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs transition hover:bg-white/15"
              >
                {t.privacy}
              </Link>
              <Link
                href="/x-link"
                className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs transition hover:bg-white/15"
              >
                {t.xLink}
              </Link>
            </nav>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onSetLang("ja")}
                className={[
                  "rounded-xl border px-4 py-2 text-xs transition backdrop-blur",
                  lang === "ja"
                    ? "border-white/35 bg-white/20"
                    : "border-white/20 bg-white/10 hover:bg-white/15",
                ].join(" ")}
              >
                日本語
              </button>
              <button
                onClick={() => onSetLang("en")}
                className={[
                  "rounded-xl border px-4 py-2 text-xs transition backdrop-blur",
                  lang === "en"
                    ? "border-white/35 bg-white/20"
                    : "border-white/20 bg-white/10 hover:bg-white/15",
                ].join(" ")}
              >
                English
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 pb-14 pt-36 md:pt-28">
        {/* タイトル */}
        <div className="text-center">
          <div
  className="leading-[1.05] px-3 md:px-0"
  style={{
    ...titleShadow,
    fontSize: "clamp(40px, 10vw, 78px)",
  }}
>
  ASTRAIA
  <br />
  DIAGNOSIS
</div>
          <div className="mt-4 text-xs text-white/85">{t.subtitle}</div>

          {/* ドットキャラ4体 */}
          <div className="mt-8 flex items-end justify-center gap-6">
            {[
              { src: "/title/knight.png", alt: "knight" },
              { src: "/title/archer.png", alt: "archer" },
              { src: "/title/mage.png", alt: "mage" },
              { src: "/title/healer.png", alt: "healer" },
            ].map((c) => (
              <Image
                key={c.src}
                src={c.src}
                alt={c.alt}
                width={96}
                height={96}
                priority
                style={{ imageRendering: "pixelated" }}
              />
            ))}
          </div>
        </div>

        {/* コマンドUI（DQ風プレート） */}
        <div className="mt-10 w-full max-w-5xl">
          {/* 外枠ゴールド */}
          <div
            className="relative rounded-[28px] p-[8px] shadow-[0_25px_90px_rgba(0,0,0,0.45)]"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,235,170,0.85), rgba(210,160,60,0.85), rgba(255,215,120,0.65))",
            }}
          >
            {/* 光沢 */}
            <div
              className="pointer-events-none absolute inset-[2px] rounded-[26px] opacity-70"
              style={{
                background:
                  "radial-gradient(800px 220px at 20% 10%, rgba(255,255,255,0.22), rgba(255,255,255,0) 60%), radial-gradient(700px 220px at 85% 12%, rgba(255,255,255,0.16), rgba(255,255,255,0) 62%)",
              }}
            />

            {/* 内側 */}
            <div
              className="relative overflow-hidden rounded-[22px] border border-black/25 px-7 py-6"
              style={{
                background:
                  "linear-gradient(180deg, rgba(60,45,18,0.68), rgba(34,26,12,0.62))",
              }}
            >
              {/* 横ライン質感 */}
              <div
                className="pointer-events-none absolute inset-0 opacity-25"
                style={{
                  background:
                    "repeating-linear-gradient(to bottom, rgba(255,255,255,0.10) 0px, rgba(255,255,255,0.10) 1px, rgba(0,0,0,0) 7px, rgba(0,0,0,0) 12px)",
                }}
              />

              <div className="relative">
                <div className="text-xs text-white/80">{t.choose}</div>

                <div className="mt-4">
                  <button
                    onClick={goStart}
                    className="group flex w-full items-center justify-between rounded-2xl border border-[#f2d57a]/25 bg-black/20 px-6 py-5 text-left transition hover:bg-black/25"
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-lg text-white/85">▶</div>
                      <div className="text-xl md:text-2xl">{t.start}</div>
                    </div>

                    {/* 右側は Enter 表示のみ（設定へは無し） */}
                    <div className="flex items-center gap-3 text-xs text-white/75">
                      <div className="rounded-lg border border-[#f2d57a]/25 bg-white/10 px-3 py-2">
                        Enter
                      </div>
                    </div>
                  </button>
                </div>

                <div className="mt-4 text-xs text-white/80">{t.pressEnter}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
