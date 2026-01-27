// src/domain/diagnosisEngine.ts
export type ScoreMap = Record<string, number>;
export type AnswersMap = Record<string, string>;

type QuestionDoc =
  | {
      version?: string;
      stats?: string[];
      question_count?: number;
      questions?: Question[];
    }
  | Question[];

type Question = {
  id: string;
  text?: any;
  choices?: Choice[];
};

type Choice = {
  id: string;
  label?: any;
  points?: Record<string, number>;
  scores?: Record<string, number>;
};

export type DiagnoseResult = {
  classId: string;
  scores: ScoreMap;
  total: number;
  level: number;
  topStat: string;
  secondStat: string;
};

const DEFAULT_STATS = ["emp", "soc", "int", "ord", "adv", "exp", "res", "shd"] as const;

function normalizeQuestionDoc(input: any): { stats: string[]; questions: Question[]; questionCount: number } {
  const stats = Array.isArray(input?.stats) ? input.stats.filter((s: any) => typeof s === "string") : [...DEFAULT_STATS];
  const questions: Question[] = Array.isArray(input)
    ? input
    : Array.isArray(input?.questions)
      ? input.questions
      : [];

  const questionCount =
    typeof input?.question_count === "number" && Number.isFinite(input.question_count)
      ? input.question_count
      : questions.length;

  return { stats, questions, questionCount };
}

function safeEntries(obj: any): [string, any][] {
  if (!obj || typeof obj !== "object") return [];
  return Object.entries(obj);
}

export function scoreAnswers(answersRaw: any, questionsRaw: any): ScoreMap {
  const answers: AnswersMap = answersRaw && typeof answersRaw === "object" ? answersRaw : {};
  const { stats, questions } = normalizeQuestionDoc(questionsRaw);

  const totals: ScoreMap = {};
  for (const s of stats) totals[s] = 0;

  const qById = new Map<string, Question>();
  for (const q of questions) {
    if (q && typeof q.id === "string") qById.set(q.id, q);
  }

  for (const [qid, choiceIdRaw] of safeEntries(answers)) {
    const choiceId = typeof choiceIdRaw === "string" ? choiceIdRaw : "";
    if (!qid || !choiceId) continue;

    const q = qById.get(qid);
    const choices = Array.isArray(q?.choices) ? q!.choices! : [];
    const picked = choices.find((c) => c && c.id === choiceId);
    const points = (picked?.points ?? picked?.scores) as any;

    for (const [stat, val] of safeEntries(points)) {
      if (typeof stat !== "string") continue;
      const n = typeof val === "number" && Number.isFinite(val) ? val : 0;
      if (!totals[stat]) totals[stat] = 0;
      totals[stat] += n;
    }
  }

  return totals;
}

export function sumScores(scores: any): number {
  if (!scores || typeof scores !== "object") return 0;
  let total = 0;
  for (const v of Object.values(scores)) {
    if (typeof v === "number" && Number.isFinite(v)) total += v;
  }
  return total;
}

export function deriveLevel(total: number): number {
  // 例: 合計30点なら Lv7（floor(30/5)+1）
  const t = typeof total === "number" && Number.isFinite(total) ? total : 0;
  return Math.max(1, Math.floor(t / 5) + 1);
}

function rankStats(scores: ScoreMap, statsOrder: string[]) {
  const orderIndex = new Map<string, number>();
  statsOrder.forEach((s, i) => orderIndex.set(s, i));

  const entries = Object.entries(scores ?? {});
  entries.sort((a, b) => {
    const av = typeof a[1] === "number" ? a[1] : 0;
    const bv = typeof b[1] === "number" ? b[1] : 0;
    if (bv !== av) return bv - av;
    return (orderIndex.get(a[0]) ?? 999) - (orderIndex.get(b[0]) ?? 999);
  });
  return entries.map(([k]) => k);
}

function pickClassId(top: string, second: string): string {
  // classes.json の id に必ず寄せる
  switch (top) {
    case "emp":
      if (second === "ord") return "holy_sigil_paladin";
      if (second === "int") return "star_oracle";
      return "seraphim_healer";

    case "soc":
      if (second === "exp") return "wind_bard";
      return "contract_diplomancer";

    case "int":
      if (second === "shd") return "torch_enchanter";
      if (second === "emp") return "star_oracle";
      return "azure_archmage";

    case "ord":
      if (second === "res") return "holy_sigil_paladin";
      return "castle_artificer";

    case "adv":
      if (second === "exp") return "training_warlord";
      return "travel_ranger";

    case "exp":
      if (second === "int") return "torch_enchanter";
      if (second === "adv") return "training_warlord";
      return "wind_bard";

    case "res":
      return "immortal_vanguard";

    case "shd":
      return "thunder_rogue";

    default:
      return "unknown";
  }
}

export function diagnose(args: { answers: any; questions: any }): DiagnoseResult {
  const { stats } = normalizeQuestionDoc(args.questions);
  const scores = scoreAnswers(args.answers, args.questions);
  const total = sumScores(scores);
  const level = deriveLevel(total);

  const ranked = rankStats(scores, stats.length ? stats : [...DEFAULT_STATS]);
  const topStat = ranked[0] ?? (stats[0] ?? "emp");
  const secondStat = ranked[1] ?? (stats[1] ?? "soc");

  const classId = total > 0 ? pickClassId(topStat, secondStat) : "unknown";

  return { classId, scores, total, level, topStat, secondStat };
}
