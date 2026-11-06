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
  role: TeacherRole; // あなた（DEMO_TEACHER）の役割。teachers の「me」と同じにする（TeacherProvider がそろえる）
  hours: ClassHours; // 授業時間（いま授業時間中かは classUntilNow で計算する）
  joinCode: string;
  joinOpen: boolean; // 参加コードの受付中／受付停止
  teachers: ClassTeacher[];
  members: DemoMember[];
  pending: DemoPending[];
  shared: DemoShared[];
  missionPlans: Record<string, DemoMission>; // 先生が出したミッション（キーは「M/D」）
  twoWeeks: DemoTwoWeeks; // きょうの画面の「この2週間」（きょうの授業中の分は memberRecords から数える）
};

// きょうより前の13日の、日ごとの件数（docs/06-school-expansion.md 5.5）。合計・割合・グラフは画面でここから計算する（数がずれないように）
export type DemoDayCount = { day: string; fields: Record<DemoField, number>; out: number }; // fields は授業中の分、out は授業の外の分
export type DemoTwoWeeks = {
  days: DemoDayCount[];
  users: number; // 使った子どもの人数（授業の外も入れる）
  units: Record<string, number>; // 授業中に保存した単元ごとの件数（よく出るものだけ）
};

// 見本の数を短く書く：[日付, 算数, 理科, 情報, 授業の外]
function twoWeekDays(rows: [string, number, number, number, number][]): DemoDayCount[] {
  return rows.map(([day, math, sci, info, out]) => ({ day, fields: { 算数: math, 理科: sci, 情報: info }, out }));
}

// ミッションの文の決まり（docs/06-school-expansion.md 5.3）。ミッションの画面と、きょうの画面で使う
export const MISSION_MAX_LENGTH = 30;
export const MISSION_EXAMPLE = "うんどうじょうで まるい ものを さがそう";

// 漢字（くり返しの「々」も）を、出てきた順に1つずつ
export function kanjiIn(text: string) {
  return [...new Set(text.match(/[\u3400-\u4DBF\u4E00-\u9FFF\uF900-\uFAFF々]/g) ?? [])];
}

// 先生が出したミッション（docs/06-school-expansion.md 5.3）。クリアは、その日に ずかんへ保存した人数（これからの日は null）
export type DemoMission = { text: string; cleared: number | null };

// 見本の「いま」の時刻と、見本の期間の祝日（キーは「M/D」。見本の日付はすべて 2026年）
export const DEMO_NOW = "10:40";
export const DEMO_HOLIDAYS: Record<string, string> = { "11/3": "文化の日" };

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

// ---- クラスの設定（docs/06-school-expansion.md 5.1・5.2・5.6。見本 docs/design/teachers/screens/15〜18） ----

export const WEEKDAYS = ["月", "火", "水", "木", "金"] as const;
export type Weekday = (typeof WEEKDAYS)[number];
export type DayHours = { on: boolean; start: string; end: string }; // 時刻は「HH:MM」
export type ExcludedDays = { id: string; name: string; from: string; to: string }; // 日付は「YYYY-MM-DD」
export type AddedDay = { id: string; name: string; date: string; start: string; end: string };
export type ClassHours = { week: Record<Weekday, DayHours>; autoHolidays: boolean; excluded: ExcludedDays[]; added: AddedDay[] };

// 一緒に見る先生。name が null のときは、追加したばかりで まだログインしていない
export type ClassTeacher = { id: string; name: string | null; mail: string; role: TeacherRole; me: boolean };

// 年度と、学校のアカウントのドメイン（見本。仮の値）
export const SCHOOL_YEAR = { from: "2026-04-01", to: "2027-03-31", label: "2026年度（4月1日〜3月31日）" };
export const SCHOOL_DOMAIN = "example.ed.jp";

// 見本の年度の祝日（振替休日・国民の休日を含む）。カレンダーと「いま授業時間中か」に使う
export const SCHOOL_YEAR_HOLIDAYS: Record<string, string> = {
  "2026-04-29": "昭和の日",
  "2026-05-03": "憲法記念日",
  "2026-05-04": "みどりの日",
  "2026-05-05": "こどもの日",
  "2026-05-06": "振替休日",
  "2026-07-20": "海の日",
  "2026-08-11": "山の日",
  "2026-09-21": "敬老の日",
  "2026-09-22": "国民の休日",
  "2026-09-23": "秋分の日",
  "2026-10-12": "スポーツの日",
  "2026-11-03": "文化の日",
  "2026-11-23": "勤労感謝の日",
  "2027-01-01": "元日",
  "2027-01-11": "成人の日",
  "2027-02-11": "建国記念の日",
  "2027-02-23": "天皇誕生日",
  "2027-03-21": "春分の日",
  "2027-03-22": "振替休日",
};

const pad2 = (n: number) => String(n).padStart(2, "0");
export const dateKey = (y: number, m: number, d: number) => `${y}-${pad2(m)}-${pad2(d)}`;
export function parseDateKey(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}
export const toMinutes = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};
// 「08:30」→「8:30」
export const shortTime = (t: string) => t.replace(/^0(\d)/, "$1");

// その日の授業時間。kind は カレンダーの見た目に使う（足した日が いちばん強い）
export type DaySchedule =
  | { kind: "added"; label: string; start: string; end: string }
  | { kind: "class"; label: string; start: string; end: string }
  | { kind: "excluded" | "holiday"; label: string }
  | { kind: "weekend" | "off"; label: string };

export function scheduleOf(h: ClassHours, key: string): DaySchedule {
  const added = h.added.find((a) => a.date === key);
  if (added) return { kind: "added", label: added.name, start: added.start, end: added.end };
  const excluded = h.excluded.find((e) => e.from <= key && key <= e.to);
  if (excluded) return { kind: "excluded", label: excluded.name };
  const holiday = SCHOOL_YEAR_HOLIDAYS[key];
  if (holiday && h.autoHolidays) return { kind: "holiday", label: holiday };
  const dow = parseDateKey(key).getDay();
  if (dow === 0 || dow === 6) return { kind: "weekend", label: holiday ?? "" };
  const day = h.week[WEEKDAYS[dow - 1]];
  if (!day.on) return { kind: "off", label: holiday ?? "授業時間なし" };
  return { kind: "class", label: holiday ?? "", start: day.start, end: day.end };
}

// いま（見本の DEMO_TODAY・DEMO_NOW）が授業時間中なら、そのおわりの時刻（「15:30」の形）。外なら null（5.2）
export function classUntilNow(h: ClassHours): string | null {
  const s = scheduleOf(h, TODAY_KEY);
  if (s.kind !== "class" && s.kind !== "added") return null;
  const now = toMinutes(DEMO_NOW);
  return toMinutes(s.start) <= now && now < toMinutes(s.end) ? shortTime(s.end) : null;
}

// 参加コード。見まちがえやすい 0・O・1・I・L は使わない
const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export function newJoinCode() {
  const values = crypto.getRandomValues(new Uint32Array(7));
  const chars = [...values].map((v) => CODE_CHARS[v % CODE_CHARS.length]).join("");
  return `${chars.slice(0, 3)}-${chars.slice(3)}`;
}

const weekHours = (wed: [string, string]): Record<Weekday, DayHours> => ({
  月: { on: true, start: "08:30", end: "15:30" },
  火: { on: true, start: "08:30", end: "15:30" },
  水: { on: true, start: wed[0], end: wed[1] },
  木: { on: true, start: "08:30", end: "15:30" },
  金: { on: true, start: "08:30", end: "15:30" },
});

const HOLIDAY_BREAKS: ExcludedDays[] = [
  { id: "x-winter", name: "冬休み", from: "2026-12-25", to: "2027-01-07" },
  { id: "x-spring", name: "春休み", from: "2027-03-25", to: "2027-04-05" },
];

// 見本の「いま」（docs/design/teachers/README.md「見本の決まりごと」）
export const DEMO_TODAY = "2026/11/4";
export const TODAY_KEY = dateKey(...(DEMO_TODAY.split("/").map(Number) as [number, number, number]));

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

const mail = (local: string) => `${local}@${SCHOOL_DOMAIN}`;

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
    hours: {
      week: weekHours(["08:30", "14:40"]),
      autoHolidays: true,
      excluded: HOLIDAY_BREAKS,
      added: [{ id: "a-happyokai", name: "学習発表会", date: "2026-11-14", start: "08:30", end: "12:00" }],
    },
    joinCode: "K7Q-4M2X",
    joinOpen: true,
    teachers: [
      { id: "t-yamada", name: DEMO_TEACHER.name, mail: mail("yamada.hanako"), role: "担任", me: true },
      { id: "t-tanaka", name: "田中 美咲", mail: mail("tanaka.misaki"), role: "副担任", me: false },
      { id: "t-sasaki", name: "佐々木 健", mail: mail("sasaki.ken"), role: "学年の先生", me: false },
    ],
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
    missionPlans: {
      "10/21": { text: "そとで うごく ものを さがそう", cleared: 9 },
      "10/23": { text: "がっこうの みずを つかう ばしょを さがそう", cleared: 8 },
      "10/26": { text: "うんどうじょうで さんかくの ものを さがそう", cleared: 9 },
      "10/28": { text: "としょしつで しかくい ものを さがそう", cleared: 10 },
      "10/30": { text: "うんどうじょうで まるい ものを さがそう", cleared: 11 },
      "11/2": { text: "きゅうしょくで かずを かぞえよう", cleared: 11 },
      "11/4": { text: "きょうしつで ながい ものを さがそう", cleared: 5 },
      "11/6": { text: "かいだんで かずを かぞえよう", cleared: null },
    },
    twoWeeks: {
      days: twoWeekDays([
        ["10/22", 6, 4, 3, 5],
        ["10/23", 5, 4, 2, 6],
        ["10/24", 0, 0, 0, 7],
        ["10/25", 0, 0, 0, 9],
        ["10/26", 6, 5, 3, 3],
        ["10/27", 5, 3, 3, 4],
        ["10/28", 7, 5, 4, 6],
        ["10/29", 6, 4, 4, 5],
        ["10/30", 6, 4, 3, 4],
        ["10/31", 0, 0, 0, 6],
        ["11/1", 0, 0, 0, 5],
        ["11/2", 4, 4, 2, 3],
        ["11/3", 0, 0, 0, 1],
      ]),
      users: 13,
      units: { 体積: 14, 割合: 12, もののとけ方: 11, 場合の数: 10, 平均: 9, データの表し方: 9, プログラミング: 8 },
    },
  },
  {
    id: "5-1",
    name: "5年1組",
    grade: "5年",
    schoolYear: "2026年度",
    role: "学年の先生",
    // きょうは学級閉鎖で授業時間から外している（見本で「授業時間の外」のヘッダーを見せるため）
    hours: {
      week: weekHours(["08:30", "14:40"]),
      autoHolidays: true,
      excluded: [{ id: "x-closure", name: "学級閉鎖", from: "2026-11-04", to: "2026-11-06" }, ...HOLIDAY_BREAKS],
      added: [{ id: "a-happyokai", name: "学習発表会", date: "2026-11-14", start: "08:30", end: "12:00" }],
    },
    joinCode: "R3W-8HNT",
    joinOpen: false,
    teachers: [
      { id: "t-mori", name: "森 健一", mail: mail("mori.kenichi"), role: "担任", me: false },
      { id: "t-yamada", name: DEMO_TEACHER.name, mail: mail("yamada.hanako"), role: "学年の先生", me: true },
    ],
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
    missionPlans: {
      "10/28": { text: "としょしつで しかくい ものを さがそう", cleared: 2 },
      "10/30": { text: "うんどうじょうで まるい ものを さがそう", cleared: 3 },
      "11/2": { text: "きゅうしょくで かずを かぞえよう", cleared: 3 },
      "11/4": { text: "きょうしつで ながい ものを さがそう", cleared: 1 },
      "11/6": { text: "かいだんで かずを かぞえよう", cleared: null },
    },
    twoWeeks: {
      days: twoWeekDays([
        ["10/22", 2, 1, 1, 2],
        ["10/23", 1, 2, 0, 1],
        ["10/24", 0, 0, 0, 2],
        ["10/25", 0, 0, 0, 1],
        ["10/26", 2, 1, 1, 1],
        ["10/27", 1, 1, 1, 0],
        ["10/28", 2, 2, 1, 2],
        ["10/29", 1, 1, 0, 1],
        ["10/30", 2, 1, 1, 1],
        ["10/31", 0, 0, 0, 1],
        ["11/1", 0, 0, 0, 2],
        ["11/2", 1, 1, 1, 1],
        ["11/3", 0, 0, 0, 0],
      ]),
      users: 4,
      units: { 体積: 5, 割合: 4, もののとけ方: 4, データの表し方: 3 },
    },
  },
];
