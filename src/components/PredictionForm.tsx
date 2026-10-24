"use client";

import { useMemo, useState } from "react";
import { formatNumber } from "@/lib/format";
import { binEdges, binValue, BIN_COUNT, usesChoices, type Guess } from "@/lib/rating";
import type { Question } from "@/server/llm/schema";
import { LogSlider } from "./LogSlider";
import { RubyText } from "./RubyText";
import { Button } from "./ui";

const RATIO_CHOICES = [1.5, 2, 3, 5, 10, 20, 50, 100];

function Option({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onClick}
      className={`min-h-12 w-full rounded-2xl border-2 px-4 py-2 text-left text-lg font-bold transition ${
        selected ? "border-brand bg-brand/10 text-brand-dark" : "border-ink/15 bg-white"
      }`}
    >
      {children}
    </button>
  );
}

/** 予想の入力。問いの種類と学年で、入力のしかたを切り替える（docs/02-spec.md 10章） */
export function PredictionForm({
  question,
  grade,
  onSubmit,
}: {
  question: Question;
  grade: number;
  onSubmit: (guess: Guess) => void;
}) {
  if (question.type === "why") return <ReasonForm question={question} onSubmit={onSubmit} />;
  if (question.type === "compare") return <CompareForm question={question} grade={grade} onSubmit={onSubmit} />;
  return <EstimateForm question={question} grade={grade} onSubmit={onSubmit} />;
}

function ReasonForm({ question, onSubmit }: { question: Question; onSubmit: (guess: Guess) => void }) {
  const [index, setIndex] = useState<number | null>(null);
  return (
    <div className="space-y-3">
      {(question.choices ?? []).map((c, i) => (
        <Option key={i} selected={index === i} onClick={() => setIndex(i)}>
          <RubyText text={c.text} />
        </Option>
      ))}
      <Button disabled={index === null} onClick={() => index !== null && onSubmit({ kind: "reason", index })}>
        これで よそうする
      </Button>
    </div>
  );
}

function EstimateForm({ question, grade, onSubmit }: { question: Question; grade: number; onSubmit: (guess: Guess) => void }) {
  const guessRange = question.guessRange;
  const range = useMemo(() => guessRange ?? { min: 1, max: 100 }, [guessRange]);
  const edges = useMemo(() => binEdges(range), [range]);
  const [index, setIndex] = useState<number | null>(null);
  const [value, setValue] = useState(() => Number(Math.sqrt(range.min * range.max).toPrecision(2)));

  if (usesChoices(grade)) {
    return (
      <div className="space-y-3">
        {Array.from({ length: BIN_COUNT }, (_, i) => (
          <Option key={i} selected={index === i} onClick={() => setIndex(i)}>
            {formatNumber(edges[i])} 〜 {formatNumber(edges[i + 1])} {question.answerUnit}
          </Option>
        ))}
        <Button
          disabled={index === null}
          onClick={() => index !== null && onSubmit({ kind: "bin", index, edges, value: binValue(edges, index) })}
        >
          これで よそうする
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <LogSlider min={range.min} max={range.max} value={value} unit={question.answerUnit} onChange={setValue} />
      <Button disabled={!(value > 0)} onClick={() => onSubmit({ kind: "number", value })}>
        これで よそうする
      </Button>
    </div>
  );
}

function CompareForm({ question, grade, onSubmit }: { question: Question; grade: number; onSubmit: (guess: Guess) => void }) {
  const names = question.compare ?? { a: "A", b: "B" };
  const [side, setSide] = useState<"a" | "b" | null>(null);
  const [ratio, setRatio] = useState<number | null>(null);
  const [slider, setSlider] = useState(10);
  const small = usesChoices(grade);
  const chosenRatio = small ? ratio : slider;

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-base font-bold">① どっちが 大きい？</p>
        <div className="grid grid-cols-2 gap-3">
          {(["a", "b"] as const).map((s) => (
            <Option key={s} selected={side === s} onClick={() => setSide(s)}>
              <RubyText text={names[s]} />
            </Option>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-base font-bold">② 大きいほうは、小さいほうの 何倍くらい？</p>
        {small ? (
          <div className="grid grid-cols-2 gap-3">
            {RATIO_CHOICES.map((r) => (
              <Option key={r} selected={ratio === r} onClick={() => setRatio(r)}>
                約{r}倍
              </Option>
            ))}
          </div>
        ) : (
          <LogSlider min={1} max={1000} value={slider} unit="倍" onChange={setSlider} />
        )}
      </div>

      <Button
        disabled={side === null || chosenRatio === null}
        onClick={() => side !== null && chosenRatio !== null && onSubmit({ kind: "compare", side, ratio: Math.max(1, chosenRatio) })}
      >
        これで よそうする
      </Button>
    </div>
  );
}
