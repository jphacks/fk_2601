"use client";

import { formatNumber, isApprox } from "@/lib/format";
import { describeGuess, RATING_LABEL, type Evaluation, type Guess, type Rating } from "@/lib/rating";
import { refParts } from "@/lib/ref";
import { unitRuby } from "@/lib/ruby";
import type { Question } from "@/server/llm/schema";
import { Confetti, Hanko } from "./Decor";
import { CountUp } from "./CountUp";
import { Icon } from "./Icons";
import { Navigator, type Mood } from "./Navigator";
import { NumberLine } from "./NumberLine";
import { RubyText } from "./RubyText";

export function ratingText(rating: Rating, type: Question["type"]): string {
  if (type === "why") return rating === "pita" ? "せいかい！" : "ざんねん…";
  return RATING_LABEL[rating];
}

/** 倍率を、ふりがなつきの書きかたにする（「約7倍」「約20分の1」）。22px以上の文字なので、漢字にはふりがなを付ける */
export function ratioRuby(ratio: number): string {
  if (!Number.isFinite(ratio) || ratio <= 0) return "";
  const big = ratio >= 1;
  const v = big ? ratio : 1 / ratio;
  const n = formatNumber(v >= 10 ? Math.round(v) : Math.round(v * 10) / 10);
  return big ? `{約|やく}${n}{倍|ばい}` : `{約|やく}${n}{分|ぶん}の1`;
}

// 評価ごとの、ナビの顔・ふきだしの色と言葉・ひとことの札の色（赤は「ピタリ」だけに使う）
const LOOK: Record<Rating, { mood: Mood; bubble: string; lines: [string, string]; chip: string }> = {
  pita: { mood: "pitari", bubble: "text-red-dark", lines: ["ピタリ！", "すごい！"], chip: "bg-red-light text-red-dark" },
  oshii: { mood: "oshii", bubble: "text-orange-dark", lines: ["おしい！", "あと すこし！"], chip: "bg-orange-light text-orange-dark" },
  ohazure: { mood: "hazure", bubble: "text-navi-dark", lines: ["こんなに", "ちがうの！？"], chip: "bg-yellow text-ink" },
};

/** こたえの数の大きさ（桁が多いときは小さくする。見本は 92px 以上） */
function bigSize(text: string): number {
  if (text.length <= 3) return 92;
  if (text.length <= 5) return 72;
  if (text.length <= 7) return 54;
  return 40;
}

function Bubble({ children, color, mood, size = 128 }: { children: React.ReactNode; color: string; mood: Mood; size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <Navigator mood={mood} size={size} />
      <div className={`relative grow rounded-card border-3 border-ink bg-white px-4 py-3 font-pop text-[24px] leading-[1.45] shadow-pop-sm ${color}`}>
        <span aria-hidden className="absolute -left-[11px] top-[calc(50%-9px)] size-4 rotate-45 border-b-3 border-l-3 border-ink bg-white" />
        <span className="relative">{children}</span>
      </div>
    </div>
  );
}

/** 答え合わせ（見本 14〜16「しょうたい」）。animate が false のとき（ずかんで見返すとき）は動かさない */
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
  const look = LOOK[rating];

  // 「なぜ？」型：せいかい・ざんねんだけ（11章）
  if (type === "why") {
    const right = rating === "pita";
    return (
      <div className="relative flex flex-col gap-3.5">
        <Confetti />
        <Bubble mood={right ? "pitari" : "hazure"} color={right ? "text-red-dark" : "text-navi-dark"}>
          {right ? (
            <>
              せいかい！
              <br />
              すごい！
            </>
          ) : (
            <>
              ざんねん…
              <br />
              こたえは これ！
            </>
          )}
        </Bubble>
        {question.choices && guess.kind === "reason" && (
          <ul className="flex flex-col gap-2.5">
            {question.choices.map((c, i) => (
              <li
                key={i}
                className={`rounded-[22px] border-3 border-ink px-4 py-3 text-[19px] font-black leading-[1.7] ${
                  c.correct ? "bg-mint-light shadow-pop-sm" : i === guess.index ? "bg-pink-light" : "bg-white text-ink-sub"
                }`}
              >
                <span className="mb-0.5 block text-sm font-black">{c.correct ? "◎ せいかい" : i === guess.index ? "× きみの よそう" : ""}</span>
                <RubyText kana text={c.text} />
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (guessValue === null || actual === null) return null;

  const ref = type === "estimate" ? refParts(question, actual) : null;
  const ratio = actual / guessValue;
  const shown = formatNumber(actual);
  const chipText =
    rating === "pita" ? "ほぼ ぴったり！" : `よそうの ${ratioRuby(ratio)}${rating === "ohazure" ? "！" : ""}`;

  return (
    <div className="relative flex flex-col gap-3">
      <Confetti />
      <Bubble mood={look.mood} color={look.bubble}>
        {look.lines[0]}
        <br />
        {look.lines[1]}
      </Bubble>

      <section className="relative flex flex-col items-start gap-1 rounded-[30px] border-3 border-ink bg-white px-5 pb-[18px] pt-3.5 shadow-pop">
        <span className="text-[15px] font-black text-ink-sub">はてなの しょうたい</span>
        <div className="flex items-baseline gap-1 text-navi">
          <span className="font-pop leading-[1.15]" style={{ fontSize: bigSize(shown) }}>
            {animate ? <CountUp value={actual} from={0} format={formatNumber} /> : shown}
          </span>
          <span className="font-pop text-[32px] leading-[1.6]">
            <RubyText text={unitRuby(unit)} />
          </span>
        </div>
        <span className={`rounded-[18px] border-[2.5px] border-ink px-4 py-1 font-pop text-[22px] leading-[1.7] ${look.chip}`}>
          <RubyText text={chipText} />
        </span>
        <div className="absolute -right-2 -top-5">
          <Hanko rating={rating} animate={animate} />
        </div>
      </section>

      {type === "compare" && question.compare && (
        <p className="rounded-card border-3 border-ink bg-pink-light px-4 py-2.5 text-[19px] font-black leading-[1.7] shadow-pop-sm">
          {evaluation.correct === false ? "おおきいのは、きみが えらんだ ほうでは なかったよ。" : "おおきい ほうを あてたね！"}
          <br />
          <RubyText kana text={question.compare[evaluation.bigger ?? "a"]} /> が おおきいよ
        </p>
      )}

      <NumberLine guess={guessValue} actual={actual} unit={unit} intro={animate} />

      {ref && (
        <div className="flex items-center gap-3.5 rounded-card border-3 border-ink bg-mint-light px-[18px] py-3 shadow-pop-sm">
          <Icon name="bulb" size={34} fill="#FFC83D" stroke="#22223A" strokeWidth={1.8} />
          <span className="text-[19px] font-black leading-[1.7]">
            <RubyText kana text={ref.label} /> {isApprox(ref.value) ? "やく " : ""}
            {formatNumber(ref.value)}
            <RubyText kana text={`${unitRuby(ref.unit)}${ref.suffix}`} />
          </span>
        </div>
      )}

      <p className="text-center text-sm font-black text-ink-sub">きみの よそう：{describeGuess(guess, unit)}</p>
    </div>
  );
}
