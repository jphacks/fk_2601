"use client";

import { plainOf, sanitizeRuby } from "@/lib/ruby";
import { useGrade } from "./AuthProvider";

/**
 * ふりがなの記法（{漢字|よみ}）で書いた文章を、学年に合わせて安全に表示する（LLM の文・画面の文言 どちらも）。
 * kana のとき（22px より小さい文字）は、ふりがなを付けず、習った漢字は漢字のまま、習っていない漢字は ひらがなで出す。
 * そうでないとき（22px 以上）は、習った漢字に ふりがなを付け、習っていない漢字は ひらがなで出す（docs/design/README.md「文字」・docs/02-spec.md 2.1）
 */
export function RubyText({ text, className, kana = false }: { text: string; className?: string; kana?: boolean }) {
  const grade = useGrade();
  if (kana) return <span className={className}>{plainOf(text, grade)}</span>;
  return <span className={className} dangerouslySetInnerHTML={{ __html: sanitizeRuby(text, grade) }} />;
}

/**
 * 画面の文言。ふりがなの記法（{漢字|よみ}）で書き、学年に合わせて出す。big は 22px 以上の文字（ふりがなつき）
 * 例：<Jp>{"{今日|きょう}の おだい"}</Jp>、<Jp big>{"はてなを {見|み}つけよう"}</Jp>
 */
export function Jp({ children, big = false, className }: { children: string; big?: boolean; className?: string }) {
  return <RubyText text={children} kana={!big} className={className} />;
}

/** 文字だけが ほしいとき（placeholder・ボタンの中の文字の組み立て など）に使う。22px より小さい文字の出しかた */
export function useJp(): (text: string) => string {
  const grade = useGrade();
  return (text: string) => plainOf(text, grade);
}
