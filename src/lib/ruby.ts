/**
 * LLM が出した文章を、画面に出せる HTML にする。
 * すべての記号を文字として扱い、<ruby>・<rt>・<rp> のタグだけをもとに戻す（それ以外のタグは文字のまま見える）
 */
export function sanitizeRuby(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
  return escaped.replace(/&lt;(\/?)(ruby|rt|rp)&gt;/gi, (_, slash: string, tag: string) => `<${slash}${tag.toLowerCase()}>`);
}

/** ふりがなを取り除いた文字（アクセシビリティや文字数の確認用） */
export function stripRuby(text: string): string {
  return text.replace(/<rt>.*?<\/rt>/gis, "").replace(/<\/?(ruby|rt|rp)>/gi, "");
}
