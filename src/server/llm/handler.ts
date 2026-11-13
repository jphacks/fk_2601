import "server-only";
import type { ZodType, z } from "zod";
import { MAX_REQUEST_BYTES } from "@/lib/constants";
import { isLocalMode, verifyRequest } from "@/server/auth";
import { LlmError } from "./client";
import { NoValidQuestionError } from "./generate";
import { allowRequest } from "./rateLimit";

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

  // 大きすぎるリクエストは、JSON を読む前に断る（Content-Length がないときは Vercel の 4.5MB の上限と、各項目の長さの検証で止める）
  if (Number(request.headers.get("content-length") ?? 0) > MAX_REQUEST_BYTES) return errorResponse("bad_request");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("bad_request");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) return errorResponse("bad_request");

  // 使いすぎの歯止め（uid ごとに 1分6回・1日100回。ローカル版と、AI を呼ばない見本の問い（fallback と scene）は数えない）
  const { fallback, scene } = parsed.data as { fallback?: boolean; scene?: string };
  const noAi = isLocalMode() || (fallback === true && scene !== undefined);
  if (!noAi && !allowRequest(user.uid)) return errorResponse("busy");

  try {
    return Response.json(await run(parsed.data));
  } catch (error) {
    if (error instanceof LlmError) return errorResponse(error.code);
    if (error instanceof NoValidQuestionError) return errorResponse("invalid_output");
    console.error("API error:", error instanceof Error ? error.name : "unknown");
    return errorResponse("llm_error");
  }
}
