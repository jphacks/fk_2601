import type { GroupId } from "@/lib/constants";
import type { ArchiveRecord, AuthUser, GroupMember, GroupMission, GroupPost, GroupRole, GroupSettings, JoinCode, Membership, Profile } from "@/lib/types";

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
  /**
   * 自動で入るグループ（GROUPS の autoJoin）に入る。入れる期限を過ぎた・もう入っているときは、何もしない。
   * username（ログイン ID）は、管理者がメンバーの一覧で見る
   */
  joinAutoGroups(uid: string, username: string): Promise<void>;
  /** ここから下の4つは、グループの管理者だけが使える（firestore.rules で確かめる） */
  listMembers(groupId: GroupId): Promise<GroupMember[]>;
  /** 自分の役割は変えられない */
  setMemberRole(groupId: GroupId, uid: string, role: GroupRole): Promise<void>;
  /** グループから外す（自分は外せない）。その人が見せた投稿は残る */
  removeMember(groupId: GroupId, uid: string): Promise<void>;
  /** 自分で入れる期限を、いまにする（自動で入るのを止める） */
  stopAutoJoin(groupId: GroupId): Promise<void>;
  /** グループの設定（メンバーなら読める） */
  getGroupSettings(groupId: GroupId): Promise<GroupSettings>;
  /** グループのミッション（#139）。その日の分（なければ null）。メンバーなら読める */
  getGroupMission(groupId: GroupId, date: string): Promise<GroupMission | null>;
  /** from〜to（日付。両はしを含む）の分。日付の順 */
  listGroupMissions(groupId: GroupId, from: string, to: string): Promise<GroupMission[]>;
  /** 出す・変える。管理者だけ */
  saveGroupMission(groupId: GroupId, date: string, text: string): Promise<void>;
  /** 消す（その日は出さない）。管理者だけ */
  deleteGroupMission(groupId: GroupId, date: string): Promise<void>;
  /** 参加コード（#137）。いまのコード（まだ作っていなければ null）。管理者だけ */
  getJoinCode(groupId: GroupId): Promise<JoinCode | null>;
  /** 新しいコードを作る（前のコードは使えなくなる）。受付中にする。管理者だけ */
  createJoinCode(groupId: GroupId): Promise<JoinCode>;
  /** 受付を止める・再開する。管理者だけ */
  setJoinCodeOpen(code: string, open: boolean): Promise<void>;
  /**
   * 参加コードでグループに入る（そろえたコードを渡す）。入ったグループを返す。
   * もう入っていたら already。コードがない・受付を止めているときは、子どもに分かる文の UserFacingError
   */
  joinWithCode(uid: string, username: string, code: string): Promise<{ groupId: GroupId; already: boolean }>;
  /** グループに見せた問い（新しい順に GROUP_POSTS_PAGE 件）。before（ミリ秒）を渡すと、それより前の分。読めるのはグループのメンバーだけ */
  listGroupPosts(groupId: GroupId, options?: { before?: number }): Promise<GroupPost[]>;
  /** 投稿を1件（もうなければ null）。管理画面で、通報された古い投稿を出すのに使う */
  getGroupPost(groupId: GroupId, id: string): Promise<GroupPost | null>;
  /** グループに見せる。uid は持ち主（投稿には入れず、本人だけが消せるようにするために別に持つ） */
  saveGroupPost(uid: string, groupId: GroupId, post: GroupPost): Promise<void>;
  /** 消す。消せるのは持ち主と、グループの管理者。もうない投稿を消しても失敗しない */
  deleteGroupPost(groupId: GroupId, id: string): Promise<void>;
  /** 渡した ID のうち、投稿がもうないもの（管理者が消したなど） */
  missingGroupPosts(groupId: GroupId, ids: string[]): Promise<string[]>;
  /** グループの投稿を通報する（メンバーなら、だれでも。同じ人が同じ投稿を2回通報しても、1件にしかならない） */
  reportGroupPost(uid: string, groupId: GroupId, postId: string): Promise<void>;
  /** 通報された数（投稿の ID ごと）。読めるのはグループの管理者だけ */
  listGroupReports(groupId: GroupId): Promise<Record<string, number>>;
}
