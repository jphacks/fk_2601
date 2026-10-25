import { kanaOf, sanitizeRuby } from "@/lib/ruby";
import { useGrade } from "./AuthProvider";

/**
 * LLM が出した、ふりがな（ruby）つきの文章を安全に表示する。
 * kana のときは、漢字を読みに置きかえて、ひらがなで出す（22px より小さい文字：docs/design/README.md「文字」）。
 * そうでないときも、いまの学年で まだ習っていない漢字は、ひらがなで出す（docs/02-spec.md 2.1）
 */
export function RubyText({ text, className, kana = false }: { text: string; className?: string; kana?: boolean }) {
  const grade = useGrade();
  if (kana) return <span className={className}>{kanaOf(text)}</span>;
  return <span className={className} dangerouslySetInnerHTML={{ __html: sanitizeRuby(text, grade) }} />;
}
