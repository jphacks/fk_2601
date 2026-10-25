"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { stampCounts } from "@/lib/collection";
import { STAMP_GOAL, SUBJECT_KANA, TITLE_LABEL } from "@/lib/constants";
import { messageOf } from "@/lib/errors";
import type { Guess, Rating } from "@/lib/rating";
import type { Question } from "@/server/llm/schema";
import { useArchive } from "./ArchiveProvider";
import { Confetti, Hanko, SideConfetti, Sparkle, Spotlight } from "./Decor";
import { Medal } from "./Icons";
import { Navigator } from "./Navigator";
import { SUBJECT_STYLE, TYPE_LABEL } from "./QuestionCard";
import { useQuiz } from "./QuizProvider";
import { Stamp } from "./StampCards";
import { Button } from "./ui";
import { kanaOf, stripRuby } from "@/lib/ruby";

/** ずかんのカード（見本 19）：つかまえた写真・はてな・きみのよそう→こたえ・はんこ */
export function CollectCard({ question, image, summary, rating }: { question: Question; image: string; summary: string; rating: Rating }) {
  const s = SUBJECT_STYLE[question.subject];
  // 「なぜ？」型は、ピタリ・はずれ ではなく、せいかい・ざんねん
  const label = question.type === "why" ? (rating === "pita" ? "せいかい" : "ざんねん") : undefined;
  return (
    <div className={`w-[300px] max-w-full -rotate-3 self-center rounded-[28px] p-2 ${s.solid}`}>
      <div className="relative overflow-hidden rounded-[20px] bg-white">
        <div className="flex h-28 items-center justify-center bg-photo">
          {/* eslint-disable-next-line @next/next/no-img-element -- 囲んだ部分の切り抜き（data URL） */}
          <img src={image} alt={stripRuby(question.target)} className="size-full object-contain" />
        </div>
        <div className="flex flex-col gap-1.5 px-3.5 pb-3.5 pt-2.5">
          <span className={`self-start rounded-[10px] px-2.5 py-0.5 text-[13px] font-black ${s.light} ${s.dark}`}>
            {SUBJECT_KANA[question.subject]} ・ {kanaOf(question.topic) || TYPE_LABEL[question.type]}
          </span>
          {/* 小さい文字なので、ひらがなで出す */}
          <span className="text-[18px] font-black leading-[1.45]">{kanaOf(question.text)}</span>
          <span className="font-pop text-[15px]">{summary}</span>
        </div>
        <div className="absolute right-1.5 top-[70px]">
          <Hanko rating={rating} label={label} size={74} />
        </div>
      </div>
    </div>
  );
}

/** 答え合わせのあと、ずかんに保存する（見本 19「はてなゲット！」）。匿名で他の人に見せるかも選べる */
export function SavePanel({
  question,
  guess,
  rating,
  image,
  summary,
}: {
  question: Question;
  guess: Guess;
  rating: Rating;
  image: string;
  /** 「きみ 100 → こたえ 720」のような、カードに入れる一行 */
  summary: string;
}) {
  const router = useRouter();
  // 保存したかは、問いの状態に持つ（画面をもどっても、同じ問いを2回保存しない）
  const { saved, markSaved } = useQuiz();
  const { archives, add } = useArchive();
  const [publish, setPublish] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (saved || busy) return;
    setBusy(true);
    setError(null);
    try {
      await add({ question, guess, rating, image, publish });
      markSaved();
    } catch (e) {
      setError(messageOf(e));
    }
    setBusy(false);
  }

  // ここで問いの状態を消すと、答え合わせの画面が先に「撮影へ」と動いてしまうので、消さずに移動する（次に撮ったときに入れかわる）
  function leave(to: string) {
    router.push(to);
  }

  const s = SUBJECT_STYLE[question.subject];
  const count = saved ? stampCounts(archives)[question.subject] : 0;
  const earned = count >= STAMP_GOAL;
  const shownStamps = Math.min(count, STAMP_GOAL);

  if (!saved) {
    return (
      <div className="relative flex flex-1 flex-col gap-4">
        <SideConfetti />
        <div className="flex items-center justify-center gap-2">
          <Sparkle color="#FF6F9C" size={22} />
          {/* 1行に おさまるよう、画面の はばに合わせて 文字を小さくする */}
          <h2 className="whitespace-nowrap font-pop text-[clamp(20px,7vw,28px)] font-normal leading-tight text-yellow [-webkit-text-stroke:2px_var(--color-ink)]">
            ずかんに のこそう！
          </h2>
          <Sparkle color="#24C3A0" size={22} delay={0.6} />
        </div>
        <Spotlight>
          <CollectCard question={question} image={image} summary={summary} rating={rating} />
        </Spotlight>

        <label className="flex cursor-pointer items-start gap-3 rounded-card border-3 border-ink bg-pink-light px-4 py-3 shadow-pop-sm active:translate-y-1 active:shadow-none">
          <input type="checkbox" checked={publish} onChange={(e) => setPublish(e.target.checked)} className="mt-1 size-6 shrink-0 accent-[var(--color-pink)]" />
          <span className="text-[19px] font-black leading-[1.6]">
            みんなにも みせる
            <span className="block text-sm font-bold text-pink-dark">なまえは でないよ。かこんだ しゃしんと はてなだけ みえるよ。</span>
          </span>
        </label>

        {error && (
          <p role="alert" className="rounded-[20px] bg-pink-light px-4 py-3 text-base font-black text-pink-dark">
            {error}
          </p>
        )}
        <div className="mt-auto">
          <Button onClick={save} disabled={busy}>
            {busy ? "のこしているよ…" : "ずかんに のこす！"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 flex-col gap-4">
      <Confetti />
      <div className="flex items-center justify-center gap-1.5">
        <Navigator mood="happy" size={70} react />
        <h2 className="font-pop text-[34px] font-normal leading-tight text-yellow [-webkit-text-stroke:2px_var(--color-ink)]">はてなゲット！</h2>
      </div>
      <CollectCard question={question} image={image} summary={summary} rating={rating} />

      <section className={`mt-auto flex flex-col gap-2.5 rounded-card px-4 py-3 ${s.light}`}>
        <div className={`flex items-center justify-between font-pop text-[17px] ${s.dark}`}>
          <span>{SUBJECT_KANA[question.subject]} スタンプ</span>
          <span>{earned ? `${STAMP_GOAL}/${STAMP_GOAL} そろった！` : `${shownStamps}/${STAMP_GOAL}`}</span>
        </div>
        <div className="grid grid-cols-5 items-center justify-items-center gap-2" role="img" aria-label={`スタンプ ${STAMP_GOAL}こちゅう ${shownStamps}こ`}>
          {Array.from({ length: STAMP_GOAL }, (_, i) => {
            // いま もらったスタンプを、黄色い丸で目立たせる（もう そろっているときは、どれも ふつうに出す）
            const isNew = count <= STAMP_GOAL && i === shownStamps - 1;
            if (isNew) {
              return (
                <span key={i} className="-my-[5px] flex size-[60px] items-center justify-center rounded-full border-3 border-ink bg-yellow">
                  <Stamp subject={question.subject} size={46} react />
                </span>
              );
            }
            return <Stamp key={i} subject={i < shownStamps ? question.subject : null} size={50} />;
          })}
        </div>
        {!earned && (
          <span className={`text-sm font-black ${s.dark}`}>
            あと {STAMP_GOAL - shownStamps}こで「{TITLE_LABEL[question.subject]}」
          </span>
        )}
      </section>

      {earned && count === STAMP_GOAL && (
        <div className="flex items-center gap-3 rounded-card bg-purple px-4 py-3 text-white">
          <Medal size={40} />
          <div className="flex flex-col">
            <span className="text-[15px] font-black">しょうごう ゲット！</span>
            <span className="font-pop text-[22px]">{TITLE_LABEL[question.subject]}</span>
          </div>
        </div>
      )}

      <div className="mt-auto flex gap-2.5">        <button
          type="button"
          onClick={() => leave("/archive")}
          className="flex h-[68px] flex-1 items-center justify-center rounded-3xl border-3 border-ink bg-white text-lg font-black shadow-pop-md active:translate-y-[4px] active:shadow-none"
        >
          ずかんを みる
        </button>
        <button
          type="button"
          onClick={() => leave("/capture")}
          className="flex h-[68px] flex-[1.2] items-center justify-center rounded-3xl border-3 border-ink bg-navi font-pop text-[19px] text-white shadow-pop-md active:translate-y-[4px] active:shadow-none"
        >
          もっと さがす！
        </button>
      </div>
    </div>
  );
}
