import type { Question } from "@/server/llm/schema";

export type RefParts = { label: string; value: number; unit: string; suffix: string };

type LegacyFamiliar = { name: string; amount: number };

/**
 * 答えを身近なものにおきかえた表示の材料。
 * per は「label 答え÷value unit ぶん」、times は「label 答え×value unit」。
 * 以前に保存した問い（familiar）も読める
 */
export function refParts(question: Question, answer: number): RefParts | null {
  const ref = question.ref;
  if (ref) {
    const value = ref.type === "per" ? answer / ref.value : answer * ref.value;
    if (!(value > 0) || !Number.isFinite(value)) return null;
    if (ref.type === "per" && value < 0.05) return null;
    return { label: ref.label, value, unit: ref.unit, suffix: ref.type === "per" ? "ぶん" : "" };
  }
  const legacy = (question as { familiar?: LegacyFamiliar | null }).familiar;
  if (legacy && legacy.amount > 0) {
    const value = answer / legacy.amount;
    if (value < 0.1 || value > 100000) return null;
    return { label: `「${legacy.name}」の`, value, unit: "こ", suffix: "ぶん" };
  }
  return null;
}
