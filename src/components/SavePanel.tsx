"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { stampCounts } from "@/lib/collection";
import { STAMP_GOAL, SUBJECT_KANA, TITLE_LABEL } from "@/lib/constants";
import { messageOf } from "@/lib/errors";
import type { Guess, Rating } from "@/lib/rating";
import type { Question } from "@/server/llm/schema";
import { useArchive } from "./ArchiveProvider";
import { Confetti, Hanko } from "./Decor";
import { Icon, Medal } from "./Icons";
import { SUBJECT_STYLE, TYPE_LABEL } from "./QuestionCard";
import { useQuiz } from "./QuizProvider";
import { Button } from "./ui";
import { kanaOf, stripRuby } from "@/lib/ruby";

/** ずかんのカード（見本 19）：つかまえた写真・はてな・きみのよそう→こたえ・はんこ */
export function CollectCard({ question, image, summary, rating }: { question: Question; image: string; summary: string; rating: Rating }) {
  const s = SUBJECT_STYLE[question.subject];
  // 「なぜ？」型は、ピタリ・はずれ ではなく、せいかい・ざんねん
  const label = question.type === "why" ? (rating === "pita" ? "せいかい" : "ざんねん") : undefined;
  return (
    <div className={`w-[300px] max-w-full -rotate-3 self-center rounded-[28px] border-2 border-ink/15 p-2 ${s.solid}`}>
      <div className="relative overflow-hidden rounded-[20px] border-3 border-ink bg-white">
        <div className="flex h-28 items-center justify-center border-b-3 border-ink bg-photo">
          {/* eslint-disable-next-line @next/next/no-img-element -- 囲んだ部分の切り抜き（data URL） */}
          <img src={image} alt={stripRuby(question.target)} className="size-full object-contain" />
        </div>
        <div className="flex flex-col gap-1.5 px-3.5 pb-3.5 pt-2.5">
          <span className={`self-start rounded-[10px] border-2 border-ink px-2.5 py-0.5 text-[13px] font-black ${s.light} ${s.dark}`}>
            {SUBJECT_KANA[question.subject]} ・ {TYPE_LABEL[question.type]}
          </span>
          {/* 小さい文字なので、ひらがなで出す */}
          <span className="text-[17px] font-black leading-[1.45]">{kanaOf(question.text)}</span>
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
      <div className="relative flex flex-1 flex-col gap-3.5">
        <Confetti />
        <h2 className="text-center font-pop text-[26px] font-normal">ずかんに のこそう！</h2>
        <CollectCard question={question} image={image} summary={summary} rating={rating} />

        <label className="mt-2 flex cursor-pointer items-start gap-3 rounded-card border-3 border-ink bg-pink-light px-4 py-3 shadow-pop-sm active:translate-y-1 active:shadow-none">
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
        <div className="mt-auto pt-2">
          <Button onClick={save} disabled={busy}>
            {busy ? "のこしているよ…" : "ずかんに のこす！"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 flex-col gap-3.5">
      <Confetti />
      <h2 className="mt-1 text-center font-pop text-[34px] font-normal leading-tight text-yellow [-webkit-text-stroke:2px_var(--color-ink)]">はてなゲット！</h2>
      <CollectCard question={question} image={image} summary={summary} rating={rating} />

      <section className={`mt-2 flex flex-col gap-2.5 rounded-card border-2 border-ink/15 px-4 py-3 ${s.light}`}>
        <div className={`flex items-center justify-between font-pop text-[17px] ${s.dark}`}>
          <span>{SUBJECT_KANA[question.subject]} スタンプ</span>
          <span>{earned ? `${STAMP_GOAL}/${STAMP_GOAL} そろった！` : `${shownStamps}/${STAMP_GOAL}`}</span>
        </div>
        <div className="grid grid-cols-5 justify-items-center gap-2" aria-label={`スタンプ ${shownStamps} / ${STAMP_GOAL}`}>
          {Array.from({ length: STAMP_GOAL }, (_, i) => {
            // いま もらったスタンプを光らせる（もう そろっているときは、どれも ふつうに出す）
            const isNew = count <= STAMP_GOAL && i === shownStamps - 1;
            return (
              <span
                key={i}
                className={`flex size-[46px] items-center justify-center rounded-full border-3 ${
                  i < shownStamps
                    ? `border-ink ${isNew ? "animate-bump bg-yellow shadow-[0_0_0_5px_#fff,0_0_0_8px_var(--color-ink)]" : s.solid}`
                    : "border-dashed border-ink-muted bg-white"
                }`}
              >
                {isNew && <Icon name="star" size={24} fill="#FFFFFF" stroke="#22223A" strokeWidth={2} />}
              </span>
            );
          })}
        </div>
        {!earned && (
          <span className={`text-sm font-black ${s.dark}`}>
            あと {STAMP_GOAL - shownStamps}こで「{TITLE_LABEL[question.subject]}」
          </span>
        )}
      </section>

      {earned && count === STAMP_GOAL && (
        <div className="flex items-center gap-3 rounded-card border-2 border-ink/15 bg-purple px-4 py-3 text-white">
          <Medal size={40} />
          <div className="flex flex-col">
            <span className="text-[15px] font-black">しょうごう ゲット！</span>
            <span className="font-pop text-[22px]">{TITLE_LABEL[question.subject]}</span>
          </div>
        </div>
      )}

      <div className="mt-auto flex gap-2.5 pt-2">
        <button
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
