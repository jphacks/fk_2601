import type { Subject } from "@/server/llm/schema";
import type { ArchiveRecord } from "./types";

// 称号（docs/02-spec.md 16章。2026-11-06 に決めた。#133）。
// 種類ごとに、どう・ぎん・きん の3段階。ずかんの記録から数える（別に保存しない）。
// 名前は小さい文字で出すので、ひらがな・カタカナで書く

export type Tier = "bronze" | "silver" | "gold";
export const TIERS: Tier[] = ["bronze", "silver", "gold"];
export const TIER_LABEL: Record<Tier, string> = { bronze: "どう", silver: "ぎん", gold: "きん" };

/** ずかんから数える、称号のための数 */
export type TitleStats = {
  stamps: Record<Subject, number>;
  /** ずかんの数 */
  total: number;
  /** 予想が「ピタリ」（「なぜ？」型は「せいかい」）になった数 */
  pita: number;
  /** 「大はずれ」で おどろいた数 */
  hazure: number;
  /** ずかんに のこした日の数 */
  days: number;
  /** みつけた ものの種類（対象のちがい） */
  kinds: number;
  /** なかまに見せた数 */
  shared: number;
};

export type TitleFamily = {
  id: string;
  name: string;
  /** どう・ぎん・きん に必要な数 */
  goals: [number, number, number];
  /** もらいかた（{n} に数が入る） */
  how: string;
  value: (s: TitleStats) => number;
};

export const TITLE_FAMILIES: TitleFamily[] = [
  { id: "math", name: "すうがく はかせ", goals: [5, 15, 30], how: "さんすうの スタンプを {n}こ あつめる", value: (s) => s.stamps.math },
  { id: "science", name: "りか マスター", goals: [5, 15, 30], how: "りかの スタンプを {n}こ あつめる", value: (s) => s.stamps.science },
  { id: "info", name: "エンジニア レベル", goals: [5, 15, 30], how: "じょうほうの スタンプを {n}こ あつめる", value: (s) => s.stamps.info },
  {
    id: "allround",
    name: "オールラウンダー",
    goals: [3, 10, 20],
    how: "3つの ぶんるいの スタンプを {n}こずつ あつめる",
    value: (s) => Math.min(s.stamps.math, s.stamps.science, s.stamps.info),
  },
  { id: "pita", name: "よそう めいじん", goals: [1, 5, 15], how: "よそうを {n}かい ピタリと あてる", value: (s) => s.pita },
  { id: "hazure", name: "びっくり たんけんか", goals: [3, 10, 30], how: "おおはずれで {n}かい おどろく", value: (s) => s.hazure },
  { id: "days", name: "まいにち たんけんか", goals: [3, 7, 20], how: "{n}にち ずかんに のこす", value: (s) => s.days },
  { id: "total", name: "はてな コレクター", goals: [10, 30, 100], how: "ずかんに {n}こ のこす", value: (s) => s.total },
  { id: "kinds", name: "なんでも はかせ", goals: [5, 15, 40], how: "ちがう ものを {n}こ みつける", value: (s) => s.kinds },
  { id: "shared", name: "みせっこ なかま", goals: [1, 5, 15], how: "なかまに {n}かい みせる", value: (s) => s.shared },
];

// はじめから持っている称号。称号をえらんでいない（title が null）ときに出す
export const FIRST_TITLE_LABEL = "はてなハンター";

/** 称号の ID（「math-gold」のように、種類と段階） */
export type TitleId = string;

export function titleId(family: string, tier: Tier): TitleId {
  return `${family}-${tier}`;
}

/** 前の称号（分類の名前だけ。5こで もらえた）は、その分類の「どう」として読む */
function normalize(id: string): { family: TitleFamily; tier: Tier } | null {
  const [familyId, tier = "bronze"] = id.split("-");
  const family = TITLE_FAMILIES.find((f) => f.id === familyId);
  if (!family || !TIERS.includes(tier as Tier)) return null;
  return { family, tier: tier as Tier };
}

/** いま つけている称号の名前（「すうがく はかせ（きん）」） */
export function titleLabel(title: string | null | undefined): string {
  const t = title ? normalize(title) : null;
  return t ? `${t.family.name}（${TIER_LABEL[t.tier]}）` : FIRST_TITLE_LABEL;
}

/** 称号の段階（はじめの称号・読めない ID は null） */
export function titleTier(title: string | null | undefined): Tier | null {
  return title ? (normalize(title)?.tier ?? null) : null;
}

/** みんなに見せる投稿に入れる、前の形の称号（分類の名前か null）。新しい称号を読めないルールのままでも、見せられるようにする */
export function legacyTitle(title: string | null | undefined): Subject | null {
  const t = title ? normalize(title) : null;
  return t && (t.family.id === "math" || t.family.id === "science" || t.family.id === "info") ? t.family.id : null;
}

/** 日付（端末の時計の、年・月・日） */
function dayKey(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

export function titleStats(archives: ArchiveRecord[]): TitleStats {
  const stamps: Record<Subject, number> = { math: 0, science: 0, info: 0 };
  const days = new Set<string>();
  const kinds = new Set<string>();
  let pita = 0;
  let hazure = 0;
  let shared = 0;
  for (const a of archives) {
    stamps[a.question.subject] += 1;
    days.add(dayKey(a.createdAt));
    kinds.add(a.question.target.trim());
    if (a.rating === "pita") pita += 1;
    if (a.rating === "ohazure") hazure += 1;
    if ((a.sharedGroups?.length ?? 0) > 0) shared += 1;
  }
  return { stamps, total: archives.length, pita, hazure, days: days.size, kinds: kinds.size, shared };
}

/** その種類の、いま もらっている いちばん上の段階（まだなら null） */
export function earnedTier(family: TitleFamily, stats: TitleStats): Tier | null {
  const v = family.value(stats);
  let best: Tier | null = null;
  TIERS.forEach((tier, i) => {
    if (v >= family.goals[i]) best = tier;
  });
  return best;
}

/** もらっている称号の ID（すべての種類・段階） */
export function earnedTitleIds(stats: TitleStats): TitleId[] {
  return TITLE_FAMILIES.flatMap((f) => TIERS.filter((_, i) => f.value(stats) >= f.goals[i]).map((tier) => titleId(f.id, tier)));
}

/** その称号を もらっているか（前の形の ID も読む） */
export function hasTitle(stats: TitleStats, title: string): boolean {
  const t = normalize(title);
  if (!t) return false;
  return t.family.value(stats) >= t.family.goals[TIERS.indexOf(t.tier)];
}

/** つぎの段階と、あといくつか（もう きん なら null） */
export function nextGoal(family: TitleFamily, stats: TitleStats): { tier: Tier; left: number } | null {
  const v = family.value(stats);
  const i = family.goals.findIndex((g) => v < g);
  return i < 0 ? null : { tier: TIERS[i], left: family.goals[i] - v };
}

/** 記録を1つ足したときに、新しく もらえた称号（「しょうごう ゲット！」に使う） */
export function newlyEarned(before: ArchiveRecord[], after: ArchiveRecord[]): TitleId[] {
  const had = new Set(earnedTitleIds(titleStats(before)));
  return earnedTitleIds(titleStats(after)).filter((id) => !had.has(id));
}

/** 前の形（「math」）もふくめて、称号の ID を そろえる（「math-bronze」）。読めないときは null */
export function canonicalTitle(title: string | null | undefined): TitleId | null {
  const t = title ? normalize(title) : null;
  return t ? titleId(t.family.id, t.tier) : null;
}
