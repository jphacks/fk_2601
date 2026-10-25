import { z } from "zod";

export const SubjectSchema = z.enum(["math", "science", "info"]);

export const VariableSchema = z.object({
  name: z.string().describe("式で使う名前。英小文字で始まる英数字（例: length）"),
  label: z.string().describe("画面に出す名前（漢字には {漢字|よみ} の形でふりがなをつける）"),
  value: z.number(),
  unit: z.string(),
  min: z.number().describe("スライダーの最小値"),
  max: z.number().describe("スライダーの最大値"),
  step: z.number().describe("スライダーの刻み"),
});

export const SourceSchema = z.object({
  kind: z.enum(["data", "book", "site"]),
  title: z.string(),
  url: z.string().nullable().describe("確実に実在する URL だけ。分からなければ null"),
  assumption: z.string().describe("何を もとに 考えたか（「おふろは 200L と する」など）。子どもが読むので、やさしいことばで書く（「前提」「仮定」「根拠」などの むずかしいことばは使わない）"),
});

export const QuestionSchema = z.object({
  // text より先に書かせる（先に「そのもののふしぎ」を決めてから、問題文を作らせるため）
  secret: z.string().describe("ねらった「写っているもの自身のふしぎ・ひみつ」を、ひとことで（例: マンホールのふたが まるいわけ）。表示には使わない"),
  swappable: z
    .boolean()
    .describe("問題文の中のものの名前を、べつのものに入れかえても問いが成り立つなら true（true の問いは使われない）。表示には使わない"),
  text: z.string().describe("問題文。みじかい1〜2文で、細かい条件や専門の数をならべない。答えの数やヒントを書かない。漢字には {漢字|よみ} の形でふりがなをつける"),
  type: z.enum(["estimate", "compare", "why"]),
  subject: SubjectSchema,
  topic: z.string().describe("単元（例: 場合の数・時間・光）。ふりがな記法は使わない"),
  target: z.string().describe("写真の対象（例: ガチャガチャ）。ふりがな記法は使わない"),
  hint: z.string().describe("問いの見かた・どう考えるかの決まりを、やさしいことばで1文で（「〜と する」など。答えのヒントは書かない）。なければ空文字"),
  formula: z
    .string()
    .nullable()
    .describe("math.js で計算できる式。estimate は答え、compare は A÷B の値。why は null"),
  variables: z.array(VariableSchema),
  answerUnit: z.string().describe("答えの単位。compare は「倍」"),
  llmAnswer: z.number().nullable().describe("あなたが考えた答え（検算用。表示には使わない）"),
  guessRange: z
    .object({ min: z.number(), max: z.number() })
    .nullable()
    .describe("estimate の予想の範囲。正解を中ほどに含み、max は min の100倍以内"),
  compare: z
    .object({ a: z.string(), b: z.string() })
    .nullable()
    .describe("compare のときだけ。比べる2つの名前（A と B）"),
  choices: z
    .array(z.object({ text: z.string(), correct: z.boolean() }))
    .nullable()
    .describe("why のときだけ。理由・結果・どっち、の選択肢を2〜3つ、正解は1つ"),
  explanation: z.object({
    short: z.string().describe("まず見せる一言"),
    steps: z.array(z.string()).describe("タップで見る計算過程のステップ"),
  }),
  ref: z
    .object({
      type: z.enum(["per", "times"]),
      label: z.string().describe("身近なものの言いかえ。数の手前までの文（例: 1日に 1000ばいずつ くむと）"),
      value: z.number().describe("per：1つぶんの大きさ（answerUnit）。times：答えにかける数"),
      unit: z.string().describe("数のあとに付ける単位（例: 日、円）"),
    })
    .nullable()
    .describe(
      "estimate のとき、答えを身近なものにおきかえる。per は「label 答え÷value unit ぶん」、times は「label 答え×value unit」と表示する。うまく作れなければ null",
    ),
  whatIf: z.string().describe("条件を変えたくなる問いかけ（例: じゃあ、40しゅるいだったら？）。なければ空文字"),
  related: z.array(z.string()).describe("同じ考えかたが使える、べつの身近なものの問い（0〜2つ）"),
  keyword: z.string().describe("もっとしらべるときのことば。なければ空文字"),
  sources: z.array(SourceSchema),
});

export const RecognitionSchema = z.object({
  label: z.string().describe("「これは○○だね？」に使う名前（ひらがなかカタカナ。ふりがな記法は使わない）"),
  canAsk: z.boolean().describe("この写真から問いが作れるか"),
});

export const QuestionsOutputSchema = z.object({
  recognition: RecognitionSchema,
  questions: z.array(QuestionSchema),
});

export const CustomOutputSchema = z.object({
  recognition: RecognitionSchema,
  answerable: z.boolean().describe("子どもが書いた問いに、式で答えられるか"),
  reason: z.string().nullable().describe("答えられないときの理由（子ども向け）"),
  question: QuestionSchema.nullable(),
});

export type Subject = z.infer<typeof SubjectSchema>;
export type Variable = z.infer<typeof VariableSchema>;
export type Source = z.infer<typeof SourceSchema>;
export type Question = z.infer<typeof QuestionSchema>;
export type Recognition = z.infer<typeof RecognitionSchema>;
export type QuestionsOutput = z.infer<typeof QuestionsOutputSchema>;
export type CustomOutput = z.infer<typeof CustomOutputSchema>;
