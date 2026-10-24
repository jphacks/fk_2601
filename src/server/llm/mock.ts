import "server-only";
import type { CustomOutput, Question, QuestionsOutput } from "./schema";

// LLM_MODE=mock のときに返す、開発・デモ用のサンプルの問い（料金がかからない）。写真の中身とは関係ない

const SET_A: Question[] = [
  {
    text: "おふろの ゆぶねを お湯で いっぱいにすると、コップ（200mL）で 何ばい分 でしょう？",
    type: "estimate",
    subject: "math",
    topic: "体積と単位",
    target: "おふろ",
    formula: "tub * 1000 / cup",
    variables: [
      { name: "tub", label: "ゆぶねの大きさ", value: 200, unit: "L", min: 100, max: 400, step: 10 },
      { name: "cup", label: "コップの大きさ", value: 200, unit: "mL", min: 100, max: 500, step: 50 },
    ],
    answerUnit: "ばい",
    llmAnswer: 1000,
    guessRange: { min: 100, max: 5000 },
    compare: null,
    choices: null,
    explanation: {
      short: "ゆぶねの お湯は、コップで 1000ばい分 も あるよ！",
      steps: ["ゆぶねの大きさは 約200L。", "1L は 1000mL だから、200L は 200000mL。", "200000 ÷ 200 = 1000（ばい）。"],
    },
    familiar: null,
    sources: [{ kind: "data", title: "家庭の浴槽の大きさ", url: null, assumption: "家庭のゆぶねは、お湯を入れて約200Lとして計算した" }],
  },
  {
    text: "東京スカイツリーの 高さ（634m）は、25mプールの 長さの 何倍 でしょう？",
    type: "compare",
    subject: "math",
    topic: "くらべる（倍）",
    target: "高いもの",
    formula: "tower / pool",
    variables: [
      { name: "tower", label: "スカイツリーの高さ", value: 634, unit: "m", min: 300, max: 900, step: 10 },
      { name: "pool", label: "プールの長さ", value: 25, unit: "m", min: 10, max: 50, step: 5 },
    ],
    answerUnit: "倍",
    llmAnswer: 25.4,
    guessRange: null,
    compare: { a: "スカイツリー", b: "25mプール" },
    choices: null,
    explanation: {
      short: "スカイツリーは、25mプールを 25こ ならべた より 少し 長いよ！",
      steps: ["スカイツリーの高さは 634m。", "25mプールの長さは 25m。", "634 ÷ 25 = 25.36 だから、約25倍。"],
    },
    familiar: null,
    sources: [{ kind: "data", title: "東京スカイツリーの高さ", url: null, assumption: "高さ634m、25mプールの長さ25mとして計算した" }],
  },
  {
    text: "夏の 日、アイスが すぐに とけてしまうのは どうして でしょう？",
    type: "why",
    subject: "science",
    topic: "熱のつたわり",
    target: "アイス",
    formula: null,
    variables: [],
    answerUnit: "",
    llmAnswer: null,
    guessRange: null,
    compare: null,
    choices: [
      { text: "まわりの あたたかい 空気から、熱が アイスに うつるから", correct: true },
      { text: "アイスが 自分で 熱を 出しているから", correct: false },
      { text: "太陽が アイスの 水分を すいとるから", correct: false },
    ],
    explanation: {
      short: "あたたかい ものから つめたい ものへ 熱が うつるから、アイスは とけるんだ。",
      steps: ["熱は、あたたかい ほうから つめたい ほうへ うつる。", "夏は まわりの 空気が あたたかい ので、アイスに 熱が どんどん うつる。", "アイスの 温度が 上がって、とけてしまう。"],
    },
    familiar: null,
    sources: [{ kind: "data", title: "熱の伝わり方（伝導・対流・放射）", url: null, assumption: "小学校の理科で習う熱の伝わり方にもとづく" }],
  },
];

const SET_B: Question[] = [
  {
    text: "0と1だけを 8こ ならべて つくる「2しんすう」は、ぜんぶで 何とおり あるでしょう？",
    type: "estimate",
    subject: "info",
    topic: "2しんすう",
    target: "QRコード",
    formula: "pow(2, bits)",
    variables: [{ name: "bits", label: "ならべる数", value: 8, unit: "こ", min: 1, max: 16, step: 1 }],
    answerUnit: "とおり",
    llmAnswer: 256,
    guessRange: { min: 16, max: 1600 },
    compare: null,
    choices: null,
    explanation: {
      short: "8こ ならべると 256とおり！ 1こ ふえるごとに、2倍に なるよ。",
      steps: ["1こなら 0か1の 2とおり。", "2こなら 2×2 = 4とおり。", "8こなら 2を 8回 かけて 256とおり。"],
    },
    familiar: null,
    sources: [{ kind: "data", title: "2進数とビット", url: null, assumption: "0と1の2つの数字だけを使う数え方として計算した" }],
  },
  {
    text: "うすさ 0.1mm の 紙を 42回 おりたたむと、厚さは 何km に なるでしょう？",
    type: "estimate",
    subject: "math",
    topic: "べき乗（2倍ずつ）",
    target: "紙",
    formula: "thick * pow(2, folds) / 1000000",
    variables: [
      { name: "thick", label: "紙のうすさ", value: 0.1, unit: "mm", min: 0.05, max: 0.5, step: 0.05 },
      { name: "folds", label: "おる回数", value: 42, unit: "回", min: 1, max: 45, step: 1 },
    ],
    answerUnit: "km",
    llmAnswer: 439800,
    guessRange: { min: 5000, max: 500000 },
    compare: null,
    choices: null,
    explanation: {
      short: "42回 おると、月に とどくほどの 厚さに なるよ！",
      steps: ["1回おると 厚さは 2倍。", "42回おると 2を 42回 かけるので、約4.4兆倍。", "0.1mm × 約4.4兆 ＝ 約44万km。"],
    },
    familiar: { name: "地球から月までの きょり", amount: 384400 },
    sources: [{ kind: "data", title: "紙の厚さと倍々", url: null, assumption: "実さいには、紙を42回おることはできない。計算だけの話" }],
  },
  {
    text: "かみなりが 光ったあと、少しおくれて 音が 聞こえるのは どうして でしょう？",
    type: "why",
    subject: "science",
    topic: "光と音",
    target: "空",
    formula: null,
    variables: [],
    answerUnit: "",
    llmAnswer: null,
    guessRange: null,
    compare: null,
    choices: [
      { text: "光は、音よりも ずっと はやく 進むから", correct: true },
      { text: "音が 先に 出て、光が あとから 出るから", correct: false },
      { text: "音は 風に のって、ゆっくり 来るから", correct: false },
    ],
    explanation: {
      short: "光は 1秒で 地球を 7周半、音は 1秒で 約340m。光の ほうが ずっと はやいんだ。",
      steps: ["光と音は、同じ ばしょで 同時に 出る。", "光は とても はやいので、すぐ 目に とどく。", "音は ゆっくりなので、おくれて 耳に とどく。"],
    },
    familiar: null,
    sources: [{ kind: "data", title: "光と音の速さ", url: null, assumption: "光は秒速約30万km、音は秒速約340mとして考えた" }],
  },
];

let counter = 0;

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function mockQuestions(): Promise<QuestionsOutput> {
  await wait(2500);
  const set = counter++ % 2 === 0 ? SET_A : SET_B;
  return { recognition: { label: "デモよう の もの", canAsk: true }, questions: set };
}

export async function mockCustom(text: string): Promise<CustomOutput> {
  await wait(2000);
  if (text.trim().length < 3) {
    return {
      recognition: { label: "デモよう の もの", canAsk: true },
      answerable: false,
      reason: "もうすこし くわしく かいてみてね",
      question: null,
    };
  }
  const base = SET_A[0];
  return {
    recognition: { label: "デモよう の もの", canAsk: true },
    answerable: true,
    reason: null,
    question: {
      ...base,
      text,
      explanation: { ...base.explanation, short: "（デモ）本物の AI につながると、きみの問いに合わせた答えが 出るよ。" },
    },
  };
}
