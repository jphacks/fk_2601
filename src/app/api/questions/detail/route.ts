import { generateDetail } from "@/server/llm/generate";
import { handle } from "@/server/llm/handler";
import { DetailRequestSchema } from "@/server/llm/request";

export const maxDuration = 90;

/** 子どもが選んだ1つの問いの、解説・やってみよう・出典などを作る（画像は送らない。2回目の呼び出し） */
export async function POST(request: Request) {
  return handle(request, DetailRequestSchema, generateDetail, "detail");
}
