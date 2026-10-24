import { generateCustom } from "@/server/llm/generate";
import { handle } from "@/server/llm/handler";
import { CustomRequestSchema } from "@/server/llm/request";

export const maxDuration = 90;

/** 子どもが自分で書いた問いを、式と変数のある問いにする */
export async function POST(request: Request) {
  return handle(request, CustomRequestSchema, generateCustom);
}
