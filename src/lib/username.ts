import { USERNAME_MAX_BYTES } from "./constants";
import { UserFacingError } from "./errors";

const ALLOWED = /^[\p{Script=Hiragana}\p{Script=Katakana}ー0-9a-z_]+$/u;

/** ユーザー名をそろえる（全角の英数字を半角にし、英字は小文字にする） */
export function normalizeUsername(input: string): string {
  return input.trim().normalize("NFKC").toLowerCase();
}

export function validateUsername(input: string): string {
  const name = normalizeUsername(input);
  if (name.length === 0) throw new UserFacingError("なまえを いれてね");
  if (!ALLOWED.test(name)) {
    throw new UserFacingError("なまえには、ひらがな・カタカナ・えいご・すうじだけ つかえるよ");
  }
  if (new TextEncoder().encode(name).length > USERNAME_MAX_BYTES) {
    throw new UserFacingError("なまえが ながすぎるよ（ひらがなは 10もじ、えいごと すうじは 32もじまで）");
  }
  return name;
}

export function validatePassword(password: string): void {
  if (password.length < 6) throw new UserFacingError("パスワードは 6もじ いじょうに してね");
}

/** ひらがななどはメールアドレスに使えないので、UTF-8 のバイト列を16進数にしてから、メールの形にする */
export function usernameToEmail(username: string, projectId: string): string {
  const hex = Array.from(new TextEncoder().encode(username), (b) => b.toString(16).padStart(2, "0")).join("");
  return `${hex}@${projectId}.firebaseapp.com`;
}

export function usernameToLocalId(username: string): string {
  return Array.from(new TextEncoder().encode(username), (b) => b.toString(16).padStart(2, "0")).join("");
}
