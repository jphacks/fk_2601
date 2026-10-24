import { computeAnswer } from "./calc";
import { formatNumber } from "./format";
import type { Question } from "@/server/llm/schema";

export type Rating = "pita" | "oshii" | "ohazure";

/** 子どもの予想。問いの種類と学年によって、入力のしかたが変わる */
export type Guess =
  | { kind: "number"; value: number }
  | { kind: "bin"; index: number; edges: number[]; value: number }
  | { kind: "compare"; side: "a" | "b"; ratio: number }
  | { kind: "reason"; index: number };

export type Evaluation = {
  rating: Rating;
  type: Question["type"];
  /** 子どもの予想の数（why は null） */
  guessValue: number | null;
  /** 正解の数（estimate は答え、compare は大きいほうが小さいほうの何倍か。why は null） */
  actual: number | null;
  /** compare：どちらが大きいか。why：選んだ理由が正しいか */
  correct: boolean | null;
  /** compare：実さいに大きいほう */
  bigger: "a" | "b" | null;
};

export const BIN_COUNT = 5;
// ピタリ：誤差5%以内、おしい：予想の1/2〜2倍（docs/02-spec.md 11章）
const PITA_TOLERANCE = 0.05;

/** 数を、2けたの読みやすい数にそろえる */
const nice = (v: number) => Number(v.toPrecision(2));

/** 予想の範囲を、対数で5つに分けた境目（低学年向けの選択肢に使う） */
export function binEdges(range: { min: number; max: number }): number[] {
  const raw = Array.from({ length: BIN_COUNT + 1 }, (_, i) => range.min * Math.pow(range.max / range.min, i / BIN_COUNT));
  const rounded = raw.map(nice);
  const increasing = rounded.every((v, i) => i === 0 || v > rounded[i - 1]);
  return increasing ? rounded : raw;
}

export function binIndexOf(value: number, edges: number[]): number {
  for (let i = 0; i < BIN_COUNT; i++) if (value < edges[i + 1]) return i;
  return BIN_COUNT - 1;
}

export function binValue(edges: number[], index: number): number {
  return Math.sqrt(edges[index] * edges[index + 1]);
}

function rateNumbers(guess: number, actual: number): Rating {
  if (Math.abs(guess - actual) / actual <= PITA_TOLERANCE) return "pita";
  const ratio = guess / actual;
  return ratio >= 0.5 && ratio <= 2 ? "oshii" : "ohazure";
}

/** 答え合わせ。scope を渡すと、条件を変えた式で正解を計算する */
export function evaluate(question: Question, guess: Guess, scope?: Record<string, number>): Evaluation {
  if (question.type === "why" && guess.kind === "reason") {
    const correct = question.choices?.[guess.index]?.correct === true;
    return { rating: correct ? "pita" : "ohazure", type: "why", guessValue: null, actual: null, correct, bigger: null };
  }

  const answer = computeAnswer(question, scope);
  if (answer === null || answer <= 0) throw new Error("答えを計算できません");

  if (question.type === "compare" && guess.kind === "compare") {
    const magnitude = Math.max(answer, 1 / answer);
    const bigger = answer >= 1 ? "a" : "b";
    const sideRight = guess.side === bigger;
    return {
      rating: sideRight ? rateNumbers(guess.ratio, magnitude) : "ohazure",
      type: "compare",
      guessValue: guess.ratio,
      actual: magnitude,
      correct: sideRight,
      bigger,
    };
  }

  if (question.type === "estimate" && guess.kind === "bin") {
    const diff = Math.abs(guess.index - binIndexOf(answer, guess.edges));
    return {
      rating: diff === 0 ? "pita" : diff === 1 ? "oshii" : "ohazure",
      type: "estimate",
      guessValue: guess.value,
      actual: answer,
      correct: null,
      bigger: null,
    };
  }

  if (question.type === "estimate" && guess.kind === "number") {
    return { rating: rateNumbers(guess.value, answer), type: "estimate", guessValue: guess.value, actual: answer, correct: null, bigger: null };
  }

  throw new Error("予想の形が問いと合っていません");
}

export const RATING_LABEL: Record<Rating, string> = {
  pita: "ピタリ！",
  oshii: "おしい！",
  ohazure: "大はずれ！",
};

/** 子どもの予想が低学年向けの選択肢か（4年生まで）、スライダー・自由入力か（5年生から） */
export const usesChoices = (grade: number) => grade <= 4;

/** 子どもの予想を、画面に出す文字にする（選択肢で答えたときは、選んだ範囲のまま出す） */
export function describeGuess(guess: Guess, unit: string): string {
  if (guess.kind === "bin") return `${formatNumber(guess.edges[guess.index])}〜${formatNumber(guess.edges[guess.index + 1])}${unit}`;
  if (guess.kind === "number") return `${formatNumber(guess.value)}${unit}`;
  if (guess.kind === "compare") return `約${formatNumber(guess.ratio)}倍`;
  return "";
}
