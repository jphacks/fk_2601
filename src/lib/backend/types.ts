import type { AuthUser, Profile } from "@/lib/types";

/** 認証とデータの保存。Firebase 版と、Firebase なしで動かす開発用のローカル版がある */
export interface Backend {
  readonly mode: "firebase" | "local";

  subscribeAuth(callback: (user: AuthUser | null) => void): () => void;
  signUp(username: string, password: string): Promise<AuthUser>;
  signIn(username: string, password: string): Promise<AuthUser>;
  signOut(): Promise<void>;
  /** API の呼び出しに付ける ID トークン（ローカル版は null） */
  getIdToken(): Promise<string | null>;

  listProfiles(uid: string): Promise<Profile[]>;
  saveProfile(uid: string, profile: Profile): Promise<void>;
}
