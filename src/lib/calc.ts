import { all, create } from "mathjs";
import type { Question } from "@/server/llm/schema";

const math = create(all);
const evaluateFormula = math.evaluate.bind(math);

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
