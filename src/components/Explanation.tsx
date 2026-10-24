"use client";

import { useState } from "react";
import type { Question } from "@/server/llm/schema";
import { Icon } from "./Icons";
import { RubyText } from "./RubyText";

const KIND_LABEL = { data: "データ", book: "ほん", site: "サイト" } as const;

// 手じゅんの色（見本 17：青 → 黄 → ピンク のくりかえし）
const STEP_STYLE = [
  { card: "bg-navi-light", dot: "bg-navi text-white" },
  { card: "bg-yellow-light", dot: "bg-yellow" },
  { card: "bg-pink-light", dot: "bg-pink" },
] as const;

/** 「くわしく みる」：答えまでの考えかたを、番号つきの手じゅんで見せる（見本 17）。直感が当たったときも同じ解説を見せる */
export function ExplanationSteps({ question, defaultOpen = false }: { question: Question; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const { steps } = question.explanation;
  if (steps.length === 0) return null;

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex h-[54px] w-full items-center justify-between rounded-[22px] border-3 border-ink bg-white px-5 font-pop text-lg shadow-pop-sm active:translate-y-1 active:shadow-none"
      >
        くわしく みる
        <Icon name="down" size={24} strokeWidth={3} className={open ? "rotate-180" : ""} />
      </button>
      {open && (
        <ol className="mt-1 flex list-none flex-col gap-3 p-0">
          {steps.map((s, i) => {
            const style = STEP_STYLE[i % STEP_STYLE.length];
            return (
              <li key={i} className={`flex items-start gap-3 rounded-[22px] border-3 border-ink px-3.5 py-3 ${style.card}`}>
                <span className={`flex size-[42px] shrink-0 items-center justify-center rounded-full border-3 border-ink font-pop text-xl ${style.dot}`}>{i + 1}</span>
                <span className="pt-0.5 text-[19px] font-black leading-[1.75]">
                  <RubyText text={s} />
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </>
  );
}

/** 同じ考えかたが使える、ほかの身近なものの問い（前に保存した問いには無いので、なければ何も出さない） */
export function Related({ question }: { question: Question }) {
  const related = question.related ?? [];
  if (related.length === 0) return null;
  return (
    <div className="flex flex-col gap-2 rounded-card border-3 border-ink bg-mint-light px-4 py-3.5 shadow-pop-sm">
      <h2 className="font-pop text-[17px] font-normal text-mint-dark">ほかにも こんな ふしぎが あるよ</h2>
      <ul className="flex list-disc flex-col gap-1 pl-5 text-[18px] font-black leading-[1.75]">
        {related.map((r, i) => (
          <li key={i}>
            <RubyText text={r} />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** 出典と前提条件。リンクは、おとなの人といっしょに見るよう伝える */
export function Sources({ question }: { question: Question }) {
  if (question.sources.length === 0 && !question.keyword) return null;
  return (
    <details className="rounded-card border-3 border-ink bg-white px-4 py-3">
      <summary className="cursor-pointer text-base font-black">つかった データと まえていの はなし</summary>
      <ul className="mt-3 flex flex-col gap-3 text-base">
        {question.sources.map((s, i) => (
          <li key={i} className="flex flex-col gap-1">
            <p className="font-black">
              <span className="mr-2 rounded-lg border-2 border-ink bg-navi-light px-2 py-0.5 text-sm text-navi-dark">{KIND_LABEL[s.kind]}</span>
              {s.url ? (
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-navi-dark underline">
                  {s.title}
                </a>
              ) : (
                s.title
              )}
            </p>
            <p className="font-bold text-ink-sub">{s.assumption}</p>
          </li>
        ))}
      </ul>
      {question.keyword && (
        <p className="mt-3 text-base font-bold">
          もっと しらべるときの ことば：<b className="font-black">{question.keyword}</b>
        </p>
      )}
      <p className="mt-3 text-sm font-bold text-ink-muted">リンクを ひらくときは、おとなの ひとと いっしょに みてね。</p>
    </details>
  );
}
