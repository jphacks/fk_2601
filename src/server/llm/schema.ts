import { z } from "zod";

export const SubjectSchema = z.enum(["math", "science", "info"]);

export const VariableSchema = z.object({
  name: z.string().describe("式で使う名前。英小文字で始まる英数字（例: length）"),
  label: z.string().describe("画面に出す名前（漢字にはふりがなの ruby タグを付ける）"),
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
  assumption: z.string().describe("前提条件・根拠の説明"),
});

export const QuestionSchema = z.object({
  text: z.string().describe("問題文（漢字にはふりがなの ruby タグを付ける）"),
  type: z.enum(["estimate", "compare", "why"]),
  subject: SubjectSchema,
  topic: z.string().describe("単元（例: 面積・速さ・割合）"),
  target: z.string().describe("写真の対象（例: 校庭のタイル）"),
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
    .describe("why のときだけ。理由の文章を3つ、正解は1つ"),
  explanation: z.object({
    short: z.string().describe("まず見せる一言"),
    steps: z.array(z.string()).describe("タップで見る計算過程のステップ"),
  }),
  familiar: z
    .object({
      name: z.string().describe("身近なものの単位（例: 25mプール1ぱい）"),
      amount: z.number().describe("answerUnit での大きさ"),
    })
    .nullable()
    .describe("estimate のとき、答えを身近なものに置き換える基準。なければ null"),
  sources: z.array(SourceSchema),
});

export const RecognitionSchema = z.object({
  label: z.string().describe("「これは○○だね？」に使う名前（ひらがな多め）"),
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
