import { firebaseBackend } from "./firebase";
import { localBackend } from "./local";
import type { Backend } from "./types";

export type { Backend } from "./types";

/** NEXT_PUBLIC_BACKEND=local のときだけ、Firebase なしのローカル版（開発・デモ用）を使う */
export function getBackend(): Backend {
  return process.env.NEXT_PUBLIC_BACKEND === "local" ? localBackend : firebaseBackend;
}
