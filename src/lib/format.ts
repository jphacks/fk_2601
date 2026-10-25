import { kanaOf, stripRuby } from "./ruby";

// 1万から上の位（「1億2350万」のように書く。桁がふえても横にはみ出さないため）。
// 漢字・読み・その漢字を習う学年（学年別漢字配当表）
const BIG_UNITS: [number, string, string, number][] = [
  [1e16, "京", "けい", 2],
  [1e12, "兆", "ちょう", 4],
  [1e8, "億", "おく", 4],
  [1e4, "万", "まん", 2],
];

/** 位の書き方。習った学年からは ふりがなつきの漢字、それより前は ひらがな（学年が分からないときは漢字） */
function unitName(i: number, grade?: number): string {
  const [, kanji, yomi, learned] = BIG_UNITS[i];
  return grade === undefined || grade >= learned ? `{${kanji}|${yomi}}` : yomi;
}

/** 1万から上の数は、上から4けたに丸める（「やく」をつけるかの判断と、表示の両方で使う） */
function roundBig(value: number): number {
  const digits = Math.floor(Math.log10(Math.abs(value))) + 1;
  const step = 10 ** (digits - 4);
  return Math.round(value / step) * step;
}

/**
 * 数を、ふりがなの記法つきで書く（22px 以上の文字に使う。RubyText に渡す）。
 * 1万から上は「万・億・兆・京」を使い、上から4けたに丸める（例：123456789 →「1{億|おく}2350{万|まん}」）。
 * grade を渡すと、まだ習っていない漢字は ひらがなにする（3年生なら「1おく2350{万|まん}」）
 */
export function numberRuby(value: number, grade?: number): string {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs === 0) return "0";
  if (abs >= 1e20) return value.toExponential(2).replace("e+", "×10^");
  // 9999.6 なども「1万」にする（丸めると1万になるため）
  if (abs >= 9999.5) {
    const sign = value < 0 ? "-" : "";
    // 4けたに丸めたので、出てくる位は2つまで（「1億2350万」「1万2350」）
    const rounded = Math.abs(roundBig(value));
    const i = BIG_UNITS.findIndex(([size]) => rounded >= size);
    const size = BIG_UNITS[i][0];
    const top = Math.floor(rounded / size + 1e-9);
    const lower = Math.round((rounded - top * size) / (size / 1e4));
    const lowerName = i + 1 < BIG_UNITS.length ? unitName(i + 1, grade) : "";
    return `${sign}${top}${unitName(i, grade)}${lower > 0 ? `${lower}${lowerName}` : ""}`;
  }
  if (abs >= 1000) return Math.round(value).toLocaleString("ja-JP");
  if (abs >= 100) return String(Math.round(value * 10) / 10);
  if (abs >= 1) return String(Math.round(value * 100) / 100);
  if (abs >= 0.001) return String(Math.round(value * 10000) / 10000);
  return value.toExponential(2).replace("e-", "×10^-");
}

/** 数を子どもにも読みやすい形にする（22px より小さい文字に使うので、万・億などは ひらがなで書く：「1おく2350まん」） */
export function formatNumber(value: number): string {
  return kanaOf(numberRuby(value));
}

/** 大きく出す数の、見た目の長さ（漢字・ひらがなは数字の2つぶんの幅として数える。字の大きさを決めるのに使う） */
export function numberLength(value: number, grade?: number): number {
  return [...stripRuby(numberRuby(value, grade))].reduce((n, c) => n + (/[\p{Script=Han}\p{Script=Hiragana}]/u.test(c) ? 2 : 1), 0);
}

/** 倍率を「約50倍」「約20分の1」のように書く */
export function formatRatio(ratio: number): string {
  if (!Number.isFinite(ratio) || ratio <= 0) return "—";
  if (ratio >= 1) return `約${formatNumber(ratio >= 10 ? Math.round(ratio) : Math.round(ratio * 10) / 10)}倍`;
  const inverse = 1 / ratio;
  return `約${formatNumber(inverse >= 10 ? Math.round(inverse) : Math.round(inverse * 10) / 10)}分の1`;
}

/** 日付を「10/24」の形にする（小さい文字なので、漢字を使わない） */
export function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/** formatNumber が丸めたあとの数（「約」をつけるかの判断に使う） */
function roundForDisplay(value: number): number {
  const abs = Math.abs(value);
  if (abs >= 1e20) return value;
  if (abs >= 9999.5) return roundBig(value);
  if (abs >= 1000) return Math.round(value);
  if (abs >= 100) return Math.round(value * 10) / 10;
  if (abs >= 1) return Math.round(value * 100) / 100;
  if (abs >= 0.001) return Math.round(value * 10000) / 10000;
  return value;
}

/** 画面に出す数が、丸めた数（ほんとうの数とすこしちがう）か */
export function isApprox(value: number): boolean {
  return Math.abs(roundForDisplay(value) - value) > Math.abs(value) * 0.001;
}
