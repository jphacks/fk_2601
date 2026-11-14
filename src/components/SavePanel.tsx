"use client";

import { Jp, RubyText } from "./RubyText";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { stampCounts } from "@/lib/collection";
import { groupOf, STAMP_GOAL, SUBJECT_JP, type GroupId } from "@/lib/constants";
import { naviStage, naviStageInfo } from "@/lib/navi";
import { progressPoints } from "@/lib/progress";
import { newlyEarned, nextGoal, TIER_LABEL, TITLE_FAMILIES, titleLabel, titleStats, titleTier } from "@/lib/titles";
import { messageOf } from "@/lib/errors";
import type { Guess, Rating } from "@/lib/rating";
import type { Question } from "@/server/llm/schema";
import { useArchive } from "./ArchiveProvider";
import { useApp } from "./AuthProvider";
import { Bunting, Confetti, Hanko, Rays, SideConfetti, Sparkle, Spotlight } from "./Decor";
import { Medal } from "./Icons";
import { MyNavigator, useNaviLook } from "./MyNavigator";
import { Navigator, type Mood } from "./Navigator";
import { SUBJECT_STYLE, TYPE_LABEL } from "./QuestionCard";
import { useQuiz } from "./QuizProvider";
import { Stamp } from "./StampCards";
import { Button, CHOICE_DOWN, CHOICE_UP, Say } from "./ui";
import { needsDetail } from "@/lib/questionDetail";
import { stripRuby } from "@/lib/ruby";
import type { Feeling } from "@/lib/types";

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
            <Jp>{`${SUBJECT_JP[question.subject]} ・ ${question.topic || TYPE_LABEL[question.type]}`}</Jp>
          </span>
          {/* 小さい文字なので、ふりがなを付けず、学年に合わせて出す */}
          <RubyText kana className="text-[18px] font-black leading-[1.45]" text={question.text} />
          <Jp className="font-pop text-[15px]">{summary}</Jp>
        </div>
        <div className="absolute right-1.5 top-[70px]">
          <Hanko rating={rating} label={label} size={74} />
        </div>
      </div>
    </div>
  );
}

/** 「この はてな、どうだった？」の3つ（顔は ナビの表情。小さい文字なので ひらがなで書く）。次の問いを作る手がかりになる（#164） */
const FEELINGS: { id: Feeling; label: string; mood: Mood; off: string; on: string }[] = [
  { id: "fun", label: "おもしろい！", mood: "happy", off: "bg-pink-light", on: "bg-pink" },
  { id: "ok", label: "ふつう", mood: "sorry", off: "bg-mint-light", on: "bg-mint" },
  { id: "hard", label: "むずかしい", mood: "effort", off: "bg-orange-light", on: "bg-orange" },
];

/** 答え合わせのあと、ずかんに保存する（見本 19「はてなゲット！」）。入っているグループの なかまに、名前を出さずに見せるかも選べる */
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
  // 解説が まだ 来ていない問い（2回目の待ち・失敗）は、保存しない。解説が空の記録が ずかんに のこらないように（#165）
  const noDetail = needsDetail(question);
  const { archives, add } = useArchive();
  const { memberships } = useApp();
  // 見せるグループ（はじめは どこにも見せない）
  const [picked, setPicked] = useState<GroupId[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareFailed, setShareFailed] = useState(false);
  // どうだった？（えらばなくても 保存できる。もう一度 押すと、えらびなおせる）
  const [feeling, setFeeling] = useState<Feeling | null>(null);

  function toggle(id: GroupId, on: boolean) {
    setPicked((prev) => (on ? [...prev.filter((g) => g !== id), id] : prev.filter((g) => g !== id)));
  }

  async function save() {
    if (saved || busy || noDetail) return;
    setBusy(true);
    setError(null);
    try {
      // 入っているグループだけに見せる（ルールでも、メンバーでないグループには書けない）
      const groups = picked.filter((g) => memberships?.some((m) => m.groupId === g));
      const result = await add({ question, guess, rating, image, groups, ...(feeling ? { feeling } : {}) });
      setShareFailed(result.shareFailed);
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
  // 保存した記録は、ずかんの いちばん前（新しい順）。それを足して、新しく もらえた称号
  const gotTitles = saved && archives.length > 0 ? newlyEarned(archives.slice(1), archives) : [];
  const subjectFamily = TITLE_FAMILIES.find((f) => f.id === question.subject);
  const subjectNext = saved && subjectFamily ? nextGoal(subjectFamily, titleStats(archives)) : null;
  // ナビが そだったか（この1つで、段階が上がったときだけ。#193）
  const { stage: naviNow } = useNaviLook();
  const grewTo = saved && archives.length > 0 && naviStage(progressPoints(archives.slice(1))) < naviNow ? naviStageInfo(naviNow) : null;

  if (!saved) {
    return (
      <div className="relative flex flex-1 flex-col gap-4">
        <Rays />
        <SideConfetti />
        <Bunting />
        <div className="flex items-center justify-center gap-2">
          <Sparkle color="#FF6F9C" size={22} />
          {/* 1行に おさまるよう、画面の はばに合わせて 文字を小さくする */}
          <h2 className="whitespace-nowrap font-pop text-[clamp(20px,7vw,28px)] font-normal leading-tight text-yellow [-webkit-text-stroke:2px_var(--color-ink)]">
            <Jp big>{"ずかんに {残|のこ}そう！"}</Jp>
          </h2>
          <Sparkle color="#24C3A0" size={22} delay={0.6} />
        </div>
        <Spotlight>
          <CollectCard question={question} image={image} summary={summary} rating={rating} />
        </Spotlight>

        {memberships && memberships.length > 0 && (
          <fieldset className="flex flex-col gap-2 rounded-card border-3 border-ink bg-pink-light px-4 py-3 shadow-pop-sm">
            <legend className="sr-only">グループの なかまにも みせる</legend>
            <span aria-hidden="true" className="text-[19px] font-black leading-[1.6]">
              <Jp>{"なかまにも {見|み}せる"}</Jp>
              <span className="block text-sm font-bold text-pink-dark">
                <Jp>{"{名前|なまえ}は {出|で}ないよ。{囲|かこ}んだ {写真|しゃしん}と はてなだけ、{選|えら}んだ グループの なかまに {見|み}えるよ。"}</Jp>
              </span>
            </span>
            {memberships.map((m) => (
              <label
                key={m.groupId}
                className="flex cursor-pointer items-center gap-3 rounded-[16px] border-3 border-ink bg-white px-3 py-2 active:translate-y-0.5"
              >
                <input
                  type="checkbox"
                  checked={picked.includes(m.groupId)}
                  onChange={(e) => toggle(m.groupId, e.target.checked)}
                  className="size-6 shrink-0 accent-[var(--color-pink)]"
                />
                {/* 小さい文字なので、ひらがなで出す */}
                <span className="text-[19px] font-black">{groupOf(m.groupId).kana}</span>
              </label>
            ))}
          </fieldset>
        )}

        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-[19px] font-black">この はてな、どうだった？</legend>
          <div className="grid grid-cols-3 gap-2.5">
            {FEELINGS.map((f) => {
              const on = feeling === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setFeeling(on ? null : f.id)}
                  className={`flex flex-col items-center justify-center gap-0.5 rounded-[20px] border-3 border-ink px-1 py-2 text-[clamp(13px,3.7vw,16px)] font-black ${
                    on ? `${f.on} ${CHOICE_DOWN}` : `${f.off} ${CHOICE_UP}`
                  }`}
                >
                  <Navigator mood={f.mood} size={44} />
                  <span className="whitespace-nowrap">{f.label}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* ナビも いっしょに よろこぶ（のこった空白を うめる） */}
        <div className="mt-auto">
          <Say mood="happy" size={64} react>
            <Jp className="whitespace-nowrap text-[clamp(15px,4.6vw,19px)]">{"いい はてなを {見|み}つけたね！"}</Jp>
          </Say>
        </div>

        {error && (
          <p role="alert" className="rounded-[20px] bg-pink-light px-4 py-3 text-base font-black text-pink-dark">
            <Jp>{error}</Jp>
          </p>
        )}
        {noDetail && (
          <p role="alert" className="rounded-[20px] bg-pink-light px-4 py-3 text-base font-black text-pink-dark">
            <Jp>{"かいせつが まだ できていないよ。「なぞとき」に もどって、まってね"}</Jp>
          </p>
        )}
        <div className="mt-auto">
          <Button onClick={save} disabled={busy || noDetail}>
            <Jp big>{busy ? "{残|のこ}しているよ…" : "ずかんに {残|のこ}す！"}</Jp>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 flex-col gap-4">
      <Confetti />
      <div className="flex items-center justify-center gap-1.5">
        <MyNavigator mood="happy" size={70} react />
        <h2 className="font-pop text-[34px] font-normal leading-tight text-yellow [-webkit-text-stroke:2px_var(--color-ink)]">はてなゲット！</h2>
      </div>
      <CollectCard question={question} image={image} summary={summary} rating={rating} />

      {shareFailed && (
        <p role="alert" className="rounded-[20px] bg-pink-light px-4 py-3 text-base font-black text-pink-dark">
          <Jp>{"ずかんには {残|のこ}せたけど、なかまには {見|み}せられなかったよ。"}</Jp>
        </p>
      )}

      <section className={`mt-auto flex flex-col gap-2.5 rounded-card px-4 py-3 ${s.light}`}>
        <div className={`flex items-center justify-between font-pop text-[17px] ${s.dark}`}>
          <Jp>{`${SUBJECT_JP[question.subject]} スタンプ`}</Jp>
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
        {subjectFamily && subjectNext && (
          <span className={`text-sm font-black ${s.dark}`}>
            あと {subjectNext.left}こで「{subjectFamily.name}（{TIER_LABEL[subjectNext.tier]}）」
          </span>
        )}
      </section>

      {gotTitles.map((id) => (
        <div key={id} className="flex items-center gap-3 rounded-card bg-purple px-4 py-3 text-white">
          <Medal size={40} tier={titleTier(id) ?? "gold"} />
          <div className="flex flex-col">
            <span className="text-[15px] font-black">しょうごう ゲット！</span>
            <span className="font-pop text-[22px]">{titleLabel(id)}</span>
          </div>
        </div>
      ))}

      {grewTo && (
        <div className="flex items-center gap-3 rounded-card bg-yellow-soft px-4 py-2.5">
          <MyNavigator mood="surprise" size={72} react />
          <div className="flex flex-col">
            <span className="font-pop text-[20px] leading-tight">ナビが そだったよ！</span>
            <span className="text-[15px] font-black text-yellow-dark">
              <Jp>{`「${grewTo.name}」に なったよ。${grewTo.look}`}</Jp>
            </span>
          </div>
        </div>
      )}

      <div className="mt-auto flex gap-2.5">
        <button
          type="button"
          onClick={() => leave("/archive")}
          className="flex h-[68px] flex-1 items-center justify-center rounded-3xl border-3 border-ink bg-white text-lg font-black shadow-pop-md active:translate-y-[4px] active:shadow-none"
        >
          <Jp>{"ずかんを {見|み}る"}</Jp>
        </button>
        <button
          type="button"
          onClick={() => leave("/capture")}
          className="flex h-[68px] flex-[1.2] items-center justify-center rounded-3xl border-3 border-ink bg-navi font-pop text-[19px] text-white shadow-pop-md active:translate-y-[4px] active:shadow-none"
        >
          <Jp>{"もっと {探|さが}す！"}</Jp>
        </button>
      </div>
    </div>
  );
}
