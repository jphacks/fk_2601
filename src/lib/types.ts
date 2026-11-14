import type { Subject, Question } from "@/server/llm/schema";
import type { GroupId, ReactionId } from "./constants";
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

/** 子どもの「この はてな、どうだった？」への答え（おもしろい！・ふつう・むずかしい） */
export type Feeling = "fun" | "ok" | "hard";

/** 図鑑（アーカイブ）に保存する、1回ぶんの問い */
export type ArchiveRecord = {
  id: string;
  createdAt: number;
  grade: number;
  question: Question;
  guess: Guess;
  rating: Rating;
  /**
   * 保存するときに子どもが えらんだ「どうだった？」。えらばなかった記録と、この項目より前の記録には ない。
   * 次の問いを作るときの手がかりにだけ使う（src/lib/progress.ts）。グループには見せない・先生の画面には出さない
   */
  feeling?: Feeling;
  /**
   * 記録のもと。ないときや "own" は、自分で囲んで作った問い。"played" は、ほかの人の問いで遊んだもの
   * （学習の進み具合の点数には数えない。src/lib/progress.ts）。ほかの人の問いで遊ぶ機能は、まだない
   */
  origin?: "own" | "played";
  /**
   * ずかんに出す小さな画像（長辺 240px の JPEG の data URL）。2026-11-10 からの記録にある（#88）。
   * 大きな切り抜きは、別の文書（archiveImages/{id}）に分けて持つ
   */
  thumb?: string;
  /** 前の記録の、切り抜き画像（大きな JPEG の data URL）。新しい記録には入れない（thumb を使う） */
  image?: string;
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
/** グループのミッション（#139）。date は日本時間の日付（「2026-11-15」）。text は ひらがなで書く */
export type GroupMission = {
  groupId: GroupId;
  date: string;
  text: string;
};

/** 参加コード（#137）。open は受付中か */
export type JoinCode = {
  code: string;
  open: boolean;
};

/**
 * 子どもが書く「いま つかっている」ようす（#192）。写真・問いの中身・位置・ニックネームは入れない。
 * username は ログイン ID（メンバーの画面と同じ）。error は さいごに出た エラーの文（子ども向けの文から ふりがなを外したもの）
 */
export type GroupPresence = {
  uid: string;
  username: string | null;
  /** いまの画面の名前（src/lib/presence.ts の PRESENCE_SCREENS） */
  screen: string;
  /** さいごに動いた時刻（ミリ秒） */
  at: number;
  error: string | null;
  errorAt: number | null;
  help: boolean;
  helpAt: number | null;
};

/** presence への1回の書きこみ。error・help は、変わったときだけ入れる（入れないものは、前の値のまま） */
export type PresenceWrite = {
  username: string;
  screen: string;
  error?: string | null;
  help?: boolean;
};

export type GroupSettings = {
  autoJoinUntil: number | null;
  open: boolean;
};

/**
 * グループに見せる問い（切り抜き画像・問い・称号だけ。ユーザー名・ニックネーム・位置情報は入れない）。
 * 同じ人の投稿をひも付けられないよう、持ち主も入れない（Firebase 版では、本人の記録だけ読める groups/{id}/owners に分けて持つ）
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

/**
 * グループの投稿についたリアクション（#156）。counts は投稿の ID ごとの数、mine は自分が送ったもの。
 * だれが送ったかは画面に出さない（数だけ）
 */
export type GroupReactions = {
  counts: Record<string, Partial<Record<ReactionId, number>>>;
  mine: Record<string, ReactionId>;
};
