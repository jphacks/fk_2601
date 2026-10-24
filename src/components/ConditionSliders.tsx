"use client";

import { useEffect, useRef, useState } from "react";
import { answerBounds, computeAnswer, defaultScope } from "@/lib/calc";
import { formatNumber, formatRatio } from "@/lib/format";
import { refParts } from "@/lib/ref";
import type { Guess } from "@/lib/rating";
import type { Question } from "@/server/llm/schema";
import { CountUp } from "./CountUp";
import { NumberLine } from "./NumberLine";
import { RubyText } from "./RubyText";

const THUMB = 34;

/** 数直線に置く値（compare は、大きいほうが小さいほうの何倍か） */
const onLine = (question: Question, value: number) => (question.type === "compare" ? Math.max(value, 1 / value) : value);

/** 条件（変数）をスライダーで動かして、答えがどう変わるかを、数・数直線・倍率で見せる */
export function ConditionSliders({
  question,
  values,
  onChange,
  guess,
}: {
  question: Question;
  values: Record<string, number>;
  onChange: (values: Record<string, number>) => void;
  guess?: Guess;
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

  const guessValue = guess?.kind === "number" || guess?.kind === "bin" ? guess.value : guess?.kind === "compare" ? guess.ratio : null;
  const bounds = answerBounds(question);
  const unit = question.type === "compare" ? "倍" : question.answerUnit;
  const parts = current !== null && question.type === "estimate" ? refParts(question, current) : null;

  return (
    <div className="space-y-4">
      {question.variables.map((v) => {
        const now = values[v.name];
        const moved = now !== v.value;
        const frac = (v.value - v.min) / (v.max - v.min);
        return (
          <div key={v.name}>
            <div className="flex items-baseline justify-between gap-2 text-base font-bold">
              <RubyText text={v.label} />
              <span className="shrink-0">
                {moved && (
                  <span className="mr-2 text-sm font-normal text-ink/60">
                    もと {formatNumber(v.value)}
                    {v.unit}
                  </span>
                )}
                <span className={`rounded-lg px-2 py-0.5 ${moved ? "bg-sun text-ink" : "text-brand"}`}>
                  {formatNumber(now)}
                  {v.unit}
                </span>
              </span>
            </div>
            <div className="relative">
              <input
                type="range"
                min={v.min}
                max={v.max}
                step={v.step}
                value={now}
                aria-label={`${v.label.replace(/\{([^{}|]+)\|[^{}|]+\}/g, "$1")}を かえる`}
                onChange={(e) => onChange({ ...values, [v.name]: Number(e.target.value) })}
              />
              <span
                aria-hidden
                className="pointer-events-none absolute top-1/2 h-5 w-1 -translate-x-1/2 -translate-y-1/2 rounded bg-ink/50"
                style={{ left: `calc(${THUMB / 2}px + (100% - ${THUMB}px) * ${Math.min(1, Math.max(0, frac))})` }}
              />
            </div>
            {moved && (
              <button
                type="button"
                className="text-sm font-bold text-brand underline"
                onClick={() => onChange({ ...values, [v.name]: v.value })}
              >
                もとに もどす
              </button>
            )}
          </div>
        );
      })}

      <div aria-live="polite" className="paper-card bg-sun/25 p-3 text-center">
        {current === null ? (
          <p>この じょうけんでは 計算できないよ</p>
        ) : question.type === "compare" ? (
          <p key={bumped} className="animate-bump text-xl font-bold">
            <RubyText
              text={
                current >= 1
                  ? `${question.compare?.a ?? "A"}は ${question.compare?.b ?? "B"}の ${formatRatio(current)}`
                  : `${question.compare?.b ?? "B"}は ${question.compare?.a ?? "A"}の ${formatRatio(1 / current)}`
              }
            />
          </p>
        ) : (
          <p key={bumped} className="animate-bump text-3xl font-bold">
            <CountUp value={current} duration={400} format={formatNumber} />
            <span className="text-lg">{unit}</span>
          </p>
        )}

        {changed && current !== null && original !== null && original > 0 && (
          <p
            className={`mx-auto mt-2 w-fit rounded-full px-4 py-1 text-lg font-bold ${
              ratio > 1.0001 ? "bg-berry/15 text-berry" : ratio < 0.9999 ? "bg-brand/15 text-brand-dark" : "bg-white"
            }`}
          >
            {ratio > 1.0001 ? "▲ " : ratio < 0.9999 ? "▼ " : ""}
            {Math.abs(ratio - 1) < 0.0001 ? "もとと おなじ" : `もとの こたえの ${formatRatio(ratio)}`}
          </p>
        )}

        {parts && (
          <p className="mt-2 text-base">
            <RubyText text={parts.label} /> <b className="text-lg">{formatNumber(parts.value)}</b>
            <RubyText text={`${parts.unit}${parts.suffix}`} />
          </p>
        )}
      </div>

      {current !== null && original !== null && current > 0 && original > 0 && (
        <NumberLine
          guess={guessValue !== null && guessValue > 0 ? guessValue : onLine(question, original)}
          actual={onLine(question, current)}
          original={changed ? onLine(question, original) : null}
          bounds={bounds}
          unit={unit}
        />
      )}
    </div>
  );
}
