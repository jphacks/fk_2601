import type { Detail, Question } from "@/server/llm/schema";
import type { DetailRequest } from "@/server/llm/request";
import type { GenerationContext } from "./progress";

/**
 * AI が作った問いは、はじめは 解説・やってみよう・出典などが空で届く（1回目）。子どもが問いを選んだあと、その1問だけ
 * 2回目（/api/questions/detail）で作る（#165）。解説の一言が空なら、2回目が まだ（要る）。
 * 見本の問い・デモ・自分で書いた問いは、はじめから そろっているので 要らない
 */
export function needsDetail(question: Question): boolean {
  return question.explanation.short.trim() === "";
}

/** 2回目に送る本文。問いの中身と、学年・進み具合だけ（画像は送らない） */
export function detailRequestBody(question: Question, context: Pick<GenerationContext, "grade" | "level" | "subjectLevels">): DetailRequest {
  return {
    grade: context.grade,
    level: context.level,
    subjectLevels: context.subjectLevels,
    question: {
      text: question.text,
      type: question.type,
      subject: question.subject,
      topic: question.topic,
      target: question.target,
      hint: question.hint,
      formula: question.formula,
      variables: question.variables.map(({ name, label, value, unit }) => ({ name, label, value, unit })),
      answerUnit: question.answerUnit,
      compare: question.compare,
      choices: question.choices,
    },
  };
}

/** 問いに、2回目で作った 解説などを重ねる */
export function withDetail(question: Question, detail: Detail): Question {
  return { ...question, ...detail };
}
