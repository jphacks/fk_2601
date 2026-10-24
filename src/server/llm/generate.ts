import "server-only";
import { builtinQuestions } from "./builtin";
import { callStructured } from "./client";
import { mockCustom, mockQuestions } from "./mock";
import { customUserText, questionsUserText, SYSTEM_PROMPT } from "./prompts";
import type { CustomRequest, QuestionsRequest } from "./request";
import {
  CustomOutputSchema,
  QuestionsOutputSchema,
  type CustomOutput,
  type Question,
  type Recognition,
} from "./schema";
import { validateQuestion } from "./validate";

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

function keepValid(questions: Question[]): Question[] {
  const valid: Question[] = [];
  for (const q of questions) {
    const result = validateQuestion(q);
    if (result.ok) valid.push(result.question);
  }
  return valid;
}

export class NoValidQuestionError extends Error {}

export async function generateQuestions(input: QuestionsRequest): Promise<QuestionsResponse> {
  // 見本の絵で AI がつながらないとき（fallback）は、AI を呼ばずに見本の問いを返す
  if (input.fallback && input.scene) {
    const { label, questions } = builtinQuestions(input.scene);
    return { recognition: { label, canAsk: true }, questions: keepValid(questions), demo: true };
  }

  const output = isMock()
    ? await mockQuestions(input.scene)
    : await callStructured(QuestionsOutputSchema, SYSTEM_PROMPT, input.image, questionsUserText(input));

  if (!output.recognition.canAsk) return { recognition: output.recognition, questions: [] };
  const questions = keepValid(output.questions);
  // 1つも出せないときはエラー表示にする（自動で作り直さない）
  if (questions.length === 0) throw new NoValidQuestionError();
  return { recognition: output.recognition, questions, ...("demo" in output ? { demo: true } : {}) };
}

export async function generateCustom(input: CustomRequest): Promise<CustomResponse> {
  const output: CustomOutput = isMock()
    ? await mockCustom(input.text, input.scene)
    : await callStructured(CustomOutputSchema, SYSTEM_PROMPT, input.image, customUserText(input));

  if (!output.answerable || !output.question) {
    return { recognition: output.recognition, answerable: false, reason: output.reason, question: null };
  }
  const result = validateQuestion(output.question);
  if (!result.ok) {
    return { recognition: output.recognition, answerable: false, reason: "うまく 答えを 作れなかったよ。ちがう 問いに してみてね", question: null };
  }
  return { recognition: output.recognition, answerable: true, reason: null, question: result.question };
}
