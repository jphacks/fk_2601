import type { ArchiveRecord } from "./types";

// 今日のお題（毎日1つ。通知はしない）。安全のため、道や高い場所・火や電気は題材にしない。
// 小さい文字で出すので、ひらがなで書く（docs/design/README.md「文字」）
export const MISSIONS: string[] = [
  "まるい ものを みつけよう",
  "しかくい ものを みつけよう",
  "おなじ かたちが いくつも ならんでいる ものを さがそう（タイル・まど など）",
  "みずに かんけいする ものを さがそう（コップ・すいとう など）",
  "すうじが かいてある ものを さがそう",
  "かげが できている ものを さがそう",
  "たくさん つみかさなっている ものを さがそう（ほん・おさら など）",
  "くさや きや はなを みつけよう",
  "おうちの なかで 「はかれる もの」を さがそう（はかり・とけい など）",
  "おなじ いろの ものを さがそう",
  "ならんでいる ものを さがそう（かいだん・フェンス・えんぴつ など）",
  "たべものを みつけよう（おうちの ひとと いっしょに）",
  "じかんに かんけいする ものを さがそう（とけい・カレンダー など）",
  "いちばん おおきい ものを さがそう（あんぜんな ばしょで）",
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
