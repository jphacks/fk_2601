import { ASKED_FROM_ARCHIVE } from "./constants";
import type { Rating } from "./rating";
import type { ArchiveRecord, Profile } from "./types";
import type { Subject } from "@/server/llm/schema";

export type AskedPair = { target: string; topic: string };

/** 教科ごとのレベル（1〜5） */
export type SubjectLevels = Record<Subject, number>;

export type GenerationContext = {
  grade: number;
  level: number;
  subjectLevels: SubjectLevels;
  archiveCount: number;
  asked: AskedPair[];
  /** さいきん「おもしろい！」と言った問いの単元（新しい順に LIKED_MAX こまで） */
  liked: string[];
  /** さいきん HARD_WINDOW 問のうち、「むずかしい」と言った数 */
  hardCount: number;
};

const SUBJECTS: Subject[] = ["math", "science", "info"];

/** 手ごたえを見る、さいきんの記録の数（教科ごと） */
const RECENT_WINDOW = 6;
/** これより記録が少ないうちは、手ごたえで上げ下げしない（回数が少ないと、ぶれが大きいため） */
const MIN_RECENT = 4;
/** 当たりの割合が、これ以上なら1つ上げ、これ以下なら1つ下げる */
const UP_RATE = 0.6;
const DOWN_RATE = 0.2;

/**
 * レベル2〜5に上がる点数。上のレベルほど、たくさん遊ばないと上がらない（2026-11-13 に決めた。#174）。
 * 前は「5点ごとに1つ」で、10回ちょっと遊ぶと いちばん上に とどき、そのあと 続けても 変わらなかった
 */
const LEVEL_POINTS = [5, 15, 30, 50];

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

/** どれだけ やっているか（経験）のレベル（1〜5）。5・15・30・50点で上がる */
export function levelFromPoints(points: number): number {
  return 1 + LEVEL_POINTS.filter((p) => points >= p).length;
}

/**
 * さいきんの手ごたえで、レベルを1つだけ上げ下げする（docs/02-spec.md 17章。2026-11-13 に決めた。#174）。
 * 当たり＝「ピタリ」「おしい」と、「なぜ？」型の正解。数の問いは、はずれて おどろくのが ふつうなので、下げるのは 当たりが2割以下の ときだけ
 * records は新しい順。記録が MIN_RECENT より少なければ、base のまま
 */
export function adjustLevel(base: number, records: Pick<ArchiveRecord, "rating">[]): number {
  const recent = records.slice(0, RECENT_WINDOW);
  if (recent.length < MIN_RECENT) return base;
  const rate = recent.filter((r) => r.rating !== "ohazure").length / recent.length;
  const step = rate >= UP_RATE ? 1 : rate <= DOWN_RATE ? -1 : 0;
  return Math.min(5, Math.max(1, base + step));
}

/** 「おもしろい！」の単元を、問いを作るときに伝える数の上限 */
const LIKED_MAX = 5;
/** 「むずかしい」の数を見る、さいきんの記録の数 */
const HARD_WINDOW = 10;

/**
 * 子どもの「どうだった？」から、問いを作る手がかりを取り出す（#164）。records は新しい順。
 * liked は「おもしろい！」の単元（同じ単元は1つ。新しい順に5つまで）。hardCount はさいきん10問のうちの「むずかしい」の数
 */
export function feelingHints(records: Pick<ArchiveRecord, "feeling" | "question">[]): { liked: string[]; hardCount: number } {
  const liked: string[] = [];
  for (const r of records) {
    if (r.feeling !== "fun" || !r.question.topic || liked.includes(r.question.topic)) continue;
    liked.push(r.question.topic);
    if (liked.length >= LIKED_MAX) break;
  }
  return { liked, hardCount: records.slice(0, HARD_WINDOW).filter((r) => r.feeling === "hard").length };
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
  // どれだけ やっているか（経験）で決めたレベルを、さいきんの手ごたえで1つだけ上げ下げする。教科ごとにも出す
  const base = levelFromPoints(progressPoints(archive));
  const subjectLevels = Object.fromEntries(
    SUBJECTS.map((subject) => [subject, adjustLevel(base, own.filter((a) => a.question.subject === subject))]),
  ) as SubjectLevels;
  return {
    grade: profile.grade,
    level: adjustLevel(base, own),
    subjectLevels,
    // 「これまでに N 問に挑戦した」の N。自分で作った問いの数
    archiveCount: own.length,
    // 出題済みは、遊んだ問いも入れる（同じ問いが出ないように）
    asked: recentAsked(archive.map((a) => a.question)),
    ...feelingHints(archive),
  };
}
