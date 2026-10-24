/** LLM の出力のふりがな記法：{漢字|よみ}（出力が短くなる）。以前の <ruby> タグも読める */
const MARKUP = /\{([^{}|]+)\|([^{}|]+)\}/g;

/**
 * LLM が出した文章を、画面に出せる HTML にする。
 * すべての記号を文字として扱い、ふりがなの記法（{漢字|よみ}）と <ruby>・<rt>・<rp> のタグだけを、ふりがなに変える
 * （それ以外のタグは文字のまま見える）
 */
export function sanitizeRuby(text: string): string {
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
  return escaped
    .replace(/&lt;(\/?)(ruby|rt|rp)&gt;/gi, (_, slash: string, tag: string) => `<${slash}${tag.toLowerCase()}>`)
    .replace(MARKUP, (_, base: string, yomi: string) => `<ruby>${base}<rt>${yomi}</rt></ruby>`);
}

/** ふりがなを取り除いた文字（見出し・画像の説明・グループ分けなど、ふりがなを出せない所に使う） */
export function stripRuby(text: string): string {
  return text
    .replace(/<rt>.*?<\/rt>/gis, "")
    .replace(/<\/?(ruby|rt|rp)>/gi, "")
    .replace(MARKUP, (_, base: string) => base);
}
