"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";

import questionsData from "../../data/questions.json";

type Lang = "ja" | "en";
type LangText = string | { ja?: string; en?: string } | null | undefined;

type AnswersStore = {
  v: number;
  updatedAt: number;
  answers: Record<string, number>; // key: question index (string), value: choice index
  name?: string;
  lang?: Lang;
};

type RunStore = {
  v: number;
  createdAt: number;
  order: number[]; // question indices
  cursor: number;
  totalAsk: number;
  poolSize: number;
};

const KEY_ANSWERS = "astraia:answers:v1";
const KEY_LAST = "astraia:lastResult:v1";
const KEY_RUN = "astraia:run:v1";

const POOL_SIZE = 30;
const TOTAL_ASK_DEFAULT = 10;

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

function getText(v: LangText, lang: Lang): string {
  if (!v) return "";
  if (typeof v === "string") return v;
  const pick = (lang === "en" ? v.en : v.ja) ?? v.ja ?? v.en;
  return typeof pick === "string" ? pick : "";
}

function shuffle(nums: number[]) {
  const a = [...nums];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const t = a[i];
    a[i] = a[j];
    a[j] = t;
  }
  return a;
}

function getQuestions(): any[] {
  const qs = (questionsData as any)?.questions;
  return Array.isArray(qs) ? qs : [];
}

function loadAnswersStore(): AnswersStore | null {
  if (!hasWindow()) return null;
  return safeParse<AnswersStore>(localStorage.getItem(KEY_ANSWERS));
}

function saveAnswersStore(store: AnswersStore) {
  if (!hasWindow()) return;
  localStorage.setItem(KEY_ANSWERS, JSON.stringify(store));
}

function loadRunStore(): RunStore | null {
  if (!hasWindow()) return null;
  return safeParse<RunStore>(localStorage.getItem(KEY_RUN));
}

function saveRunStore(run: RunStore) {
  if (!hasWindow()) return;
  localStorage.setItem(KEY_RUN, JSON.stringify(run));
}

function resetAnswersKeepProfile() {
  if (!hasWindow()) return;
  const cur = loadAnswersStore();
  if (!cur) return;
  const next: AnswersStore = {
    ...cur,
    updatedAt: Date.now(),
    answers: {},
  };
  saveAnswersStore(next);
  localStorage.removeItem(KEY_LAST);
}

function clearRun() {
  if (!hasWindow()) return;
  localStorage.removeItem(KEY_RUN);
}

function scoreFromAnswers(answers: Record<string, number>) {
  const questions = getQuestions();
  const scores: Record<string, number> = {};
  let totalPoints = 0;

  for (let i = 0; i < questions.length; i++) {
    const ci = answers[String(i)];
    if (ci === undefined) continue;

    const c = questions[i]?.choices?.[ci];
    const pts = (c?.points ?? {}) as Record<string, number>;
    for (const [k, v] of Object.entries(pts)) {
      const n = Number(v) || 0;
      scores[k] = (scores[k] || 0) + n;
      totalPoints += n;
    }
  }

  const level = Math.max(1, Math.floor(totalPoints / 5) + 1);
  return { scores, totalPoints, level };
}

function formatPoints(pts: any): string {
  if (!pts || typeof pts !== "object") return "";
  const entries = Object.entries(pts)
    .map(([k, v]) => [String(k), Number(v) || 0] as const)
    .filter(([, v]) => v !== 0);

  if (entries.length === 0) return "";
  return entries
    .map(([k, v]) => `${k} ${v > 0 ? `+${v}` : `${v}`}`)
    .join(" ");
}

/**
 * 外側：Suspenseで包む（ビルド用）
 */
export default function PlayPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen text-white">
          <div className="min-h-screen flex items-center justify-center text-white/70">
            Loading...
          </div>
        </main>
      }
    >
      <PlayPageInner />
    </Suspense>
  );
}

/**
 * 内側：ロジックは触らず、見た目だけDQ風へ統一
 */
function PlayPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const qs = useMemo(() => getQuestions(), []);
  const totalAvailable = qs.length;

  const [lang, setLang] = useState<Lang>("ja");
  const [name, setName] = useState<string>("");

  const [run, setRun] = useState<RunStore | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const [selected, setSelected] = useState(0);
  const [phase, setPhase] = useState<"init" | "load" | "ok" | "done" | "error">(
    "init"
  );

  const keyLockRef = useRef(false);

  const totalAsk = useMemo(() => {
    if (!run) return Math.min(TOTAL_ASK_DEFAULT, totalAvailable || TOTAL_ASK_DEFAULT);
    return Math.min(run.totalAsk, run.order.length);
  }, [run, totalAvailable]);

  const answeredCount = useMemo(() => {
    if (!run) return 0;
    const slice = run.order.slice(0, totalAsk);
    let n = 0;
    for (const qi of slice) {
      if (answers[String(qi)] !== undefined) n++;
    }
    return n;
  }, [run, answers, totalAsk]);

  const progressPct = useMemo(() => {
    if (totalAsk <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((answeredCount / totalAsk) * 100)));
  }, [answeredCount, totalAsk]);

  const ensureRun = useCallback(
    (forceNew: boolean) => {
      if (!hasWindow()) return;

      const questions = qs;
      if (!Array.isArray(questions) || questions.length === 0) {
        setPhase("error");
        return;
      }

      const answersStore = loadAnswersStore();
      if (!answersStore) {
        router.replace("/setup");
        return;
      }

      const l: Lang = answersStore.lang === "en" ? "en" : "ja";
      setLang(l);
      setName(String(answersStore.name ?? ""));
      setAnswers(answersStore.answers ?? {});

      let r = loadRunStore();
      const needsNew =
        forceNew ||
        !r ||
        !Array.isArray(r.order) ||
        r.order.length === 0 ||
        typeof r.cursor !== "number" ||
        r.cursor < 0;

      if (needsNew) {
        const all = Array.from({ length: questions.length }, (_, i) => i);
        const shuffled = shuffle(all);
        const pool = shuffled.slice(0, Math.min(POOL_SIZE, questions.length));
        const totAsk = Math.min(TOTAL_ASK_DEFAULT, pool.length);

        r = {
          v: 1,
          createdAt: Date.now(),
          order: pool,
          cursor: 0,
          totalAsk: totAsk,
          poolSize: pool.length,
        };

        saveRunStore(r);
      }

      setRun(r);
      setSelected(0);
      setPhase("ok");
    },
    [qs, router]
  );

  useEffect(() => {
    if (!hasWindow()) return;

    setPhase("load");

    const reset = searchParams?.get("reset") === "1";
    if (reset) {
      resetAnswersKeepProfile();
      clearRun();
      ensureRun(true);
      router.replace("/play");
      return;
    }

    ensureRun(false);
  }, [ensureRun, router, searchParams]);

  const currentQIndex = useMemo(() => {
    if (!run) return null;
    const idx = run.order[run.cursor];
    return typeof idx === "number" ? idx : null;
  }, [run]);

  const currentQ = useMemo(() => {
    if (currentQIndex === null) return null;
    return qs[currentQIndex] ?? null;
  }, [qs, currentQIndex]);

  const choices = useMemo(() => {
    const c = (currentQ as any)?.choices;
    return Array.isArray(c) ? c : [];
  }, [currentQ]);

  // 質問文が text 側に無いデータでも title 側をメインに出す
  const rawTitle = useMemo(() => {
    if (!currentQ) return "";
    return (
      getText((currentQ as any)?.title, lang) ||
      getText((currentQ as any)?.questionTitle, lang) ||
      getText((currentQ as any)?.caption, lang) ||
      getText((currentQ as any)?.label, lang)
    );
  }, [currentQ, lang]);

  const rawText = useMemo(() => {
    if (!currentQ) return "";
    return (
      getText((currentQ as any)?.text, lang) ||
      getText((currentQ as any)?.question, lang) ||
      getText((currentQ as any)?.prompt, lang) ||
      getText((currentQ as any)?.body, lang)
    );
  }, [currentQ, lang]);

  const primaryText = rawText || rawTitle;
  const secondaryTitle = rawText && rawTitle && rawText !== rawTitle ? rawTitle : "";

  const persistAnswer = useCallback((qIndex: number, choiceIndex: number) => {
    const store = loadAnswersStore();
    if (!store) return;

    const next: AnswersStore = {
      ...store,
      updatedAt: Date.now(),
      answers: {
        ...(store.answers ?? {}),
        [String(qIndex)]: choiceIndex,
      },
    };

    saveAnswersStore(next);
    setAnswers(next.answers);
  }, []);

  const finalize = useCallback(() => {
    const store = loadAnswersStore();
    if (!store) return;

    const { scores, totalPoints, level } = scoreFromAnswers(store.answers ?? {});
    localStorage.setItem(
      KEY_LAST,
      JSON.stringify({
        v: 1,
        ts: Date.now(),
        lang: store.lang === "en" ? "en" : "ja",
        name: String(store.name ?? ""),
        scores,
        totalPoints,
        level,
        answered: Object.keys(store.answers ?? {}).length,
        total: totalAvailable,
      })
    );

    setPhase("done");
    router.push("/issuing");
  }, [router, totalAvailable]);

  const goTitle = useCallback(() => {
    localStorage.removeItem(KEY_LAST);
    clearRun();
    router.push("/");
  }, [router]);

  const goSetup = useCallback(() => {
    router.push("/setup");
  }, [router]);

  const startOver = useCallback(() => {
    resetAnswersKeepProfile();
    clearRun();
    ensureRun(true);
    router.replace("/play");
  }, [ensureRun, router]);

  const confirm = useCallback(() => {
    if (!run) return;
    if (currentQIndex === null) return;
    if (!currentQ) return;
    if (!Array.isArray(choices) || choices.length === 0) return;

    const choiceIndex = Math.max(0, Math.min(choices.length - 1, selected));
    persistAnswer(currentQIndex, choiceIndex);

    const nextCursor = run.cursor + 1;
    const tot = Math.min(run.totalAsk, run.order.length);

    if (nextCursor >= tot) {
      finalize();
      return;
    }

    const nextRun: RunStore = { ...run, cursor: nextCursor };
    saveRunStore(nextRun);
    setRun(nextRun);
    setSelected(0);
  }, [choices, currentQ, currentQIndex, finalize, persistAnswer, run, selected]);

  useEffect(() => {
    if (!hasWindow()) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (keyLockRef.current) return;

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelected((s) => Math.max(0, s - 1));
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelected((s) => Math.min(Math.max(0, choices.length - 1), s + 1));
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        keyLockRef.current = true;
        try {
          confirm();
        } finally {
          setTimeout(() => {
            keyLockRef.current = false;
          }, 120);
        }
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        goTitle();
        return;
      }

      if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        startOver();
        return;
      }
    };

    window.addEventListener("keydown", onKeyDown, { passive: false });
    return () => window.removeEventListener("keydown", onKeyDown as any);
  }, [choices.length, confirm, goTitle, startOver]);

  const topLabel = "ASTRAIA DIAGNOSIS";
  const cmdLabel = lang === "en" ? "Choose a command" : "コマンドをえらべ";
  const startOverLabel = lang === "en" ? "Restart" : "最初から";
  const titleLabel = lang === "en" ? "Back to Title" : "タイトルへ";
  const setupLabel = lang === "en" ? "Setup" : "設定へ";
  const enterHint =
    lang === "en"
      ? "↑↓ Select / Enter Confirm / Esc Title / R Restart"
      : "↑↓で選択 / Enterで決定 / Escでタイトルへ / Rで最初から";

  const qNum = Math.min(answeredCount + 1, totalAsk);
  const headerProgress =
    totalAsk > 0
      ? `Q${qNum}/${totalAsk} - ${progressPct}%`
      : lang === "en"
        ? "Loading..."
        : "読み込み中...";

  return (
    <main className="min-h-screen w-full text-white">
      {/* 背景（既存の設定は維持） */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.35),rgba(0,0,0,0.35)),url('/play/bg.jpg'),url('/play/bg.png'),url('/title/bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundAttachment: "fixed",
          filter: "saturate(1.08) contrast(1.05)",
        }}
      />
      {/* リザルトと同系統のベール */}
      <div className="fixed inset-0 -z-10 bg-black/15" />
      <div
        className="fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(1200px 700px at 50% 10%, rgba(255,214,120,0.18), rgba(0,0,0,0) 55%)",
        }}
      />
      <div
        className="fixed inset-0 -z-10"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.08), rgba(0,0,0,0.28), rgba(0,0,0,0.38))",
        }}
      />

      <div className="mx-auto w-[96%] max-w-[1180px] py-10">
        {/* 金縁フレーム（リザルトと統一） */}
        <div
          className="relative rounded-[34px] p-[10px] shadow-[0_25px_90px_rgba(0,0,0,0.55)]"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,235,170,0.85), rgba(210,160,60,0.85), rgba(255,215,120,0.65))",
          }}
        >
          {/* 角の光沢 */}
          <div
            className="pointer-events-none absolute inset-[2px] rounded-[32px] opacity-70"
            style={{
              background:
                "radial-gradient(800px 260px at 20% 10%, rgba(255,255,255,0.28), rgba(255,255,255,0) 60%), radial-gradient(700px 240px at 85% 12%, rgba(255,255,255,0.20), rgba(255,255,255,0) 62%)",
            }}
          />

          {/* 内側ベベル */}
          <div
            className="relative rounded-[26px] overflow-hidden border border-black/25"
            style={{
              background:
                "linear-gradient(180deg, rgba(60,45,18,0.78), rgba(34,26,12,0.70))",
            }}
          >
            {/* 薄い横ラインでDQっぽい質感 */}
            <div
              className="pointer-events-none absolute inset-0 opacity-25"
              style={{
                background:
                  "repeating-linear-gradient(to bottom, rgba(255,255,255,0.10) 0px, rgba(255,255,255,0.10) 1px, rgba(0,0,0,0) 7px, rgba(0,0,0,0) 12px)",
              }}
            />

            {/* 上部ゴールドバー */}
            <div className="relative px-6 py-4 border-b border-white/10">
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(255,226,140,0.22), rgba(255,200,90,0.12), rgba(0,0,0,0))",
                }}
              />
              <div className="relative flex items-start justify-between gap-4">
                <div className="text-white/85">
                  <div className="text-[12px] tracking-[0.22em] text-white/70">
                    {topLabel}
                  </div>
                  <div className="mt-1 text-sm text-white/70">{headerProgress}</div>
                </div>

                <div className="text-right text-white/85 text-sm">
                  <div className="text-xs text-white/70">
                    {lang === "en" ? "Name" : "名前"}
                  </div>
                  <div className="text-lg font-semibold text-white">
                    {name || (lang === "en" ? "Nameless" : "名無し")}
                  </div>
                  <button
                    onClick={goSetup}
                    className="mt-2 inline-flex items-center justify-center rounded-xl border border-[#f2d57a]/25 bg-white/10 px-4 py-2 text-xs hover:bg-white/15 transition"
                  >
                    {setupLabel}
                  </button>
                </div>
              </div>
            </div>

            {/* 本体 */}
            <div className="p-6">
              <div className="rounded-2xl border border-[#f2d57a]/20 bg-black/25 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs tracking-wider text-white/75">{cmdLabel}</div>
                  <div className="text-xs text-white/60">{enterHint}</div>
                </div>

                <div className="mt-3 text-2xl md:text-3xl font-semibold text-white/95 leading-snug">
                  {primaryText || (lang === "en" ? "(Question text empty)" : "（質問テキストが空）")}
                </div>

                {secondaryTitle ? (
                  <div className="mt-2 text-sm text-white/70">{secondaryTitle}</div>
                ) : null}

                <div className="mt-4 h-3 rounded-full bg-white/10 border border-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${progressPct}%`,
                      background:
                        "linear-gradient(90deg, rgba(255,238,170,0.95), rgba(255,196,92,0.78), rgba(255,255,255,0.10))",
                    }}
                  />
                </div>

                {phase === "error" ? (
                  <div className="mt-4 text-white/80">
                    {lang === "en" ? "Failed to load questions." : "質問が読み込めなかった…"}
                  </div>
                ) : null}

                {Array.isArray(choices) && choices.length > 0 ? (
                  <div className="mt-5 space-y-3">
                    {choices.map((c: any, i: number) => {
                      const isActive = i === selected;
                      const label =
                        getText(c?.text, lang) ||
                        getText(c?.label, lang) ||
                        getText(c?.title, lang) ||
                        (lang === "en" ? "(No text)" : "（選択肢テキストなし）");
                      const pts = formatPoints(c?.points);

                      return (
                        <button
                          key={i}
                          onClick={() => {
                            if (i === selected) confirm();
                            else setSelected(i);
                          }}
                          className={[
                            "w-full text-left rounded-2xl border transition px-5 py-4",
                            isActive
                              ? "border-[#f2d57a]/60 bg-white/10 shadow-[0_0_0_2px_rgba(242,213,122,0.18)_inset]"
                              : "border-[#f2d57a]/18 bg-black/20 hover:bg-black/25",
                          ].join(" ")}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-start gap-3">
                              <div
                                className={[
                                  "mt-1 h-3 w-3 rounded-full border",
                                  isActive
                                    ? "border-[#f2d57a]/80 bg-white/10"
                                    : "border-white/35",
                                ].join(" ")}
                              />
                              <div>
                                <div className="text-base text-white/95">{label}</div>
                                {pts ? (
                                  <div className="mt-1 text-xs text-white/70">{pts}</div>
                                ) : null}
                              </div>
                            </div>
                            {isActive ? <div className="text-xs text-white/60">Enter</div> : null}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-4 text-white/70">
                    {lang === "en" ? "No choices." : "選択肢がない…"}
                  </div>
                )}

                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                  <button
                    onClick={startOver}
                    className="rounded-xl border border-[#f2d57a]/25 bg-white/10 px-5 py-3 text-sm hover:bg-white/15 transition"
                  >
                    {startOverLabel}
                  </button>

                  <button
                    onClick={goTitle}
                    className="rounded-xl border border-[#f2d57a]/25 bg-white/10 px-5 py-3 text-sm hover:bg-white/15 transition"
                  >
                    {titleLabel}
                  </button>
                </div>

                <div className="mt-4 text-[11px] text-white/35">
                  debug: run={phase} / answered={answeredCount}/{totalAsk} / pool={run?.order?.length ?? 0} / cursor=
                  {run?.cursor ?? 0}
                </div>
              </div>
            </div>

            {/* 下端の薄い金ライン */}
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px]"
              style={{
                background:
                  "linear-gradient(90deg, rgba(255,235,170,0), rgba(255,235,170,0.55), rgba(255,235,170,0))",
              }}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
