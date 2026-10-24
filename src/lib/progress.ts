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

export function buildGenerationContext(profile: Profile, archive: { target: string; topic: string }[]): GenerationContext {
  return {
    grade: profile.grade,
    level: levelFromCount(archive.length),
    archiveCount: archive.length,
    asked: archive.map((a) => ({ target: a.target, topic: a.topic })),
  };
}
