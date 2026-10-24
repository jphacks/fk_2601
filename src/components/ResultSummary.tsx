import { formatNumber, formatRatio } from "@/lib/format";
import { describeGuess, RATING_LABEL, type Evaluation, type Guess, type Rating } from "@/lib/rating";
import type { Question } from "@/server/llm/schema";
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

/** 予想と正解のズレを、ことばと数直線で見せる */
export function ResultSummary({
  question,
  guess,
  evaluation,
}: {
  question: Question;
  guess: Guess;
  evaluation: Evaluation;
}) {
  const { rating, type, guessValue, actual } = evaluation;
  const unit = type === "compare" ? "倍" : question.answerUnit;

  return (
    <div className="space-y-4">
      <div className={`flex items-center gap-3 rounded-3xl p-4 ${BANNER[rating]}`}>
        <Navigator mood={rating === "ohazure" ? "surprise" : "happy"} size={72} />
        <p className="text-3xl font-bold">{ratingText(rating, type)}</p>
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
              {type === "compare" && guess.kind === "compare" && (
                <p className="text-sm">{question.compare?.[guess.side]} が 大きい</p>
              )}
            </div>
            <div className="rounded-2xl bg-[#e1ecff] p-3">
              <p className="text-sm font-bold text-brand-dark">せいかい</p>
              <p className="text-xl font-bold">
                {formatNumber(actual)}
                <span className="text-base">{unit}</span>
              </p>
              {type === "compare" && evaluation.bigger && (
                <p className="text-sm">{question.compare?.[evaluation.bigger]} が 大きい</p>
              )}
            </div>
          </div>

          <NumberLine guess={guessValue} actual={actual} unit={unit} />
          <p className="text-center text-lg font-bold">{gapText(guessValue, actual)}</p>
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

/** 答えを、身近なものにおきかえる（「プール○杯分」など） */
function Familiar({ question, actual }: { question: Question; actual: number }) {
  const f = question.familiar;
  if (!f) return null;
  const n = actual / f.amount;
  if (n < 0.1 || n > 100000) return null;
  return (
    <p className="rounded-2xl bg-sun/20 p-3 text-center text-base">
      <RubyText text={`「${f.name}」の 約${formatNumber(n)}こぶん`} />
    </p>
  );
}
