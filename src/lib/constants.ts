import type { Subject } from "@/server/llm/schema";

// アプリ名（docs/04-mvp.md）。変えるときはここだけ書き換える
export const APP_NAME = "かこってはてな!?";
export const NAVIGATOR_NAME = "ナビ";

export const GRADES = [1, 2, 3, 4, 5, 6] as const;
export type Grade = (typeof GRADES)[number];

export const SUBJECT_LABEL: Record<Subject, string> = {
  math: "算数",
  science: "理科",
  info: "情報",
};

// 小さい文字には、漢字を使わずひらがなで書く（docs/design/README.md「文字」）
export const SUBJECT_KANA: Record<Subject, string> = {
  math: "さんすう",
  science: "りか",
  info: "じょうほう",
};

export const SUBJECTS: Subject[] = ["math", "science", "info"];

// 「はてなを さがす！」から撮影へ行くときの URL。撮影の画面は、カメラを起動する前に「でかける まえの やくそく」を出す
// （とりなおし・「もっと さがす！」から来たときは出さない）
export const CAPTURE_WITH_PROMISE = "/capture?yakusoku=1";

// 称号を得るのに必要な個数。未決（docs/02-spec.md 16章）なので仮の値
export const STAMP_GOAL = 5;

// 称号の名前（仮。docs/design/README.md「見本の決まりごと」）。小さい文字で出すので、ひらがなで書く
export const TITLE_LABEL: Record<Subject, string> = {
  math: "すうがく はかせ",
  science: "りか マスター",
  info: "エンジニア レベル",
};

// はじめから持っている称号（仮。docs/design/README.md「見本の決まりごと」）。称号をえらんでいない（title が null）ときに出す
export const FIRST_TITLE_LABEL = "はてなハンター";

/** いま つけている称号の名前 */
export function titleLabel(title: Subject | null | undefined): string {
  return title ? TITLE_LABEL[title] : FIRST_TITLE_LABEL;
}

// 切り抜き画像：長辺のピクセル数と JPEG の品質（Firestore の1件 1MiB に収めるため）
export const CROP_MAX_EDGE = 1024;
export const CROP_QUALITY_STEPS = [0.8, 0.7, 0.6, 0.5, 0.4];
export const IMAGE_MAX_BASE64_BYTES = 600_000;

// LLM
export const LLM_TIMEOUT_MS = 60_000;

// ユーザー名：メールアドレスの @ より前は64文字まで。16進数にすると1バイト2文字
export const USERNAME_MAX_BYTES = 32;
