"use client";

import { useEffect, useState } from "react";
import { formatNumber } from "@/lib/format";
import { useReducedMotion } from "@/lib/useReducedMotion";
import { Icon } from "./Icons";

/** 軸の右はしの数：いちばん大きい値より少し先の、きりのいい数（ふつうの目盛り。ズレが見た目の長さにそのまま出る） */
function axisMax(top: number): number {
  const raw = top * 1.15;
  const p = 10 ** Math.floor(Math.log10(raw));
  const f = raw / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
}

const clamp = (pct: number) => Math.min(96, Math.max(4, pct));

/**
 * 予想とこたえを、1本の道で見せる（見本 14〜16）。ピンクの丸＝きみ、青の旗＝こたえ。
 * ずれは黄色い帯。intro のときは、旗が予想の位置から答えの位置へ動く
 */
export function NumberLine({
  guess,
  actual,
  unit,
  intro = false,
}: {
  guess: number;
  actual: number;
  unit: string;
  intro?: boolean;
}) {
  const reduced = useReducedMotion();
  const [arrived, setArrived] = useState(!intro);

  useEffect(() => {
    if (!intro) return;
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => setArrived(true)));
    return () => cancelAnimationFrame(frame);
  }, [intro]);

  const max = axisMax(Math.max(guess, actual));
  const gx = clamp((guess / max) * 100);
  const ax = clamp((actual / max) * 100);
  const flagX = arrived ? ax : gx;
  const left = Math.min(gx, flagX);
  const width = Math.abs(flagX - gx);
  const move = reduced ? "none" : "left 1.1s cubic-bezier(.2,.9,.25,1) .5s, width 1.1s cubic-bezier(.2,.9,.25,1) .5s";
  const close = Math.abs(gx - ax) < 18;

  return (
    <div
      role="img"
      aria-label={`きみの よそう ${formatNumber(guess)}${unit}、こたえ ${formatNumber(actual)}${unit}`}
      className="relative h-[112px]"
    >
      <span className="absolute left-1 top-1 font-pop text-[13px] text-ink-sub">0</span>
      <span className="absolute right-1 top-1 font-pop text-[13px] text-ink-sub">{formatNumber(max)}</span>
      <div className="absolute inset-x-0 top-7 h-[46px] rounded-[18px] bg-cloud" />
      <div className="absolute inset-x-3.5 top-[50px] h-0 border-t-3 border-dashed border-white" />
      <div className="absolute top-[31px] h-10 bg-zure" style={{ left: `${left}%`, width: `${width}%`, transition: move }} />
      <span
        className="absolute top-[34px] flex size-[34px] -translate-x-1/2 items-center justify-center rounded-full border-3 border-ink bg-pink"
        style={{ left: `${gx}%` }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#22223A" aria-hidden="true">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7z" />
        </svg>
      </span>
      <span
        className="absolute top-[31px] flex size-10 -translate-x-1/2 items-center justify-center rounded-full border-3 border-ink bg-navi"
        style={{ left: `${flagX}%`, transition: reduced ? "none" : "left 1.1s cubic-bezier(.2,.9,.25,1) .5s" }}
      >
        <Icon name="flag" size={20} stroke="#FFFFFF" strokeWidth={2.6} />
      </span>
      {close ? (
        <div className="absolute inset-x-0 top-[82px] text-center font-pop text-base">
          きみ {formatNumber(guess)} ・ <span className="text-navi-dark">こたえ {formatNumber(actual)}</span>
        </div>
      ) : (
        <>
          <div className="absolute top-[82px] w-[150px] -translate-x-1/2 text-center font-pop text-base" style={{ left: `clamp(75px, ${gx}%, calc(100% - 75px))` }}>
            きみ {formatNumber(guess)}
          </div>
          <div className="absolute top-[82px] w-[150px] -translate-x-1/2 text-center font-pop text-base text-navi-dark" style={{ left: `clamp(75px, ${ax}%, calc(100% - 75px))` }}>
            こたえ {formatNumber(actual)}
          </div>
        </>
      )}
    </div>
  );
}
