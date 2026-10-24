import "server-only";
import type { ZodType, z } from "zod";
import { verifyRequest } from "@/server/auth";
import { LlmError } from "./client";
import { NoValidQuestionError } from "./generate";

export type ApiErrorCode = "unauthorized" | "bad_request" | "refusal" | "timeout" | "busy" | "invalid_output" | "llm_error";

const STATUS: Record<ApiErrorCode, number> = {
  unauthorized: 401,
  bad_request: 400,
  refusal: 422,
  timeout: 504,
  busy: 429,
  invalid_output: 502,
  llm_error: 502,
};

const MESSAGE: Record<ApiErrorCode, string> = {
  unauthorized: "ログインしなおしてね",
  bad_request: "しゃしんを うまく おくれなかったよ。もういちど ためしてね",
  refusal: "この しゃしんからは はてなが つくれなかったよ。べつの ものを かこんでみてね",
  timeout: "じかんが かかりすぎたよ。もういちど ためしてね",
  busy: "いま みんなが たくさん つかっているよ。すこし まってから もういちど ためしてね",
  invalid_output: "はてなを うまく つくれなかったよ。もういちど ためしてね",
  llm_error: "うまくいかなかったよ。もういちど ためしてね",
};

function errorResponse(code: ApiErrorCode): Response {
  return Response.json({ error: { code, message: MESSAGE[code] } }, { status: STATUS[code] });
}

/** ログインの確認 → 入力の検証 → 処理、の流れをまとめる。失敗は子ども向けのメッセージで返す */
export async function handle<S extends ZodType, R>(
  request: Request,
  schema: S,
  run: (input: z.infer<S>) => Promise<R>,
): Promise<Response> {
  const user = await verifyRequest(request);
  if (!user) return errorResponse("unauthorized");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("bad_request");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return errorResponse("bad_request");

  try {
    return Response.json(await run(parsed.data));
  } catch (error) {
    if (error instanceof LlmError) return errorResponse(error.code);
    if (error instanceof NoValidQuestionError) return errorResponse("invalid_output");
    console.error("API error:", error instanceof Error ? error.name : "unknown");
    return errorResponse("llm_error");
  }
}
