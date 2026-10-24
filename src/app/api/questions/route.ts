import { generateQuestions } from "@/server/llm/generate";
import { handle } from "@/server/llm/handler";
import { QuestionsRequestSchema } from "@/server/llm/request";

export const maxDuration = 90;

/** 切り抜き画像・学年・学習の進み具合から、問いを3つ作る */
export async function POST(request: Request) {
  return handle(request, QuestionsRequestSchema, generateQuestions);
}
