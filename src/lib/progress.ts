import { ASKED_FROM_ARCHIVE } from "./constants";
import type { Rating } from "./rating";
import type { ArchiveRecord, Profile } from "./types";

export type AskedPair = { target: string; topic: string };

export type GenerationContext = {
  grade: number;
  level: number;
  archiveCount: number;
  asked: AskedPair[];
};

/** 点数が、いくつふえるごとに、レベルが1つ上がるか */
const POINTS_PER_LEVEL = 5;

/** 予想が よく当たったときの おまけの点（「ピタリ」「おしい」） */
const BONUS_RATINGS: Rating[] = ["pita", "oshii"];

/**
 * 学習の進み具合の点数（docs/02-spec.md 17章。2026-11-06 に決めた）。
 * 自分で囲んで作った問い1つにつき 1点。予想が「ピタリ」「おしい」のときは、もう1点。
 * ほかの人の問いで遊んだ分（origin が "played"）は、遊ぶだけで上がらないよう、数えない
 */
export function progressPoints(archive: Pick<ArchiveRecord, "rating" | "origin">[]): number {
  let points = 0;
  for (const a of archive) {
    if (a.origin === "played") continue;
    points += 1 + (BONUS_RATINGS.includes(a.rating) ? 1 : 0);
  }
  return points;
}

/** 学習の進み具合（レベル1〜5）。点数が5点ふえるごとに1つ上がる */
export function levelFromPoints(points: number): number {
  return Math.min(5, 1 + Math.floor(points / POINTS_PER_LEVEL));
}

/** 同じ「対象×単元」を1つにまとめ、新しい順（archive は新しい順に並んでいる）に上限まで残す */
export function recentAsked(archive: { target: string; topic: string }[], limit = ASKED_FROM_ARCHIVE): AskedPair[] {
  const seen = new Set<string>();
  const out: AskedPair[] = [];
  for (const a of archive) {
    const key = `${a.target}|${a.topic}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ target: a.target, topic: a.topic });
    if (out.length >= limit) break;
  }
  return out;
}

/** archive は、ずかんの記録（新しい順） */
export function buildGenerationContext(profile: Profile, archive: ArchiveRecord[]): GenerationContext {
  const own = archive.filter((a) => a.origin !== "played");
  return {
    grade: profile.grade,
    level: levelFromPoints(progressPoints(archive)),
    // 「これまでに N 問に挑戦した」の N。自分で作った問いの数
    archiveCount: own.length,
    // 出題済みは、遊んだ問いも入れる（同じ問いが出ないように）
    asked: recentAsked(archive.map((a) => a.question)),
  };
}
