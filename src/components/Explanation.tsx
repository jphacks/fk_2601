"use client";

import { useState } from "react";
import type { Question } from "@/server/llm/schema";
import { RubyText } from "./RubyText";
import { Button } from "./ui";

const KIND_LABEL = { data: "データ", book: "本", site: "サイト" } as const;

/** まず一言、タップで詳しく。直感が当たった場合も同じ解説を見せる */
export function Explanation({ question }: { question: Question }) {
  const [open, setOpen] = useState(false);
  const { short, steps } = question.explanation;

  return (
    <div className="space-y-3">
      <p className="text-lg font-bold leading-loose">
        <RubyText text={short} />
      </p>
      {steps.length > 0 && (
        <Button variant="secondary" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
          {open ? "とじる" : "くわしく 見る"}
        </Button>
      )}
      {open && (
        <ol className="list-decimal space-y-2 rounded-2xl bg-paper p-4 pl-8 text-base leading-loose">
          {steps.map((s, i) => (
            <li key={i}>
              <RubyText text={s} />
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

/** 出典と前提条件。リンクは、おとなの人といっしょに見るよう伝える */
export function Sources({ question }: { question: Question }) {
  if (question.sources.length === 0) return null;
  return (
    <details className="rounded-2xl bg-white p-4 shadow-sm">
      <summary className="cursor-pointer text-base font-bold">つかった データと まえ提</summary>
      <ul className="mt-3 space-y-3 text-base">
        {question.sources.map((s, i) => (
          <li key={i} className="space-y-1">
            <p className="font-bold">
              <span className="mr-2 rounded-full bg-brand/10 px-2 py-0.5 text-sm text-brand-dark">{KIND_LABEL[s.kind]}</span>
              {s.url ? (
                <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-brand underline">
                  {s.title}
                </a>
              ) : (
                s.title
              )}
            </p>
            <p className="text-ink/80">{s.assumption}</p>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-sm text-ink/60">リンクを 開くときは、おとなの人と いっしょに 見てね。</p>
    </details>
  );
}
