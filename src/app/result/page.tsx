"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

import CLASSES_JSON from "@/data/classes.json";

type Lang = "ja" | "en";
type Scores = Record<string, number>;

type ClassRecord = {
  id: string;
  title?: { ja?: string; en?: string };
  share_text?: { ja?: string; en?: string };
  desc?: { ja?: string; en?: string };

  image?: string;
  portrait?: string;
  mini?: string;

  axes?: string[];
  scoreKeys?: string[];
  tags?: string[];

  [k: string]: unknown;
};

type LastResult = {
  v?: number;
  ts?: number;
  lang?: Lang | string;
  name?: string;
  scores?: Scores | Record<string, unknown>;
  totalPoints?: number;
  level?: number;
  answered?: number;
  total?: number;
};

const KEY_LAST = "astraia:lastResult:v1";

const UI = {
  ja: {
    guild: "冒険者ギルド",
    card: "ギルドカード",
    classInfo: "クラス紹介",
    memo: "性格メモ",
    status: "STATUS",
    name: "名前",
    id: "ID",
    total: "総合ポイント",
    copy: "SNSにシェア",
    again: "もう一回",
    title: "タイトルへ",
    hint: "Enterで決定 / Escでタイトルへ",
    missing: "診断結果が見つからないよ…（タイトルへ戻って再診断してね）",
    strength: "強み",
    caution: "注意点",
    style: "戦闘スタイル",
    synergy: "相性",
    hp: "HP",
    mp: "MP",
    atk: "攻撃力",
    def: "防御力",
    agi: "素早さ",
  },
  en: {
    guild: "Adventurers Guild",
    card: "Guild Card",
    classInfo: "Class Info",
    memo: "Notes",
    status: "STATUS",
    name: "Name",
    id: "ID",
    total: "Total Points",
    copy: "Share",
    again: "Again",
    title: "Back to title",
    hint: "Enter: confirm / Esc: title",
    missing: "No result found… (go back to title and run again)",
    strength: "Strength",
    caution: "Caution",
    style: "Combat Style",
    synergy: "Synergy",
    hp: "HP",
    mp: "MP",
    atk: "ATK",
    def: "DEF",
    agi: "AGI",
  },
} as const;

const AXIS_LABEL: Record<string, { ja: string; en: string }> = {
  emp: { ja: "共感", en: "Empathy" },
  soc: { ja: "社交", en: "Social" },
  int: { ja: "直感", en: "Intuition" },
  ord: { ja: "規律", en: "Order" },
  adv: { ja: "冒険", en: "Adventure" },
  exp: { ja: "表現", en: "Expression" },
  res: { ja: "回復", en: "Recovery" },
  shd: { ja: "影", en: "Shadow" },
};

function toScores(input: unknown): Scores {
  if (!input || typeof input !== "object") return {};
  const obj = input as Record<string, unknown>;
  const out: Scores = {};
  for (const [k, v] of Object.entries(obj)) {
    const n = typeof v === "number" ? v : Number(v);
    if (Number.isFinite(n)) out[k] = n;
  }
  return out;
}

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function hashStr(s: string, seed: number) {
  let h = seed | 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h >>> 0;
}

function seeded01(seed: number) {
  let x = seed | 0;
  x ^= x << 13;
  x ^= x >> 17;
  x ^= x << 5;
  return ((x >>> 0) % 100000) / 100000;
}

function stableIdFrom(ts: number, name: string) {
  const h = hashStr(`${ts}:${name}`, ts);
  return String(h % 100000000).padStart(8, "0");
}

function pickTopAxes(scores: Scores, seed: number) {
  const entries = Object.entries(scores).filter(([, v]) => Number.isFinite(v));
  entries.sort((a, b) => {
    const dv = (b[1] as number) - (a[1] as number);
    if (dv !== 0) return dv;
    return hashStr(a[0], seed) - hashStr(b[0], seed);
  });
  const topA = entries[0]?.[0];
  const topB = entries[1]?.[0];
  const low = entries[entries.length - 1]?.[0];
  return { topA, topB, low };
}

function matchClassByAxes(classes: ClassRecord[], a: string, b: string) {
  const sig1 = `${a}-${b}`;
  const sig2 = `${b}-${a}`;

  return (
    classes.find((c: any) => c.id === sig1 || c.id === sig2) ||
    classes.find((c: any) => {
      const arr: unknown = c.axes ?? c.scoreKeys;
      return (
        Array.isArray(arr) &&
        arr.length >= 2 &&
        ((arr[0] === a && arr[1] === b) || (arr[0] === b && arr[1] === a))
      );
    }) ||
    classes.find((c: any) => Array.isArray(c.tags) && c.tags.includes(a) && c.tags.includes(b)) ||
    null
  );
}

function pickClass(classes: ClassRecord[], scoresRaw: unknown, seed: number) {
  const scores = toScores(scoresRaw);
  const { topA, topB, low } = pickTopAxes(scores, seed);

  if (!classes.length) return { picked: null as any, scores, topA, topB, low };
  if (!topA || !topB) return { picked: classes[0], scores, topA, topB, low };

  const found = matchClassByAxes(classes, topA, topB);
  if (found) return { picked: found, scores, topA, topB, low };

  const idx = hashStr(`${topA}-${topB}`, seed) % classes.length;
  return { picked: classes[idx], scores, topA, topB, low };
}

function axisLabel(axis: string | undefined, lang: Lang) {
  if (!axis) return lang === "ja" ? "不明" : "Unknown";
  return AXIS_LABEL[axis]?.[lang] ?? axis.toUpperCase();
}

function makeRpgStats(scores: Scores) {
  const emp = scores.emp ?? 0;
  const soc = scores.soc ?? 0;
  const int = scores.int ?? 0;
  const ord = scores.ord ?? 0;
  const adv = scores.adv ?? 0;
  const exp = scores.exp ?? 0;
  const res = scores.res ?? 0;
  const shd = scores.shd ?? 0;

  const hp = clamp(Math.round(90 + res * 6 + ord * 2 + emp * 1.5), 80, 999);
  const mp = clamp(Math.round(60 + int * 6 + exp * 2 + emp * 1.5), 40, 999);
  const atk = clamp(Math.round(18 + adv * 4.2 + shd * 2.2 + soc * 0.8), 10, 999);
  const def = clamp(Math.round(18 + ord * 4.8 + res * 2.0 + emp * 0.6), 10, 999);
  const agi = clamp(Math.round(18 + exp * 4.0 + soc * 2.2 + adv * 1.2), 10, 999);

  return { hp, mp, atk, def, agi };
}

function barPct(v: number, max = 200) {
  return clamp((v / max) * 100, 0, 100);
}

function pickTextByLang(
  obj: { ja?: string; en?: string } | undefined,
  lang: Lang
): string | "" {
  if (!obj) return "";
  const s = obj[lang] ?? obj.ja ?? obj.en ?? "";
  return typeof s === "string" ? s : "";
}

// クラス紹介文は「以前作った文章」が classes.json に入っている前提で最優先表示
function getClassIntroText(c: ClassRecord, lang: Lang): string {
  const candidates = [
    pickTextByLang((c as any).desc, lang),
    pickTextByLang((c as any).share_text, lang),
    pickTextByLang((c as any).intro, lang),
    pickTextByLang((c as any).card_intro, lang),
    pickTextByLang((c as any).flavor, lang),
  ].map((s) => (typeof s === "string" ? s.trim() : ""));

  const first = candidates.find((s) => s.length > 0);
  return first ?? "";
}

export default function ResultPage() {
  const router = useRouter();
  const [last, setLast] = useState<LastResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY_LAST);
      if (!raw) {
        setLast(null);
        return;
      }
      const parsed = JSON.parse(raw) as LastResult;
      setLast(parsed);
    } catch {
      setLast(null);
    }
  }, []);

  const lang: Lang = useMemo(() => {
    const l = String(last?.lang ?? "ja").toLowerCase();
    return l === "en" ? "en" : "ja";
  }, [last?.lang]);

  const t = UI[lang];

  const classes: ClassRecord[] = useMemo(() => {
    const anyJson = CLASSES_JSON as any;
    const list = (anyJson?.classes ?? []) as ClassRecord[];
    return Array.isArray(list) ? list : [];
  }, []);

  const seed = useMemo(() => {
    const ts = typeof last?.ts === "number" ? last!.ts : Date.now();
    const nm = String(last?.name ?? "");
    return hashStr(`${ts}:${nm}:${KEY_LAST}`, ts);
  }, [last?.ts, last?.name]);

  const picked = useMemo(() => {
    if (!last) return null;
    return pickClass(classes, last.scores, seed);
  }, [classes, last, seed]);

  const name = useMemo(() => String(last?.name ?? ""), [last?.name]);
  const ts = useMemo(() => (typeof last?.ts === "number" ? last!.ts : Date.now()), [last?.ts]);
  const shownId = useMemo(() => stableIdFrom(ts, name || "anonymous"), [ts, name]);

  const totalPoints = useMemo(() => {
    const n = Number(last?.totalPoints ?? 0);
    return Number.isFinite(n) ? n : 0;
  }, [last?.totalPoints]);

  const baseLv = useMemo(() => {
    const n = Number(last?.level ?? 1);
    return clamp(Number.isFinite(n) ? n : 1, 1, 99);
  }, [last?.level]);

  const shownLv = useMemo(() => {
    const r = seeded01(seed);
    const bump = Math.floor(r * 5);
    return clamp(baseLv + bump, 1, 99);
  }, [baseLv, seed]);

  const scores = picked?.scores ?? {};
  const { hp, mp, atk, def, agi } = useMemo(() => makeRpgStats(scores), [scores]);

  const classTitle = useMemo(() => {
    const c = picked?.picked;
    if (!c) return "";
    return c.title?.[lang] ?? c.title?.ja ?? c.title?.en ?? c.id;
  }, [picked?.picked, lang]);

  const classIntro = useMemo(() => {
    const c = picked?.picked;
    if (!c) return "";
    const intro = getClassIntroText(c, lang);
    if (intro) return intro;

    const a = axisLabel(picked?.topA, lang);
    const b = axisLabel(picked?.topB, lang);
    return lang === "ja"
      ? `${a}と${b}を軸に戦う、ギルド認定の冒険者タイプ。`
      : `A guild-certified adventurer type built around ${a} and ${b}.`;
  }, [picked?.picked, picked?.topA, picked?.topB, lang]);

  const classImage = useMemo(() => {
    const c = picked?.picked;
    if (!c) return "";
    const img = (c.mini || c.portrait || c.image) as string | undefined;
    if (img && img.startsWith("/")) return img;
    if (img && img.startsWith("http")) return img;
    return `/classes/${c.id}.png`;
  }, [picked?.picked]);

  const memo = useMemo(() => {
    const a = picked?.topA;
    const b = picked?.topB;
    const low = picked?.low;

    const aLabel = axisLabel(a, lang);
    const bLabel = axisLabel(b, lang);
    const lowLabel = axisLabel(low, lang);

    if (lang === "ja") {
      return {
        strength: `${aLabel}・${bLabel}。落ち着いて判断し、要所を外さない。`,
        caution: `${aLabel}が行き過ぎると偏りやすい。${lowLabel}でバランスを取ると安定。`,
        style: `${aLabel}で主導権を取り、${bLabel}で決め切る。`,
        synergy: `${lowLabel}が得意な仲間がいると噛み合う。`,
      };
    }
    return {
      strength: `Strong in ${aLabel} and ${bLabel}. Calm decisions, good timing.`,
      caution: `Too much ${aLabel} can tilt your balance. Stabilize with ${lowLabel}.`,
      style: `Lead with ${aLabel}, finish cleanly with ${bLabel}.`,
      synergy: `Best with allies strong in ${lowLabel}.`,
    };
  }, [picked?.topA, picked?.topB, picked?.low, lang]);

  const playSe = useCallback((key: string) => {
    const w = window as any;
    const fn = w?.__sfx?.play;
    if (typeof fn === "function") fn(key);
  }, []);

  const goTitle = useCallback(() => {
    playSe("cancel");
    router.push("/");
  }, [router, playSe]);

  const goAgain = useCallback(() => {
    playSe("confirm");
    router.replace("/play?reset=1");
  }, [router, playSe]);

  const shareCard = useCallback(async () => {
    try {
      playSe("confirm");

      const lines: string[] = [];
      lines.push(`${t.guild} / ${t.card}`);
      lines.push(`${t.name}: ${name || "-"}`);
      lines.push(`${t.id}: ${shownId}`);
      lines.push(`Lv: ${shownLv}`);
      lines.push(`${t.total}: ${totalPoints}`);
      lines.push(`Class: ${classTitle}`);
      lines.push(classIntro);
      lines.push("");
      lines.push(`${t.status}:`);
      lines.push(`${t.hp}: ${hp}`);
      lines.push(`${t.mp}: ${mp}`);
      lines.push(`${t.atk}: ${atk}`);
      lines.push(`${t.def}: ${def}`);
      lines.push(`${t.agi}: ${agi}`);

      const text = lines.join("\n");
      const nav: any = navigator as any;
      const url =
        typeof window !== "undefined" && typeof window.location?.href === "string"
          ? window.location.href
          : undefined;

      // 対応ブラウザは本当に共有（共有シート）
      if (typeof nav?.share === "function") {
        await nav.share({
          title: `${t.guild} / ${t.card}`,
          text,
          ...(url ? { url } : {}),
        });
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
        return;
      }

      // 非対応はコピーにフォールバック（UIは崩さない）
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (e: any) {
      // ユーザーが共有をキャンセルした場合などは何もしない
      const msg = String(e?.name ?? e?.message ?? "");
      if (msg.includes("Abort")) return;
      // 共有が失敗した時だけ、可能ならコピーを試す
      try {
        const lines: string[] = [];
        lines.push(`${t.guild} / ${t.card}`);
        lines.push(`${t.name}: ${name || "-"}`);
        lines.push(`${t.id}: ${shownId}`);
        lines.push(`Lv: ${shownLv}`);
        lines.push(`${t.total}: ${totalPoints}`);
        lines.push(`Class: ${classTitle}`);
        lines.push(classIntro);
        lines.push("");
        lines.push(`${t.status}:`);
        lines.push(`${t.hp}: ${hp}`);
        lines.push(`${t.mp}: ${mp}`);
        lines.push(`${t.atk}: ${atk}`);
        lines.push(`${t.def}: ${def}`);
        lines.push(`${t.agi}: ${agi}`);
        await navigator.clipboard.writeText(lines.join("\n"));
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      } catch {
        // noop
      }
    }
  }, [
    playSe,
    t,
    name,
    shownId,
    shownLv,
    totalPoints,
    classTitle,
    classIntro,
    hp,
    mp,
    atk,
    def,
    agi,
  ]);

  if (!last || !picked?.picked) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="max-w-xl w-[92%] rounded-3xl border border-white/10 bg-black/50 p-6 text-white">
          <div className="text-lg font-semibold">{t.missing}</div>
          <div className="mt-4 flex gap-3">
            <button
              className="rounded-xl border border-white/15 bg-white/10 px-4 py-2"
              onClick={goTitle}
            >
              {t.title}
            </button>
          </div>
          <div className="mt-3 text-xs text-white/40">debug: sourceKey={KEY_LAST}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full text-white">
      {/* 背景 */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          backgroundImage: "url(/result/bg.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "saturate(1.08) contrast(1.05)",
        }}
      />
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
        <div
          className="relative rounded-[34px] p-[10px] shadow-[0_25px_90px_rgba(0,0,0,0.55)]"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,235,170,0.85), rgba(210,160,60,0.85), rgba(255,215,120,0.65))",
          }}
        >
          <div
            className="pointer-events-none absolute inset-[2px] rounded-[32px] opacity-70"
            style={{
              background:
                "radial-gradient(800px 260px at 20% 10%, rgba(255,255,255,0.28), rgba(255,255,255,0) 60%), radial-gradient(700px 240px at 85% 12%, rgba(255,255,255,0.20), rgba(255,255,255,0) 62%)",
            }}
          />

          <div
            className="relative rounded-[26px] overflow-hidden border border-black/25"
            style={{
              background:
                "linear-gradient(180deg, rgba(60,45,18,0.78), rgba(34,26,12,0.70))",
            }}
          >
            <div
              className="pointer-events-none absolute inset-0 opacity-25"
              style={{
                background:
                  "repeating-linear-gradient(to bottom, rgba(255,255,255,0.10) 0px, rgba(255,255,255,0.10) 1px, rgba(0,0,0,0) 7px, rgba(0,0,0,0) 12px)",
              }}
            />

            <div className="relative px-6 py-4 border-b border-white/10">
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(90deg, rgba(255,226,140,0.22), rgba(255,200,90,0.12), rgba(0,0,0,0))",
                }}
              />
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm tracking-wider text-white/85">{t.guild}</div>
                  <div className="text-2xl font-semibold">{t.card}</div>
                  <div className="mt-1 text-xs text-white/65">Guild Card · Lv.{shownLv}</div>
                </div>

                <div className="text-right">
                  <div className="text-xs text-white/70">{t.name}</div>
                  <div className="text-lg font-semibold">{name || "-"}</div>
                  <div className="mt-1 text-xs text-white/65">
                    {t.id} {shownId}
                  </div>
                  <div className="mt-2 text-xs text-white/75">
                    {t.total}:{totalPoints}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
              <div className="rounded-2xl border border-[#f2d57a]/20 bg-black/25 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs tracking-wider text-white/75">CLASS INFO</div>
                </div>
                <div className="mt-2 text-lg font-semibold">{t.classInfo}</div>

                <div className="mt-4 rounded-2xl border border-[#f2d57a]/18 bg-black/20 p-4 flex items-center justify-center min-h-[260px]">
                  {classImage ? (
                    <Image
                      src={classImage}
                      alt={classTitle}
                      width={360}
                      height={360}
                      className="h-auto w-auto max-h-[240px] max-w-[320px] object-contain drop-shadow-[0_18px_26px_rgba(0,0,0,0.6)]"
                      priority
                    />
                  ) : (
                    <div className="text-white/50 text-sm">No image</div>
                  )}
                </div>

                <div className="mt-4">
                  <div className="text-base font-semibold">{classTitle}</div>
                  <div className="mt-2 text-sm leading-relaxed text-white/85 whitespace-pre-wrap">
                    {classIntro}
                  </div>
                  <div className="mt-3 text-xs text-white/55">Astraiaギルド発行</div>
                </div>
              </div>

              <div className="rounded-2xl border border-[#f2d57a]/20 bg-black/25 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs tracking-wider text-white/75">MEMO</div>
                </div>
                <div className="mt-2 text-lg font-semibold">{t.memo}</div>

                <div className="mt-4 space-y-3">
                  <MemoBox label={t.strength} text={memo.strength} />
                  <MemoBox label={t.caution} text={memo.caution} />
                  <MemoBox label={t.style} text={memo.style} />
                  <MemoBox label={t.synergy} text={memo.synergy} />
                </div>
              </div>
            </div>

            <div className="px-6 pb-6">
              <div className="rounded-2xl border border-[#f2d57a]/20 bg-black/25 p-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs tracking-wider text-white/75">{t.status}</div>
                  <div className="text-xs text-white/60">{t.hint}</div>
                </div>

                <div className="mt-4 space-y-3">
                  <StatRow label={t.hp} value={hp} pct={barPct(hp, 250)} />
                  <StatRow label={t.mp} value={mp} pct={barPct(mp, 250)} />
                  <StatRow label={t.atk} value={atk} pct={barPct(atk, 180)} />
                  <StatRow label={t.def} value={def} pct={barPct(def, 180)} />
                  <StatRow label={t.agi} value={agi} pct={barPct(agi, 180)} />
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    className="rounded-xl border border-[#f2d57a]/25 bg-white/10 px-4 py-2 text-sm hover:bg-white/15 transition"
                    onClick={shareCard}
                  >
                    {copied ? "OK!" : t.copy}
                  </button>
                  <button
                    className="rounded-xl border border-[#f2d57a]/25 bg-white/10 px-4 py-2 text-sm hover:bg-white/15 transition"
                    onClick={goAgain}
                  >
                    {t.again}
                  </button>
                  <button
                    className="rounded-xl border border-[#f2d57a]/25 bg-white/10 px-4 py-2 text-sm hover:bg-white/15 transition"
                    onClick={goTitle}
                  >
                    {t.title}
                  </button>
                </div>

                <div className="mt-3 text-[11px] text-white/35">
                  debug: sourceKey={KEY_LAST} / totalPoints={totalPoints} / scoredKeys={Object.keys(scores).length} / baseLv={baseLv} / shownLv={shownLv}
                </div>
              </div>
            </div>

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
    </div>
  );
}

function MemoBox(props: { label: string; text: string }) {
  return (
    <div className="rounded-2xl border border-[#f2d57a]/18 bg-black/20 p-4">
      <div className="text-xs text-white/70">{props.label}</div>
      <div className="mt-1 text-sm text-white/88">{props.text}</div>
    </div>
  );
}

function StatRow(props: { label: string; value: number; pct: number }) {
  const { label, value, pct } = props;
  return (
    <div className="grid grid-cols-[72px_1fr_56px] items-center gap-3">
      <div className="text-sm text-white/88">{label}</div>
      <div className="h-3 rounded-full bg-white/10 border border-white/10 overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background:
              "linear-gradient(90deg, rgba(255,238,170,0.95), rgba(255,196,92,0.78), rgba(255,255,255,0.10))",
          }}
        />
      </div>
      <div className="text-right text-sm text-white/90 tabular-nums">{value}</div>
    </div>
  );
}
