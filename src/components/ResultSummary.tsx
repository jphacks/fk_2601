"use client";

import { formatNumber, isApprox, numberLength, numberRuby } from "@/lib/format";
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

/** 倍率を、ふりがなつきの書きかたにする（「約7倍」「約20分の1」）。22px以上の文字なので、漢字にはふりがなを付ける。grade は万・億などの書き方に使う */
export function ratioRuby(ratio: number, grade?: number): string {
  if (!Number.isFinite(ratio) || ratio <= 0) return "";
  const big = ratio >= 1;
  const v = big ? ratio : 1 / ratio;
  const n = numberRuby(v >= 10 ? Math.round(v) : Math.round(v * 10) / 10, grade);
  return big ? `{約|やく}${n}{倍|ばい}` : `{約|やく}${n}{分|ぶん}の1`;
}

// 評価ごとの、ナビの顔・ふきだしの地と文字の色・答えのカードの地・ひとことの札の色（赤は「ピタリ」だけに使う。見本 14〜16）
const LOOK: Record<Rating, { mood: Mood; bubble: string; lines: [string, string]; card: string; chip: string }> = {
  pita: { mood: "pitari", bubble: "bg-red-light text-red-dark", lines: ["ピタリ！", "すごい！"], card: "bg-red-light", chip: "bg-white text-red-dark" },
  oshii: { mood: "oshii", bubble: "bg-navi-light text-ink", lines: ["おしい！", "あと すこし！"], card: "bg-orange-light", chip: "bg-white text-orange-dark" },
  ohazure: { mood: "hazure", bubble: "bg-navi-light text-navi-dark", lines: ["こんなに", "ちがうの！？"], card: "bg-navi-light", chip: "bg-yellow text-ink" },
};

/** こたえの数の大きさ（桁が多いときは小さくする。見本は 92px 以上） */
function bigSize(value: number, grade?: number): number {
  const length = numberLength(value, grade);
  if (length <= 3) return 92;
  if (length <= 5) return 72;
  if (length <= 7) return 54;
  if (length <= 10) return 40;
  if (length <= 12) return 32;
  return 28;
}

/** 大きく出す数（万・億などは、習った漢字なら ふりがなを付け、まだなら ひらがなで書く） */
const bigNumber = (value: number, grade?: number) => <RubyText text={numberRuby(value, grade)} />;

/** ナビの反応（下から飛び出して登場する）。ふきだしは押せないので地の色だけ。color には地と文字の色を渡す */
function Bubble({ children, color, mood, react, size = 128 }: { children: React.ReactNode; color: string; mood: Mood; react: boolean; size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <Navigator mood={mood} size={size} react={react} />
      <div className={`relative grow rounded-card px-4 py-3 font-pop text-[24px] leading-[1.45] ${color}`}>
        <span aria-hidden className={`absolute -left-2 top-[calc(50%-8px)] size-4 rotate-45 ${color}`} />
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
  grade,
  animate = true,
}: {
  question: Question;
  guess: Guess;
  evaluation: Evaluation;
  /** 万・億などを漢字で書くか ひらがなで書くかを決める学年 */
  grade?: number;
  animate?: boolean;
}) {
  const { rating, type, guessValue, actual } = evaluation;
  const unit = type === "compare" ? "倍" : question.answerUnit;
  const look = LOOK[rating];

  // 「なぜ？」型：せいかい・ざんねんだけ（11章）
  if (type === "why") {
    const right = rating === "pita";
    return (
      <div className="relative flex flex-col gap-4">
        <Confetti />
        <Bubble react={animate} mood={right ? "pitari" : "hazure"} color={right ? "bg-red-light text-red-dark" : "bg-navi-light text-navi-dark"}>
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
                className={`rounded-[22px] px-4 py-3 text-[19px] font-black leading-[1.7] ${
                  c.correct ? "bg-mint-light" : i === guess.index ? "bg-pink-light" : "bg-cloud text-ink-sub"
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
  const chipText =
    rating === "pita" ? "ほぼ ぴったり！" : `よそうの ${ratioRuby(ratio, grade)}${rating === "ohazure" ? "！" : ""}`;

  return (
    <div className="relative flex flex-col gap-4">
      <Confetti />
      <Bubble react={animate} mood={look.mood} color={look.bubble}>
        {look.lines[0]}
        <br />
        {look.lines[1]}
      </Bubble>

      <section className={`relative flex flex-col items-start gap-1 rounded-[30px] px-5 pb-[18px] pt-3.5 ${look.card}`}>
        <span className="text-[15px] font-black text-ink-sub">はてなの しょうたい</span>
        <div className="flex items-baseline gap-1 text-navi">
          <span className="font-pop leading-[1.15]" style={{ fontSize: bigSize(actual, grade) }}>
            {animate ? <CountUp value={actual} from={0} format={(n) => bigNumber(n, grade)} /> : bigNumber(actual, grade)}
          </span>
          <span className="font-pop text-[32px] leading-[1.6]">
            <RubyText text={unitRuby(unit)} />
          </span>
        </div>
        <span className={`rounded-[18px] px-4 py-1 font-pop text-[22px] leading-[1.7] ${look.chip}`}>
          <RubyText text={chipText} />
        </span>
        <div className="absolute -right-2 -top-5">
          <Hanko rating={rating} animate={animate} />
        </div>
      </section>

      {type === "compare" && question.compare && (
        <p className="rounded-card bg-pink-light px-4 py-2.5 text-[19px] font-black leading-[1.7]">
          {evaluation.correct === false ? "おおきいのは、きみが えらんだ ほうでは なかったよ。" : "おおきい ほうを あてたね！"}
          <br />
          <RubyText kana text={question.compare[evaluation.bigger ?? "a"]} /> が おおきいよ
        </p>
      )}

      <NumberLine guess={guessValue} actual={actual} unit={unit} intro={animate} />

      {ref && (
        <div className="flex items-center gap-3.5 rounded-card bg-mint-light px-[18px] py-3">
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
