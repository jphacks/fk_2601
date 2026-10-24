import { all, create } from "mathjs";
import type { Question } from "@/server/llm/schema";

const math = create(all);
const evaluateFormula = math.evaluate.bind(math);

// 驚きのある問い（確率・組み合わせ・足し算の積み重ね）に使う関数。重い計算にならないよう、大きさに上限をつける
const MAX_HARMONIC = 1_000_000;
const MAX_FACT = 170;
const MAX_COMB = 2000;

/** 1 + 1/2 + … + 1/n（ガチャを全部そろえる平均回数は n × harmonic(n)） */
function harmonic(n: number): number {
  const k = Math.floor(Math.min(Math.max(n, 0), MAX_HARMONIC));
  let sum = 0;
  for (let i = 1; i <= k; i++) sum += 1 / i;
  return sum;
}

function fact(n: number): number {
  const k = Math.floor(n);
  if (k < 0 || k > MAX_FACT) return Number.POSITIVE_INFINITY;
  let result = 1;
  for (let i = 2; i <= k; i++) result *= i;
  return result;
}

/** n この中から k こを えらぶ えらびかた */
function comb(n: number, k: number): number {
  const total = Math.floor(n);
  const pick = Math.floor(k);
  if (total < 0 || total > MAX_COMB || pick < 0 || pick > total) return 0;
  const small = Math.min(pick, total - pick);
  let result = 1;
  for (let i = 1; i <= small; i++) result = (result * (total - small + i)) / i;
  return result;
}

/** n 人の中に、たんじょう日が同じ人がいる確率（％）。1年は365日で考える */
function birthday(n: number): number {
  const k = Math.floor(n);
  if (k <= 1) return 0;
  if (k > 365) return 100;
  let none = 1;
  for (let i = 0; i < k; i++) none *= (365 - i) / 365;
  return (1 - none) * 100;
}

math.import({ harmonic, fact, comb, birthday });

// 式の中から危険な関数を呼べないようにする（math.js 公式のセキュリティの手順）
const disabled = () => {
  throw new Error("この関数は使えません");
};
math.import(
  {
    import: disabled,
    createUnit: disabled,
    reviver: disabled,
    evaluate: disabled,
    parse: disabled,
    simplify: disabled,
    derivative: disabled,
    resolve: disabled,
  },
  { override: true },
);

const ALLOWED_FUNCTIONS = new Set([
  "sqrt",
  "cbrt",
  "abs",
  "pow",
  "min",
  "max",
  "round",
  "floor",
  "ceil",
  "log",
  "log10",
  "log2",
  "exp",
  "pi",
  "e",
  "sin",
  "cos",
  "tan",
  "harmonic",
  "fact",
  "comb",
  "birthday",
]);

const MAX_FORMULA_LENGTH = 200;

export type CalcResult = { ok: true; value: number } | { ok: false; reason: string };

/** 式の文字と名前を確かめてから計算する。変数は scope に渡したものだけ使える */
export function calculate(formula: string, scope: Record<string, number>): CalcResult {
  if (formula.length === 0 || formula.length > MAX_FORMULA_LENGTH) {
    return { ok: false, reason: "式の長さが正しくありません" };
  }
  if (!/^[0-9A-Za-z_\s+\-*/^().,%]+$/.test(formula) || /\.[A-Za-z_]/.test(formula)) {
    return { ok: false, reason: "式に使えない文字があります" };
  }
  // 数の書き方（1.5e6 など）を取り除いてから、名前を調べる
  const names = formula.replace(/\d+(\.\d+)?(e[+-]?\d+)?/gi, " ").match(/[A-Za-z_][A-Za-z0-9_]*/g) ?? [];
  for (const name of names) {
    if (!(name in scope) && !ALLOWED_FUNCTIONS.has(name)) {
      return { ok: false, reason: `知らない名前があります: ${name}` };
    }
  }
  try {
    const value = evaluateFormula(formula, { ...scope });
    if (typeof value !== "number" || !Number.isFinite(value)) {
      return { ok: false, reason: "答えが数になりません" };
    }
    return { ok: true, value };
  } catch {
    return { ok: false, reason: "式を計算できません" };
  }
}

export function defaultScope(question: Question): Record<string, number> {
  return Object.fromEntries(question.variables.map((v) => [v.name, v.value]));
}

/** 問いの答え（estimate は答え、compare は A÷B の値）。why は null */
export function computeAnswer(question: Question, scope?: Record<string, number>): number | null {
  if (question.type === "why" || !question.formula) return null;
  const result = calculate(question.formula, scope ?? defaultScope(question));
  return result.ok ? result.value : null;
}

/**
 * 条件のスライダーをはしからはしまで動かしたときの、答えの大きさのはんい。
 * 数直線の目盛りを固定して、星がなめらかに動くようにするために使う（compare は、大きいほうが小さいほうの何倍か）
 */
export function answerBounds(question: Question): { min: number; max: number } | null {
  const vars = question.variables;
  if (question.type === "why" || !question.formula || vars.length > 4) return null;
  let min = Number.POSITIVE_INFINITY;
  let max = 0;
  let below = false;
  let above = false;
  const count = 1 << vars.length;
  for (let mask = 0; mask < count; mask++) {
    const scope = Object.fromEntries(vars.map((v, i) => [v.name, mask & (1 << i) ? v.max : v.min]));
    const result = calculate(question.formula, scope);
    if (!result.ok || result.value <= 0) continue;
    const value = result.value;
    if (question.type === "compare") {
      below ||= value < 1;
      above ||= value > 1;
      const magnitude = Math.max(value, 1 / value);
      min = Math.min(min, magnitude);
      max = Math.max(max, magnitude);
    } else {
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
  }
  if (!Number.isFinite(min) || max === 0) return null;
  if (question.type === "compare" && below && above) min = 1;
  return { min, max };
}

