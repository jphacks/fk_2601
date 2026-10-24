import "server-only";
import type { Question } from "./schema";

// 見本の問い（AI を使わない）。開発用のモックと、AI がつながらないときの「見本の絵」で使う。
// 「直感がはずれやすい」問いの作りかたの手本にもなる（docs/03-technical.md 5.3）

export const SCENES = ["gacha", "signal", "ice"] as const;
export type Scene = (typeof SCENES)[number];

type Entry = { label: string; questions: Question[] };

// 読みやすさのため、学年つきの記法 {漢字|よみ|学年} で書いて、学年の部分をとってから使う
const g = (s: string) => s.replace(/\{([^{}|]+)\|([^{}|]+)\|\d\}/g, "{$1|$2}");

type Draft = Omit<Question, "sources" | "compare" | "choices" | "guessRange" | "llmAnswer" | "formula" | "variables" | "answerUnit" | "ref"> & {
  answerUnit?: string;
  formula?: string;
  variables?: Question["variables"];
  llmAnswer?: number;
  guessRange?: { min: number; max: number };
  choices?: { text: string; correct: boolean }[];
  ref?: Question["ref"];
  source: string;
  assume: string;
};

function build(d: Draft): Question {
  const { source, assume, ...rest } = d;
  return {
    ...rest,
    text: g(d.text),
    topic: g(d.topic),
    target: g(d.target),
    hint: g(d.hint),
    whatIf: g(d.whatIf),
    related: d.related.map(g),
    keyword: g(d.keyword),
    explanation: { short: g(d.explanation.short), steps: d.explanation.steps.map(g) },
    answerUnit: d.answerUnit ?? "",
    formula: d.formula ?? null,
    variables: (d.variables ?? []).map((v) => ({ ...v, label: g(v.label) })),
    llmAnswer: d.llmAnswer ?? null,
    guessRange: d.guessRange ?? null,
    compare: null,
    choices: d.choices?.map((c) => ({ ...c, text: g(c.text) })) ?? null,
    ref: d.ref ? { ...d.ref, label: g(d.ref.label), unit: g(d.ref.unit) } : null,
    sources: [{ kind: "data", title: g(source), url: null, assumption: g(assume) }],
  };
}

const BUILTIN: Record<Scene, Entry> = {
  gacha: {
    label: "ガチャガチャ",
    questions: [
      build({
        text: "この ガチャガチャには おもちゃが 10しゅるい。ぜんぶ そろえるには、へいきんで {何|なん|2}かい まわせば いい？",
        type: "estimate",
        subject: "math",
        topic: "へいきん",
        target: "ガチャガチャ",
        hint: "おなじ おもちゃが なんども {出|で|1}る ことも あるよ。",
        formula: "n*harmonic(n)",
        variables: [{ name: "n", label: "おもちゃの しゅるい", value: 10, unit: "しゅるい", min: 2, max: 40, step: 1 }],
        answerUnit: "かい",
        llmAnswer: 29.3,
        // 予想の範囲の まんなか（スライダーのはじめの位置・5つの範囲の まんなか）が、答えにならないようにする
        guessRange: { min: 10, max: 1000 },
        explanation: {
          short: "さいごの 1しゅるいが、なかなか {出|で|1}て こないんだ！",
          steps: [
            "さいしょの 1こは、なにが {出|で|1}ても あたらしい。だから 1かいで OK。",
            "のこりが 9しゅるいの ときは、10かいに 9かい あたらしいのが {出|で|1}る。へいきん 10÷9＝{約|やく|4}1.1かい。",
            "のこりが 1しゅるいに なると、10かいに 1かいしか {出|で|1}ない。へいきん 10かいも かかる！",
            "ぜんぶ たすと 10÷10＋10÷9＋…＋10÷1＝{約|やく|4}29かい。",
          ],
        },
        ref: { type: "times", label: "1かい 300えんだと", value: 300, unit: "えん" },
        whatIf: "じゃあ、40しゅるい だったら？",
        related: ["おかしの おまけシール、ぜんぶ あつめるには {何|なん|2}こ かう？"],
        keyword: "クーポン コレクター もんだい",
        source: "クーポン コレクター{問題|もんだい|3}（{数学|すうがく|2}で よく {知|し|2}られている {問題|もんだい|3}）",
        assume: "どの おもちゃも おなじくらい {出|で|1}やすい／おなじ おもちゃが なんども {出|で|1}る ことが ある",
      }),
      build({
        text: "カプセルの {色|いろ|2}は {赤|あか|1}・{青|あお|1}・{黄|き|2}の 3しょく。3かい まわした ときの {色|いろ|2}の {出|で|1}かた（じゅんばん）は、ぜんぶで {何|なん|2}とおり？",
        type: "estimate",
        subject: "math",
        topic: "{場合|ばあい|2}の{数|かず|2}",
        target: "カプセル",
        hint: "「{赤|あか|1}→{青|あお|1}→{赤|あか|1}」と「{青|あお|1}→{赤|あか|1}→{赤|あか|1}」は、ちがう {出|で|1}かたとして かぞえてね。",
        formula: "c^k",
        variables: [
          { name: "c", label: "{色|いろ|2}の {数|かず|2}", value: 3, unit: "しょく", min: 2, max: 8, step: 1 },
          { name: "k", label: "まわす {回数|かいすう|2}", value: 3, unit: "かい", min: 1, max: 8, step: 1 },
        ],
        answerUnit: "とおり",
        llmAnswer: 27,
        guessRange: { min: 10, max: 1000 },
        explanation: {
          short: "1かい ふえる ごとに、3ばいずつ ふえていくよ。",
          steps: ["1かい{目|め|1}の {色|いろ|2}は 3とおり。", "2かい{目|め|1}も、それぞれに 3とおり ずつ。3×3＝9とおり。", "3かい{目|め|1}も おなじ。9×3＝27とおり！"],
        },
        whatIf: "じゃあ、8かい まわしたら？",
        related: ["じゃんけんを 3{人|にん|1}で したら、{手|て|1}の {出|だ|1}しかたは {何|なん|2}とおり？"],
        keyword: "{場合|ばあい|2}の {数|かず|2}",
        source: "{場合|ばあい|2}の {数|かず|2}（かけ{算|ざん|2}の きまり）",
        assume: "どの {色|いろ|2}も {出|で|1}る ことが ある",
      }),
      build({
        text: "ガチャガチャの カプセルは、どうして まるいの？",
        type: "why",
        subject: "science",
        topic: "ものの かたち",
        target: "カプセル",
        hint: "もし しかくい カプセルだったら、どうなるかな？",
        choices: [
          { text: "どこを {下|した|1}に しても ころがって、きかいの {中|なか|1}で ひっかからないから", correct: true },
          { text: "まるい ほうが かるく なるから", correct: false },
          { text: "まるい ほうが かわいいと きまっているから", correct: false },
        ],
        explanation: {
          short: "まるは、ころがる かたちの チャンピオン！",
          steps: ["まるい カプセルは、どの むきでも おなじように ころがる。", "かどが ないので、きかいの {中|なか|1}や {出|で|1}{口|ぐち|1}で ひっかかりにくい。", "それに まるい かたちは、おされても こわれにくいんだ。"],
        },
        whatIf: "",
        related: ["マンホールの ふたは、どうして まるい？"],
        keyword: "きゅう（ボールの かたち）",
        source: "ものの かたちと ころがりかた",
        assume: "—",
      }),
    ],
  },
  signal: {
    label: "しんごう",
    questions: [
      build({
        text: "この {信号|しんごう|4}は、{青|あお|1}→{黄|き|2}→{赤|あか|1}を 90びょうで 1まわり するよ。1{日|にち|1}で {青|あお|1}に かわるのは {何|なん|2}かい？",
        type: "estimate",
        subject: "info",
        topic: "きかいの しくみ",
        target: "しんごう",
        hint: "{夜|よる|2}の あいだも ずっと うごいていると して かんがえてね。",
        formula: "24*60*60/s",
        variables: [{ name: "s", label: "1まわりの {時間|じかん|2}", value: 90, unit: "びょう", min: 30, max: 240, step: 10 }],
        answerUnit: "かい",
        llmAnswer: 960,
        guessRange: { min: 30, max: 3000 },
        explanation: {
          short: "{信号|しんごう|4}は {休|やす|1}まずに はたらいているんだね！",
          steps: ["1{日|にち|1}は 24{時間|じかん|2}。1{時間|じかん|2}は 60ぷん、1ぷんは 60びょう。", "だから 1{日|にち|1}は 24×60×60＝86400びょう。", "90びょうで 1まわり だから、86400÷90＝960かい！"],
        },
        ref: { type: "times", label: "1{年|ねん|1}（365{日|にち|1}）だと", value: 365, unit: "かい" },
        whatIf: "じゃあ、1まわりが 60びょう だったら？",
        related: ["ふみきりは 1{日|にち|1}に {何|なん|2}かい しまる？"],
        keyword: "{信号|しんごう|4}の サイクル",
        source: "{時間|じかん|2}の たんいの かんけい（1{日|にち|1}＝86400びょう）",
        assume: "1{日|にち|1}じゅう おなじ はやさで かわる（ほんとうは {時間|じかん|2}で かわる {信号|しんごう|4}も ある）",
      }),
      build({
        text: "{信号|しんごう|4}の ランプは 3こ。1こ 1こが「つく」か「きえる」の 2とおり だと、ランプの ひかりかたは ぜんぶで {何|なん|2}とおり？",
        type: "estimate",
        subject: "info",
        topic: "2しんほう",
        target: "しんごう",
        hint: "ぜんぶ きえている ときも、1とおりと かぞえてね。",
        formula: "2^n",
        variables: [{ name: "n", label: "ランプの {数|かず|2}", value: 3, unit: "こ", min: 1, max: 12, step: 1 }],
        answerUnit: "とおり",
        llmAnswer: 8,
        guessRange: { min: 3, max: 300 },
        explanation: {
          short: "ランプが 1こ ふえると、とおりの {数|かず|2}は 2ばいに なるよ。",
          steps: ["1こ{目|め|1}：つく・きえる の 2とおり。", "2こ{目|め|1}も 2とおり。2×2＝4とおり。", "3こ{目|め|1}も 2とおり。4×2＝8とおり。", "コンピューターも「つく・きえる」の くみあわせで、いろいろな ことを あらわして いるんだ。"],
        },
        whatIf: "じゃあ、ランプが 10こ だったら？",
        related: ["QRコードの {白|しろ|1}と {黒|くろ|2}の ならべかたは {何|なん|2}とおり？"],
        keyword: "2しんほう",
        source: "2しんほう（コンピューターの {数|かず|2}の あらわしかた）",
        assume: "ランプは「つく」か「きえる」の 2つだけ",
      }),
      build({
        text: "「とまれ」の {信号|しんごう|4}は、どうして {赤|あか|1}なの？",
        type: "why",
        subject: "science",
        topic: "{光|ひかり|2}",
        target: "しんごう",
        hint: "{遠|とお|2}くから {見|み|1}る ときの ことを かんがえてみよう。",
        choices: [
          { text: "{赤|あか|1}い {光|ひかり|2}は {遠|とお|2}くまで とどきやすく、{目|め|1}だつから", correct: true },
          { text: "{赤|あか|1}い ランプが いちばん やすいから", correct: false },
          { text: "{赤|あか|1}は {夜|よる|2}に {見|み|1}えなく なる {色|いろ|2}だから", correct: false },
        ],
        explanation: {
          short: "{赤|あか|1}は、きりの {日|ひ|1}でも とどきやすい {色|いろ|2}なんだ。",
          steps: ["{光|ひかり|2}には、{空気|くうき|1}の {中|なか|1}で ちらばりやすい {色|いろ|2}と、ちらばりにくい {色|いろ|2}が ある。", "{赤|あか|1}は ちらばりにくく、きりや {雨|あめ|1}の {日|ひ|1}でも {遠|とお|2}くから {見|み|1}えやすい。", "それに {赤|あか|1}は「あぶない」と かんじやすい {色|いろ|2}。だから いちばん だいじな「とまれ」に つかわれて いるよ。"],
        },
        whatIf: "",
        related: ["{夕|ゆう|1}やけは、どうして {赤|あか|1}い？"],
        keyword: "{光|ひかり|2}の さんらん",
        source: "{光|ひかり|2}の せいしつ（{色|いろ|2}による ちらばりかたの ちがい）",
        assume: "—",
      }),
    ],
  },
  ice: {
    label: "こおりの コップ",
    questions: [
      build({
        text: "コップの {氷|こおり|3}が ぜんぶ とけたら、{水|みず|1}の {高|たか|2}さは どうなる？",
        type: "why",
        subject: "science",
        topic: "{水|みず|1}の すがた",
        target: "こおりの コップ",
        hint: "{氷|こおり|3}は {水|みず|1}に うかんでいるね。",
        choices: [
          { text: "あがる（あふれそう）", correct: false },
          { text: "さがる", correct: false },
          { text: "かわらない", correct: true },
        ],
        explanation: {
          short: "{氷|こおり|3}は とける まえから、じぶんの おもさ ぶんの {水|みず|1}を おしのけて いたんだ。",
          steps: ["{水|みず|1}に うかぶ ものは、じぶんと おなじ おもさの {水|みず|1}を おしのけて いる。", "{氷|こおり|3}が とけると、ちょうど その おしのけて いた ぶんの {水|みず|1}に なる。", "だから {水|みず|1}の {高|たか|2}さは かわらない！"],
        },
        whatIf: "",
        related: ["うみに うかぶ {氷|こおり|3}が とけたら、うみの {水|みず|1}は ふえる？"],
        keyword: "アルキメデスの げんり",
        source: "アルキメデスの げんり（うく {力|ちから|1}）",
        assume: "{氷|こおり|3}は うかんでいて、コップの そこに ついていない",
      }),
      build({
        text: "この コップ（200mL）で {水|みず|1}を くんで、{学校|がっこう|1}の 25mプールを いっぱいに するには、{何|なん|2}ばい くめば いい？",
        type: "estimate",
        subject: "math",
        topic: "かさ",
        target: "コップ",
        hint: "プールは たて 25m、よこ 12m、ふかさ 1.2m くらい だよ。",
        formula: "p*1000/v",
        variables: [
          { name: "v", label: "コップ 1ぱいの かさ", value: 200, unit: "mL", min: 50, max: 2000, step: 50 },
          { name: "p", label: "プールの {水|みず|1}の かさ", value: 360000, unit: "L", min: 100000, max: 1000000, step: 10000 },
        ],
        answerUnit: "ばい",
        llmAnswer: 1800000,
        guessRange: { min: 300000, max: 30000000 },
        explanation: {
          short: "1{日|にち|1}に 1000ばい くんでも、5{年|ねん|1}くらい かかるよ！",
          steps: ["プールの {水|みず|1}は 25×12×1.2＝360（{立方|りっぽう|4}メートル）。これは 360000L。", "1Lは 1000mL。だから 360000Lは 3{億|おく|4}6000{万|まん|2}mL。", "200mL ずつ くむと、360000000÷200＝1800000。180{万|まん|2}ばい！"],
        },
        ref: { type: "per", label: "1{日|にち|1}に 1000ばい ずつ くむと", value: 1000, unit: "{日|にち|1}" },
        whatIf: "じゃあ、バケツ（2000mL）で くんだら？",
        related: ["おふろの {水|みず|1}は、コップ {何|なん|2}ばいぶん？"],
        keyword: "かさの たんい（mL・L）",
        source: "{学校|がっこう|1}の 25mプールの よくある {大|おお|1}きさ",
        assume: "プールの {大|おお|1}きさは 25m×12m×1.2m／コップには いつも 200mL ちょうど {入|はい|1}る",
      }),
      build({
        text: "つめたい コップの そとがわに、{水|みず|1}てきが つくのは どうして？",
        type: "why",
        subject: "science",
        topic: "{水|みず|1}の すがた",
        target: "コップ",
        hint: "コップに あなは あいて いないよ。",
        choices: [
          { text: "{空気|くうき|1}の {中|なか|1}の {見|み|1}えない {水|みず|1}が、ひやされて {水|みず|1}に もどったから", correct: true },
          { text: "コップの {中|なか|1}の {水|みず|1}が、しみ{出|だ|1}したから", correct: false },
          { text: "{氷|こおり|3}が あせを かいて いるから", correct: false },
        ],
        explanation: {
          short: "{水|みず|1}は {空気|くうき|1}の {中|なか|1}から やってきたんだ！",
          steps: ["{空気|くうき|1}の {中|なか|1}には、{目|め|1}に {見|み|1}えない {水|みず|1}（{水|すい|1}じょうき）が まじっている。", "つめたい コップに ふれた {空気|くうき|1}が ひやされると、{水|すい|1}じょうきが {水|みず|1}の つぶに もどる。", "だから コップの そとがわに {水|みず|1}てきが つく。{中|なか|1}の {水|みず|1}が もれたのでは ないよ。"],
        },
        whatIf: "",
        related: ["{冬|ふゆ|2}に まどが くもるのは、どうして？"],
        keyword: "けつろ",
        source: "{水|すい|1}じょうきと けつろ",
        assume: "—",
      }),
    ],
  },
};

export function builtinQuestions(scene?: Scene): { label: string; questions: Question[] } {
  const key = scene ?? SCENES[Math.floor(Math.random() * SCENES.length)];
  return { label: BUILTIN[key].label, questions: BUILTIN[key].questions };
}
