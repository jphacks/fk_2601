/** LLM の出力のふりがな記法：{漢字|よみ}（出力が短くなる）。以前の <ruby> タグも読める */
// うしろに学年がついた書きかた（{漢字|よみ|3}）がまざっても、学年の部分は読みとばす
const MARKUP = /\{([^{}|]+)\|([^{}|]+)(?:\|\d+)?\}/g;
const HAS_MARKUP = /\{[^{}|]+\|[^{}|]+(?:\|\d+)?\}/;
const HAN = /\p{Script=Han}/u;

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
    .replace(MARKUP, (_, base: string, yomi: string) =>
      // 漢字のない部分（数字・ひらがななど）や、同じ読みのものには、ふりがなをつけない（AI がつけてしまうことがある）
      HAN.test(base) && base !== yomi ? `<ruby>${base}<rt>${yomi}</rt></ruby>` : base,
    );
}

/**
 * 漢字を、ふりがなの読みに置きかえた文字（22px より小さい文字は、ひらがなで書く：docs/design/README.md「文字」）。
 * ふりがなの付いていない漢字は、そのまま残る。HTML ではなく、ふつうの文字として表示する
 */
export function kanaOf(text: string): string {
  return text
    .replace(/<ruby>(.*?)(?:<rp>.*?<\/rp>)?<rt>(.*?)<\/rt>(?:<rp>.*?<\/rp>)?<\/ruby>/gis, (_, _base: string, yomi: string) => yomi)
    .replace(/<\/?(ruby|rt|rp)>/gi, "")
    .replace(MARKUP, (_, base: string, yomi: string) => (HAN.test(base) ? yomi : base));
}

// 答えの単位によく出る漢字の読み（AI は単位にふりがなを付けないため、ここで付ける）。長いものから順に当てる
const UNIT_READING: [string, string][] = [
  ["時間", "じかん"],
  ["種類", "しゅるい"],
  ["通り", "とおり"],
  ["回", "かい"],
  ["個", "こ"],
  ["倍", "ばい"],
  ["枚", "まい"],
  ["本", "ほん"],
  ["人", "にん"],
  ["日", "にち"],
  ["年", "ねん"],
  ["秒", "びょう"],
  ["円", "えん"],
  ["杯", "はい"],
  ["冊", "さつ"],
  ["台", "だい"],
  ["匹", "ひき"],
  ["頭", "とう"],
  ["羽", "わ"],
  ["歩", "ほ"],
  ["週", "しゅう"],
  ["周", "しゅう"],
  ["粒", "つぶ"],
  ["箱", "はこ"],
  ["袋", "ふくろ"],
  ["階", "かい"],
  ["度", "ど"],
  ["色", "しょく"],
  ["千", "せん"],
  ["万", "まん"],
  ["億", "おく"],
  ["兆", "ちょう"],
];

/** 単位を、ふりがなの記法にする（「回」→「{回|かい}」、「日分」→「{日|にち}{分|ぶん}」）。知らない漢字はそのまま */
export function unitRuby(unit: string): string {
  if (HAS_MARKUP.test(unit)) return unit;
  let out = "";
  let i = 0;
  while (i < unit.length) {
    // 「分」は、単位のはじめや数字のあとなら「ふん」（10分）、ほかの字のあとなら「ぶん」（3日分）
    if (unit[i] === "分") {
      out += i === 0 || /[0-9０-９]/.test(unit[i - 1]) ? "{分|ふん}" : "{分|ぶん}";
      i += 1;
      continue;
    }
    const hit = UNIT_READING.find(([kanji]) => unit.startsWith(kanji, i));
    if (hit) {
      out += `{${hit[0]}|${hit[1]}}`;
      i += hit[0].length;
    } else {
      out += unit[i];
      i += 1;
    }
  }
  return out;
}

/** 単位を、ひらがなにする（小さい文字のとき） */
export function unitKana(unit: string): string {
  return kanaOf(unitRuby(unit));
}

/** ふりがなを取り除いた文字（見出し・画像の説明・グループ分けなど、ふりがなを出せない所に使う） */
export function stripRuby(text: string): string {
  return text
    .replace(/<rt>.*?<\/rt>/gis, "")
    .replace(/<\/?(ruby|rt|rp)>/gi, "")
    .replace(MARKUP, (_, base: string) => base);
}
