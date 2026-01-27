"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DotGothic16, Press_Start_2P } from "next/font/google";
import styles from "../titlePlate.module.css";

type Lang = "ja" | "en";

type AnswersStore = {
  v: number;
  updatedAt: number;
  answers: Record<string, number>;
  name?: string;
  lang?: Lang;
};

const KEY_ANSWERS = "astraia:answers:v1";

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

function readStore(): AnswersStore | null {
  if (!hasWindow()) return null;
  return safeParse<AnswersStore>(localStorage.getItem(KEY_ANSWERS));
}

function writeStorePatch(patch: Partial<Pick<AnswersStore, "name" | "lang">>) {
  if (!hasWindow()) return;

  const saved = readStore();
  const next: AnswersStore = saved
    ? {
        ...saved,
        ...patch,
        updatedAt: Date.now(),
        v: saved.v ?? 1,
        answers: saved.answers ?? {},
      }
    : {
        v: 1,
        updatedAt: Date.now(),
        answers: {},
        ...patch,
      };

  localStorage.setItem(KEY_ANSWERS, JSON.stringify(next));
}

const TEXT = {
  ja: {
    title: "冒険者登録",
    desc: "診断の前に、言語と名前を決めよう",
    nameLabel: "キャラ名",
    nameHint: "空ならランダム名になります",
    random: "ランダム",
    start: "診断をはじめる",
    back: "タイトルへ戻る",
    keys: "Enterで決定 / Escで戻る / Rでランダム",
  },
  en: {
    title: "Adventurer Registration",
    desc: "Before the diagnosis, choose language and name",
    nameLabel: "Name",
    nameHint: "If empty, a random name will be used",
    random: "Random",
    start: "Start Diagnosis",
    back: "Back to Title",
    keys: "Enter: confirm / Esc: back / R: random",
  },
} as const;

function randomName(lang: Lang) {
  const JA = [
    "リョウ",
    "ハル",
    "ユウ",
    "ソラ",
    "レン",
    "カイ",
    "アオ",
    "ユイ",
    "サラ",
    "リサ",
    "ミオ",
    "ナナ",
    "アキ",
    "ヒナ",
    "ツバサ",
    "シオン",
    "レイ",
    "セナ",
    "ルナ",
    "マオ",
    "コト",
    "スズ",
    "ユズ",
    "ミナト",
    "ハヤテ",
    "カナデ",
    "トワ",
    "イツキ",
    "ユキ",
    "サツキ",
    "カエデ",
    "ノア",
    "ライ",
    "ヒカリ",
    "ツキ",
    "アサヒ",
    "ナギ",
    "コハク",
    "ハク",
    "リン",
    "サクラ",
    "ミツキ",
    "ユウト",
    "レナ",
    "マナ",
    "ヒビキ",
    "フウ",
    "ユリア",
    "セイ",
    "タクミ",
  ];

  const EN = [
    "Aiden",
    "Luna",
    "Kai",
    "Mira",
    "Rin",
    "Nova",
    "Eli",
    "Sora",
    "Aria",
    "Theo",
    "Ivy",
    "Rowan",
    "Ashe",
    "Lyra",
    "Finn",
    "Nina",
    "Jade",
    "Rey",
    "Skye",
    "Milo",
    "Eden",
    "Rhea",
    "Zane",
    "Kira",
    "Remy",
    "Leo",
    "Sage",
    "Cora",
    "Dawn",
    "Blair",
    "Ezra",
    "Ari",
    "Lior",
    "Nox",
    "Orin",
    "Vale",
    "Wren",
  ];

  const list = lang === "en" ? EN : JA;
  return list[Math.floor(Math.random() * list.length)];
}

export default function SetupPage() {
  const router = useRouter();
  const [lang, setLang] = useState<Lang>("ja");
  const [name, setName] = useState("");

  useEffect(() => {
    const saved = readStore();
    const l: Lang = saved?.lang === "en" ? "en" : "ja";
    setLang(l);
    setName(saved?.name ?? "");
  }, []);

  const t = useMemo(() => TEXT[lang], [lang]);

  const onSetLang = useCallback((l: Lang) => {
    setLang(l);
    writeStorePatch({ lang: l });
  }, []);

  const applyRandom = useCallback(() => {
    const n = randomName(lang);
    setName(n);
    writeStorePatch({ name: n, lang });
  }, [lang]);

  const goTitle = useCallback(() => {
    router.push("/");
  }, [router]);

  const goPlay = useCallback(() => {
    const finalName = name.trim() || randomName(lang);
    writeStorePatch({ name: finalName, lang });
    router.push("/play");
  }, [router, name, lang]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        goPlay();
      }
      if (e.key === "Escape") {
        e.preventDefault();
        goTitle();
      }
      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        applyRandom();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [goPlay, goTitle, applyRandom]);

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
      {/* 背景は現状維持（タイトルと同じ） */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: "url(/title/bg.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
      <div className="fixed inset-0 -z-10 bg-black/15" />

      {/* 言語ボタン（右上） */}
      <div className="fixed right-6 top-6 z-20 flex items-center gap-3">
        <button
          onClick={() => onSetLang("ja")}
          className={[
            "rounded-xl border px-4 py-2 text-sm transition",
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
            "rounded-xl border px-4 py-2 text-sm transition",
            lang === "en"
              ? "border-white/35 bg-white/20"
              : "border-white/20 bg-white/10 hover:bg-white/15",
          ].join(" ")}
        >
          English
        </button>
      </div>

      <div className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 py-14">
        <div className="w-full max-w-5xl">
          {/* 豪華プレート本体（リザルトと同系統） */}
          <div className={styles.plate}>
            <div className={styles.inner}>
              <div className="mb-6">
                <div className="text-3xl md:text-4xl">{t.title}</div>
                <div className="mt-2 text-sm text-white/85">{t.desc}</div>
              </div>

              {/* キャラ名 */}
              <div className="mb-8">
                <div className={styles.caption}>{t.nameLabel}</div>

                <div className="mt-3 flex flex-col gap-3 md:flex-row md:items-center">
                  <input
                    value={name}
                    onChange={(e) => {
                      const v = e.target.value;
                      setName(v);
                      writeStorePatch({ name: v, lang });
                    }}
                    placeholder={lang === "en" ? "Your name" : "例：リョウ"}
                    className={[
                      "w-full flex-1 rounded-2xl border px-5 py-4 text-lg outline-none",
                      "border-white/15 bg-white/10 text-white placeholder:text-white/45",
                      "backdrop-blur-md",
                    ].join(" ")}
                  />

                  <button
                    type="button"
                    onClick={applyRandom}
                    className={[styles.keyChip, "h-[52px] px-5"].join(" ")}
                  >
                    {t.random}
                  </button>
                </div>

                <div className="mt-2 text-xs text-white/70">{t.nameHint}</div>
              </div>

              {/* ボタン群 */}
              <div className="space-y-3">
                <button
                  onClick={goPlay}
                  className={[styles.option, styles.optionActive].join(" ")}
                >
                  <div className={styles.menuRow}>
                    <div className={styles.optionLine}>
                      <span className={styles.caret}>▶</span>
                      <span className="text-lg md:text-xl">{t.start}</span>
                    </div>
                    <div className={styles.rightMeta}>
                      <span className={styles.keyChip}>Enter</span>
                    </div>
                  </div>
                </button>

                <button
                  onClick={goTitle}
                  className={styles.option}
                  style={{ opacity: 0.95 }}
                >
                  <div className={styles.menuRow}>
                    <div className={styles.optionLine}>
                      <span className="opacity-75">←</span>
                      <span className="text-base md:text-lg">{t.back}</span>
                    </div>
                    <div className={styles.rightMeta}>
                      <span className={styles.keyChip}>Esc</span>
                    </div>
                  </div>
                </button>
              </div>

              <div className={styles.hint} style={{ marginTop: 14 }}>
                {t.keys}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
