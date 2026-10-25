"use client";

import { useEffect, useState } from "react";
import { Confetti } from "./Decor";
import { CropCircle } from "./CropCircle";
import { Icon } from "./Icons";
import { Navigator } from "./Navigator";
import { TRIVIA } from "@/lib/trivia";

/** まめちしき（ときどき入れかえる） */
function Trivia() {
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
    <div className="rounded-[26px] border-2 border-ink/15 bg-yellow-light px-[18px] py-3.5">
      <p className="flex items-center gap-1.5 text-[15px] font-black text-yellow-dark">
        <Icon name="bulb" size={20} />
        まめちしき
      </p>
      <p className="mt-1 text-[19px] font-black leading-[1.75]">{TRIVIA[index]}</p>
    </div>
  );
}

/**
 * 待ち時間。
 * image を渡したとき（はてなを さがしている あいだ）は、見本 07「つかまえた！」：切り抜きを丸く見せて、まめちしきを出す。
 * 渡さないとき（ログインの確認・ずかんを ひらく など）は、ナビと はずむ点だけの、かんたんな表示にする
 */
export function Loading({ message = "ちょっと まってね", image }: { message?: string; image?: string }) {
  if (!image) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-10 text-center" role="status" aria-live="polite">
        <Navigator mood="effort" size={110} />
        <p className="text-lg font-black">{message}</p>
        <div className="flex gap-2" aria-hidden>
          {["bg-navi", "bg-yellow", "bg-pink"].map((color, i) => (
            <span key={color} className={`loading-dot ${color}`} style={{ animationDelay: `${i * 0.18}s` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col gap-3.5" role="status" aria-live="polite">
      <Confetti />
      <div className="mt-1.5 flex items-center gap-3.5">
        <CropCircle src={image} alt="つかまえた ところ" size={128} />
        <div className="flex flex-col gap-2">
          <span className="font-pop text-[32px] leading-tight text-pink [-webkit-text-stroke:1.5px_var(--color-ink)]">つかまえた！</span>
          <span className="self-start rounded-[14px] border-[2.5px] border-ink bg-yellow-light px-3 py-1 text-[15px] font-black">{message}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Navigator mood="effort" size={76} />
        <div className="flex grow flex-col gap-2">
          <div className="relative h-6 overflow-hidden rounded-xl border-3 border-ink bg-white">
            <div className="absolute inset-y-0 w-2/5 animate-[indeterminate_1.6s_ease-in-out_infinite] border-r-3 border-ink bg-navi" />
          </div>
          <span className="text-[15px] font-black text-ink-sub">1ぷんくらい かかる ことも あるよ</span>
        </div>
      </div>

      <Trivia />
    </div>
  );
}
