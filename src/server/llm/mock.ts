import "server-only";
import { builtinQuestions, type Scene } from "./builtin";
import type { CustomOutput, QuestionsOutput } from "./schema";

// LLM_MODE=mock のときに返す、開発・デモ用のサンプルの問い（料金がかからない）。見本の問いは builtin.ts にある

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function mockQuestions(scene?: Scene): Promise<QuestionsOutput & { demo: true }> {
  await wait(1500);
  const { label, questions } = builtinQuestions(scene);
  return { recognition: { label, canAsk: true }, questions, demo: true };
}

export async function mockCustom(text: string, scene?: Scene): Promise<CustomOutput> {
  await wait(1200);
  const { label, questions } = builtinQuestions(scene);
  if (text.trim().length < 3) {
    return { recognition: { label, canAsk: true }, answerable: false, reason: "もうすこし くわしく かいてみてね", question: null };
  }
  const base = questions.find((q) => q.type === "estimate") ?? questions[0];
  return {
    recognition: { label, canAsk: true },
    answerable: true,
    reason: null,
    question: {
      ...base,
      text,
      hint: "（デモ）本物の AI につながると、きみの問いに合わせた答えが 出るよ。",
    },
  };
}
