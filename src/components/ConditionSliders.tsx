"use client";

import { computeAnswer, defaultScope } from "@/lib/calc";
import { formatNumber, formatRatio } from "@/lib/format";
import type { Question } from "@/server/llm/schema";
import { RubyText } from "./RubyText";

/** 条件（変数）をスライダーで動かして、答えがどう変わるかを見る */
export function ConditionSliders({
  question,
  values,
  onChange,
}: {
  question: Question;
  values: Record<string, number>;
  onChange: (values: Record<string, number>) => void;
}) {
  if (question.variables.length === 0 || question.type === "why") return null;

  const original = computeAnswer(question, defaultScope(question));
  const current = computeAnswer(question, values);
  const changed = question.variables.some((v) => values[v.name] !== v.value);

  return (
    <div className="space-y-4">
      {question.variables.map((v) => (
        <label key={v.name} className="block">
          <span className="flex items-baseline justify-between gap-2 text-base font-bold">
            <RubyText text={v.label} />
            <span className="shrink-0 text-brand">
              {formatNumber(values[v.name])}
              {v.unit}
            </span>
          </span>
          <input
            type="range"
            min={v.min}
            max={v.max}
            step={v.step}
            value={values[v.name]}
            onChange={(e) => onChange({ ...values, [v.name]: Number(e.target.value) })}
            className="h-10 w-full"
          />
        </label>
      ))}

      <div aria-live="polite" className="rounded-2xl bg-sun/20 p-3 text-center">
        {current === null ? (
          <p>この じょうけんでは 計算できないよ</p>
        ) : question.type === "compare" ? (
          <p className="text-xl font-bold">
            {current >= 1
              ? `${question.compare?.a ?? "A"}は ${question.compare?.b ?? "B"}の ${formatRatio(current)}`
              : `${question.compare?.b ?? "B"}は ${question.compare?.a ?? "A"}の ${formatRatio(1 / current)}`}
          </p>
        ) : (
          <p className="text-xl font-bold">
            こたえ：{formatNumber(current)}
            {question.answerUnit}
          </p>
        )}
        {changed && original !== null && current !== null && original > 0 && (
          <p className="mt-1 text-base">もとの こたえの {formatRatio(current / original)}に なったよ</p>
        )}
      </div>
    </div>
  );
}
