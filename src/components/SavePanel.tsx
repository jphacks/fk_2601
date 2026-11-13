"use client";

import { Jp, RubyText } from "./RubyText";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { stampCounts } from "@/lib/collection";
import { groupOf, STAMP_GOAL, SUBJECT_JP, type GroupId } from "@/lib/constants";
import { newlyEarned, nextGoal, TIER_LABEL, TITLE_FAMILIES, titleLabel, titleStats, titleTier } from "@/lib/titles";
import { messageOf } from "@/lib/errors";
import type { Guess, Rating } from "@/lib/rating";
import type { Question } from "@/server/llm/schema";
import { useArchive } from "./ArchiveProvider";
import { useApp } from "./AuthProvider";
import { Burst, Confetti, Hanko, Rays, Sparkle, Spotlight } from "./Decor";
import { Icon, Medal } from "./Icons";
import { Navigator } from "./Navigator";
import { BackButton } from "./Page";
import { SUBJECT_STYLE, TYPE_LABEL } from "./QuestionCard";
import { useQuiz } from "./QuizProvider";
import { Stamp } from "./StampCards";
import { Button, CHOICE_DOWN, CHOICE_UP, Say } from "./ui";
import { stripRuby } from "@/lib/ruby";

// カードの写真の たかさ（ひくい画面では ちぢめる）。はんこは、写真の下のふちに かさねる
const PHOTO_HEIGHT = "clamp(100px, 15dvh, 136px)";

/**
 * ずかんのカード（見本 19）：つかまえた写真・はてな・きみのよそう→こたえ・はんこ。
 * number を渡すと、ずかんの 何こめかを 左上の 丸い札で出す。shine のときは、光が ななめに走る（ずかんに のこそう）
 */
export function CollectCard({
  question,
  image,
  summary,
  rating,
  number,
  shine = false,
}: {
  question: Question;
  image: string;
  summary: string;
  rating: Rating;
  number?: number;
  shine?: boolean;
}) {
  const s = SUBJECT_STYLE[question.subject];
  // 「なぜ？」型は、ピタリ・はずれ ではなく、せいかい・ざんねん
  const label = question.type === "why" ? (rating === "pita" ? "せいかい" : "ざんねん") : undefined;
  return (
    <div className={`relative w-[300px] max-w-full rounded-[28px] p-2 ${s.solid}`} style={{ "--photo": PHOTO_HEIGHT } as React.CSSProperties}>
      {number !== undefined && (
        <span className="absolute -left-3.5 -top-3.5 z-10 flex size-[60px] -rotate-12 flex-col items-center justify-center rounded-full border-3 border-ink bg-yellow font-pop leading-none">
          <span className="text-[21px]">{number}</span>
          <span className="mt-0.5 text-[12px]">こめ</span>
        </span>
      )}
      <div className="relative overflow-hidden rounded-[20px] bg-white">
        <div className="flex h-[var(--photo)] items-center justify-center bg-photo">
          {/* eslint-disable-next-line @next/next/no-img-element -- 囲んだ部分の切り抜き（data URL） */}
          <img src={image} alt={stripRuby(question.target)} className="size-full object-contain" />
        </div>
        <div className="flex flex-col gap-1.5 px-3.5 pb-3.5 pt-2.5">
          <span className={`self-start rounded-[10px] px-2.5 py-0.5 text-[13px] font-black ${s.light} ${s.dark}`}>
            <Jp>{`${SUBJECT_JP[question.subject]} ・ ${question.topic || TYPE_LABEL[question.type]}`}</Jp>
          </span>
          {/* 小さい文字なので、ふりがなを付けず、学年に合わせて出す */}
          <RubyText kana className="line-clamp-4 text-[18px] font-black leading-[1.45]" text={question.text} />
          <Jp className="font-pop text-[15px]">{summary}</Jp>
        </div>
        <div className="absolute right-1.5 top-[calc(var(--photo)-42px)]">
          <Hanko rating={rating} label={label} size={74} />
        </div>
        {shine && <span aria-hidden className="animate-shine pointer-events-none absolute inset-y-0 left-0 w-1/4 bg-gradient-to-r from-transparent via-white/55 to-transparent" />}
      </div>
    </div>
  );
}

/** 答え合わせのあと、ずかんに保存する（見本 19「はてなゲット！」）。入っているグループの なかまに、名前を出さずに見せるかも選べる */
export function SavePanel({
  question,
  guess,
  rating,
  image,
  summary,
  onBack,
}: {
  question: Question;
  guess: Guess;
  rating: Rating;
  image: string;
  /** 「きみ 100 → こたえ 720」のような、カードに入れる一行 */
  summary: string;
  /** のこす前の「もどる」（なぞとき・もしも へ）。のこした あとは出さない */
  onBack: () => void;
}) {
  const router = useRouter();
  // 保存したかは、問いの状態に持つ（画面をもどっても、同じ問いを2回保存しない）
  const { saved, markSaved } = useQuiz();
  const { status, archives, add } = useArchive();
  const { memberships } = useApp();
  // 見せるグループ（はじめは どこにも見せない）
  const [picked, setPicked] = useState<GroupId[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareFailed, setShareFailed] = useState(false);
  // いま のこした ところか（紙ふぶきは、のこした しゅんかんだけ。あとで もどってきたときは出さない）
  const [celebrate, setCelebrate] = useState(false);

  function toggle(id: GroupId, on: boolean) {
    setPicked((prev) => (on ? [...prev.filter((g) => g !== id), id] : prev.filter((g) => g !== id)));
  }

  async function save() {
    if (saved || busy) return;
    setBusy(true);
    setError(null);
    try {
      // 入っているグループだけに見せる（ルールでも、メンバーでないグループには書けない）
      const groups = picked.filter((g) => memberships?.some((m) => m.groupId === g));
      const result = await add({ question, guess, rating, image, groups });
      setShareFailed(result.shareFailed);
      setCelebrate(true);
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
  // ずかんの 何こめか。ずかんを 読みこめていないときは、まちがった数に なるので出さない
  const number = status === "ready" ? archives.length + (saved ? 0 : 1) : undefined;

  if (!saved) {
    return (
      <div className="relative flex flex-1 flex-col gap-4">
        <Rays />
        {/* 上の段：もどる と、ナビの ひとこと（カードを 大きく見せたいので、1行に まとめる） */}
        <div className="flex min-h-[52px] items-center gap-2.5">
          <BackButton onBack={onBack} />
          <div className="grow">
            <Say mood="happy" size={52} react small>
              いい はてなだね！
            </Say>
          </div>
        </div>

        {/* 見出し：画面の はばに合わせて、1行に おさまる いちばん大きな文字にする */}
        <h2 className="title-pop whitespace-nowrap text-yellow text-center font-pop text-[clamp(28px,9vw,40px)] font-normal leading-[1.5]">
          <Jp big>{"ずかんに {残|のこ}そう！"}</Jp>
        </h2>

        <Spotlight>
          <CollectCard question={question} image={image} summary={summary} rating={rating} number={number} shine />
        </Spotlight>

        {memberships && memberships.length > 0 && (
          // わくは 押せないので 地の色だけ。中の グループの ボタンだけが 押せる（えらぶと 色がついて 押しこまれる）
          <fieldset className="mt-auto flex flex-col gap-2 rounded-card bg-pink-light px-4 py-3">
            <legend className="sr-only">グループの なかまにも みせる</legend>
            <span aria-hidden="true" className="flex items-center gap-2 font-pop text-[17px] leading-snug">
              <Icon name="people" size={22} stroke="#A12A55" strokeWidth={2.4} />
              <Jp>{"なかまにも {見|み}せる？"}</Jp>
            </span>
            <div className="flex flex-wrap gap-2.5 pb-1">
              {memberships.map((m) => {
                const on = picked.includes(m.groupId);
                return (
                  <label
                    key={m.groupId}
                    className={`flex h-12 cursor-pointer items-center gap-2 rounded-[18px] border-3 border-ink pl-2.5 pr-3.5 text-[17px] font-black has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-navi ${
                      on ? `bg-pink ${CHOICE_DOWN}` : `bg-white ${CHOICE_UP}`
                    }`}
                  >
                    <input type="checkbox" checked={on} onChange={(e) => toggle(m.groupId, e.target.checked)} className="sr-only" />
                    <span aria-hidden className={`flex size-6 shrink-0 items-center justify-center rounded-lg border-[2.5px] border-ink ${on ? "bg-white" : "bg-cloud"}`}>
                      {on && <Icon name="check" size={16} strokeWidth={4} />}
                    </span>
                    {/* 小さい文字なので、ひらがなで出す */}
                    {groupOf(m.groupId).kana}
                  </label>
                );
              })}
            </div>
            <span className="text-sm font-bold leading-[1.6] text-pink-dark">
              <Jp>{"{名前|なまえ}は {出|で}ないよ。{囲|かこ}んだ {写真|しゃしん}と はてなだけ、{選|えら}んだ グループの なかまに {見|み}えるよ。"}</Jp>
            </span>
          </fieldset>
        )}

        {error && (
          <p role="alert" className="rounded-[20px] bg-pink-light px-4 py-3 text-base font-black text-pink-dark">
            <Jp>{error}</Jp>
          </p>
        )}
        {/* ひくい画面では、スクロールしなくても ボタンが見えるよう、下に とめる */}
        <div className="mt-auto [@media(max-height:760px)]:sticky [@media(max-height:760px)]:bottom-0 [@media(max-height:760px)]:z-10 [@media(max-height:760px)]:-mx-6 [@media(max-height:760px)]:-mb-[30px] [@media(max-height:760px)]:bg-gradient-to-t [@media(max-height:760px)]:from-white [@media(max-height:760px)]:from-70% [@media(max-height:760px)]:to-transparent [@media(max-height:760px)]:px-6 [@media(max-height:760px)]:pb-[30px] [@media(max-height:760px)]:pt-5">
          <div className={busy ? "" : "animate-nudge"}>
            <Button onClick={save} disabled={busy}>
              <Icon name="book" size={30} strokeWidth={2.6} />
              <Jp big>{busy ? "{残|のこ}しているよ…" : "ずかんに {残|のこ}す！"}</Jp>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 flex-col gap-4">
      <Confetti />
      {celebrate && <Burst tone="party" y={32} rain />}
      <div className="flex items-center justify-center gap-2">
        <Navigator mood="happy" size={70} react />
        <h2 className="title-pop whitespace-nowrap text-yellow font-pop text-[clamp(28px,8.6vw,36px)] font-normal leading-[1.5]">はてなゲット！</h2>
      </div>
      <div className={`mt-auto self-center pt-2 ${celebrate ? "animate-card-pop" : ""}`}>
        <div className="-rotate-3">
          <CollectCard question={question} image={image} summary={summary} rating={rating} number={number} />
        </div>
      </div>

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
                <span key={i} className="relative -my-[5px] flex size-[60px] items-center justify-center rounded-full border-3 border-ink bg-yellow">
                  {/* スタンプを 押した しゅんかんに、輪が 広がる */}
                  {celebrate && <span aria-hidden className="animate-ring absolute -inset-1 rounded-full border-[5px] border-yellow [animation-delay:0.5s]" />}
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

      {gotTitles.map((id, i) => (
        <div
          key={id}
          className={`relative flex items-center gap-3 rounded-card bg-purple px-4 py-3 text-white ${celebrate ? "animate-pop-in" : ""}`}
          style={celebrate ? { animationDelay: `${0.7 + i * 0.2}s` } : undefined}
        >
          <Medal size={40} tier={titleTier(id) ?? "gold"} />
          <div className="flex flex-col">
            <span className="text-[15px] font-black">しょうごう ゲット！</span>
            {/* 長い名前（「あさの たんけんか（どう）」など）も、なるべく 1行に おさめる。折り返すときは、行の長さを そろえる */}
            <span className="text-balance font-pop text-[clamp(17px,5.1vw,20px)] leading-snug">{titleLabel(id)}</span>
          </div>
          {/* 星は、名前の はばを とらないよう、カードの かどに かさねる */}
          <span className="absolute -right-1.5 -top-2.5">
            <Sparkle color="#FFC83D" size={28} delay={i * 0.3} />
          </span>
        </div>
      ))}

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
