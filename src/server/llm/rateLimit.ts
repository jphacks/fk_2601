import { RATE_LIMIT_DAY, RATE_LIMIT_DETAIL_DAY, RATE_LIMIT_DETAIL_MINUTE, RATE_LIMIT_MINUTE } from "@/lib/constants";

/** questions は 問いを作る呼び出し（/api/questions・/api/questions/custom）、detail は 2回目の解説づくり（/api/questions/detail。#165）。別々に数える */
export type RateKind = "questions" | "detail";

// 利用者（uid）ごとの回数の上限（AI を呼ぶ API の使いすぎを止める。#166）。
// サーバーは DB を持たない決まりなので、回数はこの関数のメモリの中の Map で数える。
// 限界：Vercel の関数は何台かに分かれ、休んだり作り直されたりすると記録が消える。
//   そのため上限は「1台をたたきつづける」ことだけを止める。ちゃんとした上限（Vercel KV・Firebase App Check など）は
//   新しいサービスが要るので、人に確認してから決める（docs/03-technical.md 9章）

const MINUTE_MS = 60_000;
const DAY_MS = 24 * 60 * 60_000;
/** 使っていない uid の記録を捨てるまでの時間 */
const IDLE_MS = 60 * 60_000;
/** 古い記録を探して捨てる間隔 */
const SWEEP_MS = 60_000;
/** 記録する uid の数の上限（メモリが大きくならないように） */
const MAX_USERS = 10_000;

// uid → 呼んだ時刻のならび（古い順。24時間より古いものは捨てる）
const calls = new Map<string, number[]>();
let lastSweep = 0;

function sweep(now: number) {
  lastSweep = now;
  for (const [uid, times] of calls) {
    if (times.length === 0 || now - times[times.length - 1] > IDLE_MS) calls.delete(uid);
  }
  // それでも多いときは、古く入れたものから捨てる（Map は入れた順に並ぶ）
  for (const uid of calls.keys()) {
    if (calls.size <= MAX_USERS) break;
    calls.delete(uid);
  }
}

/** 呼んでよければ true（回数を1つ数える）。上限をこえていれば false（数えない）。now はテスト用に渡せる */
export function allowRequest(uid: string, kind: RateKind = "questions", now = Date.now()): boolean {
  if (now - lastSweep >= SWEEP_MS) sweep(now);
  // 2回目は 画像がなく 出力も 3分の1ほどで、1枚の写真で 1〜3回 呼ばれる（3つを見くらべたとき）。同じ入れものだと 1分6回に 当たりやすいので、別に数える
  const [perMinute, perDay] = kind === "detail" ? [RATE_LIMIT_DETAIL_MINUTE, RATE_LIMIT_DETAIL_DAY] : [RATE_LIMIT_MINUTE, RATE_LIMIT_DAY];
  const key = kind === "detail" ? `detail:${uid}` : uid;
  const times = (calls.get(key) ?? []).filter((t) => now - t < DAY_MS);
  const inMinute = times.filter((t) => now - t < MINUTE_MS).length;
  if (inMinute >= perMinute || times.length >= perDay) {
    calls.set(key, times);
    return false;
  }
  times.push(now);
  calls.set(key, times);
  return true;
}
