"use client";

import { useEffect, useState } from "react";
import { Navigator } from "./Navigator";
import { TRIVIA } from "@/lib/trivia";

/** 待ち時間：ナビゲーターキャラが豆知識を話す */
export function Loading({ message = "かんがえているよ…" }: { message?: string }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const start = Math.floor(Math.random() * TRIVIA.length);
    const first = setTimeout(() => setIndex(start), 0);
    const timer = setInterval(() => setIndex((i) => (i + 1) % TRIVIA.length), 7000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="flex flex-col items-center gap-4 py-6 text-center" role="status" aria-live="polite">
      <div className="animate-bounce">
        <Navigator mood="think" size={96} />
      </div>
      <p className="text-lg font-bold">{message}</p>
      <div className="rounded-2xl bg-white px-4 py-3 text-left shadow-sm ring-1 ring-ink/5">
        <p className="mb-1 text-sm font-bold text-brand">まめちしき</p>
        <p className="text-base">{TRIVIA[index]}</p>
      </div>
    </div>
  );
}
