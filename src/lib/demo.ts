import type { Question } from "@/server/llm/schema";
import type { CustomResponse, QuestionsResponse } from "@/server/llm/generate";
import { seedLocalUser } from "./backend/local";
import { newId } from "./id";

// ピッチ用のデモ版（/demo）。操作・見た目は本物と同じで、AI を呼ばずに、ペットボトルの問いを出す。
// 何を撮っても「ペットボトル」と認識し、待ち時間は 1〜2 秒の演出だけにする。ログインは使わず、データは端末の中だけに置く。
// デモの印は、/demo を開いたタブの中だけに置く（sessionStorage）。ほかのタブで https://fk2601.vercel.app/ を開くと、本物になる。

const FLAG_KEY = "demo:on";

/** 前の版では印を localStorage に置いていて、ふつうの URL もデモのままになっていた。残っていたら消す */
function clearOldFlag(): void {
  try {
    window.localStorage.removeItem(FLAG_KEY);
  } catch {
    // 何もしない
  }
}

/** 待ちの画面の長さ（本物の「しらべている」演出を、短く見せるだけ） */
export const DEMO_DELAY_MS = 1600;

export function isDemo(): boolean {
  try {
    if (typeof window === "undefined") return false;
    clearOldFlag();
    return window.sessionStorage.getItem(FLAG_KEY) === "1";
  } catch {
    return false;
  }
}

/** デモを（はじめから）始める。前のデモのデータは消して、5年生のプロフィールを用意する */
export function startDemo(): void {
  const uid = "local-demo";
  seedLocalUser(
    { uid, username: "demo" },
    { id: newId(), nickname: "そら", grade: 5, title: null, firstMode: "choices", createdAt: Date.now() },
  );
  try {
    window.sessionStorage.setItem(FLAG_KEY, "1");
  } catch {
    // 保存できなくても、画面は動かす
  }
}

/** デモを終わって、本物の使いかたにもどす */
export function exitDemo(): void {
  try {
    window.sessionStorage.removeItem(FLAG_KEY);
  } catch {
    // 何もしない
  }
  clearOldFlag();
}

const source = (title: string, assumption: string) => [{ kind: "data" as const, title, url: null, assumption }];

const QUESTIONS: Question[] = [
  {
    secret: "ペットボトルは、中の水にくらべて、とてもかるい",
    swappable: false,
    text: "ペットボトルに {水|みず}を いっぱい {入|い}れると、{水|みず}は ペットボトル{本体|ほんたい}の {何倍|なんばい} {重|おも}い？",
    type: "estimate",
    subject: "math",
    topic: "おもさ",
    target: "ペットボトル",
    hint: "500mL の ペットボトルで、からの ペットボトル（ふた つき）は 20g と して かんがえるよ。",
    formula: "water/bottle",
    variables: [
      { name: "water", label: "{水|みず}の おもさ", value: 500, unit: "g", min: 100, max: 2000, step: 100 },
      { name: "bottle", label: "からの ペットボトルの おもさ", value: 20, unit: "g", min: 10, max: 40, step: 5 },
    ],
    answerUnit: "ばい",
    llmAnswer: 25,
    guessRange: { min: 2, max: 100 },
    compare: null,
    choices: null,
    explanation: {
      short: "ペットボトルは、うすくて とても かるいんだ！",
      steps: [
        "{水|みず}は 1mL で 1g。だから 500mL の {水|みず}は 500g。",
        "からの ペットボトルは 20g くらい。",
        "500÷20＝25。{水|みず}は、ペットボトルの 25ばいも {重|おも}い！",
      ],
    },
    ref: null,
    whatIf: "じゃあ、{水|みず}を {半分|はんぶん}に したら？",
    related: ["コップ 1ぱいの {水|みず}は、コップの {何倍|なんばい} {重|おも}い？"],
    keyword: "ペットボトル おもさ",
    sources: source("{水|みず}の おもさと、ペットボトルの おもさ（めやす）", "{水|みず}は 1mL で 1g／からの ペットボトル（ふた つき）は 20g くらい と する"),
  },
  {
    secret: "水はこおると、かさがふえる",
    swappable: false,
    text: "ペットボトルに {水|みず}を ぎりぎりまで {入|い}れて、れいとうこで こおらせると、どうなる？",
    type: "why",
    subject: "science",
    topic: "こおる とき",
    target: "ペットボトル",
    hint: "ふたは しめたままに するよ。",
    formula: null,
    variables: [],
    answerUnit: "",
    llmAnswer: null,
    guessRange: null,
    compare: null,
    choices: [
      { text: "{氷|こおり}に なると ふくらんで、ペットボトルが ぱんぱんに なる", correct: true },
      { text: "{氷|こおり}に なると ちぢんで、ペットボトルが へこむ", correct: false },
      { text: "{氷|こおり}に なっても、ぜんぜん かわらない", correct: false },
    ],
    explanation: {
      short: "{水|みず}は こおると、すこし ふえるんだ！",
      steps: [
        "ふつうの ものは、こおると ちぢむ ことが おおい。",
        "でも {水|みず}は ぎゃく。{氷|こおり}に なると、かさが やく 1.1ばいに なる。",
        "だから ぎりぎりまで {入|い}れると、ペットボトルが ぱんぱんに なって、われる ことも あるよ。こおらせる ときは、すこし あけて おこう。",
      ],
    },
    ref: null,
    whatIf: "",
    related: ["コップの {氷|こおり}が ぜんぶ とけたら、{水|みず}の {高|たか}さは どうなる？"],
    keyword: "{水|みず} こおる ふくらむ",
    sources: source("{水|みず}が こおる ときの かさ", "{水|みず}が こおると、かさは やく 1.09ばいに なる"),
  },
  {
    secret: "バーコードに入っているのは、ねだんではなく番号",
    swappable: false,
    text: "ペットボトルの ラベルに ある、{白|しろ}と {黒|くろ}の しま（バーコード）には、{何|なに}が {入|はい}っている？",
    type: "why",
    subject: "info",
    topic: "バーコード",
    target: "ペットボトル",
    hint: "レジで ピッと よみとる ところを おもいだしてね。",
    formula: null,
    variables: [],
    answerUnit: "",
    llmAnswer: null,
    guessRange: null,
    compare: null,
    choices: [
      { text: "{商品|しょうひん}の {番号|ばんごう}。ねだんは、{番号|ばんごう}から おみせの コンピューターが さがす", correct: true },
      { text: "ねだんそのもの", correct: false },
      { text: "いつまで のめるか（のめる {日|ひ}）", correct: false },
    ],
    explanation: {
      short: "しまは、{番号|ばんごう}を きかいが よめる {形|かたち}に した ものなんだ！",
      steps: [
        "バーコードの しまは、{数字|すうじ}を きかいが よみとれる {形|かたち}に した もの。",
        "{入|はい}っているのは {商品|しょうひん}の {番号|ばんごう}で、ねだんは {入|はい}っていない。",
        "レジで よみとると、おみせの コンピューターが {番号|ばんごう}から {商品|しょうひん}と ねだんを さがす。だから、おみせごとに ねだんを かえられるよ。",
      ],
    },
    ref: null,
    whatIf: "",
    related: ["QRコードの {白黒|しろくろ}には、{何|なに}が {入|はい}っている？"],
    keyword: "バーコード しくみ",
    sources: source("バーコード（JANコード）", "バーコードには {商品|しょうひん}の {番号|ばんごう}が {入|はい}っていて、ねだんは {入|はい}っていない"),
  },
];

/** デモの「AI の答え」。何を囲んでも、ペットボトルとして、同じ3つの問いを返す（本物と同じ見た目にするため、demo の印はつけない） */
export function demoQuestions(): QuestionsResponse {
  return { recognition: { label: "ペットボトル", canAsk: true }, questions: QUESTIONS };
}

/** デモでは、自分で書いた問いは使えない。ナビが、3つから選ぶようにすすめる */
export function demoCustom(): CustomResponse {
  return {
    recognition: { label: "ペットボトル", canAsk: true },
    answerable: false,
    reason: "この デモでは、3つの はてなから えらんでね",
    question: null,
  };
}
