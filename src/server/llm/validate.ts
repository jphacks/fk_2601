import "server-only";
import { calculate, defaultScope } from "@/lib/calc";
import { stripRuby } from "@/lib/ruby";
import type { Question } from "./schema";

// LLM の答え（llmAnswer）と、式で計算した値のずれの許容範囲（docs/03-technical.md 5.2）
const ANSWER_TOLERANCE = 0.05;
const NAME_PATTERN = /^[a-z][A-Za-z0-9_]*$/;

export type Validated = { ok: true; question: Question } | { ok: false; reason: string };

function sanitizeUrl(url: string | null): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}

const clip = (text: string, max: number) => text.trim().slice(0, max);

/** 身近なものへの言いかえ（per / times）が、使える形かを確かめる。だめなら null にする */
function sanitizeRef(ref: Question["ref"]): Question["ref"] {
  if (!ref) return null;
  const label = clip(ref.label, 60);
  if (!label || !(ref.value > 0) || !Number.isFinite(ref.value)) return null;
  return { type: ref.type, label, value: ref.value, unit: clip(ref.unit, 10) };
}

/** LLM が出した問いを確かめ、使える形にそろえる。式の答えは LLM の値ではなく、math.js で計算した値を信じる */
export function validateQuestion(input: Question): Validated {
  const fail = (reason: string): Validated => ({ ok: false, reason });
  const q: Question = {
    ...input,
    // 見出しや分類に使う文字には、ふりがな記法を残さない
    topic: stripRuby(input.topic).trim(),
    target: stripRuby(input.target).trim(),
    answerUnit: stripRuby(input.answerUnit).trim(),
    variables: input.variables.map((v) => ({ ...v, unit: stripRuby(v.unit).trim() })),
    hint: clip(input.hint ?? "", 120),
    whatIf: clip(input.whatIf ?? "", 80),
    related: (input.related ?? []).map((r) => clip(r, 100)).filter(Boolean).slice(0, 2),
    keyword: clip(input.keyword ?? "", 40),
    sources: input.sources.map((s) => ({ ...s, url: sanitizeUrl(s.url) })),
    ref: sanitizeRef(input.ref),
  };

  if (q.text.trim().length === 0 || q.text.length > 400) return fail("問題文の長さが正しくありません");
  if (q.explanation.short.trim().length === 0) return fail("解説がありません");
  if (q.topic.length === 0 || q.target.length === 0) return fail("単元か対象がありません");

  const names = new Set<string>();
  for (const v of q.variables) {
    if (!NAME_PATTERN.test(v.name) || names.has(v.name)) return fail(`変数名が正しくありません: ${v.name}`);
    names.add(v.name);
    if (![v.value, v.min, v.max, v.step].every(Number.isFinite)) return fail("変数の数が正しくありません");
    if (v.min >= v.max || v.step <= 0 || v.value < v.min || v.value > v.max) return fail("スライダーの範囲が正しくありません");
  }
  if (q.variables.length > 4) return fail("変数が多すぎます");

  if (q.type === "why") {
    const choices = q.choices ?? [];
    if (choices.length < 2 || choices.filter((c) => c.correct).length !== 1) return fail("選択肢が正しくありません");
    return { ok: true, question: { ...q, formula: null, variables: [], guessRange: null, compare: null, llmAnswer: null, ref: null } };
  }

  if (!q.formula) return fail("式がありません");
  const result = calculate(q.formula, defaultScope(q));
  if (!result.ok) return fail(result.reason);
  const answer = result.value;
  if (answer <= 0) return fail("答えが0以下です");
  if (q.llmAnswer === null || Math.abs(q.llmAnswer - answer) > Math.abs(answer) * ANSWER_TOLERANCE) {
    return fail("LLM の答えと式の答えが大きくずれています");
  }

  if (q.type === "compare") {
    if (!q.compare || !q.compare.a.trim() || !q.compare.b.trim()) return fail("比べる2つの名前がありません");
    return { ok: true, question: { ...q, answerUnit: "倍", guessRange: null, choices: null, ref: null } };
  }

  // estimate：予想の範囲は、正解をふくみ、100倍以内にそろえる。合わなければ作り直す
  let range = q.guessRange;
  const valid = range && range.min > 0 && range.max > range.min && range.max / range.min <= 100 && range.min <= answer && answer <= range.max;
  if (!valid) range = { min: answer / 8, max: answer * 4 };
  return { ok: true, question: { ...q, guessRange: range, compare: null, choices: null } };
}
