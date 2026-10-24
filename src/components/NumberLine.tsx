import { formatNumber } from "@/lib/format";

/** 予想と正解の位置を、対数の数直線で見せる（ズレを目で見て分かるようにする） */
export function NumberLine({ guess, actual, unit }: { guess: number; actual: number; unit: string }) {
  const lo = Math.min(guess, actual) / 4;
  const hi = Math.max(guess, actual) * 4;
  const span = Math.log10(hi / lo);
  const width = 320;
  const pad = 22;
  const x = (v: number) => pad + ((Math.log10(v) - Math.log10(lo)) / span) * (width - pad * 2);

  const ticks: number[] = [];
  for (let e = Math.ceil(Math.log10(lo)); e <= Math.floor(Math.log10(hi)); e++) ticks.push(10 ** e);

  const guessX = x(guess);
  const actualX = x(actual);
  const close = Math.abs(guessX - actualX) < 64;

  return (
    <svg viewBox={`0 0 ${width} 118`} className="w-full" role="img" aria-label="予想と正解の数直線">
      <line x1={pad} y1="62" x2={width - pad} y2="62" stroke="#1f2a44" strokeWidth="3" strokeLinecap="round" opacity="0.25" />
      {ticks.map((t) => (
        <g key={t}>
          <line x1={x(t)} y1="56" x2={x(t)} y2="68" stroke="#1f2a44" strokeWidth="2" opacity="0.4" />
          <text x={x(t)} y="86" textAnchor="middle" fontSize="10" fill="#1f2a44" opacity="0.6">
            {formatNumber(t)}
          </text>
        </g>
      ))}
      <line x1={guessX} y1="62" x2={actualX} y2="62" stroke="#f0558a" strokeWidth="5" strokeLinecap="round" opacity="0.5" />

      <circle cx={guessX} cy="62" r="9" fill="#f0558a" stroke="#fff" strokeWidth="3" />
      <text x={guessX} y={close ? 22 : 40} textAnchor="middle" fontSize="12" fontWeight="bold" fill="#c2336a">
        よそう
      </text>
      <text x={guessX} y={close ? 36 : 52} textAnchor="middle" fontSize="10" fill="#c2336a" opacity={close ? 1 : 0}>
        {formatNumber(guess)}
        {unit}
      </text>

      <circle cx={actualX} cy="62" r="9" fill="#2f6fed" stroke="#fff" strokeWidth="3" />
      <text x={actualX} y="108" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#1e4fb8">
        せいかい
      </text>
    </svg>
  );
}
