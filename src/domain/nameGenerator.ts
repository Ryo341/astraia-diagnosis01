import { xorshift32 } from "./rng";
import { Lang } from "@/state/diagnosisTypes";

const EN = ["Astra", "Liora", "Kael", "Mira", "Rowan", "Elio", "Seren", "Nyx", "Ciel", "Vey"];
const JA = ["アストラ", "リオラ", "カイル", "ミラ", "ローワン", "エリオ", "セレン", "ニクス", "シエル", "ヴェイ"];

export function generateName(lang: Lang, seed: number) {
  const r = xorshift32(seed);
  const pool = lang === "ja-JP" ? JA : EN;
  const idx = Math.floor(r() * pool.length);
  return pool[Math.max(0, Math.min(pool.length - 1, idx))];
}
