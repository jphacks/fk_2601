import type { Subject, Question } from "@/server/llm/schema";
import type { GroupId } from "./constants";
import type { Guess, Rating } from "./rating";

export type AuthUser = {
  uid: string;
  username: string;
};

export type FirstMode = "choices" | "custom";

export type Profile = {
  id: string;
  nickname: string;
  grade: number;
  /** 切り替えて使う称号（その分類のスタンプが貯まると選べる） */
  /** つけている称号の ID（src/lib/titles.ts。「math-gold」など。前の形の「math」なども読める）。null は はじめの称号 */
  title: string | null;
  /** 問いの出し方：先に3択を出すか、自分で書く入力欄を出すか */
  firstMode: FirstMode;
  /**
   * あそびかたの説明を見おわった（とばした）時刻。null は まだ見ていない（はじめての登録で null にする）。
   * この値がない前からのプロフィールと /demo は、見おわったとして扱う（docs/03-technical.md 6章）
   */
  guideSeenAt?: number | null;
  createdAt: number;
};

/** 図鑑（アーカイブ）に保存する、1回ぶんの問い */
export type ArchiveRecord = {
  id: string;
  createdAt: number;
  grade: number;
  question: Question;
  guess: Guess;
  rating: Rating;
  /**
   * 記録のもと。ないときや "own" は、自分で囲んで作った問い。"played" は、ほかの人の問いで遊んだもの
   * （学習の進み具合の点数には数えない。src/lib/progress.ts）。ほかの人の問いで遊ぶ機能は、まだない
   */
  origin?: "own" | "played";
  /** 切り抜き画像（JPEG の data URL） */
  image: string;
  /**
   * 見せているグループ（グループの投稿の ID は、この記録の id と同じ）。ないのは、どこにも見せていないもの。
   * この項目より前の記録には、全員への匿名公開（やめた）の publicId が残っていることがあるが、使わない
   */
  sharedGroups?: GroupId[];
};

export type GroupRole = "member" | "admin";

/** 入っているグループ */
export type Membership = {
  groupId: GroupId;
  role: GroupRole;
};

/** グループのメンバー（管理画面で、管理者だけが見る）。username（ログイン ID）がないのは、#129 より前に入った記録 */
export type GroupMember = {
  uid: string;
  username: string | null;
  role: GroupRole;
  joinedAt: number | null;
};

/**
 * グループの設定。autoJoinUntil は自分で入れる期限（ミリ秒。null は期限が入っていない）。
 * open は、読んだときに自分で入れたか（Firebase 版は期限の前のときだけ。ローカル版は止めるまで期限なしで入れる）
 */
/** 参加コード（#137）。open は受付中か */
export type JoinCode = {
  code: string;
  open: boolean;
};

export type GroupSettings = {
  autoJoinUntil: number | null;
  open: boolean;
};

/**
 * グループに見せる問い（切り抜き画像・問い・称号だけ。ユーザー名・ニックネーム・位置情報は入れない）。
 * 同じ人の投稿をひも付けられないよう、持ち主も入れない（Firebase 版では、だれも読めない groups/{id}/owners に分けて持つ）
 */
export type GroupPost = {
  id: string;
  createdAt: number;
  image: string;
  text: string;
  subject: Subject;
  topic: string;
  title: string | null;
};
