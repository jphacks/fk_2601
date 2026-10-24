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
      <Navigator mood="think" size={104} />
      <p className="text-lg font-black">{message}</p>
      <div className="flex gap-2" aria-hidden>
        {["bg-brand", "bg-sun", "bg-berry"].map((color, i) => (
          <span key={color} className={`loading-dot ${color}`} style={{ animationDelay: `${i * 0.18}s` }} />
        ))}
      </div>
      <div className="paper-card w-full bg-white px-4 py-3 text-left">
        <p className="mb-1 inline-block rounded-full border-2 border-ink bg-sun px-2 text-sm font-black">まめちしき</p>
        <p className="text-base font-medium">{TRIVIA[index]}</p>
      </div>
    </div>
  );
}
