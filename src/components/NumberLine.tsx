"use client";

import { useEffect, useState } from "react";
import { formatNumber } from "@/lib/format";
import { useReducedMotion } from "@/lib/useReducedMotion";

const W = 340;
const H = 160;
const PAD = 26;
const BASE = 96;

function starPoints(radius: number): string {
  const points: string[] = [];
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 ? radius * 0.48 : radius;
    points.push(`${(Math.cos(angle) * r).toFixed(1)},${(Math.sin(angle) * r).toFixed(1)}`);
  }
  return points.join(" ");
}
const STAR = starPoints(14);

function niceStep(x: number): number {
  const p = Math.pow(10, Math.floor(Math.log10(x)));
  const f = x / p;
  return (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * p;
}

/**
 * 予想とこたえの位置を、数直線で見せる。
 * intro のときは、星が予想の位置から答えの位置へ動く。original があるときは、条件を変える前の答えをうすい星で残す。
 * bounds（答えが動くはんい）を渡すと、目盛りが固定され、スライダーを動かしても星だけがなめらかに動く
 */
export function NumberLine({
  guess,
  actual,
  original,
  bounds,
  unit,
  intro = false,
}: {
  guess: number;
  actual: number;
  original?: number | null;
  bounds?: { min: number; max: number } | null;
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

  // 動くはんいが広すぎる（1万倍より大きい）ときは、目盛りを固定せず、いまの値にあわせる（星が小さくなりすぎるため）
  const fixed = bounds && bounds.min > 0 && bounds.max / bounds.min <= 1e4 ? bounds : null;
  const values = [guess, actual, original ?? actual, fixed?.min ?? actual, fixed?.max ?? actual].filter(
    (v) => v > 0 && Number.isFinite(v),
  );
  const lo0 = Math.min(...values);
  const hi0 = Math.max(...values);
  const log = hi0 / lo0 > 3;
  const lo = log ? lo0 / 2.5 : 0;
  const hi = log ? hi0 * 2.5 : hi0 * 1.25;
  const x = (v: number) =>
    PAD +
    (log ? (Math.log10(v) - Math.log10(lo)) / (Math.log10(hi) - Math.log10(lo)) : (v - lo) / (hi - lo)) * (W - 2 * PAD);

  let ticks: number[] = [];
  if (log) {
    for (let e = Math.ceil(Math.log10(lo)); e <= Math.floor(Math.log10(hi)); e++) ticks.push(10 ** e);
    if (ticks.length < 2) {
      const e = Math.floor(Math.log10(lo));
      for (const m of [3, 10, 30, 100]) {
        const v = 10 ** e * m;
        if (v > lo && v < hi && !ticks.includes(v)) ticks.push(v);
      }
      ticks.sort((a, b) => a - b);
    }
    while (ticks.length > 6) ticks = ticks.filter((_, i) => i % 2 === 0);
  } else {
    const step = niceStep(hi / 4);
    for (let v = 0; v <= hi + 1e-9; v += step) ticks.push(v);
  }

  const xGuess = x(guess);
  const xActual = x(actual);
  const xOriginal = original ? x(original) : null;
  const starX = arrived ? xActual : xGuess;
  const showGhost = xOriginal !== null && Math.abs(xOriginal - xActual) > 8;
  const bandFrom = xOriginal ?? xGuess;
  const bandLeft = Math.min(bandFrom, starX);
  const bandWidth = Math.abs(bandFrom - starX);

  const move = reduced ? "none" : intro ? "transform 1.1s cubic-bezier(.2,.9,.25,1) .35s" : "transform .3s ease-out";
  const clampDx = (px: number) => Math.max(30, Math.min(W - 30, px)) - px;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      role="img"
      aria-label={`よそう ${formatNumber(guess)}${unit}、こたえ ${formatNumber(actual)}${unit}`}
    >
      <line x1={PAD} y1={BASE} x2={W - PAD} y2={BASE} stroke="var(--color-ink)" strokeWidth="3" strokeLinecap="round" opacity="0.3" />
      {ticks.map((t) => (
        <g key={t}>
          <line x1={x(t)} y1={BASE - 6} x2={x(t)} y2={BASE + 6} stroke="var(--color-ink)" strokeWidth="2" opacity="0.4" />
          <text x={x(t)} y={BASE + 24} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--color-ink)" opacity="0.6">
            {formatNumber(t)}
          </text>
        </g>
      ))}

      <rect
        x={0}
        y={BASE - 5}
        width={1}
        height={10}
        fill={xOriginal !== null ? "var(--color-berry)" : "var(--color-sun)"}
        opacity="0.85"
        style={{ transform: `translateX(${bandLeft}px) scaleX(${Math.max(bandWidth, 0.01)})`, transformOrigin: "0px 0px", transition: move }}
      />

      <g transform={`translate(${xGuess} ${BASE})`}>
        <circle r="9" fill="var(--color-ink)" stroke="#fff" strokeWidth="3" />
        <text x={clampDx(xGuess)} y="50" textAnchor="middle" fontSize="12" fontWeight="900" fill="var(--color-ink)">
          よそう
        </text>
      </g>

      {showGhost && xOriginal !== null && (
        <g transform={`translate(${xOriginal} ${BASE})`}>
          <polygon points={STAR} fill="none" stroke="var(--color-ink)" strokeWidth="2" strokeDasharray="3 3" opacity="0.7" />
          <g transform={`translate(${clampDx(xOriginal)} -64)`}>
            <rect x="-26" y="-12" width="52" height="22" rx="11" fill="#fff" stroke="var(--color-ink)" strokeWidth="2" strokeDasharray="3 3" />
            <text y="4" textAnchor="middle" fontSize="12" fontWeight="900" fill="var(--color-ink)">
              もとの
            </text>
          </g>
        </g>
      )}

      <g style={{ transform: `translateX(${starX}px)`, transition: move }}>
        <g transform={`translate(0 ${BASE})`}>
          <polygon points={STAR} fill="var(--color-sun)" stroke="var(--color-ink)" strokeWidth="2.5" strokeLinejoin="round" />
          <g transform={`translate(${clampDx(starX)} -34)`}>
            <rect x="-26" y="-12" width="52" height="22" rx="11" fill="var(--color-sun)" stroke="var(--color-ink)" strokeWidth="2" />
            <text y="4" textAnchor="middle" fontSize="12" fontWeight="900" fill="var(--color-ink)">
              こたえ
            </text>
          </g>
        </g>
      </g>

      {log && (
        <text x={W - PAD} y={H - 4} textAnchor="end" fontSize="10" fontWeight="700" fill="var(--color-ink)" opacity="0.6">
          めもり 1つで 10ばい
        </text>
      )}
    </svg>
  );
}
