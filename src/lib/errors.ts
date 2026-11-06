/** 子どもにそのまま見せてよいメッセージを持つエラー */
export class UserFacingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserFacingError";
  }
}

/** ログイン ID が もう使われていた（登録の画面で、ID の手順に戻すために見分ける） */
export class UsernameTakenError extends UserFacingError {
  constructor() {
    super("その ログイン ID は もう つかわれているよ。ちがう ID に してね");
    this.name = "UsernameTakenError";
  }
}

export function messageOf(error: unknown, fallback = "うまくいかなかったよ。もういちど ためしてね"): string {
  return error instanceof UserFacingError ? error.message : fallback;
}
