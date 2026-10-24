import { sanitizeRuby } from "@/lib/ruby";

/** LLM が出した、ふりがな（ruby）つきの文章を安全に表示する */
export function RubyText({ text, className }: { text: string; className?: string }) {
  return <span className={className} dangerouslySetInnerHTML={{ __html: sanitizeRuby(text) }} />;
}
