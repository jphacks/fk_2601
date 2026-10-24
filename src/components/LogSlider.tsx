"use client";

import { formatNumber } from "@/lib/format";

const STEPS = 1000;

/** 範囲が広くても動かしやすいよう、対数の目盛りで動くスライダー（5年生から）と、数の直接入力 */
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

  return (
    <div className="space-y-3">
      <p className="text-center text-3xl font-bold text-brand">
        {formatNumber(value)}
        <span className="ml-1 text-lg">{unit}</span>
      </p>
      <input
        type="range"
        min={0}
        max={STEPS}
        value={position}
        onChange={(e) => onChange(Number((min * Math.exp((Number(e.target.value) / STEPS) * ratio)).toPrecision(3)))}
        aria-label="よそうする 数"
        className="h-10 w-full"
      />
      <div className="flex justify-between text-sm text-ink/60">
        <span>{formatNumber(min)}</span>
        <span>{formatNumber(max)}</span>
      </div>
      <label className="flex items-center gap-2">
        <span className="text-base font-bold">数を 入れる</span>
        <input
          type="number"
          inputMode="decimal"
          min={0}
          step="any"
          value={Number.isFinite(value) ? value : ""}
          onChange={(e) => {
            const next = Number(e.target.value);
            if (Number.isFinite(next) && next > 0) onChange(next);
          }}
          className="min-h-11 w-full rounded-xl border-2 border-ink/15 bg-white px-3 text-lg outline-none focus:border-brand"
        />
      </label>
    </div>
  );
}
