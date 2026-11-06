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
  /** 問いの形ごとの数（「なぜ？」・数を予想・くらべる） */
  why: number;
  estimate: number;
  compare: number;
  /** 予想が「おしい」だった数 */
  oshii: number;
  /** つづけて あそんだ日の、いちばん長い れんぞく */
  streak: number;
  /** 土よう・日ように あそんだ日の数 */
  weekend: number;
  /** あさ（6時〜9時まえ）に のこした数 */
  morning: number;
  /** 1日に のこした数の、いちばん多い日 */
  burst: number;
  /** たんげん（単元）の種類 */
  topics: number;
  /** きん の称号の数（「きんメダル コレクター」をのぞく） */
  medals: number;
};

/** 称号の まとまり（スタンプの画面の見出し） */
export const TITLE_GROUPS = [
  { id: "subject", name: "ぶんるいの スタンプ" },
  { id: "guess", name: "よそうと こたえ" },
  { id: "explore", name: "たんけん" },
  { id: "daily", name: "まいにち" },
  { id: "special", name: "なかま・とくべつ" },
] as const;
export type TitleGroupId = (typeof TITLE_GROUPS)[number]["id"];

export type TitleFamily = {
  /** 英小文字だけ（ID は「math-gold」の形。firestore.rules も この形だけを通す） */
  id: string;
  name: string;
  group: TitleGroupId;
  /** どう・ぎん・きん に必要な数 */
  goals: [number, number, number];
  /** もらいかた（{n} に数が入る） */
  how: string;
  value: (s: TitleStats) => number;
};

export const TITLE_FAMILIES: TitleFamily[] = [
  // ぶんるいの スタンプ
  { id: "math", group: "subject", name: "すうがく はかせ", goals: [5, 15, 30], how: "さんすうの スタンプを {n}こ あつめる", value: (s) => s.stamps.math },
  { id: "science", group: "subject", name: "りか マスター", goals: [5, 15, 30], how: "りかの スタンプを {n}こ あつめる", value: (s) => s.stamps.science },
  { id: "info", group: "subject", name: "エンジニア レベル", goals: [5, 15, 30], how: "じょうほうの スタンプを {n}こ あつめる", value: (s) => s.stamps.info },
  {
    id: "allround",
    group: "subject",
    name: "オールラウンダー",
    goals: [3, 10, 20],
    how: "3つの ぶんるいの スタンプを {n}こずつ あつめる",
    value: (s) => Math.min(s.stamps.math, s.stamps.science, s.stamps.info),
  },
  // よそうと こたえ
  { id: "pita", group: "guess", name: "よそう めいじん", goals: [1, 5, 15], how: "よそうを {n}かい ピタリと あてる", value: (s) => s.pita },
  { id: "oshii", group: "guess", name: "あと いっぽ", goals: [3, 10, 25], how: "よそうが {n}かい おしい", value: (s) => s.oshii },
  { id: "hazure", group: "guess", name: "びっくり たんけんか", goals: [3, 10, 30], how: "おおはずれで {n}かい おどろく", value: (s) => s.hazure },
  { id: "why", group: "guess", name: "なぜなぜ たんてい", goals: [3, 10, 25], how: "「なぜ？」の はてなを {n}こ とく", value: (s) => s.why },
  { id: "estimate", group: "guess", name: "かず よそうや", goals: [3, 10, 25], how: "かずを よそうする はてなを {n}こ とく", value: (s) => s.estimate },
  { id: "compare", group: "guess", name: "くらべっこ めいじん", goals: [2, 5, 15], how: "くらべる はてなを {n}こ とく", value: (s) => s.compare },
  // たんけん
  { id: "total", group: "explore", name: "はてな コレクター", goals: [10, 30, 100], how: "ずかんに {n}こ のこす", value: (s) => s.total },
  { id: "kinds", group: "explore", name: "なんでも はかせ", goals: [5, 15, 40], how: "ちがう ものを {n}こ みつける", value: (s) => s.kinds },
  { id: "topics", group: "explore", name: "ひきだし いっぱい", goals: [5, 15, 30], how: "ちがう たんげんの はてなを {n}こ みつける", value: (s) => s.topics },
  { id: "burst", group: "explore", name: "いっき たんけんか", goals: [3, 5, 10], how: "1にちに {n}こ のこす", value: (s) => s.burst },
  // まいにち
  { id: "days", group: "daily", name: "まいにち たんけんか", goals: [3, 7, 20], how: "{n}にち ずかんに のこす", value: (s) => s.days },
  { id: "streak", group: "daily", name: "つづけ めいじん", goals: [2, 5, 10], how: "{n}にち つづけて のこす", value: (s) => s.streak },
  { id: "weekend", group: "daily", name: "しゅうまつ たんけんか", goals: [2, 5, 15], how: "どよう・にちように {n}にち のこす", value: (s) => s.weekend },
  { id: "morning", group: "daily", name: "あさの たんけんか", goals: [1, 5, 15], how: "あさ（6じ〜9じ）に {n}こ のこす", value: (s) => s.morning },
  // なかま・とくべつ
  { id: "shared", group: "special", name: "みせっこ なかま", goals: [1, 5, 15], how: "なかまに {n}かい みせる", value: (s) => s.shared },
  { id: "medals", group: "special", name: "きんメダル コレクター", goals: [1, 3, 6], how: "ほかの しょうごうの きんを {n}こ もらう", value: (s) => s.medals },
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

/** いちばん長い れんぞくの日数（日付は、その日の0時の時刻） */
function longestStreak(dayStarts: number[]): number {
  const sorted = [...new Set(dayStarts)].sort((a, b) => a - b);
  let best = 0;
  let run = 0;
  for (let i = 0; i < sorted.length; i++) {
    // となりの日（ちょうど1日。夏時間などで ずれても、12時間いないなら となりの日とみる）
    run = i > 0 && Math.abs(sorted[i] - sorted[i - 1] - 86_400_000) < 43_200_000 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  return best;
}

export function titleStats(archives: ArchiveRecord[]): TitleStats {
  const stamps: Record<Subject, number> = { math: 0, science: 0, info: 0 };
  const perDay = new Map<string, number>();
  const weekendDays = new Set<string>();
  const kinds = new Set<string>();
  const topics = new Set<string>();
  const counts = { pita: 0, hazure: 0, oshii: 0, shared: 0, why: 0, estimate: 0, compare: 0, morning: 0 };
  const dayStarts: number[] = [];
  for (const a of archives) {
    const d = new Date(a.createdAt);
    const key = dayKey(a.createdAt);
    stamps[a.question.subject] += 1;
    perDay.set(key, (perDay.get(key) ?? 0) + 1);
    dayStarts.push(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime());
    if (d.getDay() === 0 || d.getDay() === 6) weekendDays.add(key);
    if (d.getHours() >= 6 && d.getHours() < 9) counts.morning += 1;
    kinds.add(a.question.target.trim());
    topics.add(a.question.topic.trim());
    if (a.rating === "pita") counts.pita += 1;
    if (a.rating === "oshii") counts.oshii += 1;
    if (a.rating === "ohazure") counts.hazure += 1;
    if ((a.sharedGroups?.length ?? 0) > 0) counts.shared += 1;
    counts[a.question.type] += 1;
  }
  const stats: TitleStats = {
    stamps,
    total: archives.length,
    ...counts,
    days: perDay.size,
    kinds: kinds.size,
    topics: topics.size,
    streak: longestStreak(dayStarts),
    weekend: weekendDays.size,
    burst: Math.max(0, ...perDay.values()),
    medals: 0,
  };
  // きんメダル コレクター：ほかの種類で「きん」を もらった数（自分自身は数えない）
  stats.medals = TITLE_FAMILIES.filter((f) => f.id !== "medals" && f.value(stats) >= f.goals[2]).length;
  return stats;
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
