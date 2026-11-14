// 先生が見る「いま つかっている人」（#192）。子どもの画面が、入っているグループに「いまの画面」などを書く。
// 写真・問いの中身・位置・ニックネームは書かない。書くのは、ログイン ID・いまの画面の名前・時刻・さいごのエラーの文・たすけて だけ。

/** 先生の画面で、「いま つかっている」と数える時間（さいごに動いてから） */
export const PRESENCE_ACTIVE_MS = 5 * 60_000;
/** たすけて を出している人は、動かなくなってからも この時間までは一覧に残す */
export const PRESENCE_HELP_KEEP_MS = 30 * 60_000;
/** 子どもの画面が、動いているあいだに書く間かく（1分に1回まで） */
export const PRESENCE_HEARTBEAT_MS = 60_000;
/** 画面が変わったときの書きこみの、さいていの間かく（つづけて変わっても、これより多く書かない） */
export const PRESENCE_MIN_GAP_MS = 5_000;
/** さいごのエラーの文の長さの上限（firestore.rules と同じ） */
export const PRESENCE_ERROR_MAX = 120;

/** 画面の名前（presence に書く値）と、先生の画面に出す呼び名 */
export const PRESENCE_SCREENS: Record<string, string> = {
  home: "ホーム",
  capture: "撮影",
  lasso: "囲む",
  recognize: "問いを作っている（待ち）",
  choose: "はてなを選ぶ",
  predict: "予想",
  result: "こたえあわせ",
  nazo: "なぞとき",
  moshimo: "もしも",
  save: "ずかんに のこす",
  archive: "ずかん",
  stamp: "スタンプ・しょうごう",
  others: "みんなの はてな",
  settings: "せってい",
  join: "グループに入る",
  mission: "今日のお題",
  profile: "プロフィール",
  other: "そのほか",
};

/** URL から、画面の名前を決める（/result の中の段階は、画面の側が usePresenceScreen で知らせる） */
export function screenOfPath(pathname: string): string {
  const first = pathname.split("/")[1] ?? "";
  if (first === "") return "home";
  return first in PRESENCE_SCREENS ? first : "other";
}

/** 先生の画面に出す呼び名。知らない名前（あたらしい版が書いたもの）は「そのほか」 */
export function screenLabel(screen: string): string {
  return PRESENCE_SCREENS[screen] ?? PRESENCE_SCREENS.other;
}

/** 「3分前」のような言い方（先生の画面用） */
export function agoLabel(ms: number): string {
  const sec = Math.max(0, Math.round(ms / 1000));
  if (sec < 60) return "いま";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}分前`;
  return `${Math.floor(min / 60)}時間前`;
}
