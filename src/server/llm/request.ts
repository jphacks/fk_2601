import { z } from "zod";
import { SCENES } from "./builtin";

// 画像は base64（長辺 1024px の JPEG）。Vercel のリクエストは 4.5MB までなので余裕を持たせる
const MAX_IMAGE_CHARS = 1_500_000;

const Asked = z.object({ target: z.string().max(60), topic: z.string().max(60) });

export const QuestionsRequestSchema = z.object({
  image: z
    .string()
    .max(MAX_IMAGE_CHARS)
    .regex(/^[A-Za-z0-9+/]+=*$/, "画像の形式が正しくありません"),
  grade: z.number().int().min(1).max(6),
  /** 学習の進み具合（1〜5） */
  level: z.number().int().min(1).max(5),
  /** 教科ごとのレベル（1〜5）。前の版のアプリは送らないので、なくてもよい */
  subjectLevels: z
    .object({ math: z.number().int().min(1).max(5), science: z.number().int().min(1).max(5), info: z.number().int().min(1).max(5) })
    .optional(),
  archiveCount: z.number().int().min(0).max(100_000),
  /** 出題済みの対象×単元 */
  asked: z.array(Asked).max(200),
  /** さいきん「おもしろい！」と言った問いの単元（新しい順）。前の版のアプリは送らないので、なくてもよい */
  liked: z.array(z.string().max(60)).max(10).optional(),
  /** さいきん10問のうち、「むずかしい」と言った数。前の版のアプリは送らないので、なくてもよい */
  hardCount: z.number().int().min(0).max(10).optional(),
  /** 見本の絵を使っているとき、その名前（開発用のモックや、AI が使えないときの見本の問いに使う） */
  scene: z.enum(SCENES).optional(),
  /** true のとき、AI を呼ばずに見本の問いを返す（見本の絵のときだけ） */
  fallback: z.boolean().optional(),
});

export const CustomRequestSchema = QuestionsRequestSchema.extend({
  text: z.string().trim().min(1).max(100),
});

export type QuestionsRequest = z.infer<typeof QuestionsRequestSchema>;
export type CustomRequest = z.infer<typeof CustomRequestSchema>;

// 2回目（子どもが選んだ1問の解説づくり）に送る、問いの中身。画像は送らない。長さと個数は、サーバーで制限する
const DetailVariable = z.object({
  name: z.string().regex(/^[a-z][A-Za-z0-9_]*$/).max(40),
  label: z.string().max(60),
  value: z.number().finite(),
  unit: z.string().max(20),
});
const DetailQuestion = z.object({
  text: z.string().min(1).max(400),
  type: z.enum(["estimate", "compare", "why"]),
  subject: z.enum(["math", "science", "info"]),
  topic: z.string().max(60),
  target: z.string().max(60),
  hint: z.string().max(120),
  formula: z.string().max(200).nullable(),
  variables: z.array(DetailVariable).max(4),
  answerUnit: z.string().max(20),
  compare: z.object({ a: z.string().max(60), b: z.string().max(60) }).nullable(),
  choices: z.array(z.object({ text: z.string().max(200), correct: z.boolean() })).max(4).nullable(),
});

export const DetailRequestSchema = z.object({
  grade: z.number().int().min(1).max(6),
  level: z.number().int().min(1).max(5),
  subjectLevels: QuestionsRequestSchema.shape.subjectLevels,
  question: DetailQuestion,
});

export type DetailRequest = z.infer<typeof DetailRequestSchema>;
