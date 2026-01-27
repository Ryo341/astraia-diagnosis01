import i18n from "@/data/i18n.json";
import { Lang } from "@/state/diagnosisTypes";

export function t(lang: Lang, key: string): string {
  const parts = key.split(".");
  let cur: any = (i18n as any)[lang];
  for (const p of parts) cur = cur?.[p];
  return typeof cur === "string" ? cur : key;
}
