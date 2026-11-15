// AI には 4つ書かせて（prompts.ts）、検査を通ったものから 子どもに見せる 3つを選ぶ。
// 1つ落ちても 3つ残るようにするため（docs/03-technical.md 5.3.4）。プロンプトの決まり（why を1つ以上・数の問いは2つまで・教科をまぜる）を、ここでも守る

export const SHOWN_COUNT = 3;
const MAX_NUMERIC = 2;

type Pickable = { type: string; subject?: string };

/** 選んだ組み合わせのよさ。前の項目ほど大事（教科2種類以上 → why がある → 教科3種類 → 数の問いが2つまで → 書かれた順に近い） */
function score<T extends Pickable>(combo: T[], valid: T[]): number[] {
  const subjects = new Set(combo.map((q) => q.subject).filter(Boolean)).size;
  const hasWhy = combo.some((q) => q.type === "why") ? 1 : 0;
  const numericOk = combo.filter((q) => q.type !== "why").length <= MAX_NUMERIC ? 1 : 0;
  const order = -combo.reduce((sum, q) => sum + valid.indexOf(q), 0);
  return [Math.min(subjects, 2), hasWhy, subjects, numericOk, order];
}

function better(a: number[], b: number[]): boolean {
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return a[i] > b[i];
  return false;
}

function combinations<T>(items: T[], k: number): T[][] {
  if (k === 0) return [[]];
  if (items.length < k) return [];
  const [head, ...rest] = items;
  return [...combinations(rest, k - 1).map((c) => [head, ...c]), ...combinations(rest, k)];
}

/**
 * 検査を通った問い（AI が書いた順）から、子どもに見せる問いを選ぶ。
 * 教科（算数・理科・情報）が かたよらないように、3つの教科（できなければ 2つの教科）になる組み合わせを優先する（#217）。
 * 順番は、書かれた順を保つ
 */
export function pickQuestions<T extends Pickable>(valid: T[], max = SHOWN_COUNT): T[] {
  if (valid.length <= max) return valid;
  let best: T[] = valid.slice(0, max);
  let bestScore = score(best, valid);
  for (const combo of combinations(valid, max)) {
    const s = score(combo, valid);
    if (better(s, bestScore)) {
      best = combo;
      bestScore = s;
    }
  }
  return valid.filter((q) => best.includes(q));
}
