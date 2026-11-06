import type { GroupId } from "@/lib/constants";
import type { ArchiveRecord, AuthUser, GroupPost, Membership, Profile } from "@/lib/types";

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

  /** 入っているグループ（constants の GROUPS のうち、メンバーになっているもの） */
  listMemberships(uid: string): Promise<Membership[]>;
  /** 自動で入るグループ（GROUPS の autoJoin）に入る。入れる期限を過ぎた・もう入っているときは、何もしない */
  joinAutoGroups(uid: string): Promise<void>;
  /** グループに見せた問い（新しい順）。読めるのはグループのメンバーだけ */
  listGroupPosts(groupId: GroupId): Promise<GroupPost[]>;
  /** グループに見せる。uid は持ち主（投稿には入れず、本人だけが消せるようにするために別に持つ） */
  saveGroupPost(uid: string, groupId: GroupId, post: GroupPost): Promise<void>;
  /** 消す。消せるのは持ち主と、グループの管理者。もうない投稿を消しても失敗しない */
  deleteGroupPost(groupId: GroupId, id: string): Promise<void>;
  /** 渡した ID のうち、投稿がもうないもの（管理者が消したなど） */
  missingGroupPosts(groupId: GroupId, ids: string[]): Promise<string[]>;
}
