import "server-only";
import { TIMES_GRADE } from "@/lib/format";
import { builtinQuestions } from "./builtin";
import { callStructured } from "./client";
import { mockCustom, mockQuestions } from "./mock";
import { customUserText, detailUserText, questionsUserText, SYSTEM_PROMPT } from "./prompts";
import type { CustomRequest, DetailRequest, QuestionsRequest } from "./request";
import {
  CustomOutputSchema,
  DetailSchema,
  QuestionsOutputSchema,
  type CustomOutput,
  type Detail,
  type DraftQuestion,
  type Question,
  type Recognition,
} from "./schema";
import { EMPTY_DETAIL, validateDetail, validateQuestion } from "./validate";

export type QuestionsResponse = {
  recognition: Recognition;
  questions: Question[];
  /** AI を使わない見本の問いのとき true */
  demo?: boolean;
};
export type CustomResponse = {
  recognition: Recognition;
  answerable: boolean;
  reason: string | null;
  question: Question | null;
};

const isMock = () => process.env.LLM_MODE === "mock";

function keepValid(questions: (Question | DraftQuestion)[], options: { lenient?: boolean; partial?: boolean } = {}): Question[] {
  const valid: Question[] = [];
  for (const q of questions) {
    const result = validateQuestion(q, options);
    if (result.ok) valid.push(result.question);
  }
  return valid;
}

export class NoValidQuestionError extends Error {}

/** 1年生は「倍」を まだ習っていないので、ほかの問いがあるときは compare（何倍）を出さない（docs/02-spec.md 2.4）。見本の問いにも きかせる */
function fitToGrade(valid: Question[], grade: number): Question[] {
  const fitGrade = grade < TIMES_GRADE ? valid.filter((q) => q.type !== "compare") : valid;
  return fitGrade.length > 0 ? fitGrade : valid;
}

export async function generateQuestions(input: QuestionsRequest): Promise<QuestionsResponse> {
  // 見本の絵で AI がつながらないとき（fallback）は、AI を呼ばずに見本の問いを返す
  if (input.fallback && input.scene) {
    const { label, questions } = builtinQuestions(input.scene);
    return { recognition: { label, canAsk: true }, questions: fitToGrade(keepValid(questions, { lenient: true }), input.grade), demo: true };
  }

  const output = isMock()
    ? await mockQuestions(input.scene)
    : await callStructured(QuestionsOutputSchema, SYSTEM_PROMPT, input.image, questionsUserText(input));

  if (!output.recognition.canAsk) return { recognition: output.recognition, questions: [] };
  // 見本の問い（モック）は、手で書いたものなので、問いの作りかたの検査はゆるくする。モックは 解説まで全部そろっている。
  // 本物の AI の問い（1回目）は、解説などが空（2回目で書かせる。#165）
  const valid = keepValid(output.questions, isMock() ? { lenient: true } : { partial: true });
  const questions = fitToGrade(valid, input.grade);
  // 1つも出せないときはエラー表示にする（自動で作り直さない）
  if (questions.length === 0) throw new NoValidQuestionError();
  return { recognition: output.recognition, questions, ...("demo" in output ? { demo: true } : {}) };
}

export async function generateCustom(input: CustomRequest): Promise<CustomResponse> {
  const output: CustomOutput = isMock()
    ? await mockCustom(input.text, input.scene)
    : await callStructured(CustomOutputSchema, SYSTEM_PROMPT, input.image, customUserText(input));

  if (!output.answerable || !output.question) {
    return { recognition: output.recognition, answerable: false, reason: output.reason || null, question: null };
  }
  const result = validateQuestion(output.question, { lenient: true });
  if (!result.ok) {
    return { recognition: output.recognition, answerable: false, reason: "うまく こたえを つくれなかったよ。ちがう はてなに してみてね", question: null };
  }
  return { recognition: output.recognition, answerable: true, reason: null, question: result.question };
}

/** 2回目：子どもが選んだ1問の、解説・やってみよう・出典などを作る（画像は送らない）。答えは コードで 計算して AI に渡す */
export async function generateDetail(input: DetailRequest): Promise<Detail> {
  let output: Detail;
  if (isMock()) {
    // LLM_MODE=mock のときは、1回目で全部そろうので、ここは使われない。念のため、短い答えを返す
    output = { ...EMPTY_DETAIL, explanation: { short: "（デモ）本物の AI につながると、ここに かいせつが 出るよ。", steps: [] } };
  } else {
    // 式が計算できない・正解が決まらない問いは、AI を呼ばずに断る
    const text = detailUserText(input);
    if (!text) throw new NoValidQuestionError();
    output = await callStructured(DetailSchema, SYSTEM_PROMPT, null, text);
  }
  const detail = validateDetail(output);
  if (!detail) throw new NoValidQuestionError();
  return detail;
}
