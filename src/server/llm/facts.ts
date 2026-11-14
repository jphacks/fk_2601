import "server-only";

// たしかな数の「ひきだし」（#162）。AI が その場で数を思いつくと、つまらない数や こじつけの数になるので、
// 人が たしかめた「おどろく数」と その式を、ここに持たせる。AI には SYSTEM_PROMPT（prompts.ts）で渡す。
// 足しかた・たしかめかた・出どころの書きかたは docs/03-technical.md 5.3.3。
// すべての式が calc.ts の calculate で計算できるかは、評価スクリプト（npm run eval:questions）の はじめに確かめる。

export type FactVariable = { name: string; label: string; value: number; unit: string; min: number; max: number; step: number };

export type Fact = {
  /** プロンプトと、学年の しぼりこみ（minGrade）で使う目印。英小文字で始まる英数字 */
  id: string;
  /** あてはまる もの（ひらがな・カタカナ。写っているものが これらのどれかに あたるときに使う） */
  targets: string[];
  /** 何が おどろきか（子どもが ふつう 思っていることと、ちがう点） */
  secret: string;
  /** calc.ts で計算できる式。答えの単位は answerUnit */
  formula: string;
  /** 式で使う変数。label は ふりがな記法 {漢字|よみ} で書く。unit は ふりがななし */
  variables: FactVariable[];
  answerUnit: string;
  /** 何を もとにしたか（本・公的な資料の名前、または 式の導きかた）。出どころを たしかめられない数は入れない */
  source: string;
  /** 何年生から出してよいか */
  minGrade: number;
};

// 数と出どころは、人が たしかめたものだけを足す。いまあるのは、式から導ける（数学として正しい）わくぐみ用の例。
// 【未決】人が たしかめて 足す：信号（1日に 青になる回数）・えんぴつ（1本で書ける線の長さ。JIS で 50km とよく言われる）・
// 心ぞう（1日に うつ回数）・雨つぶ・かみなり（光と音の はやさ）・ピアノの けんばんなど。出どころを 見つけてから 入れる
export const FACTS: Fact[] = [
  {
    id: "bicycle",
    targets: ["じてんしゃ", "はぐるま", "ギア", "ペダル", "チェーン"],
    secret: "ペダルを 1回 こぐと、前の はぐるまの 歯の数 ÷ 後ろの はぐるまの 歯の数 だけ、タイヤが まわる。思ったより ずっと 遠くまで すすむ",
    formula: "front / rear * wheel",
    variables: [
      { name: "front", label: "{前|まえ}の はぐるまの {歯|は}の {数|かず}", value: 36, unit: "こ", min: 22, max: 52, step: 1 },
      { name: "rear", label: "{後|うし}ろの はぐるまの {歯|は}の {数|かず}", value: 16, unit: "こ", min: 11, max: 34, step: 1 },
      { name: "wheel", label: "タイヤの 1しゅうの {長|なが}さ", value: 2, unit: "m", min: 1, max: 2.2, step: 0.1 },
    ],
    answerUnit: "m",
    source: "歯車の 回る数は 歯の数に はんぴれいする（歯の数の 比）。1回 まわると、タイヤは 1しゅう（円周）ぶん すすむ。歯の数・タイヤの 長さは、ふつうの 自転車の 目安の 値",
    minGrade: 4,
  },
  {
    id: "clock",
    targets: ["とけい", "かけどけい", "うでどけい", "はり", "ながい はり"],
    secret: "長い はりの 先は、1日に 24しゅう する。ぜんぶ つなぐと、思ったより ずっと 長い きょりを うごいている",
    formula: "24 * 2 * pi * length / 100",
    variables: [{ name: "length", label: "{長|なが}い はりの {長|なが}さ", value: 10, unit: "cm", min: 3, max: 30, step: 1 }],
    answerUnit: "m",
    source: "長い はり（分しん）は 1時間で 1しゅう、1日は 24時間。1しゅうの 長さ ＝ 円周 ＝ はんけい × 2 × 3.14（円周率）。はりの 長さは 時計ごとに ちがうので 変数にする",
    minGrade: 5,
  },
  {
    id: "gacha",
    targets: ["ガチャ", "ガチャガチャ", "カプセル"],
    secret: "n しゅるいを ぜんぶ そろえるには、同じ ものが ダブる ぶん、n回よりも ずっと 多く まわす 必要がある（へいきんで n × (1 + 1/2 + … + 1/n) 回）",
    formula: "n * harmonic(n)",
    variables: [{ name: "n", label: "ぜんぶの しゅるいの {数|かず}", value: 10, unit: "しゅるい", min: 2, max: 50, step: 1 }],
    answerUnit: "回",
    source: "確率の 期待値（クーポン収集問題）。どの しゅるいも 同じ 出やすさ、と 考える。n番目の しゅるいを 引くまでの へいきんは n/(n-1) 回…と たしていって、n × (1 + 1/2 + … + 1/n)",
    minGrade: 4,
  },
  {
    id: "paper",
    targets: ["かみ", "コピーようし", "ノート", "しんぶん", "おりがみ"],
    secret: "紙を 1回 おると 厚さが 2倍。おるたびに 2倍 2倍と ふえて、思ったより ずっと 高く なる（もし おれたら）",
    formula: "0.0001 * 2^n / 1000",
    variables: [{ name: "n", label: "おる {回数|かいすう}", value: 30, unit: "回", min: 5, max: 42, step: 1 }],
    answerUnit: "km",
    source: "紙の 厚さを 0.1mm（コピー用紙の 目安）と する。1回 おると 厚さが 2倍になるので、n回で 2のn乗 倍（0.1mm = 0.0001m。÷1000 で km）。じっさいには そんなに 何回も おれないので「もし おれたら」と 聞く",
    minGrade: 4,
  },
  {
    id: "cards",
    targets: ["トランプ"],
    secret: "トランプ 52まいから 5まいを えらぶ えらびかたは、思ったより ずっと 多い",
    formula: "comb(52, pick)",
    variables: [{ name: "pick", label: "えらぶ {数|かず}", value: 5, unit: "まい", min: 2, max: 7, step: 1 }],
    answerUnit: "とおり",
    source: "場合の数（組み合わせ）。トランプは ジョーカーを のぞいて 52まい。52まいから k まいを えらぶ えらびかた ＝ 52 × 51 × … ÷ (k × (k-1) × … × 1)",
    minGrade: 4,
  },
  {
    id: "dice",
    targets: ["サイコロ", "さいころ"],
    secret: "サイコロを ふるたびに 出る目が 6とおり。何こも ふると、出かたの ならびは 6 × 6 × … と どんどん ふえて、思ったより ずっと 多い",
    formula: "6^n",
    variables: [{ name: "n", label: "ふる サイコロの {数|かず}", value: 6, unit: "こ", min: 2, max: 10, step: 1 }],
    answerUnit: "とおり",
    source: "場合の数（積の法則）。1こ ごとに 出る目は 6とおり。n こ ぜんぶの 出かたは 6 を n 回 かける。サイコロは 1〜6の 目が 同じ 出やすさ、と 考える",
    minGrade: 4,
  },
];

/** その学年で 出してよい ひきだし（minGrade 以上の学年のときだけ） */
export function factsForGrade(grade: number): Fact[] {
  return FACTS.filter((f) => f.minGrade <= grade);
}
