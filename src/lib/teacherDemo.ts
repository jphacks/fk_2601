// 管理画面の見本（デモ）で使う架空のデータ。実在の先生・学校・子どもは入れない
// 見た目と動きの決まりは docs/design/teachers/README.md、画面の仕様は docs/06-school-expansion.md 5章
import { calculate } from "./calc";
import type { SceneKey } from "./scenes";

export type TeacherRole = "担任" | "副担任" | "学年の先生";

export type DemoField = "算数" | "理科" | "情報";

// 参加中の子ども。件数は授業中の分を分野ごとに持ち、合計は画面で足す（数がずれないように）
export type DemoMember = {
  id: string;
  no: number | null; // 出席番号（先生が入れる。まだなら null）
  name: string; // 本名（先生の画面にだけ出す）
  user: string; // ユーザー名
  mail: string;
  joined: string; // 参加した日（YYYY/M/D）
  title: string; // 称号（見本の名前。仮）
  fields: Record<DemoField, number>; // 授業中に保存した件数（分野ごと）
  out: number; // 授業時間の外に保存した件数（件数だけ見せる）
  missions: number; // ミッションをクリアした日数
  recordStart: number; // 授業中の記録を DEMO_RECORDS のどこから出すか
  recordShift: number; // 授業中の記録の時刻を、何分前にずらすか（みんなが同じ時刻にならないように）
};

// 参加の確認を待っている子ども
export type DemoPending = { id: string; name: string; user: string; mail: string };

export type TeacherClass = {
  id: string;
  name: string;
  grade: string;
  schoolYear: string;
  role: TeacherRole;
  // 授業時間のおわりの時刻。いまが授業時間の外なら null（docs/06-school-expansion.md 5.2）
  classUntil: string | null;
  members: DemoMember[];
  pending: DemoPending[];
  shared: DemoShared[];
};

// クラスに共有された投稿（docs/06-school-expansion.md 7.1・7.2）。共有は授業時間によらないので、時刻は授業の外のこともある
export type DemoShared = {
  id: string;
  memberId: string;
  record: number; // 問いの中身（DEMO_RECORDS の何番目か）
  at: string; // 共有した日時（M/D H:MM）
  isNew: boolean; // 先生がまだ見ていないもの
};

// 授業中に保存した問いの見本。写真は見本の絵（src/lib/scenes.ts）を使い、答えは式から計算して出す
export type DemoRecord = {
  field: DemoField;
  unit: string;
  scene: SceneKey;
  question: string;
  guess: string; // 子どもの予想（単位つき）
  formula: string;
  scope: Record<string, number>;
  answerUnit: string;
};

export const DEMO_TEACHER = { name: "山田 花子", initial: "山" };

// 見本の「いま」（docs/design/teachers/README.md「見本の決まりごと」）
export const DEMO_TODAY = "2026/11/4";

export const DEMO_RECORDS: DemoRecord[] = [
  { field: "情報", unit: "プログラミング", scene: "signal", question: "この信号は、1日に何回 切りかわる？", guess: "100回", formula: "24*60*60/s", scope: { s: 60 }, answerUnit: "回" },
  { field: "算数", unit: "平均", scene: "gacha", question: "このガチャガチャの10種類を全部そろえるには、平均で何回まわす？", guess: "10回", formula: "n*harmonic(n)", scope: { n: 10 }, answerUnit: "回" },
  { field: "算数", unit: "体積", scene: "ice", question: "このコップで、プールをいっぱいにするには何ばい くむ？", guess: "5,000ばい", formula: "p*1000/v", scope: { p: 360000, v: 200 }, answerUnit: "ばい" },
  { field: "情報", unit: "データの表し方", scene: "signal", question: "この信号の3つのランプで、何通りの光り方を作れる？", guess: "3通り", formula: "2^n", scope: { n: 3 }, answerUnit: "通り" },
  { field: "算数", unit: "場合の数", scene: "gacha", question: "3色のカプセルを3回出すと、色の出方は何通り？", guess: "9通り", formula: "c^k", scope: { c: 3, k: 3 }, answerUnit: "通り" },
  { field: "理科", unit: "もののとけ方", scene: "ice", question: "このコップの水に、さとうは何gまで とける？", guess: "50g", formula: "v/100*204", scope: { v: 200 }, answerUnit: "g" },
  { field: "算数", unit: "割合", scene: "gacha", question: "このガチャガチャを10回まわして、ほしい1種類が1回も出ないのは何％？", guess: "1%", formula: "(1-1/n)^k*100", scope: { n: 10, k: 10 }, answerUnit: "%" },
  { field: "算数", unit: "割合", scene: "signal", question: "この信号が赤になっている時間は、1年で何時間？", guess: "100時間", formula: "24*365*r/c", scope: { r: 60, c: 120 }, answerUnit: "時間" },
];

// 授業中の記録の日と時刻（新しい順）。出席番号ごとに recordShift 分ずつ前にずらす
const RECORD_SLOTS = [
  { day: "11/4", minutes: 10 * 60 + 36 },
  { day: "10/29", minutes: 11 * 60 + 40 },
  { day: "10/28", minutes: 13 * 60 + 50 },
];

export type DemoRecordItem = DemoRecord & { id: string; memberId: string; at: string };

// その子が授業中に保存した はてなのうち、見本で出す新しいもの（最大3件）。メンバーの画面と はてなの画面で同じものを出す
export function memberRecords(m: DemoMember): DemoRecordItem[] {
  const total = m.fields.算数 + m.fields.理科 + m.fields.情報;
  return RECORD_SLOTS.slice(0, Math.min(total, RECORD_SLOTS.length)).map((slot, k) => {
    const minutes = slot.minutes - m.recordShift;
    return {
      ...DEMO_RECORDS[(m.recordStart + k) % DEMO_RECORDS.length],
      id: `${m.id}-r${k}`,
      memberId: m.id,
      at: `${slot.day} ${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, "0")}`,
    };
  });
}

// 「M/D H:MM」を並べかえ用の数にする（見本の日付はすべて 2026年）
export function timeKey(at: string) {
  const [, m, d, h, min] = at.match(/^(\d+)\/(\d+) (\d+):(\d+)$/)?.map(Number) ?? [0, 0, 0, 0, 0];
  return ((m * 100 + d) * 100 + h) * 100 + min;
}

// 答えは式から計算する（LLM や手書きの数を使わない）
export function answerText(r: DemoRecord) {
  const result = calculate(r.formula, r.scope);
  if (!result.ok) return "—";
  const rounded = Math.round(result.value);
  return `${rounded === result.value ? "" : "約"}${rounded.toLocaleString("ja-JP")}${r.answerUnit}`;
}

const mail = (local: string) => `${local}@example.ed.jp`;

function member(
  id: string,
  no: number,
  name: string,
  user: string,
  local: string,
  joined: string,
  title: string,
  [math, sci, info, out, missions]: [number, number, number, number, number],
): DemoMember {
  return {
    id,
    no,
    name,
    user,
    mail: mail(local),
    joined,
    title,
    fields: { 算数: math, 理科: sci, 情報: info },
    out,
    missions,
    recordStart: (no - 1) % DEMO_RECORDS.length,
    recordShift: (no - 1) * 2,
  };
}

export const DEMO_CLASSES: TeacherClass[] = [
  {
    id: "5-2",
    name: "5年2組",
    grade: "5年",
    schoolYear: "2026年度",
    role: "担任",
    classUntil: "15:30",
    members: [
      member("m1", 1, "青木 空", "そらまめ", "aoki.sora", "2026/4/9", "はかせの たまご", [7, 5, 2, 9, 9]),
      member("m2", 2, "井上 陽翔", "ハルト", "inoue.haruto", "2026/4/9", "データ たんてい", [5, 3, 4, 6, 8]),
      member("m3", 3, "上田 結衣", "ゆいゆい", "ueda.yui", "2026/4/9", "じょうほう マスター", [6, 4, 5, 12, 11]),
      member("m4", 4, "岡本 蓮", "れんこん", "okamoto.ren", "2026/4/10", "はじめての はてな", [6, 2, 1, 3, 6]),
      member("m5", 5, "加藤 さくら", "さくらもち", "kato.sakura", "2026/4/9", "しぜん はかせ", [3, 8, 2, 8, 10]),
      member("m6", 6, "木村 湊", "みなとくん", "kimura.minato", "2026/4/9", "みずの はかせ", [7, 2, 2, 5, 7]),
      member("m7", 7, "小林 芽依", "めいめい", "kobayashi.mei", "2026/4/12", "とけかた はかせ", [4, 6, 2, 7, 9]),
      member("m8", 8, "佐藤 大和", "やまとダッシュ", "sato.yamato", "2026/4/9", "ながれ はかせ", [3, 5, 2, 4, 8]),
      member("m9", 9, "鈴木 心春", "こはる", "suzuki.koharu", "2026/4/9", "はやさ はかせ", [6, 4, 3, 7, 9]),
      member("m10", 10, "高橋 律", "りっちゃん", "takahashi.ritsu", "2026/4/15", "プログラム はかせ", [4, 2, 4, 5, 7]),
      member("m11", 11, "田中 陸", "りくりく", "tanaka.riku", "2026/4/9", "はじめての はてな", [2, 1, 1, 6, 4]),
      member("m12", 12, "中島 葵", "あおいろ", "nakajima.aoi", "2026/4/9", "しぜん はかせ", [3, 6, 1, 2, 8]),
      member("m13", 13, "西村 悠真", "ゆうま", "nishimura.yuma", "2026/5/7", "はかせの たまご", [0, 0, 0, 4, 2]),
      member("m14", 14, "林 美月", "みづき", "hayashi.mizuki", "2026/4/9", "データ たんてい", [5, 2, 6, 3, 10]),
    ],
    pending: [
      { id: "p1", name: "中村 陽菜", user: "ひなた", mail: mail("nakamura.hina") },
      { id: "p2", name: "山口 颯太", user: "そうた", mail: mail("yamaguchi.sota") },
      { id: "p3", name: "渡辺 碧", user: "あおい", mail: mail("watanabe.aoi") },
    ],
    shared: [
      { id: "s1", memberId: "m3", record: 3, at: "11/3 16:08", isNew: true },
      { id: "s2", memberId: "m4", record: 6, at: "11/2 17:30", isNew: true },
      { id: "s3", memberId: "m1", record: 2, at: "10/30 10:26", isNew: false },
      { id: "s4", memberId: "m8", record: 7, at: "10/29 15:12", isNew: false },
      { id: "s5", memberId: "m6", record: 1, at: "10/28 13:52", isNew: false },
      { id: "s6", memberId: "m10", record: 0, at: "10/27 12:40", isNew: false },
      { id: "s7", memberId: "m5", record: 5, at: "10/26 10:05", isNew: false },
      { id: "s8", memberId: "m7", record: 4, at: "10/23 11:20", isNew: false },
      { id: "s9", memberId: "m2", record: 3, at: "10/22 14:30", isNew: false },
    ],
  },
  {
    id: "5-1",
    name: "5年1組",
    grade: "5年",
    schoolYear: "2026年度",
    role: "学年の先生",
    classUntil: null,
    members: [
      member("k1", 1, "石井 翼", "つばさ", "ishii.tsubasa", "2026/4/9", "はかせの たまご", [4, 3, 1, 5, 6]),
      member("k2", 2, "大野 千尋", "ちひろ", "ono.chihiro", "2026/4/9", "しぜん はかせ", [2, 5, 1, 3, 7]),
      member("k3", 3, "斎藤 湊斗", "みなと", "saito.minato", "2026/4/9", "データ たんてい", [3, 1, 4, 6, 5]),
      member("k4", 4, "松本 凛", "りんりん", "matsumoto.rin", "2026/4/13", "はじめての はてな", [1, 2, 0, 2, 3]),
    ],
    pending: [],
    shared: [
      { id: "t1", memberId: "k2", record: 5, at: "11/2 18:15", isNew: true },
      { id: "t2", memberId: "k3", record: 3, at: "10/28 11:02", isNew: false },
    ],
  },
];
