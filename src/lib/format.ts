/** 数を子どもにも読みやすい形にする（桁が大きいときはカンマ区切り、小さいときは有効数字3けた） */
export function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return "—";
  const abs = Math.abs(value);
  if (abs === 0) return "0";
  if (abs >= 1e12) return value.toExponential(2).replace("e+", "×10^");
  if (abs >= 1000) return Math.round(value).toLocaleString("ja-JP");
  if (abs >= 100) return String(Math.round(value * 10) / 10);
  if (abs >= 1) return String(Math.round(value * 100) / 100);
  if (abs >= 0.001) return String(Math.round(value * 10000) / 10000);
  return value.toExponential(2).replace("e-", "×10^-");
}

/** 倍率を「約50倍」「約20分の1」のように書く */
export function formatRatio(ratio: number): string {
  if (!Number.isFinite(ratio) || ratio <= 0) return "—";
  if (ratio >= 1) return `約${formatNumber(ratio >= 10 ? Math.round(ratio) : Math.round(ratio * 10) / 10)}倍`;
  const inverse = 1 / ratio;
  return `約${formatNumber(inverse >= 10 ? Math.round(inverse) : Math.round(inverse * 10) / 10)}分の1`;
}

/** 日付を「10/24」の形にする（小さい文字なので、漢字を使わない） */
export function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/** formatNumber が丸めたあとの数（「約」をつけるかの判断に使う） */
function roundForDisplay(value: number): number {
  const abs = Math.abs(value);
  if (abs >= 1000) return Math.round(value);
  if (abs >= 100) return Math.round(value * 10) / 10;
  if (abs >= 1) return Math.round(value * 100) / 100;
  if (abs >= 0.001) return Math.round(value * 10000) / 10000;
  return value;
}

/** 画面に出す数が、丸めた数（ほんとうの数とすこしちがう）か */
export function isApprox(value: number): boolean {
  return Math.abs(roundForDisplay(value) - value) > Math.abs(value) * 0.001;
}
