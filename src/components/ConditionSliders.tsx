"use client";

import { useEffect, useRef, useState } from "react";
import { computeAnswer, defaultScope } from "@/lib/calc";
import { formatNumber } from "@/lib/format";
import { refParts } from "@/lib/ref";
import { kanaOf, unitKana, unitRuby } from "@/lib/ruby";
import type { Question } from "@/server/llm/schema";
import { CountUp } from "./CountUp";
import { Icon } from "./Icons";
import { ratioRuby } from "./ResultSummary";
import { RubyText } from "./RubyText";

const THUMB = 44;

/** 数の大きさに合わせた字の大きさ（見本 18 は 80px） */
function bigSize(text: string): number {
  if (text.length <= 3) return 80;
  if (text.length <= 5) return 64;
  if (text.length <= 7) return 48;
  return 36;
}

/** 条件（変数）をスライダーで動かして、答えがどう変わるかを、数・ぼうグラフ・倍率で見せる（見本 18「もしも」） */
export function ConditionSliders({
  question,
  values,
  onChange,
}: {
  question: Question;
  values: Record<string, number>;
  onChange: (values: Record<string, number>) => void;
}) {
  const [bumped, setBumped] = useState(0);
  const lastRatio = useRef(1);

  const original = computeAnswer(question, defaultScope(question));
  const current = computeAnswer(question, values);
  const changed = question.variables.some((v) => values[v.name] !== v.value);
  const ratio = original !== null && current !== null && original > 0 ? current / original : 1;

  useEffect(() => {
    if (Math.abs(ratio - lastRatio.current) > 1e-9) {
      lastRatio.current = ratio;
      setBumped((n) => n + 1);
    }
  }, [ratio]);

  if (question.variables.length === 0 || question.type === "why") return null;

  const unit = question.type === "compare" ? "倍" : question.answerUnit;
  // 比べる問いは、大きいほうが小さいほうの何倍か
  const onLine = (v: number) => (question.type === "compare" ? Math.max(v, 1 / v) : v);
  const parts = current !== null && question.type === "estimate" ? refParts(question, current) : null;
  const shown = current === null ? "" : formatNumber(onLine(current));
  const top = original !== null && current !== null ? Math.max(onLine(original), onLine(current)) : 1;
  const pct = (v: number) => Math.max(2, Math.min(100, (onLine(v) / top) * 100));

  return (
    <div className="flex flex-col gap-3.5">
      {question.variables.map((v) => {
        const now = values[v.name];
        const moved = now !== v.value;
        const frac = (v.value - v.min) / (v.max - v.min);
        return (
          <div key={v.name} className="flex flex-col gap-1.5 rounded-[26px] border-2 border-ink/15 bg-yellow-light px-[18px] py-3.5">
            <div className="flex items-center justify-between gap-2">
              <label htmlFor={`v-${v.name}`} className="font-pop text-[17px] leading-snug">
                {kanaOf(v.label)}
              </label>
              <span className="shrink-0 font-pop text-[26px] leading-[1.4]">
                {formatNumber(now)}
                <span className="text-lg">{unitKana(v.unit)}</span>
              </span>
            </div>
            <div className="relative">
              <input
                id={`v-${v.name}`}
                type="range"
                min={v.min}
                max={v.max}
                step={v.step}
                value={now}
                onChange={(e) => onChange({ ...values, [v.name]: Number(e.target.value) })}
              />
              {/* もとの値の目印 */}
              <span
                aria-hidden
                className="pointer-events-none absolute top-1/2 h-6 w-1 -translate-x-1/2 -translate-y-1/2 rounded bg-ink/40"
                style={{ left: `calc(${THUMB / 2}px + (100% - ${THUMB}px) * ${Math.min(1, Math.max(0, frac))})` }}
              />
            </div>
            <div className="flex justify-between px-3.5 font-pop text-sm text-ink-sub" aria-hidden>
              <span>{formatNumber(v.min)}</span>
              {moved && <span className="text-ink-muted">もとは {formatNumber(v.value)}</span>}
              <span>{formatNumber(v.max)}</span>
            </div>
            {moved && (
              <button type="button" onClick={() => onChange({ ...values, [v.name]: v.value })} className="self-start text-sm font-black text-navi-dark underline">
                もとに もどす
              </button>
            )}
          </div>
        );
      })}

      <div aria-live="polite" className="flex flex-col items-center rounded-[26px] border-2 border-ink/15 bg-white px-[18px] pb-4 pt-3">
        {current === null ? (
          <p className="text-lg font-black">この じょうけんでは けいさん できないよ</p>
        ) : question.type === "compare" ? (
          <p key={bumped} className="animate-bump text-center text-[20px] font-black leading-[1.75]">
            <RubyText kana text={`${current >= 1 ? question.compare?.a ?? "A" : question.compare?.b ?? "B"} は ${current >= 1 ? question.compare?.b ?? "B" : question.compare?.a ?? "A"} の `} />
            <b className="font-pop text-navi">
              <RubyText kana text={ratioRuby(onLine(current))} />
            </b>
          </p>
        ) : (
          <>
            <span className="text-[20px] font-black leading-[1.75]">こたえは</span>
            <div key={bumped} className="animate-bump flex items-baseline gap-1 text-navi">
              <span className="font-pop leading-[1.15]" style={{ fontSize: bigSize(shown) }}>
                <CountUp value={current} duration={400} format={formatNumber} />
              </span>
              <span className="font-pop text-[30px] leading-[1.6]">
                <RubyText text={unitRuby(unit)} />
              </span>
            </div>
          </>
        )}
        {changed && original !== null && current !== null && original > 0 && Math.abs(ratio - 1) > 1e-4 && (
          <span className={`mt-1 rounded-[18px] border-[2.5px] border-ink px-4 py-0.5 font-pop text-lg ${ratio > 1 ? "bg-yellow" : "bg-navi-light text-navi-dark"}`}>
            {ratio > 1 ? "▲ " : "▼ "}
            もとの <RubyText kana text={ratioRuby(ratio)} />
          </span>
        )}
        {parts && (
          <p className="mt-2 text-center text-[17px] font-black leading-[1.7]">
            {kanaOf(parts.label)} {formatNumber(parts.value)}
            {unitKana(parts.unit)}
            {parts.suffix}
          </p>
        )}
      </div>

      {current !== null && original !== null && (
        <div role="img" aria-label={`さっきは ${formatNumber(onLine(original))}${unit}、いまは ${shown}${unit}`} className="mt-1 flex flex-col gap-2">
          <div className="grid grid-cols-[56px_minmax(0,1fr)_72px] items-center gap-2">
            <span className="text-[15px] font-black text-ink-sub">さっき</span>
            <span className="block h-[22px] overflow-hidden rounded-[11px] border-3 border-ink bg-cloud">
              <span className="block h-full bg-[#C9CFFF] transition-[width] duration-300" style={{ width: `${pct(original)}%` }} />
            </span>
            <span className="text-right font-pop text-[15px] text-ink-sub">{formatNumber(onLine(original))}</span>
          </div>
          <div className="grid grid-cols-[56px_minmax(0,1fr)_72px] items-center gap-2">
            <span className="text-[15px] font-black">いま</span>
            <span className="block h-[22px] overflow-hidden rounded-[11px] border-3 border-ink bg-cloud">
              <span className="block h-full bg-navi transition-[width] duration-300" style={{ width: `${pct(current)}%` }} />
            </span>
            <span className="text-right font-pop text-[15px] text-navi-dark">{shown}</span>
          </div>
        </div>
      )}

      {changed && (
        <p className="flex items-center gap-1.5 text-sm font-black text-ink-sub">
          <Icon name="info" size={18} strokeWidth={2.4} />
          スライダーを もとの ばしょに もどすと、さいしょの こたえに なるよ
        </p>
      )}
    </div>
  );
}
