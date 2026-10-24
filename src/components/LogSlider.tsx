"use client";

import { formatNumber } from "@/lib/format";

const STEPS = 1000;
const THUMB = 44;

/** めもり（1・10・100…）。範囲の中にある 10 のべき乗だけを出す */
function tickValues(min: number, max: number): number[] {
  const ticks: number[] = [];
  for (let e = Math.ceil(Math.log10(min)); e <= Math.floor(Math.log10(max)); e++) ticks.push(10 ** e);
  if (ticks.length < 2) return [min, max];
  while (ticks.length > 6) ticks.splice(1, 1);
  return ticks;
}

/**
 * 範囲が広くても動かしやすいよう、対数の目盛りで動くスライダー（5年生から）と、数の直接入力（見本 12）。
 * 大きな黄色いボックスが数の入力を兼ねる
 */
export function LogSlider({
  min,
  max,
  value,
  unit,
  onChange,
}: {
  min: number;
  max: number;
  value: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  const ratio = Math.log(max / min);
  const clamped = Math.min(max, Math.max(min, value));
  const position = Math.round((Math.log(clamped / min) / ratio) * STEPS);
  const fraction = (v: number) => Math.min(1, Math.max(0, Math.log(v / min) / ratio));
  const ticks = tickValues(min, max);

  return (
    <div className="flex flex-col gap-3">
      <span className="text-center font-pop text-lg">きみの よそうは？</span>
      <label className="flex items-baseline justify-center gap-2 rounded-[30px] border-3 border-ink bg-yellow px-4 py-3 shadow-pop">
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          aria-label="よそうする 数"
          value={Number.isFinite(value) ? value : ""}
          onChange={(e) => {
            const next = Number(e.target.value);
            if (Number.isFinite(next) && next > 0) onChange(next);
          }}
          className="w-full min-w-0 bg-transparent text-center font-pop text-[64px] leading-[1.15] text-ink outline-none"
        />
        <span className="shrink-0 font-pop text-[26px] text-ink">{unit}</span>
      </label>

      <div>
        <input
          type="range"
          min={0}
          max={STEPS}
          value={position}
          onChange={(e) => onChange(Number((min * Math.exp((Number(e.target.value) / STEPS) * ratio)).toPrecision(3)))}
          aria-label="よそうする 数を えらぶ"
        />
        <div className="relative mx-0 h-6 font-pop text-sm text-ink-sub" aria-hidden>
          {ticks.map((t) => (
            <span
              key={t}
              className="absolute -translate-x-1/2 whitespace-nowrap"
              style={{ left: `calc(${THUMB / 2}px + (100% - ${THUMB}px) * ${fraction(t)})` }}
            >
              {formatNumber(t)}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
