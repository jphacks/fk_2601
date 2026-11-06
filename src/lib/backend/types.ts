import type { ArchiveRecord, AuthUser, Profile, PublicPost } from "@/lib/types";

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

  /** 新しい順 */
  listArchives(uid: string, profileId: string): Promise<ArchiveRecord[]>;
  saveArchive(uid: string, profileId: string, record: ArchiveRecord): Promise<void>;
  deleteArchive(uid: string, profileId: string, id: string): Promise<void>;
  deleteAllArchives(uid: string, profileId: string): Promise<void>;

  /** 匿名で公開された問い（新しい順） */
  listPublic(): Promise<PublicPost[]>;
  /** 公開する。uid は持ち主（公開データには入れず、本人だけが消せるようにするために別に持つ） */
  savePublic(uid: string, post: PublicPost): Promise<void>;
  deletePublic(id: string): Promise<void>;
  /** 渡した ID のうち、公開データがもうないもの（管理者が消したなど） */
  missingPublic(ids: string[]): Promise<string[]>;
}
