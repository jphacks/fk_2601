// 問いの評価スクリプト（#159）。同じ写真・同じ学年で、プロンプトを直す前と後をくらべるための土台。
// 手で動かすときだけ、本物の AI を呼ぶ（テスト・CI・ビルドからは呼ばれない）。使いかたは docs/03-technical.md 5.3.2
//   npm run eval:questions -- [--only <ファイル名>] [--grades 1,3,6] [--level 1] [--dry-run]
// 本物と同じ道（SYSTEM_PROMPT・questionsUserText・QuestionsOutputSchema・callStructured・validateQuestion）を通す。
// 1回目（問い4つ→検査を通ったものから3つに しぼる）だけを評価する。解説・やってみよう・出典は 2回目（#165）で書かせるので、ここには出ない

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { calculate } from "@/lib/calc";
import { isLearned } from "@/lib/kanji";
import { TIMES_GRADE } from "@/lib/format";
import { stripRuby } from "@/lib/ruby";
import { callStructured, LlmError } from "@/server/llm/client";
import { FACTS } from "@/server/llm/facts";
import { questionsUserText, SYSTEM_PROMPT } from "@/server/llm/prompts";
import { QuestionsRequestSchema } from "@/server/llm/request";
import { QuestionsOutputSchema, type DraftQuestion, type QuestionsOutput } from "@/server/llm/schema";
import { pickQuestions, SHOWN_COUNT } from "@/server/llm/select";
import { validateQuestion } from "@/server/llm/validate";

// 1回の実行で呼べる回数の上限（課金のため。これをこえるときは、呼ばずにエラーで止める）
const MAX_CALLS = 40;
const DEFAULT_GRADES = [1, 3, 6];
const IMAGE_DIR = "eval/images";
const OUT_DIR = "eval/out";
// 単調さを見るための、問題文の出だし
const WHY_START = /^(なぜ|何故|なんのため|何のため|どうして)/;

type Args = { only: string | null; grades: number[]; level: number; dryRun: boolean };

function fail(message: string): never {
  console.error(`エラー: ${message}`);
  process.exit(1);
}

function parseArgs(argv: string[]): Args {
  const args: Args = { only: null, grades: DEFAULT_GRADES, level: 1, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    if (key === "--dry-run") {
      args.dryRun = true;
      continue;
    }
    const value = argv[++i];
    if (value === undefined) fail(`${key} に値がありません`);
    if (key === "--only") args.only = value;
    else if (key === "--grades") {
      args.grades = value.split(",").map((s) => Number(s.trim()));
      if (args.grades.length === 0 || args.grades.some((g) => !Number.isInteger(g) || g < 1 || g > 6)) fail("--grades は 1〜6 を , でならべてください（例: 1,3,6）");
    } else if (key === "--level") {
      args.level = Number(value);
      if (!Number.isInteger(args.level) || args.level < 1 || args.level > 5) fail("--level は 1〜5 です");
    } else fail(`知らない引数です: ${key}`);
  }
  return args;
}

type Call = {
  image: string;
  grade: number;
  ms: number | null;
  usage: { inputTokens: number; outputTokens: number; cacheRead: number; cacheWrite: number } | null;
  model: string | null;
  effort: string | null;
  error: string | null;
  recognition: QuestionsOutput["recognition"] | null;
  questions: Judged[];
};

// ok＝検査を通った／chosen＝そのうち、子どもに出す 3つに選ばれた（select.ts）
type Judged = { draft: DraftQuestion; ok: boolean; reason: string | null; chosen: boolean };

/** callStructured が出す [llm] のログ（時間とトークンの数だけ）を取りこむ。画面には出さない */
type LlmLog = { ms: number; inputTokens: number; outputTokens: number; cacheRead: number; cacheWrite: number; model: string; effort: string };
function captureLlmLog<T>(run: () => Promise<T>): Promise<{ result: T | Error; log: LlmLog | null }> {
  const original = console.info;
  let log: LlmLog | null = null;
  console.info = (...items: unknown[]) => {
    if (items[0] === "[llm]" && typeof items[1] === "object" && items[1]) log = items[1] as LlmLog;
  };
  return run()
    .then((result) => ({ result: result as T | Error, log }))
    .catch((error: unknown) => ({ result: (error instanceof Error ? error : new Error("unknown")) as T | Error, log }))
    .finally(() => {
      console.info = original;
    });
}

/** 本物の流れ（generate.ts の generateQuestions）と同じ検査をして、落ちた理由を残す */
function judge(output: QuestionsOutput, grade: number): Judged[] {
  const judged: Judged[] = output.questions.map((draft) => {
    const result = validateQuestion(draft, { partial: true });
    return result.ok ? { draft, ok: true, reason: null, chosen: false } : { draft, ok: false, reason: result.reason, chosen: false };
  });
  // 1年生は「倍」を まだ習っていないので、ほかの問いがあるときは compare を出さない（generate.ts の fitToGrade）
  if (grade < TIMES_GRADE && judged.some((j) => j.ok && j.draft.type !== "compare")) {
    for (const j of judged) {
      if (j.ok && j.draft.type === "compare") {
        j.ok = false;
        j.reason = "1年生には compare（何倍）を出さない決まり";
      }
    }
  }
  // 本物と同じ選びかた（generate.ts）。AI は 4つ書き、検査を通ったものから 3つに しぼる
  const picked = new Set(pickQuestions(judged.filter((j) => j.ok).map((j) => ({ type: j.draft.type, judged: j }))).map((p) => p.judged));
  for (const j of judged) j.chosen = picked.has(j);
  return judged;
}

function listImages(only: string | null): string[] {
  let names: string[];
  try {
    names = readdirSync(IMAGE_DIR).filter((n) => [".jpg", ".jpeg"].includes(extname(n).toLowerCase())).sort();
  } catch {
    return fail(`${IMAGE_DIR}/ がありません`);
  }
  if (only) names = names.filter((n) => n === only || basename(n, extname(n)) === only);
  if (names.length === 0) fail(only ? `${IMAGE_DIR}/ に ${only} がありません` : `${IMAGE_DIR}/ に JPEG がありません`);
  return names;
}

function readImage(name: string): string {
  const buffer = readFileSync(join(IMAGE_DIR, name));
  // 位置情報などのメタデータ（EXIF）が残った写真は、送らない（AGENTS.md「LLM の扱い」）
  if (buffer.subarray(0, 65536).includes(Buffer.from("Exif\0\0", "latin1"))) fail(`${name} に EXIF が残っています。取りのぞいてから置いてください（convert -strip など）`);
  return buffer.toString("base64");
}

// ---- 数える ----

const plainOf = (q: DraftQuestion) => stripRuby(q.text);
const numbersIn = (text: string) => (text.match(/\d+(?:\.\d+)?/g) ?? []).map(Number).filter((n) => n !== 1);
const isNumeric = (q: DraftQuestion) => q.type !== "why";
const mean = (values: number[]) => (values.length === 0 ? 0 : values.reduce((a, b) => a + b, 0) / values.length);
const pct = (n: number, d: number) => (d === 0 ? "-" : `${((n / d) * 100).toFixed(0)}%（${n}/${d}）`);

/** その学年で習っていない漢字の数（問題文・ヒント・選択肢・比べる名前。ふりがなの記法は外してから数える） */
function unlearnedKanji(q: DraftQuestion, grade: number): string[] {
  const parts = [q.text, q.hint, ...(q.choices ?? []).map((c) => c.text), q.compare?.a ?? "", q.compare?.b ?? ""];
  const found: string[] = [];
  for (const ch of stripRuby(parts.join(""))) {
    if (/\p{Script=Han}/u.test(ch) && !isLearned(ch, grade)) found.push(ch);
  }
  return found;
}

function summarize(calls: Call[]): string {
  const done = calls.filter((c) => !c.error);
  const all = done.flatMap((c) => c.questions.map((j) => ({ ...j, grade: c.grade })));
  const passed = all.filter((j) => j.ok);
  const shown = all.filter((j) => j.chosen);
  const rows: [string, string][] = [];

  rows.push(["呼んだ回数（うち失敗）", `${calls.length}（${calls.length - done.length}）`]);
  const recognized = done.filter((c) => c.recognition?.canAsk !== false);
  rows.push(["問いを作れないと答えた写真の割合（canAsk=false）", pct(done.length - recognized.length, done.length)]);
  rows.push(["検査で落ちた問いの割合", pct(all.length - passed.length, all.length)]);
  const full = recognized.filter((c) => c.questions.filter((j) => j.chosen).length >= SHOWN_COUNT);
  rows.push([`子どもに ${SHOWN_COUNT}つ 出せた割合（選んだあと）`, pct(full.length, recognized.length)]);

  const count = (list: typeof all, type: string) => list.filter((j) => j.draft.type === type).length;
  rows.push(["type の内わけ・作った問い（why / estimate / compare）", `${count(all, "why")} / ${count(all, "estimate")} / ${count(all, "compare")}`]);
  rows.push(["type の内わけ・出る問い（検査を通って、3つに選ばれたもの）", `${count(shown, "why")} / ${count(shown, "estimate")} / ${count(shown, "compare")}`]);
  // 子どもに出る問い（検査を通ったもの）に、数で答える問いが1つもない、写真×学年の割合
  const noNumeric = recognized.filter((c) => !c.questions.some((j) => j.chosen && isNumeric(j.draft)));
  rows.push(["数で答える問いが1つもない写真×学年の割合（出る問いの中で）", pct(noNumeric.length, recognized.length)]);
  const noNumericMade = recognized.filter((c) => !c.questions.some((j) => isNumeric(j.draft)));
  rows.push(["数で答える問いが1つもない写真×学年の割合（作った問いの中で）", pct(noNumericMade.length, recognized.length)]);

  const threeCalls = recognized.filter((c) => c.questions.length >= 3);
  const sameSubject = threeCalls.filter((c) => new Set(c.questions.filter((j) => j.chosen).map((j) => j.draft.subject)).size === 1);
  rows.push(["3問とも同じ subject の割合（選んだ3つ）", pct(sameSubject.length, threeCalls.length)]);

  rows.push(["問題文の長さの平均（ふりがなをのぞく・作った問い）", `${mean(all.map((j) => plainOf(j.draft).length)).toFixed(1)} 字`]);
  rows.push(["問題文の数の個数の平均（1をのぞく・作った問い）", `${mean(all.map((j) => numbersIn(plainOf(j.draft)).length)).toFixed(2)} こ`]);
  const whyStart = all.filter((j) => WHY_START.test(plainOf(j.draft).trim()));
  rows.push(["「なぜ・なんのため・どうして」で始まる問いの割合（作った問い）", pct(whyStart.length, all.length)]);
  const manyWhy = threeCalls.filter((c) => c.questions.filter((j) => WHY_START.test(plainOf(j.draft).trim())).length >= 2);
  rows.push(["そのうち、1回に2つ以上ある回の割合（決まりは1つまで）", pct(manyWhy.length, threeCalls.length)]);
  rows.push(["学年で習っていない漢字の数の合計（問いごとの平均）", `${all.reduce((s, j) => s + unlearnedKanji(j.draft, j.grade).length, 0)}（${mean(all.map((j) => unlearnedKanji(j.draft, j.grade).length)).toFixed(2)}）`]);

  const sum = (pick: (u: NonNullable<Call["usage"]>) => number) => done.reduce((s, c) => s + (c.usage ? pick(c.usage) : 0), 0);
  rows.push(["かかった時間の平均", `${(mean(done.map((c) => c.ms ?? 0)) / 1000).toFixed(1)} 秒`]);
  rows.push(["トークンの合計（入力 / 出力 / キャッシュ読み / キャッシュ書き）", `${sum((u) => u.inputTokens)} / ${sum((u) => u.outputTokens)} / ${sum((u) => u.cacheRead)} / ${sum((u) => u.cacheWrite)}`]);

  const table = ["| 項目 | 値 |", "|---|---|", ...rows.map(([k, v]) => `| ${k} | ${v} |`)].join("\n");

  // 落ちた理由の内わけ
  const reasons = new Map<string, number>();
  for (const j of all) if (!j.ok && j.reason) reasons.set(j.reason, (reasons.get(j.reason) ?? 0) + 1);
  const reasonTable =
    reasons.size === 0
      ? "（検査で落ちた問いはありません）"
      : ["| 落ちた理由 | 数 |", "|---|---|", ...[...reasons].sort((a, b) => b[1] - a[1]).map(([r, n]) => `| ${r} | ${n} |`)].join("\n");

  // 学年ごとの内わけ
  const gradeRows = [...new Set(calls.map((c) => c.grade))].sort().map((g) => {
    const list = all.filter((j) => j.grade === g);
    const ok = list.filter((j) => j.ok);
    const numeric = list.filter((j) => isNumeric(j.draft)).length;
    return `| ${g}年 | ${list.length} | ${pct(list.length - ok.length, list.length)} | ${numeric} |`;
  });
  const gradeTable = ["| 学年 | 作った問い | 落ちた割合 | 数で答える問い（作った） |", "|---|---|---|---|", ...gradeRows].join("\n");

  return `## 集計\n\n${table}\n\n### 学年ごと\n\n${gradeTable}\n\n### 検査で落ちた理由\n\n${reasonTable}\n`;
}

// ---- 報告 ----

function describeQuestion(j: Judged, index: number, grade: number): string {
  const q = j.draft;
  const lines: string[] = [];
  lines.push(`#### 問い${index + 1}　${j.ok ? (j.chosen ? "✅ 通った（選ばれた）" : "☑ 通った（3つの外）") : `❌ 落ちた：${j.reason}`}`);
  lines.push("");
  lines.push(`- type: ${q.type} ／ subject: ${q.subject} ／ 単元: ${q.topic} ／ 対象: ${q.target}`);
  lines.push(`- 問題文: ${q.text}`);
  lines.push(`- ねらい（secret）: ${q.secret}`);
  if (q.hint) lines.push(`- ヒント: ${q.hint}`);
  if (q.choices) lines.push(...["- 選択肢:", ...q.choices.map((c) => `  - ${c.correct ? "✔ " : ""}${c.text}`)]);
  if (q.compare) lines.push(`- くらべる2つ: ${q.compare.a} と ${q.compare.b}`);
  if (q.formula) {
    const vars = q.variables.map((v) => `${v.name}=${v.value}${v.unit}`).join("、");
    lines.push(`- 式: \`${q.formula}\`（${vars}）／ 答えの単位: ${q.answerUnit} ／ AI の答え: ${q.llmAnswer} ／ 直感の数: ${q.naiveGuess}`);
  }
  lines.push(`- たしかさ: ${q.certainty} ／ わけ: ${q.basis}`);
  const kanji = unlearnedKanji(q, grade);
  lines.push(`- 習っていない漢字: ${kanji.length}${kanji.length > 0 ? `（${[...new Set(kanji)].join("")}）` : ""} ／ 問題文 ${plainOf(q).length} 字・数 ${numbersIn(plainOf(q)).length} こ`);
  lines.push("");
  return lines.join("\n");
}

function describeCall(c: Call): string {
  const head = `### ${c.image} ／ ${c.grade}年生`;
  if (c.error) return `${head}\n\n![${c.image}](../images/${c.image})\n\n⚠ 失敗：${c.error}\n`;
  const usage = c.usage
    ? `入力 ${c.usage.inputTokens}・出力 ${c.usage.outputTokens}・キャッシュ読み ${c.usage.cacheRead}・キャッシュ書き ${c.usage.cacheWrite}`
    : "トークン数なし";
  const meta = `${c.model ?? "?"}・effort ${c.effort ?? "?"}・${((c.ms ?? 0) / 1000).toFixed(1)}秒・${usage}`;
  const label = c.recognition ? `これは「${c.recognition.label}」${c.recognition.canAsk ? "" : "（問いは作れない）"}` : "";
  return [head, "", `![${c.image}](../images/${c.image})`, "", `${label} ／ ${meta}`, "", ...c.questions.map((j, i) => describeQuestion(j, i, c.grade))].join("\n");
}

function timestamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

// ひきだし（facts.ts。#162）の すべての式が、calc.ts の calculate で計算できるかを確かめる（AI は呼ばない）。
// 変数の はしからはし（min・max の 組み合わせ）でも、答えが 0 より大きい数になること。問題があれば、止める
function checkFacts() {
  const problems: string[] = [];
  const ids = new Set<string>();
  for (const f of FACTS) {
    const at = (msg: string) => problems.push(`${f.id}: ${msg}`);
    if (ids.has(f.id)) at("id が かさなっています");
    ids.add(f.id);
    if (f.targets.length === 0 || !f.source.trim() || !f.secret.trim() || !f.answerUnit.trim()) at("targets・secret・source・answerUnit が 空です");
    if (!Number.isInteger(f.minGrade) || f.minGrade < 1 || f.minGrade > 6) at("minGrade は 1〜6 です");
    if (f.variables.length === 0 || f.variables.length > 3) at("変数は 1〜3 こです");
    for (const v of f.variables) {
      if (!/^[a-z][A-Za-z0-9_]*$/.test(v.name) || !(v.min < v.max) || !(v.step > 0) || v.value < v.min || v.value > v.max) at(`変数が正しくありません: ${v.name}`);
    }
    const scopes = [Object.fromEntries(f.variables.map((v) => [v.name, v.value]))];
    for (let mask = 0; mask < 1 << f.variables.length; mask++) {
      scopes.push(Object.fromEntries(f.variables.map((v, i) => [v.name, mask & (1 << i) ? v.max : v.min])));
    }
    for (const scope of scopes) {
      const r = calculate(f.formula, scope);
      if (!r.ok) at(`${r.reason}（${JSON.stringify(scope)}）`);
      else if (!(r.value > 0)) at(`答えが 0 以下です（${JSON.stringify(scope)}）`);
    }
  }
  if (problems.length > 0) fail(`ひきだし（facts.ts）に 問題があります\n  ${problems.join("\n  ")}`);
  console.log(`ひきだし ${FACTS.length} こ：すべての式が 計算できました`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  checkFacts();
  const images = listImages(args.only);
  const total = images.length * args.grades.length;
  if (total > MAX_CALLS) fail(`呼ぶ回数が ${total} 回になります。1回の実行は ${MAX_CALLS} 回までです（--only か --grades で しぼってください）`);

  console.log(`写真 ${images.length} 枚 × 学年 ${args.grades.join("・")} ＝ ${total} 回（めやす：1回 約3セント → 約 ${(total * 0.03).toFixed(2)} ドル）`);
  if (args.dryRun) {
    for (const image of images) console.log(`  ${image}`);
    console.log("--dry-run なので、AI は呼びません");
    return;
  }
  if (process.env.LLM_MODE === "mock") fail("LLM_MODE=mock のままです。本物の AI を呼んで評価するので、.env.local の LLM_MODE を空にしてください");
  if (!process.env.ANTHROPIC_API_KEY) fail("ANTHROPIC_API_KEY がありません（.env.local に書いてください）");

  const calls: Call[] = [];
  let n = 0;
  for (const image of images) {
    const base64 = readImage(image);
    for (const grade of args.grades) {
      n++;
      const request = QuestionsRequestSchema.parse({ image: base64, grade, level: args.level, archiveCount: 0, asked: [] });
      // 自動リトライはしない。失敗したら、その回の失敗として残して、次へ進む
      const { result, log } = await captureLlmLog(() => callStructured(QuestionsOutputSchema, SYSTEM_PROMPT, request.image, questionsUserText(request)));
      const call: Call = {
        image,
        grade,
        ms: log?.ms ?? null,
        usage: log ? { inputTokens: log.inputTokens, outputTokens: log.outputTokens, cacheRead: log.cacheRead ?? 0, cacheWrite: log.cacheWrite ?? 0 } : null,
        model: log?.model ?? null,
        effort: log?.effort ?? null,
        error: null,
        recognition: null,
        questions: [],
      };
      if (result instanceof Error) {
        call.error = result instanceof LlmError ? result.code : result.name;
      } else {
        call.recognition = result.recognition;
        call.questions = result.recognition.canAsk ? judge(result, grade) : [];
      }
      calls.push(call);
      const okCount = call.questions.filter((j) => j.ok).length;
      const chosenCount = call.questions.filter((j) => j.chosen).length;
      console.log(`[${n}/${total}] ${image} ${grade}年 → ${call.error ? `失敗（${call.error}）` : `問い ${call.questions.length}（通った ${okCount}・出す ${chosenCount}）`}`);
    }
  }

  const first = calls.find((c) => c.model);
  const stamp = timestamp();
  const summary = summarize(calls);
  const report = [
    `# 問いの評価 ${stamp}`,
    "",
    `- 写真: ${images.join("、")}`,
    `- 学年: ${args.grades.join("・")} ／ 学習の進み具合: レベル${args.level} ／ 出題済み: なし`,
    `- モデル: ${first?.model ?? "?"} ／ effort: ${first?.effort ?? "?"}`,
    "- 評価するのは 1回目（問い4つ→3つに しぼる）だけ。解説・やってみよう・出典は 2回目（#165）で書かせるので、ここには出ない",
    "",
    summary,
    "## 1問ごとの結果",
    "",
    ...calls.map(describeCall),
  ].join("\n");

  mkdirSync(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, `${stamp}.md`);
  writeFileSync(path, report);
  console.log(`\n${summary}`);
  console.log(`報告を書きました: ${path}`);
}

await main();
