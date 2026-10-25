import type { Backend } from "@/lib/backend";
import { DEMO_DELAY_MS, demoCustom, demoQuestions, isDemo } from "@/lib/demo";
import { UserFacingError } from "@/lib/errors";
import type { CustomResponse, QuestionsResponse } from "@/server/llm/generate";
import type { CustomRequest, QuestionsRequest } from "@/server/llm/request";

// サーバーのタイムアウト（60秒）より少し長く待つ
const CLIENT_TIMEOUT_MS = 70_000;

async function post<T>(backend: Backend, path: string, body: unknown): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);
  try {
    const token = await backend.getIdToken();
    const response = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json", ...(token ? { authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const message = (data as { error?: { message?: string } } | null)?.error?.message;
      throw new UserFacingError(message ?? "うまくいかなかったよ。もういちど ためしてね");
    }
    return data as T;
  } catch (error) {
    if (error instanceof UserFacingError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new UserFacingError("じかんが かかりすぎたよ。もういちど ためしてね");
    }
    throw new UserFacingError("ネットに つながらないよ。つながってから もういちど ためしてね");
  } finally {
    clearTimeout(timer);
  }
}

// デモ（/demo）では、AI を呼ばずに、用意した問いを、少し待ってから返す（待ちの画面の演出のため）
const demoWait = <T>(value: T): Promise<T> => new Promise((resolve) => setTimeout(() => resolve(value), DEMO_DELAY_MS));

export function requestQuestions(backend: Backend, input: QuestionsRequest): Promise<QuestionsResponse> {
  if (isDemo()) return demoWait(demoQuestions());
  return post<QuestionsResponse>(backend, "/api/questions", input);
}

export function requestCustom(backend: Backend, input: CustomRequest): Promise<CustomResponse> {
  if (isDemo()) return demoWait(demoCustom());
  return post<CustomResponse>(backend, "/api/questions/custom", input);
}
