"use client";

import { useEffect, useState } from "react";
import { FRACTION_GRADE, formatNumber, isApprox, numberLength, numberRuby, TIMES_GRADE } from "@/lib/format";
import { describeGuess, RATING_LABEL, type Evaluation, type Guess, type Rating } from "@/lib/rating";
import { refParts } from "@/lib/ref";
import { unitRuby } from "@/lib/ruby";
import { useReducedMotion } from "@/lib/useReducedMotion";
import type { Question } from "@/server/llm/schema";
import { Burst, Confetti, Glints, Hanamaru, Hanko, Shock } from "./Decor";
import { CountUp } from "./CountUp";
import { Icon } from "./Icons";
import { Navigator, type Mood } from "./Navigator";
import { NumberLine } from "./NumberLine";
import { Jp, RubyText } from "./RubyText";

export function ratingText(rating: Rating, type: Question["type"]): string {
  if (type === "why") return rating === "pita" ? "{正解|せいかい}！" : "ざんねん…";
  return RATING_LABEL[rating];
}

/**
 * 倍率を、ふりがなつきの書きかたにする（「約7倍」「約20分の1」）。22px以上の文字なので、漢字にはふりがなを付ける。
 * grade を渡すと、学年に合わせる（docs/02-spec.md 2.4）：「倍」は2年、「○分の1」は3年から。それより前は「○より ずっと おおい・すくない」と言う
 */
export function ratioRuby(ratio: number, grade?: number): string {
  if (!Number.isFinite(ratio) || ratio <= 0) return "";
  const big = ratio >= 1;
  const v = big ? ratio : 1 / ratio;
  if (grade !== undefined && grade < (big ? TIMES_GRADE : FRACTION_GRADE)) {
    const much = v >= 2 ? "ずっと" : "{少|すこ}し";
    return big ? `${much} {多|おお}い` : `${much} {少|すく}ない`;
  }
  const n = numberRuby(v >= 10 ? Math.round(v) : Math.round(v * 10) / 10, grade);
  return big ? `{約|やく}${n}{倍|ばい}` : `{約|やく}${n}{分|ぶん}の1`;
}

/** 「よそうの 約5倍」「もとの 約20分の1」のように、くらべる もとを つけて言う（1年生などは「よそうより ずっと おおい」） */
export function ratioWith(base: string, ratio: number, grade?: number): string {
  const phrase = grade !== undefined && grade < (ratio >= 1 ? TIMES_GRADE : FRACTION_GRADE);
  return `${base}${phrase ? "より" : "の"} ${ratioRuby(ratio, grade)}`;
}

// 評価ごとの、ナビの顔・ふきだしの地と文字の色・答えのカードの地・ひとことの札の色（赤は「ピタリ」だけに使う。見本 14〜16）
const LOOK: Record<Rating, { mood: Mood; bubble: string; lines: [string, string]; card: string; chip: string; ring: string }> = {
  pita: { mood: "pitari", bubble: "bg-red-light text-red-dark", lines: ["ピタリ！", "すごい！"], card: "bg-red-light", chip: "bg-white text-red-dark", ring: "border-red" },
  oshii: { mood: "oshii", bubble: "bg-navi-light text-ink", lines: ["おしい！", "あと {少|すこ}し！"], card: "bg-orange-light", chip: "bg-white text-orange-dark", ring: "border-orange" },
  ohazure: { mood: "hazure", bubble: "bg-navi-light text-navi-dark", lines: ["こんなに", "ちがうの！？"], card: "bg-navi-light", chip: "bg-yellow text-ink", ring: "border-navi" },
};

// 数が ふえおわって（CountUp は 900ms）、ひといき おいてから、はんこを押して 結果を言う。それまでは「どきどき」で じらす
const REVEAL_MS = 1150;
// 「なぜ？」型は、数が ふえる動きが ないので、みじかく じらす
const REVEAL_WHY_MS = 900;

/**
 * 結果（ピタリ・おしい・大はずれ／正解・ざんねん）を、もう言ってよいか。
 * animate のときは、はじめは false で、wait ミリ秒たつと true になる（じらしてから言う）。動きを減らす設定・見返すとき（animate が false）は、はじめから true
 */
function useReveal(animate: boolean, wait: number): boolean {
  const reduced = useReducedMotion();
  const [timeUp, setTimeUp] = useState(false);
  const staged = animate && !reduced;
  useEffect(() => {
    if (!staged) return;
    const timer = setTimeout(() => setTimeUp(true), wait);
    return () => clearTimeout(timer);
  }, [staged, wait]);
  return !staged || timeUp;
}

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

/**
 * 数が ふえている とちゅうの数を、答えと同じ こまかさ（整数か、小数の けた数）に そろえる。
 * とちゅうだけ 小数が出ると、けたが のびて 単位が折り返し、カードの たかさが 変わってしまうため
 */
function stepLike(value: number, target: number): number {
  const decimals = Math.min(4, (String(target).split(".")[1] ?? "").length);
  const k = 10 ** decimals;
  return Math.round(value * k) / k;
}

/** 大きく出す数（万・億などは、習った漢字なら ふりがなを付け、まだなら ひらがなで書く） */
const bigNumber = (value: number, grade?: number) => <RubyText text={numberRuby(value, grade)} />;

/** ナビの反応（下から飛び出して登場する）。ふきだしは押せないので地の色だけ。color には地と文字の色を渡す。pop のときは、ふきだしも ぽんっと出る */
function Bubble({ children, color, mood, react, pop = false, size = 128 }: { children: React.ReactNode; color: string; mood: Mood; react: boolean; pop?: boolean; size?: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <Navigator mood={mood} size={size} react={react} />
      <div className={`relative grow rounded-card px-4 py-3 font-pop text-[24px] leading-[1.45] ${color} ${pop ? "animate-pop-in origin-left" : ""}`}>
        <span aria-hidden className={`absolute -left-2 top-[calc(50%-8px)] size-4 rotate-45 ${color}`} />
        <span className="relative">{children}</span>
      </div>
    </div>
  );
}

/** 結果を言う前の「どきどき」（ナビは ぎゅっと 目をつぶる）。まだ 結果は 言わない */
function Drumroll({ second }: { second: string }) {
  return (
    <Bubble react mood="effort" color="bg-navi-light text-ink">
      <Jp big>{"{答|こた}えは…"}</Jp>
      <br />
      {second}
    </Bubble>
  );
}

/**
 * 答え合わせ（見本 14〜16「こたえあわせ」）。
 * animate のときは、「どきどき」→ 結果（はんこ・ナビの反応・評価ごとの演出）の順に見せる。false のとき（ずかんで見返すとき・なぞときから もどったとき）は動かさない。
 * action（「なぞときへ！」のボタン）を渡すと、1画面を まるごと使う形にする：画面の たかさ いっぱいに広がり、ボタンを いちばん下に置いて、
 * のこった空白を かたまりの切れ目に同じだけ分ける（docs/design/README.md「余白」）
 */
export function ResultSummary({
  question,
  guess,
  evaluation,
  grade,
  animate = true,
  action,
}: {
  question: Question;
  guess: Guess;
  evaluation: Evaluation;
  /** 万・億などを漢字で書くか ひらがなで書くかを決める学年 */
  grade?: number;
  animate?: boolean;
  action?: React.ReactNode;
}) {
  const { rating, type, guessValue, actual } = evaluation;
  const shown = useReveal(animate, type === "why" ? REVEAL_WHY_MS : REVEAL_MS);
  // 結果を言った しゅんかんの動き（見返すときは つけない）
  const fresh = animate && shown;
  const unit = type === "compare" ? "倍" : question.answerUnit;
  const look = LOOK[rating];
  // 1画面を まるごと使うか（かたまりの切れ目に mt-auto を付けて、空白を分ける）
  const full = action !== undefined;
  const frame = `relative flex flex-col gap-4 ${full ? "flex-1" : ""}`;
  const footer = full ? <div className="mt-auto">{action}</div> : null;

  // 「なぜ？」型：せいかい・ざんねんだけ（11章）
  if (type === "why") {
    const right = rating === "pita";
    return (
      <div className={frame}>
        <Confetti />
        {fresh && right && <Burst tone="pita" y={30} rain />}
        {shown ? (
          <Bubble key="result" react={animate} pop={fresh} mood={right ? "pitari" : "hazure"} color={right ? "bg-red-light text-red-dark" : "bg-navi-light text-navi-dark"}>
            {right ? (
              <>
                <Jp big>{"{正解|せいかい}！"}</Jp>
                <br />
                すごい！
              </>
            ) : (
              <>
                ざんねん…
                <br />
                {/* ふきだしの はばに 1行で おさめる（「これ！」の とちゅうで 折り返さないように） */}
                <span className="whitespace-nowrap text-[22px]">こたえは これ！</span>
              </>
            )}
          </Bubble>
        ) : (
          <Drumroll key="wait" second="どれかな…？" />
        )}
        {question.choices && guess.kind === "reason" && (
          <ul className={`flex flex-col gap-2.5 ${full ? "mt-auto" : ""}`}>
            {question.choices.map((c, i) => {
              const mine = i === guess.index;
              const correct = shown && c.correct;
              return (
                <li
                  key={i}
                  className={`relative rounded-[22px] px-4 py-3 text-[19px] font-black leading-[1.7] transition-colors duration-300 ${
                    correct ? "bg-mint-light" : mine ? "bg-pink-light" : "bg-cloud text-ink-sub"
                  } ${fresh && c.correct ? "animate-bump" : ""} ${fresh && mine && !c.correct ? "animate-shake" : ""}`}
                >
                  <span className="mb-0.5 block text-sm font-black">
                    <Jp>{correct ? (mine ? "◎ {正解|せいかい}（きみの {予想|よそう}）" : "◎ {正解|せいかい}") : mine ? (shown ? "× きみの {予想|よそう}" : "きみの {予想|よそう}") : ""}</Jp>
                  </span>
                  <RubyText kana text={c.text} />
                  {/* 正解を 当てたときだけ、はなまるを かく（赤は 正解だけに使う） */}
                  {correct && mine && <Hanamaru size={72} animate={fresh} delay={0.15} className="absolute -right-2 -top-6" />}
                </li>
              );
            })}
          </ul>
        )}
        {footer}
      </div>
    );
  }

  if (guessValue === null || actual === null) return null;

  const ref = type === "estimate" ? refParts(question, actual) : null;
  const ratio = actual / guessValue;
  // 範囲で予想したときは、倍率ではなく、選んだ範囲との ちかさで言う（まんなかの数から計算した倍率は、子どもが選んだ数ではない）
  const range = guess.kind === "bin" ? { min: guess.edges[guess.index], max: guess.edges[guess.index + 1] } : null;
  const chipText = range
    ? rating === "pita"
      ? "ぴったり この はんい！"
      : rating === "oshii"
        ? "おしい！ となりの はんい"
        : `{予想|よそう}より ずっと ${ratio >= 1 ? "{多|おお}い" : "{少|すく}ない"}！`
    : rating === "pita"
      ? "ほぼ ぴったり！"
      : `${ratioWith("{予想|よそう}", ratio, grade)}${rating === "ohazure" ? "！" : ""}`;

  return (
    <div className={frame}>
      <Confetti />
      {/* 評価ごとの演出（1回だけ）：ピタリ＝紙ふぶき、おしい＝きらきら、大はずれ＝びっくりの線 */}
      {fresh && rating === "pita" && <Burst tone="pita" rain />}
      {fresh && rating === "oshii" && (
        <>
          <Burst tone="oshii" x={82} y={31} delay={0.45} />
          <Glints />
        </>
      )}
      {fresh && rating === "ohazure" && <Shock />}

      {shown ? (
        <Bubble key="result" react={animate} pop={fresh} mood={look.mood} color={look.bubble}>
          <Jp big>{look.lines[0]}</Jp>
          <br />
          <Jp big>{look.lines[1]}</Jp>
        </Bubble>
      ) : (
        <Drumroll key="wait" second="どきどき…" />
      )}

      <section
        className={`relative flex flex-col items-start gap-1 rounded-[30px] px-5 pb-[18px] pt-3.5 transition-colors duration-300 ${full ? "mt-auto" : ""} ${
          shown ? look.card : "bg-cloud"
        } ${fresh && rating === "ohazure" ? "animate-shake" : ""}`}
      >
        <span className="text-[15px] font-black text-ink-sub">はてなの こたえあわせ</span>
        <div className={`flex items-baseline gap-1 text-navi ${fresh ? "animate-bump origin-left" : ""}`}>
          <span className={`font-pop leading-[1.15] ${shown ? "" : "animate-drum"}`} style={{ fontSize: bigSize(actual, grade) }}>
            {animate ? <CountUp value={actual} from={0} format={(n) => bigNumber(stepLike(n, actual), grade)} /> : bigNumber(actual, grade)}
          </span>
          <span className="whitespace-nowrap font-pop text-[32px] leading-[1.6]">
            <RubyText text={unitRuby(unit)} />
          </span>
        </div>
        {/* 結果を言うまでは、場所だけ取っておく（出たときに 画面が ずれないように） */}
        <span className={`rounded-[18px] px-4 py-1 font-pop text-[22px] leading-[1.7] ${look.chip} ${shown ? (fresh ? "animate-pop-in origin-left [animation-delay:0.35s]" : "") : "invisible"}`}>
          <RubyText text={chipText} />
        </span>
        {shown && (
          <div className="absolute -right-2 -top-5">
            {/* はんこを 押した しゅんかんに、輪が 広がる */}
            {fresh && <span aria-hidden className={`animate-ring absolute inset-1 rounded-full border-[5px] [animation-delay:0.55s] ${look.ring}`} />}
            <Hanko rating={rating} animate={animate} />
          </div>
        )}
      </section>

      {type === "compare" && question.compare && (
        <p className={`rounded-card bg-pink-light px-4 py-2.5 text-[19px] font-black leading-[1.7] ${shown ? (fresh ? "animate-pop-in" : "") : "invisible"}`}>
          <Jp>{evaluation.correct === false ? "{大|おお}きいのは、きみが {選|えら}んだ ほうでは なかったよ。" : "{大|おお}きい ほうを {当|あ}てたね！"}</Jp>
          <br />
          <RubyText kana text={question.compare[evaluation.bigger ?? "a"]} /> <Jp>{"が {大|おお}きいよ"}</Jp>
        </p>
      )}

      <NumberLine guess={guessValue} guessRange={range ?? undefined} actual={actual} unit={unit} intro={animate} grade={grade} />

      {ref && (
        <div className={`flex items-center gap-3.5 rounded-card bg-mint-light px-[18px] py-3 ${full ? "mt-auto" : ""}`}>
          <Icon name="bulb" size={34} fill="#FFC83D" stroke="#22223A" strokeWidth={1.8} />
          <span className="text-[19px] font-black leading-[1.7]">
            <RubyText kana text={ref.label} /> {isApprox(ref.value) ? "やく " : ""}
            {formatNumber(ref.value, grade)}
            <RubyText kana text={`${unitRuby(ref.unit)}${ref.suffix}`} />
          </span>
        </div>
      )}

      {!range && (
        <p className="text-center text-sm font-black text-ink-sub">
          <Jp>{"きみの {予想|よそう}："}</Jp>
          {describeGuess(guess, unit, grade)}
        </p>
      )}
      {footer}
    </div>
  );
}
