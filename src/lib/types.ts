import type { Subject } from "@/server/llm/schema";

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
