import { z } from "zod";

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
  archiveCount: z.number().int().min(0).max(100_000),
  /** 出題済みの対象×単元 */
  asked: z.array(Asked).max(200),
});

export const CustomRequestSchema = QuestionsRequestSchema.extend({
  text: z.string().trim().min(1).max(100),
});

export type QuestionsRequest = z.infer<typeof QuestionsRequestSchema>;
export type CustomRequest = z.infer<typeof CustomRequestSchema>;
