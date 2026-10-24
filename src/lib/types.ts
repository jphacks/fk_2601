import type { Subject, Question } from "@/server/llm/schema";
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
  title: Subject | null;
  /** 問いの出し方：先に3択を出すか、自分で書く入力欄を出すか */
  firstMode: FirstMode;
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
  /** 切り抜き画像（JPEG の data URL） */
  image: string;
  /** 匿名で公開しているときの、公開用のデータの ID */
  publicId: string | null;
};

/** 匿名で公開する問い（切り抜き画像・問い・称号だけ。ユーザー名・位置情報は入れない） */
export type PublicPost = {
  id: string;
  /** 本人だけが消せるようにするための ID（画面には出さない） */
  ownerUid: string;
  createdAt: number;
  image: string;
  text: string;
  subject: Subject;
  topic: string;
  title: Subject | null;
};
