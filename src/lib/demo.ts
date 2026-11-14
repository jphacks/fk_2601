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
    secret: "ペットボトル1本の水は、しずくにすると1万てきもある",
    swappable: false,
    text: "ペットボトルの {水|みず}を しずくに すると、ぜんぶで {何|なん}てき？",
    type: "estimate",
    subject: "math",
    topic: "かさ",
    target: "ペットボトル",
    hint: "500mL の ペットボトルに {水|みず}が いっぱい。スポイトで 1てきずつ おとすと するよ。",
    formula: "volume / drop",
    variables: [
      { name: "volume", label: "{水|みず}の かさ", value: 500, unit: "mL", min: 100, max: 2000, step: 100 },
      { name: "drop", label: "1てきの かさ", value: 0.05, unit: "mL", min: 0.03, max: 0.1, step: 0.01 },
    ],
    answerUnit: "てき",
    llmAnswer: 10000,
    guessRange: { min: 200, max: 20000 },
    compare: null,
    choices: null,
    certainty: "textbook",
    basis: "しずく1てきの大きさは、スポイトなどの器具で変わるが、1mLが約20てき（1てき約0.05mL）という目安がよく使われる。500mL ÷ 0.05mL ＝ 約10000てき（ここでは目安の値で計算している）",
    explanation: {
      short: "{小|ちい}さな しずくも、あつまると 1{万|まん}てき！",
      steps: [
        "スポイトの 1てきは、やく 0.05mL。1mL で だいたい 20てき。",
        "500mL なら、500×20＝10000てき。",
        "1びょうに 1てきずつ おとしても、ぜんぶ おとすのに やく 2{時間|じかん}{半|はん}より {長|なが}く かかるよ。",
      ],
    },
    ref: { type: "per", label: "1びょうに 1てきずつ おとすと", value: 3600, unit: "時間" },
    whatIf: "じゃあ、2L の ペットボトルだったら？",
    tryIt: "ストローの {先|さき}を ゆびで ふさいで {水|みず}を すこし とり、コップに 1てきずつ おとして、10てきで どれくらいに なるか {見|み}てみよう",
    related: ["おふろの {水|みず}を しずくに すると、{何|なん}てき？"],
    keyword: "しずく 1てき かさ",
    sources: source("しずく 1てきの かさ（めやす）", "スポイトの 1てきは やく 0.05mL（1mL で 20てき くらい）と する"),
  },
  {
    secret: "水はこおると、かさがふえる",
    swappable: false,
    text: "{水|みず}を ぎりぎりまで {入|い}れて こおらせると、ペットボトルは どうなる？",
    type: "why",
    subject: "science",
    topic: "こおる とき",
    target: "ペットボトル",
    hint: "れいとうこで、ふたを しめたまま こおらせるよ。",
    formula: null,
    variables: [],
    answerUnit: "",
    llmAnswer: null,
    guessRange: null,
    compare: null,
    choices: [
      { text: "{氷|こおり}に なると ちぢんで、ペットボトルが へこむ", correct: false },
      { text: "{氷|こおり}に なると ふくらんで、ペットボトルが ぱんぱんに なる", correct: true },
      { text: "{氷|こおり}に なっても、ぜんぜん かわらない", correct: false },
    ],
    certainty: "textbook",
    basis: "水は凍ると体積が約9％（約1.09倍）ふえる。氷の密度は水より小さい（理科の教科書の「水の状態変化」）",
    explanation: {
      short: "{水|みず}は こおると、すこし ふえるんだ！",
      steps: [
        "ふつうの ものは、こおると ちぢむ ことが おおい。",
        "でも {水|みず}は ぎゃく。{氷|こおり}に なると、かさが やく 1.1ばいに なる。",
        "だから ぎりぎりまで {入|い}れると、ペットボトルが ぱんぱんに なって、われる ことも あるよ。こおらせる ときは、すこし あけて おこう。",
      ],
    },
    ref: null,
    whatIf: "じゃあ、{水|みず}を {半分|はんぶん}だけ {入|い}れて こおらせたら どうなる？",
    tryIt: "コップの {水|みず}に {氷|こおり}を うかべて、{氷|こおり}が どれくらい {水|みず}から でているか みてみよう",
    related: ["コップの {氷|こおり}が ぜんぶ とけたら、{水|みず}の {高|たか}さは どうなる？"],
    keyword: "{水|みず} こおる ふくらむ",
    sources: source("{水|みず}が こおる ときの かさ", "{水|みず}が こおると、かさは やく 1.09ばいに なる"),
  },
  {
    secret: "バーコードのさいごの数字は、よみまちがいを見つけるためのもの",
    swappable: false,
    text: "バーコードの {下|した}の {数字|すうじ}。いちばん {右|みぎ}の 1つは なんの ため？",
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
      { text: "{商品|しょうひん}が つくられた {日|ひ}を あらわす", correct: false },
      { text: "ほかの {数字|すうじ}から {計算|けいさん}で きまり、よみまちがいを {見|み}つける", correct: true },
      { text: "ねだんの いちばん {下|した}の けたを あらわす", correct: false },
    ],
    certainty: "textbook",
    basis: "JANコードの最後の1けたはチェックデジットで、前の12けたから決まった計算で求める（日本の流通で使われる規格）",
    explanation: {
      short: "さいごの 1つは、「よみまちがい チェック」の {数字|すうじ}なんだ！",
      steps: [
        "ペットボトルの バーコードの {数字|すうじ}は、ふつう 13こ ならんでいる。",
        "いちばん {右|みぎ}の 1つは、ほかの 12この {数字|すうじ}から、きまった {計算|けいさん}で {出|だ}す {数字|すうじ}（チェックデジット）。",
        "レジの きかいも {同|おな}じ {計算|けいさん}を して、あわなければ「よみまちがい」と わかる。だから、ちがう {商品|しょうひん}と まちがえにくいんだ。",
      ],
    },
    ref: null,
    whatIf: "じゃあ、この {数字|すうじ}が なかったら、どうなる？",
    tryIt: "いえに ある ほかの しょうひんの バーコードを さがして、{下|した}の {数字|すうじ}が いくつ ならんでいるか かぞえてみよう",
    related: ["{本|ほん}の うらの バーコードにも、よみまちがい チェックの {数字|すうじ}は ある？"],
    keyword: "チェックデジット バーコード",
    sources: source("バーコード（JANコード）", "13けたの いちばん {右|みぎ}は、ほかの 12けたから {計算|けいさん}で きまる「チェックデジット」"),
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
