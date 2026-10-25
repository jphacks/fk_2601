"use client";

import { useMemo, useState } from "react";
import { formatNumber } from "@/lib/format";
import { unitKana } from "@/lib/ruby";
import { binEdges, binValue, BIN_COUNT, usesChoices, type Guess } from "@/lib/rating";
import type { Question } from "@/server/llm/schema";
import { LogSlider } from "./LogSlider";
import { RubyText } from "./RubyText";
import { Button, CHOICE_DOWN, CHOICE_UP, Say } from "./ui";

const RATIO_CHOICES = [1.5, 2, 3, 5, 10, 20, 50, 100];

// 5つの範囲の色（見本 13）：えらぶと、こい色になる
const BIN_STYLE = [
  { off: "bg-pink-light", on: "bg-pink" },
  { off: "bg-orange-light", on: "bg-orange" },
  { off: "bg-yellow-light", on: "bg-yellow" },
  { off: "bg-mint-light", on: "bg-mint" },
  { off: "bg-navi-light", on: "bg-navi text-white" },
] as const;

/** 範囲の「おおきさ」を、点の多さで見せる丸いアイコン（見本 13） */
function BinIcon({ index }: { index: number }) {
  const dots: [number, number, number][][] = [
    [[23, 23, 4]],
    [[15, 19, 3.5], [29, 17, 3.5], [22, 30, 3.5]],
    [[14, 16, 3], [23, 14, 3], [32, 17, 3], [14, 27, 3], [23, 26, 3], [32, 28, 3], [19, 35, 3], [28, 36, 3]],
    Array.from({ length: 16 }, (_, k) => [10 + (k % 5) * 7, 12 + Math.floor(k / 5) * 8 + (k % 3), 2.4] as [number, number, number]),
    [[14, 16, 1.6], [22, 12, 1.6], [31, 15, 1.6], [12, 25, 1.6], [27, 22, 1.6], [35, 27, 1.6], [19, 31, 1.6], [29, 34, 1.6]],
  ];
  const dark = index === 4;
  return (
    <svg width="46" height="46" viewBox="0 0 46 46" aria-hidden="true" className="shrink-0">
      <circle cx="23" cy="23" r="21" fill={dark ? "#22223A" : "#FFFFFF"} stroke="#22223A" strokeWidth="2.5" />
      <g fill={dark ? "#FFFFFF" : "#22223A"}>
        {dots[index].map(([x, y, r], k) => (
          <circle key={k} cx={x} cy={y} r={r} />
        ))}
      </g>
    </svg>
  );
}

/** 「せーの！」と、その上のナビのひとこと。のこった空白は、かたまりの切れ目に同じだけ分ける（docs/design/README.md「余白」） */
function SeenoButton({ disabled, onClick, hint }: { disabled: boolean; onClick: () => void; hint?: React.ReactNode }) {
  return (
    <>
      {hint && <div className="mt-auto">{hint}</div>}
      <div className="mt-auto">
        <Button variant="seeno" disabled={disabled} onClick={onClick}>
          せーの！
        </Button>
      </div>
    </>
  );
}

/** 予想の入力。問いの種類と学年で、入力のしかたを切り替える（docs/02-spec.md 10章） */
export function PredictionForm({
  question,
  grade,
  onSubmit,
  hint,
}: {
  question: Question;
  grade: number;
  onSubmit: (guess: Guess) => void;
  /** 「せーの！」の上に出す、ナビのひとこと */
  hint?: React.ReactNode;
}) {
  if (question.type === "why") return <ReasonForm question={question} onSubmit={onSubmit} hint={hint} />;
  if (question.type === "compare") return <CompareForm question={question} grade={grade} onSubmit={onSubmit} hint={hint} />;
  return <EstimateForm question={question} grade={grade} onSubmit={onSubmit} hint={hint} />;
}

type FormProps = { question: Question; onSubmit: (guess: Guess) => void; hint?: React.ReactNode };

const CHOICE_COLORS = ["bg-pink-light", "bg-yellow-light", "bg-mint-light"] as const;
const CHOICE_ON = ["bg-pink", "bg-yellow", "bg-mint"] as const;

function ReasonForm({ question, onSubmit, hint }: FormProps) {
  const [index, setIndex] = useState<number | null>(null);
  return (
    <>
      <span className="mt-auto text-center font-pop text-lg">どれだと おもう？</span>
      <div role="radiogroup" aria-label="よそう" className="flex flex-col gap-2.5">
        {(question.choices ?? []).map((c, i) => (
          <button
            key={i}
            type="button"
            role="radio"
            aria-checked={index === i}
            onClick={() => setIndex(i)}
            className={`flex items-center gap-3.5 rounded-[22px] border-3 border-ink px-3.5 py-3 text-left text-[19px] font-black leading-[1.7] ${
              index === i ? `${CHOICE_ON[i % 3]} ${CHOICE_DOWN}` : `${CHOICE_COLORS[i % 3]} ${CHOICE_UP}`
            }`}
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full border-3 border-ink bg-white font-pop text-base">{i + 1}</span>
            <RubyText kana text={c.text} />
          </button>
        ))}
      </div>
      <SeenoButton hint={hint} disabled={index === null} onClick={() => index !== null && onSubmit({ kind: "reason", index })} />
    </>
  );
}

function EstimateForm({ question, grade, onSubmit, hint }: FormProps & { grade: number }) {
  const guessRange = question.guessRange;
  const range = useMemo(() => guessRange ?? { min: 1, max: 100 }, [guessRange]);
  const edges = useMemo(() => binEdges(range), [range]);
  const [index, setIndex] = useState<number | null>(null);
  const [value, setValue] = useState(() => Number(Math.sqrt(range.min * range.max).toPrecision(2)));

  if (usesChoices(grade)) {
    return (
      <>
        <div className="mt-auto">
          <Say mood="effort" size={66}>
            <span className="font-pop text-[17px] font-normal leading-normal">どれくらいだと おもう？</span>
          </Say>
        </div>
        <div role="radiogroup" aria-label="よそう" className="flex flex-col gap-2.5">
          {Array.from({ length: BIN_COUNT }, (_, i) => (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={index === i}
              onClick={() => setIndex(i)}
              className={`flex h-[66px] items-center gap-3.5 rounded-[22px] border-3 border-ink px-3.5 text-left text-[20px] font-black ${
                index === i ? `${BIN_STYLE[i].on} ${CHOICE_DOWN}` : `${BIN_STYLE[i].off} ${CHOICE_UP}`
              }`}
            >
              <BinIcon index={i} />
              <span>
                {formatNumber(edges[i])} 〜 {formatNumber(edges[i + 1])} {unitKana(question.answerUnit)}
              </span>
            </button>
          ))}
        </div>
        {/* ナビのひとことは上の「どれくらいだと おもう？」で言うので、ここでは出さない（見本 13） */}
        <SeenoButton
          disabled={index === null}
          onClick={() => index !== null && onSubmit({ kind: "bin", index, edges, value: binValue(edges, index) })}
        />
      </>
    );
  }

  return (
    <>
      <LogSlider min={range.min} max={range.max} value={value} unit={question.answerUnit} onChange={setValue} />
      <SeenoButton hint={hint} disabled={!(value > 0)} onClick={() => onSubmit({ kind: "number", value })} />
    </>
  );
}

function CompareForm({ question, grade, onSubmit, hint }: FormProps & { grade: number }) {
  const names = question.compare ?? { a: "A", b: "B" };
  const [side, setSide] = useState<"a" | "b" | null>(null);
  const [ratio, setRatio] = useState<number | null>(null);
  const [slider, setSlider] = useState(10);
  const small = usesChoices(grade);
  const chosenRatio = small ? ratio : slider;

  return (
    <>
      <div className="flex flex-col gap-2">
        <span className="mt-auto text-center font-pop text-lg">どっちが おおきい？</span>
        <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="どっちが おおきい？">
          {(["a", "b"] as const).map((s, i) => (
            <button
              key={s}
              type="button"
              role="radio"
              aria-checked={side === s}
              onClick={() => setSide(s)}
              className={`min-h-[84px] rounded-[22px] border-3 border-ink px-3 py-2 text-center text-[19px] font-black leading-[1.6] ${
                side === s ? `${i === 0 ? "bg-pink" : "bg-navi text-white"} ${CHOICE_DOWN}` : `${i === 0 ? "bg-pink-light" : "bg-navi-light"} ${CHOICE_UP}`
              }`}
            >
              <RubyText kana text={names[s]} />
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-center font-pop text-lg">おおきい ほうは、なんばい くらい？</span>
        {small ? (
          <div className="grid grid-cols-2 gap-2.5">
            {RATIO_CHOICES.map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={ratio === r}
                onClick={() => setRatio(r)}
                className={`h-[54px] rounded-[20px] border-3 border-ink text-lg font-black ${ratio === r ? `bg-yellow ${CHOICE_DOWN}` : `bg-yellow-light ${CHOICE_UP}`}`}
              >
                やく {r} ばい
              </button>
            ))}
          </div>
        ) : (
          <LogSlider min={1} max={1000} value={slider} unit="倍" label="なんばいだと おもう？" onChange={setSlider} />
        )}
      </div>

      <SeenoButton
        hint={hint}
        disabled={side === null || chosenRatio === null || !(chosenRatio > 0)}
        onClick={() => side !== null && chosenRatio !== null && chosenRatio > 0 && onSubmit({ kind: "compare", side, ratio: Math.max(1, chosenRatio) })}
      />
    </>
  );
}
