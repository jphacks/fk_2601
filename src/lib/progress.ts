import { ASKED_FROM_ARCHIVE } from "./constants";
import type { Profile } from "./types";

export type AskedPair = { target: string; topic: string };

export type GenerationContext = {
  grade: number;
  level: number;
  archiveCount: number;
  asked: AskedPair[];
};

/**
 * 学習の進み具合（レベル1〜5）。いまは挑戦した問いの数だけで決める仮の決め方。
 * 測り方は未決（docs/02-spec.md 17章）
 */
export function levelFromCount(count: number): number {
  return Math.min(5, 1 + Math.floor(count / 4));
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

export function buildGenerationContext(profile: Profile, archive: { target: string; topic: string }[]): GenerationContext {
  return {
    grade: profile.grade,
    level: levelFromCount(archive.length),
    archiveCount: archive.length,
    asked: recentAsked(archive),
  };
}
