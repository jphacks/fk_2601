import type { ArchiveRecord } from "./types";

// 今日のお題（毎日1つ。通知はしない）。安全のため、道や高い場所・火や電気は題材にしない
export const MISSIONS: string[] = [
  "まるい ものを 見つけて とってみよう",
  "しかくい ものを 見つけて とってみよう",
  "おなじ 形が いくつも ならんでいる ものを さがそう（タイル・まど など）",
  "水に かんけいする ものを さがそう（コップ・すいとう など）",
  "数字が かいてある ものを さがそう",
  "かげが できている ものを さがそう",
  "たくさん つみかさなっている ものを さがそう（本・おさら など）",
  "草や 木や 花を 見つけて とってみよう",
  "おうちの 中で 「はかれる もの」を さがそう（はかり・とけい など）",
  "おなじ 色の ものを あつめて とってみよう",
  "ならんでいる ものを さがそう（かいだん・フェンス・えんぴつ など）",
  "食べものを 見つけよう（おうちの 人と いっしょに）",
  "じかんに かんけいする ものを さがそう（とけい・カレンダー）",
  "いちばん 大きい ものを さがして とってみよう（安全な ばしょで）",
];

/** その日の日付（この たんまつの 時間）を 数に する */
export function dayNumber(date = new Date()): number {
  return Math.floor(new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() / 86_400_000);
}

export function todaysMission(date = new Date()): string {
  return MISSIONS[dayNumber(date) % MISSIONS.length];
}

/** 今日、図鑑に保存した問いがあれば、お題をクリアしたことにする */
export function missionDone(archives: ArchiveRecord[], date = new Date()): boolean {
  return archives.some((a) => dayNumber(new Date(a.createdAt)) === dayNumber(date));
}
