// 参加コード（#137）。8文字の英大文字と数字。見まちがえやすい 0・O・1・I・L は使わない（firestore.rules の joinCodes と同じ決まり）
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const JOIN_CODE_LENGTH = 8;
const PATTERN = new RegExp(`^[${ALPHABET}]{${JOIN_CODE_LENGTH}}$`);

/** 新しいコード（総当たりで当てられないよう、暗号用の乱数で作る） */
export function newJoinCode(): string {
  const bytes = new Uint8Array(JOIN_CODE_LENGTH);
  // 256 は 31 で割り切れないので、偏りが出る大きい値は使わずに引きなおす
  let code = "";
  while (code.length < JOIN_CODE_LENGTH) {
    crypto.getRandomValues(bytes);
    for (const b of bytes) if (b < 248 && code.length < JOIN_CODE_LENGTH) code += ALPHABET[b % ALPHABET.length];
  }
  return code;
}

/** 子どもが入れたコードを そろえる（全角・小文字・空白・ハイフンをゆるす）。形が合わなければ null */
export function normalizeJoinCode(input: string): string | null {
  const code = input.normalize("NFKC").toUpperCase().replace(/[\s\-ー－]/g, "");
  return PATTERN.test(code) ? code : null;
}

/** 読みやすいように 4文字ずつ区切る（ABCD-EFGH） */
export function formatJoinCode(code: string): string {
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}
