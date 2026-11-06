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

// ---- グループのミッション（#139） ----
// グループの管理者が日付ごとに出す。日付は日本時間（グループのメンバーは日本で使う前提。端末の時差で日付がずれないように）

/** 文の長さの上限（firestore.rules と同じ） */
export const GROUP_MISSION_MAX = 60;

/** 日本時間の日付（「2026-11-15」の形）。days を足すと、その日数だけ先の日 */
export function jstDate(date = new Date(), days = 0): string {
  const shifted = new Date(date.getTime() + days * 86_400_000);
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" }).format(shifted);
}

/** 子どもの画面に出すので、漢字を使っていないか（docs/design/README.md「文字」。firestore.rules でも断る） */
export function hasKanji(text: string): boolean {
  return /\p{Script=Han}/u.test(text);
}
