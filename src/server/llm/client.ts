import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { ZodError, type ZodType, type z } from "zod";
import { LLM_TIMEOUT_MS } from "@/lib/constants";

// LLM_MODEL で切り替えられる（安いモデルで質と速さを比べるため）。許可した3つ以外は、既定の Opus 5.5 になる
const MODELS = ["claude-opus-5-5", "claude-sonnet-5-5", "claude-haiku-5-5"];
function model(): string {
  const value = process.env.LLM_MODEL;
  return value && MODELS.includes(value) ? value : MODELS[0];
}

export type LlmErrorCode = "refusal" | "timeout" | "busy" | "invalid_output" | "llm_error";

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

// 考える処理をオフにすると速くなる（LLM_THINKING=off）。Haiku 5.5 だけが対応している（Opus 5.5・Sonnet 5.5 では 400 になる）
function thinkingOption() {
  return process.env.LLM_THINKING === "off" && model() === "claude-haiku-5-5" ? { thinking: { type: "disabled" as const } } : {};
}

// 自動リトライはしない（課金とレート制限のため）。タイムアウトは60秒
let cached: Anthropic | null = null;
function anthropic(): Anthropic {
  cached ??= new Anthropic({ maxRetries: 0, timeout: LLM_TIMEOUT_MS });
  return cached;
}

/** 画像（base64 の JPEG）とテキストを送り、決まった形の JSON を受け取る。呼び出しは1回だけ。画像なし（null）は、2回目（解説づくり）の呼び出し */
export async function callStructured<S extends ZodType>(
  schema: S,
  system: string,
  imageBase64: string | null,
  text: string,
): Promise<z.infer<S>> {
  const startedAt = Date.now();
  try {
    const response = await anthropic().messages.parse({
      model: model(),
      max_tokens: 16000,
      // system は毎回まったく同じ文字にする（学年・日付・乱数を入れない。それらは text の側）。そうすると、2回目からは入力のほとんどがキャッシュから読まれ、安く速くなる
      // （5分のあいだ。キャッシュできる最小の長さは、Sonnet 5.5・Opus 5.5 で 512 トークン。docs/03-technical.md 5.3）
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages: [
        {
          role: "user",
          content: [
            ...(imageBase64 ? [{ type: "image" as const, source: { type: "base64" as const, media_type: "image/jpeg" as const, data: imageBase64 } }] : []),
            { type: "text", text },
          ],
        },
      ],
      ...thinkingOption(),
      output_config: { effort: effort(), format: zodOutputFormat(schema) },
    });

    // 費用と待ち時間を測るため、時間とトークンの数だけを残す（画像や問いの中身は出さない）
    console.info("[llm]", {
      ms: Date.now() - startedAt,
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
      cacheRead: response.usage.cache_read_input_tokens,
      cacheWrite: response.usage.cache_creation_input_tokens,
      model: model(),
      effort: effort(),
      thinking: process.env.LLM_THINKING === "off" ? "off" : "auto",
      stop: response.stop_reason,
    });

    // content を読む前に stop_reason を確認する
    if (response.stop_reason === "refusal") throw new LlmError("refusal");
    if (response.stop_reason === "max_tokens" || !response.parsed_output) throw new LlmError("invalid_output");
    return response.parsed_output as z.infer<S>;
  } catch (error) {
    if (error instanceof LlmError) throw error;
    if (error instanceof Anthropic.APIConnectionTimeoutError) throw new LlmError("timeout");
    if (error instanceof Anthropic.APIError) {
      // 429（利用が多い）と 529（Anthropic 側の混雑）は、少し待てば直る
      if (error instanceof Anthropic.RateLimitError || error.status === 529) throw new LlmError("busy");
      // 400（残高不足など）・401・403（キーの設定まちがい）を、すぐ調べられるよう、状態と理由を残す（キーの文字列は伏せる）
      const detail = String(error.message).replace(/sk-ant-[A-Za-z0-9_-]+/g, "sk-ant-***").slice(0, 200);
      console.error("LLM error: status", error.status, detail);
      throw new LlmError("llm_error");
    }
    // 出力が JSON として読めない・形が合わないときは、SDK が AnthropicError を投げる（本文を含むので、ログには出さない）
    if (
      error instanceof ZodError ||
      error instanceof SyntaxError ||
      (error instanceof Anthropic.AnthropicError && error.message.startsWith("Failed to parse structured output"))
    ) {
      throw new LlmError("invalid_output");
    }
    console.error("LLM error:", error instanceof Error ? error.constructor.name : "unknown");
    throw new LlmError("llm_error");
  }
}
