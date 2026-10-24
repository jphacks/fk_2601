import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { ZodError, type ZodType, type z } from "zod";
import { LLM_TIMEOUT_MS } from "@/lib/constants";

const MODEL = "claude-opus-5-5";

export type LlmErrorCode = "refusal" | "timeout" | "invalid_output" | "llm_error";

export class LlmError extends Error {
  constructor(
    public readonly code: LlmErrorCode,
    message?: string,
  ) {
    super(message ?? code);
    this.name = "LlmError";
  }
}

type Effort = "low" | "medium" | "high";

function effort(): Effort {
  const value = process.env.LLM_EFFORT;
  return value === "low" || value === "high" ? value : "medium";
}

// 自動リトライはしない（課金とレート制限のため）。タイムアウトは60秒
let cached: Anthropic | null = null;
function anthropic(): Anthropic {
  cached ??= new Anthropic({ maxRetries: 0, timeout: LLM_TIMEOUT_MS });
  return cached;
}

/** 画像（base64 の JPEG）とテキストを送り、決まった形の JSON を受け取る。呼び出しは1回だけ */
export async function callStructured<S extends ZodType>(
  schema: S,
  system: string,
  imageBase64: string,
  text: string,
): Promise<z.infer<S>> {
  try {
    const response = await anthropic().messages.parse({
      model: MODEL,
      max_tokens: 16000,
      system,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: "image/jpeg", data: imageBase64 } },
            { type: "text", text },
          ],
        },
      ],
      output_config: { effort: effort(), format: zodOutputFormat(schema) },
    });

    // content を読む前に stop_reason を確認する
    if (response.stop_reason === "refusal") throw new LlmError("refusal");
    if (response.stop_reason === "max_tokens" || !response.parsed_output) throw new LlmError("invalid_output");
    return response.parsed_output as z.infer<S>;
  } catch (error) {
    if (error instanceof LlmError) throw error;
    if (error instanceof Anthropic.APIConnectionTimeoutError) throw new LlmError("timeout");
    if (error instanceof ZodError || error instanceof SyntaxError) throw new LlmError("invalid_output");
    console.error("LLM error:", error instanceof Error ? error.name : "unknown");
    throw new LlmError("llm_error");
  }
}
