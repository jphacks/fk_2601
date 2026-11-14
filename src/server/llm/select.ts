// AI には 4つ書かせて（prompts.ts）、検査を通ったものから 子どもに見せる 3つを選ぶ。
// 1つ落ちても 3つ残るようにするため（docs/03-technical.md 5.3.4）。プロンプトの決まり（why を1つ以上・数の問いは2つまで）を、ここでも守る

export const SHOWN_COUNT = 3;
const MAX_NUMERIC = 2;

/** 検査を通った問い（AI が書いた順）から、子どもに見せる問いを選ぶ。順番は、書かれた順をなるべく保つ */
export function pickQuestions<T extends { type: string }>(valid: T[], max = SHOWN_COUNT): T[] {
  const picked: T[] = [];
  const skipped: T[] = [];
  let numeric = 0;
  for (const q of valid) {
    const isNumeric = q.type !== "why";
    if (picked.length >= max || (isNumeric && numeric >= MAX_NUMERIC)) {
      skipped.push(q);
      continue;
    }
    picked.push(q);
    if (isNumeric) numeric++;
  }
  // 数の問いを2つに おさえたせいで足りないときは、決まりより 3つ そろえることを 優先する
  for (const q of skipped) {
    if (picked.length >= max) break;
    picked.push(q);
  }
  // why が1つもないときは、さいごの数の問いを、まだ選ばれていない why とかえる
  const spareWhy = valid.find((q) => q.type === "why" && !picked.includes(q));
  if (spareWhy && !picked.some((q) => q.type === "why")) picked[picked.length - 1] = spareWhy;
  // 元の順にそろえる
  return valid.filter((q) => picked.includes(q));
}
