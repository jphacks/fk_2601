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

/** あそびかたの説明を もういちど見る（せっていから ホームへ）。ホームは この クエリで説明を出す */
export const GUIDE_PARAM = "guide";
export const GUIDE_AGAIN = `/?${GUIDE_PARAM}=1`;

// 問いを作るときに送る、出題済みの「対象×単元」の上限（サーバーの受けつけは 200 件まで。src/server/llm/request.ts）。
// ずかんが増えても超えないよう、新しいものから ASKED_FROM_ARCHIVE 件だけ送り、のこりは作り直しで見た問いにあてる
export const ASKED_MAX = 200;
export const ASKED_FROM_ARCHIVE = 150;

// 「みんなの はてな」で はてなを見せあうグループ（docs/02-spec.md 15章、docs/03-technical.md 6章）。
// グループそのもの（groups/{id}）とメンバー・管理者は Firestore に人が作る。ここは画面に出す名前だけを持つ。
// name は 22px 以上の文字で使う（ふりがなの記法つき）。kana は小さい文字で使う
// autoJoin：新しく登録した人を自動で入れる（入れる期限は Firestore の groups/{id} の autoJoinUntil。firestore.rules で確かめる）
export const GROUPS = [
  { id: "jphacks", name: "JPHACKS", kana: "JPHACKS", autoJoin: true },
  { id: "csennkai", name: "C{専会|せんかい}", kana: "Cせんかい", autoJoin: false },
  { id: "c3", name: "C3", kana: "C3", autoJoin: false },
] as const;
export type GroupId = (typeof GROUPS)[number]["id"];

export function groupOf(id: GroupId) {
  return GROUPS.find((g) => g.id === id) ?? GROUPS[0];
}

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
