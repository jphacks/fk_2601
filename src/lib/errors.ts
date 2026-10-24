/** 子どもにそのまま見せてよいメッセージを持つエラー */
export class UserFacingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UserFacingError";
  }
}

export function messageOf(error: unknown, fallback = "うまくいかなかったよ。もういちど ためしてね"): string {
  return error instanceof UserFacingError ? error.message : fallback;
}
