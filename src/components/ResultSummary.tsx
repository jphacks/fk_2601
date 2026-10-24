"use client";

import { formatNumber, formatRatio, isApprox } from "@/lib/format";
import { refParts } from "@/lib/ref";
import { describeGuess, RATING_LABEL, type Evaluation, type Guess, type Rating } from "@/lib/rating";
import type { Question } from "@/server/llm/schema";
import { CountUp } from "./CountUp";
import { Navigator } from "./Navigator";
import { NumberLine } from "./NumberLine";
import { RubyText } from "./RubyText";

const BANNER: Record<Rating, string> = {
  pita: "bg-mint/25 text-ink",
  oshii: "bg-sun/30 text-ink",
  ohazure: "bg-berry/15 text-berry",
};

export function ratingText(rating: Rating, type: Question["type"]): string {
  if (type === "why") return rating === "pita" ? "せいかい！" : "ざんねん…";
  return RATING_LABEL[rating];
}

/** 予想と正解のズレを、ことばと数直線で見せる。animate が false のとき（ずかんで見返すとき）は動かさない */
export function ResultSummary({
  question,
  guess,
  evaluation,
  animate = true,
}: {
  question: Question;
  guess: Guess;
  evaluation: Evaluation;
  animate?: boolean;
}) {
  const { rating, type, guessValue, actual } = evaluation;
  const unit = type === "compare" ? "倍" : question.answerUnit;

  return (
    <div className="space-y-4">
      <div className={`flex items-center gap-3 rounded-3xl p-4 ${BANNER[rating]}`}>
        <Navigator mood={rating === "ohazure" ? "surprise" : "happy"} size={72} />
        <p className={`text-3xl font-bold ${animate ? "animate-stamp" : ""}`}>{ratingText(rating, type)}</p>
      </div>

      {type === "why" && question.choices && guess.kind === "reason" && (
        <ul className="space-y-2">
          {question.choices.map((c, i) => (
            <li
              key={i}
              className={`rounded-2xl border-2 px-4 py-3 text-lg ${
                c.correct ? "border-mint bg-mint/15 font-bold" : i === guess.index ? "border-berry/60 bg-berry/10" : "border-ink/10 bg-white"
              }`}
            >
              <span className="mr-2">{c.correct ? "◎ せいかい" : i === guess.index ? "× きみの よそう" : ""}</span>
              <RubyText text={c.text} />
            </li>
          ))}
        </ul>
      )}

      {type !== "why" && guessValue !== null && actual !== null && (
        <>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="rounded-2xl bg-berry/10 p-3">
              <p className="text-sm font-bold text-berry">きみの よそう</p>
              <p className="text-xl font-bold">{describeGuess(guess, unit)}</p>
              {type === "compare" && guess.kind === "compare" && question.compare && (
                <p className="text-sm">
                  <RubyText text={question.compare[guess.side]} /> が 大きい
                </p>
              )}
            </div>
            <div className="rounded-2xl bg-[#e1ecff] p-3">
              <p className="text-sm font-bold text-brand-dark">せいかい</p>
              <p className="text-2xl font-bold">
                {animate ? <CountUp value={actual} from={0} format={formatNumber} /> : formatNumber(actual)}
                <span className="text-base">{unit}</span>
              </p>
              {type === "compare" && evaluation.bigger && question.compare && (
                <p className="text-sm">
                  <RubyText text={question.compare[evaluation.bigger]} /> が 大きい
                </p>
              )}
            </div>
          </div>

          <NumberLine guess={guessValue} actual={actual} unit={unit} intro={animate} />
          <p className="text-center text-xl font-bold">{gapText(guessValue, actual)}</p>
          {type === "compare" && evaluation.correct === false && (
            <p className="text-center text-base">大きいのは、きみが えらんだ ほうでは なかったよ。</p>
          )}
          {type === "estimate" && <Familiar question={question} actual={actual} />}
        </>
      )}
    </div>
  );
}

function gapText(guess: number, actual: number): string {
  if (Math.abs(guess - actual) / actual <= 0.05) return "ほとんど おなじ！ すごい！";
  const k = actual / guess;
  return `せいかいは、きみの よそうの ${formatRatio(k)}だったよ！`;
}

/** 答えを、身近なものにおきかえる（「1日に 1000ばいずつ くむと 1800日ぶん」など） */
function Familiar({ question, actual }: { question: Question; actual: number }) {
  const parts = refParts(question, actual);
  if (!parts) return null;
  return (
    <p className="rounded-2xl bg-sun/20 p-3 text-center text-base">
      <RubyText text={parts.label} /> <b className="text-lg">{isApprox(parts.value) ? "約" : ""}{formatNumber(parts.value)}</b>
      <RubyText text={`${parts.unit}${parts.suffix}`} />
    </p>
  );
}
