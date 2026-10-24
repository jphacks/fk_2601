import { kanaOf, sanitizeRuby } from "@/lib/ruby";

/**
 * LLM が出した、ふりがな（ruby）つきの文章を安全に表示する。
 * kana のときは、漢字を読みに置きかえて、ひらがなで出す（22px より小さい文字：docs/design/README.md「文字」）
 */
export function RubyText({ text, className, kana = false }: { text: string; className?: string; kana?: boolean }) {
  if (kana) return <span className={className}>{kanaOf(text)}</span>;
  return <span className={className} dangerouslySetInnerHTML={{ __html: sanitizeRuby(text) }} />;
}
