"use client";

import { Jp } from "./RubyText";
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
        <Jp className="block text-[21px] font-black leading-[1.75]">{TRIVIA[index]}</Jp>
      </div>
      <div aria-hidden className="flex justify-center gap-2">
        {Array.from({ length: dots }, (_, i) => (
          <span key={i} className={`h-2.5 rounded-[5px] transition-all ${i === index % dots ? "w-[22px] bg-yellow-dark" : "w-2.5 bg-yellow"}`} />
        ))}
      </div>
    </div>
  );
}

// はてなキャッチ：はてなが出る間かくと、出ている長さ（ミリ秒）
const BUBBLE_EVERY_MS = 850;
const BUBBLE_LIFE_MS = 1700;
const BUBBLE_COLORS = ["bg-navi text-white", "bg-pink text-ink", "bg-yellow text-ink", "bg-mint text-ink"] as const;

type Bubble = { id: number; x: number; y: number; color: (typeof BUBBLE_COLORS)[number]; born: number };

/**
 * 待っているあいだの ミニゲーム「はてなキャッチ」（#127）。出てくる「？」を さわって つかまえる。
 * 失敗はなく、つかまえた数だけを数える。はてなが できたら（running が false）、新しい「？」は出さない
 */
function CatchGame({ running }: { running: boolean }) {
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [caught, setCaught] = useState(0);

  useEffect(() => {
    if (!running) return;
    let next = 0;
    const timer = setInterval(() => {
      const now = Date.now();
      setBubbles((prev) => [
        // 古くなった「？」は消す
        ...prev.filter((b) => now - b.born < BUBBLE_LIFE_MS),
        // 端に かからないよう、8〜82% の位置に出す
        { id: next++, x: 8 + Math.random() * 74, y: 10 + Math.random() * 62, color: BUBBLE_COLORS[next % BUBBLE_COLORS.length], born: now },
      ]);
    }, BUBBLE_EVERY_MS);
    return () => clearInterval(timer);
  }, [running]);

  return (
    <div className="flex shrink-0 flex-col gap-2 rounded-[28px] bg-navi-light px-[18px] pb-[18px] pt-4">
      <p className="flex items-center justify-between font-pop text-[17px] text-navi-dark">
        <span>はてなキャッチ</span>
        <span aria-live="polite">{caught}こ キャッチ！</span>
      </p>
      <div className="relative h-[150px] overflow-hidden rounded-[20px] bg-white">
        {bubbles.length === 0 && (
          <span className="absolute inset-0 flex items-center justify-center text-base font-black text-ink-sub">
            <Jp>{running ? "{出|で}てくる「？」を さわってね" : "はてなが できたよ！"}</Jp>
          </span>
        )}
        {bubbles.map((b) => (
          // 位置は外の箱で決め、中のボタンだけを はずませる（transform が ぶつからないように）
          <span key={b.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${b.x}%`, top: `${b.y}%` }}>
            <button
              type="button"
              aria-label="はてなを つかまえる"
              onPointerDown={() => {
                setCaught((n) => n + 1);
                setBubbles((prev) => prev.filter((x) => x.id !== b.id));
              }}
              className={`animate-bump flex size-12 items-center justify-center rounded-full border-3 border-ink font-pop text-2xl ${b.color}`}
            >
              ?
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}

type Pastime = "trivia" | "game";

/** 待っているあいだに見るもの（まめちしき／はてなキャッチ）。切りかえは押せる形（線と影） */
function Pastimes({ done }: { done: boolean }) {
  const [mode, setMode] = useState<Pastime>("trivia");
  const tabs: [Pastime, string][] = [
    ["trivia", "まめちしき"],
    ["game", "はてなキャッチ"],
  ];
  return (
    <div className="flex shrink-0 flex-col gap-2.5">
      <div role="tablist" aria-label="まっている あいだ" className="grid grid-cols-2 gap-2">
        {tabs.map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            onClick={() => setMode(value)}
            className={`h-11 rounded-[16px] border-3 border-ink font-pop text-[15px] ${
              mode === value ? "translate-y-1 bg-yellow shadow-none" : "bg-white shadow-pop-sm active:translate-y-1 active:shadow-none"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
      {mode === "trivia" ? <Trivia /> : <CatchGame running={!done} />}
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
      <span className="text-center text-[15px] font-black text-ink-sub">
        <Jp>{"1{分|ぷん}くらい かかる ことも あるよ"}</Jp>
      </span>
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
        <p className="text-lg font-black">
          <Jp>{message ?? "ちょっと {待|ま}ってね"}</Jp>
        </p>
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
          <span className="font-pop text-[32px] leading-tight text-pink [-webkit-text-stroke:1.5px_var(--color-ink)]">
            <Jp big>{"{見|み}つけた！"}</Jp>
          </span>
          <span className="self-start rounded-[14px] bg-yellow-light px-3 py-1 text-[15px] font-black"><Jp>{done ? "はてなが できたよ" : (message ?? "いま {調|しら}べてるよ")}</Jp></span>
        </div>
      </div>

      <div className="mt-auto">
        <Progress done={done} />
      </div>

      <Pastimes done={done} />

      {/* できたときに出るボタン。出る前から場所を取っておく（出たときに画面がずれないように） */}
      {onDone && (
        <div className="mt-auto h-[78px] shrink-0">
          {done && (
            <Button onClick={onDone}>
              <Jp big>{"できた！ {見|み}てみる"}</Jp>
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
