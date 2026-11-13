import type { ArchiveRecord } from "./types";

// 今日のお題（毎日1つ。通知はしない）。安全のため、道や高い場所・火や電気は題材にしない。
// 小さい文字で出すので、ひらがなで書く（docs/design/README.md「文字」）
export const MISSIONS: string[] = [
  "{丸|まる}い ものを {見|み}つけよう",
  "{四角|しかく}い ものを {見|み}つけよう",
  "{同|おな}じ {形|かたち}が いくつも ならんでいる ものを {探|さが}そう（タイル・{窓|まど} など）",
  "{水|みず}に {関係|かんけい}する ものを {探|さが}そう（コップ・すいとう など）",
  "{数字|すうじ}が {書|か}いてある ものを {探|さが}そう",
  "かげが できている ものを {探|さが}そう",
  "たくさん つみかさなっている ものを {探|さが}そう（{本|ほん}・お{皿|さら} など）",
  "{草|くさ}や {木|き}や {花|はな}を {見|み}つけよう",
  "おうちの {中|なか}で 「はかれる もの」を {探|さが}そう（はかり・{時計|とけい} など）",
  "{同|おな}じ {色|いろ}の ものを {探|さが}そう",
  "ならんでいる ものを {探|さが}そう（{階段|かいだん}・フェンス・えんぴつ など）",
  "{食|た}べものを {見|み}つけよう（おうちの {人|ひと}と いっしょに）",
  "{時間|じかん}に {関係|かんけい}する ものを {探|さが}そう（{時計|とけい}・カレンダー など）",
  "いちばん {大|おお}きい ものを {探|さが}そう（{安全|あんぜん}な {場所|ばしょ}で）",
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

/** 日本時間の、その日の0時（ミリ秒）。「きょう」の数を数えるのに使う（#140） */
export function jstDayStart(date = new Date()): number {
  return new Date(`${jstDate(date)}T00:00:00+09:00`).getTime();
}
