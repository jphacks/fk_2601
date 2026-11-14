import "server-only";
import { calculate, defaultScope } from "@/lib/calc";
import { stripRuby } from "@/lib/ruby";
import type { Detail, Question } from "./schema";

// LLM の答え（llmAnswer）と、式で計算した値のずれの許容範囲（docs/03-technical.md 5.2）
const ANSWER_TOLERANCE = 0.05;
// 条件をならべすぎた問いを出さない（ふりがなをのぞいた問題文の長さと、数の個数。docs/03-technical.md 5.3）
const MAX_TEXT_LENGTH = 140;
const MAX_NUMBERS_IN_TEXT = 2;
const MAX_NUMBER_IN_TEXT = 10000;
// 数で答える問いは、計算に使う数を問題文にならべない（文章題にしない）。問題文は1つまで、ヒントと合わせて2つまで
const MAX_NUMBERS_IN_NUMERIC_TEXT = 1;
const MAX_NUMBERS_WITH_HINT = 2;
// 子どもが直感で言いそうな数（naiveGuess）と答えが、これより近い問いは出さない（予想がはずれないため）。
// 2倍にすると、ガチャを ぜんぶ そろえる平均（直感 8回・答え 約15回）のような よい問いまで落ちた（2026-11-13）
const MIN_SURPRISE_RATIO = 1.5;
const NAME_PATTERN = /^[a-z][A-Za-z0-9_]*$/;
// 正解が あやふやな「なぜ？」型は出さない。空白をのぞいて探す。「あたらしい」などの「らしい」は、のぞいてから探す
const HEDGE_PATTERN = /かもしれ|おもう|おもいま|おもわれ|思う|思いま|思われ|らしい|たぶん|多分/;
const NOT_HEDGE_PATTERN = /あたらしい|めずらしい|すばらしい|わざとらしい|いやらしい|かわいらしい|ばからしい|新しい|珍しい|素晴らしい/g;
const hasHedge = (text: string) => HEDGE_PATTERN.test(stripRuby(text).replace(/\s+/g, "").replace(NOT_HEDGE_PATTERN, ""));

export type Validated = { ok: true; question: Question } | { ok: false; reason: string };

/** 解説などは、2回目で書かせる（#165）。1回目の問いには、空の値を入れておく（explanation.short が空かどうかで、2回目が要るかが分かる） */
export const EMPTY_DETAIL: Detail = {
  explanation: { short: "", steps: [] },
  whatIf: "",
  tryIt: "",
  related: [],
  keyword: "",
  sources: [],
};

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

// AI は正解を1番目に書く（15問中15問。2026-11-13）ので、サーバーで1回だけ ランダムに並べかえる。保存される順が、そのまま画面の順になる
function shuffled<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// 「やってみよう」に入っていたら出さない ことば（AI への指示でも禁じているが、念のため コードでも はじく。docs/02-spec.md 13章）
const UNSAFE_TRY = [
  "火", "ほのお", "マッチ", "ライター", "コンロ", "あつい", "熱", "おゆ", "お湯", "ゆげ",
  "刃", "ナイフ", "はさみ", "ハサミ", "カッター", "ほうちょう", "包丁", "切る",
  "でんき", "電気", "コンセント", "でんち", "電池", "でんし", "電子レンジ",
  "くすり", "薬", "せんざい", "洗剤", "ひょうはく", "漂白",
  "たかい ところ", "高い所", "高い ところ", "やね", "屋根", "のぼ", "登",
  "どうろ", "道路", "しゃどう", "車道", "せんろ", "線路", "ふみきり", "踏切", "川", "池", "海",
  "なめ", "たべ", "食べ", "のんで", "飲", "くちに", "口に",
  "しらない ひと", "知らない人", "でかけ", "出かけ", "まちで",
];

/** やってみよう を確かめる。あぶないかもしれない ことばが あれば、出さない（空にする） */
function sanitizeTryIt(text: string | undefined): string {
  const t = clip(text ?? "", 120);
  const plain = stripRuby(t).replace(/\s+/g, " ");
  return UNSAFE_TRY.some((w) => plain.includes(w)) ? "" : t;
}

/** 身近なものへの言いかえ（per / times）が、使える形かを確かめる。だめなら null にする */
function sanitizeRef(ref: Question["ref"]): Question["ref"] {
  if (!ref) return null;
  const label = clip(ref.label, 60);
  if (!label || !(ref.value > 0) || !Number.isFinite(ref.value)) return null;
  return { type: ref.type, label, value: ref.value, unit: clip(ref.unit, 10) };
}

/** 2回目で書かせた 解説などを確かめ、使える形にそろえる（1回目の問いと同じ決まり）。解説の一言が空なら null */
export function validateDetail(detail: Detail): Detail | null {
  const short = clip(detail.explanation.short, 200);
  if (short.length === 0) return null;
  return {
    explanation: { short, steps: detail.explanation.steps.map((s) => clip(s, 200)).filter(Boolean).slice(0, 6) },
    whatIf: clip(detail.whatIf ?? "", 80),
    tryIt: sanitizeTryIt(detail.tryIt),
    related: (detail.related ?? []).map((r) => clip(r, 100)).filter(Boolean).slice(0, 2),
    keyword: clip(detail.keyword ?? "", 40),
    sources: (detail.sources ?? []).slice(0, 5).map((s) => ({ ...s, url: sanitizeUrl(s.url) })),
  };
}

// 検査する問い。1回目の問い（解説などがない）・見本の問い・自分で書いた問い（全部ある）のどれでも受けとる
type Draft = Omit<Question, keyof Detail | "swappable"> & Partial<Detail> & { swappable?: boolean; naiveGuess?: number };

/**
 * LLM が出した問いを確かめ、使える形にそろえる。式の答えは LLM の値ではなく、math.js で計算した値を信じる。
 * lenient は、子どもが自分で書いた問いと、見本の問い（写真のものを入れかえられるか・長さ・数の個数では はじかない）。
 * partial は、1回目の問い（解説などは 2回目に書くので、空のまま通す）
 */
export function validateQuestion(draft: Draft, options: { lenient?: boolean; partial?: boolean } = {}): Validated {
  const fail = (reason: string): Validated => ({ ok: false, reason });
  // naiveGuess は検査に使うだけで、保存しない。AI が作る問い（DraftQuestion）には swappable がない
  const { naiveGuess, swappable, ...input } = draft;
  const q: Question = {
    ...input,
    explanation: input.explanation ?? EMPTY_DETAIL.explanation,
    sources: (input.sources ?? []).map((s) => ({ ...s, url: sanitizeUrl(s.url) })),
    // 内部で使うだけの項目は、保存しない
    secret: "",
    swappable: false,
    // 大人が あとで たしかめられるよう、basis は のこす（ふりがな記法は残さない）。前の記録には ない
    ...(input.basis === undefined ? {} : { basis: clip(stripRuby(input.basis), 200) }),
    // 見出しや分類に使う文字には、ふりがな記法を残さない
    topic: stripRuby(input.topic).trim(),
    target: stripRuby(input.target).trim(),
    answerUnit: stripRuby(input.answerUnit).trim(),
    variables: input.variables.map((v) => ({ ...v, unit: stripRuby(v.unit).trim() })),
    hint: clip(input.hint ?? "", 120),
    whatIf: clip(input.whatIf ?? "", 80),
    tryIt: sanitizeTryIt(input.tryIt),
    related: (input.related ?? []).map((r) => clip(r, 100)).filter(Boolean).slice(0, 2),
    keyword: clip(input.keyword ?? "", 40),
    ref: sanitizeRef(input.ref),
  };

  if (q.text.trim().length === 0 || q.text.length > 400) return fail("問題文の長さが正しくありません");
  // AI が「写真からの すいそく」と申告した問いは、まちがったことを おぼえさせるおそれがあるので出さない（見本の問いは通す）
  if (!options.lenient && q.certainty === "guess") return fail("正解の たしかさが すいそくの問いです");
  if (!options.lenient) {
    // 写っているものでなければ成り立たない、短くて、条件をならべすぎない問いだけを使う
    if (swappable) return fail("写っているもの以外でも成り立つ問いです");
    const plain = stripRuby(q.text);
    if (plain.length > MAX_TEXT_LENGTH) return fail("問題文が長すぎます");
    // 「1日」「1回」のような 1 は数えない。専門の大きな数（44100 など）を条件に書いた問いも出さない
    const numbers = (plain.match(/\d+(?:\.\d+)?/g) ?? []).map(Number).filter((n) => n !== 1);
    if (numbers.length > MAX_NUMBERS_IN_TEXT) return fail("問題文に数が多すぎます");
    if (numbers.some((n) => n >= MAX_NUMBER_IN_TEXT)) return fail("問題文に大きな数が書いてあります");
    if (q.type !== "why") {
      if (numbers.length > MAX_NUMBERS_IN_NUMERIC_TEXT) return fail("数で答える問いの問題文に、数がならんでいます");
      const inHint = (stripRuby(q.hint).match(/d+(?:.d+)?/g) ?? []).map(Number).filter((n) => n !== 1);
      if (numbers.length + inHint.length > MAX_NUMBERS_WITH_HINT) return fail("問題文とヒントに、計算に使う数がならんでいます");
    }
  }
  if (!options.partial && q.explanation.short.trim().length === 0) return fail("解説がありません");
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
    // 正解の選択肢や一言に「かもしれない」などが入っている問いは、正解があやふやなので出さない
    if (choices.some((c) => c.correct && hasHedge(c.text)) || hasHedge(q.explanation.short)) return fail("正解が あやふやな ことばで 書かれています");
    return { ok: true, question: { ...q, choices: shuffled(choices), formula: null, variables: [], guessRange: null, compare: null, llmAnswer: null, ref: null } };
  }

  if (!q.formula) return fail("式がありません");
  // 式で使われない変数は、もしもの スライダーを動かしても答えが変わらないので、外す。
  // 1つも使わない式（円の まわりは はばの 何倍？＝pi など、答えが決まった数）は、スライダーなしで出す（もしもの画面は出ない）
  const formula = q.formula;
  q.variables = q.variables.filter((v) => new RegExp(`(^|[^A-Za-z0-9_])${v.name}([^A-Za-z0-9_(]|$)`).test(formula));
  const result = calculate(q.formula, defaultScope(q));
  if (!result.ok) return fail(result.reason);
  const answer = result.value;
  if (answer <= 0) return fail("答えが0以下です");
  if (q.llmAnswer === null || Math.abs(q.llmAnswer - answer) > Math.abs(answer) * ANSWER_TOLERANCE) {
    return fail("LLM の答えと式の答えが大きくずれています");
  }
  if (!options.lenient) {
    // 直感で言いそうな数と答えが近い問いは、計算の練習になるだけなので出さない
    if (typeof naiveGuess !== "number" || !(naiveGuess > 0)) return fail("直感で言いそうな数がありません");
    if (Math.max(answer / naiveGuess, naiveGuess / answer) < MIN_SURPRISE_RATIO) return fail("直感で言いそうな数と、答えが近すぎます");
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
