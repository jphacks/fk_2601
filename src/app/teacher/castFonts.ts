import type { CSSProperties } from "react";
import { Klee_One } from "next/font/google";

// 教室に映す画面の文字（docs/design/teachers/README.md「文字」）。映す画面があるページだけで読み込む
// モニター：Klee One 600
export const chalkFont = Klee_One({ weight: "600", display: "swap", preload: false, variable: "--font-t-chalk" });

// 黒板に投影：Zen Maru Gothic 900。子どもの画面のルートで読み込み済み（--nf-body）なので、同じものを使う（2回読み込まない）
export const CAST_FONT_STYLE = { "--font-t-cast": "var(--nf-body), var(--font-t-body), sans-serif" } as CSSProperties;
