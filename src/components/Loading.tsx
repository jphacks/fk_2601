"use client";

import { useEffect, useState } from "react";
import { Confetti } from "./Decor";
import { CropCircle } from "./CropCircle";
import { Icon } from "./Icons";
import { Navigator } from "./Navigator";
import { isDemo } from "@/lib/demo";
import { TRIVIA } from "@/lib/trivia";
import { Button } from "./ui";

// まめちしきを入れかえる間かく（docs/design/README.md「見かた」：10秒ごと）
const TRIVIA_MS = 10_000;

/** まめちしき（10秒ごとに入れかえる。ボタンも こたえも なし） */
function Trivia() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const start = Math.floor(Math.random() * TRIVIA.length);
    const first = setTimeout(() => setIndex(start), 0);
    const timer = setInterval(() => setIndex((i) => (i + 1) % TRIVIA.length), TRIVIA_MS);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, []);

  // 点は4つまで（いま どれを みているかの目安）
  const dots = Math.min(TRIVIA.length, 4);
  return (
    <div className="flex shrink-0 flex-col gap-3 rounded-[28px] bg-yellow-light px-[18px] pb-[18px] pt-4">
      <p className="flex items-center gap-1.5 font-pop text-[17px] text-yellow-dark">
        <Icon name="bulb" size={24} fill="#FFFFFF" stroke="#6E4D00" strokeWidth={2.2} />
        まめちしき
      </p>
      <div aria-live="polite" className="flex min-h-[88px] flex-1 items-center">
        <p className="text-[21px] font-black leading-[1.75]">{TRIVIA[index]}</p>
      </div>
      <div aria-hidden className="flex justify-center gap-2">
        {Array.from({ length: dots }, (_, i) => (
          <span key={i} className={`h-2.5 rounded-[5px] transition-all ${i === index % dots ? "w-[22px] bg-yellow-dark" : "w-2.5 bg-yellow"}`} />
        ))}
      </div>
    </div>
  );
}

/** 進み具合のバー。本当の進みは分からないので、時間とともに 90% に近づけ、できたら 100% にする。のびた先をナビが歩く */
function Progress({ done }: { done: boolean }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (done) return;
    const started = Date.now();
    const timer = setInterval(() => setElapsed(Date.now() - started), isDemo() ? 100 : 500);
    return () => clearInterval(timer);
  }, [done]);

  // デモ（/demo）は待ちが1〜2秒なので、バーも早くのびるようにする
  const pct = done ? 100 : Math.round(8 + 82 * (1 - Math.exp(-elapsed / (isDemo() ? 1_200 : 20_000))));
  return (
    <div className="relative flex flex-col gap-2 pt-[52px]">
      <div className="absolute -top-1.5 transition-[left] duration-500" style={{ left: `clamp(0px, calc(${pct}% - 34px), calc(100% - 62px))` }}>
        <Navigator mood={done ? "happy" : "effort"} size={62} />
      </div>
      <div
        role="progressbar"
        aria-label="しらべている ところ"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="h-[22px] overflow-hidden rounded-[11px] bg-navi-light"
      >
        <div className="h-full rounded-[11px] bg-navi transition-[width] duration-500" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-center text-[15px] font-black text-ink-sub">1ぷんくらい かかる ことも あるよ</span>
    </div>
  );
}

/**
 * 待ち時間。
 * image を渡したとき（はてなを さがしている あいだ）は、見本 07：切り抜きを丸く見せ、バーの上をナビが歩き、まめちしきを出す。
 * 渡さないとき（ログインの確認・ずかんを ひらく など）は、ナビと はずむ点だけの、かんたんな表示にする
 */
export function Loading({
  message,
  image,
  done = false,
  onDone,
}: {
  message?: string;
  image?: string;
  /** はてなが できたか（できたら バーを 100% にする） */
  done?: boolean;
  /** 渡すと、できたときに「できた！ みてみる」を出す（見本 07） */
  onDone?: () => void;
}) {
  if (!image) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 py-10 text-center" role="status" aria-live="polite">
        <Navigator mood="effort" size={110} />
        <p className="text-lg font-black">{message ?? "ちょっと まってね"}</p>
        <div className="flex gap-2" aria-hidden>
          {["bg-navi", "bg-yellow", "bg-pink"].map((color, i) => (
            <span key={color} className={`loading-dot ${color}`} style={{ animationDelay: `${i * 0.18}s` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-1 flex-col gap-4">
      <Confetti />
      <div className="mt-11 flex items-center justify-center gap-3.5" role="status" aria-live="polite">
        <CropCircle src={image} alt="つかまえた ところ" size={128} />
        <div className="flex flex-col gap-2">
          <span className="font-pop text-[32px] leading-tight text-pink [-webkit-text-stroke:1.5px_var(--color-ink)]">みつけた！</span>
          <span className="self-start rounded-[14px] bg-yellow-light px-3 py-1 text-[15px] font-black">{done ? "はてなが できたよ" : (message ?? "いま しらべてるよ")}</span>
        </div>
      </div>

      <div className="mt-auto">
        <Progress done={done} />
      </div>

      <Trivia />

      {/* できたときに出るボタン。出る前から場所を取っておく（出たときに画面がずれないように） */}
      {onDone && (
        <div className="mt-auto h-[78px] shrink-0">
          {done && <Button onClick={onDone}>できた！ みてみる</Button>}
        </div>
      )}
    </div>
  );
}
