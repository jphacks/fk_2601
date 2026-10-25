"use client";

import { useState } from "react";
import { Navigator } from "./Navigator";
import { Button } from "./ui";

// アプリを開いて最初のホームだけ、1回表示する（ページを読み込み直すと、また出る）
let shownAtLaunch = false;

/** 起動時の注意表示（docs/02-spec.md 3章、見本 01「でかける まえの やくそく」）。「人の顔はとらないでね」「まわりに気をつけてね」 */
export function SafetyNotice({ once = false }: { once?: boolean }) {
  const [open, setOpen] = useState(() => {
    if (!once) return true;
    if (shownAtLaunch) return false;
    shownAtLaunch = true;
    return true;
  });

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white" role="dialog" aria-modal="true" aria-labelledby="safety-title">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 px-6 pb-8">
        <div className="relative -mx-6 flex flex-col items-center gap-1 rounded-b-[44px] border-b-3 border-ink bg-yellow-light px-6 pb-6 pt-9">
          <svg aria-hidden="true" viewBox="0 0 390 300" className="absolute left-0 top-0 h-[300px] w-full">
            <path d="M50 60l6 12 13 2-10 9 3 13-12-7-12 7 3-13-10-9 13-2z" fill="#FFFFFF" stroke="#22223A" strokeWidth="2.5" strokeLinejoin="round" />
            <circle cx="338" cy="70" r="10" fill="#FF6F9C" stroke="#22223A" strokeWidth="2.5" />
            <circle cx="320" cy="200" r="7" fill="#24C3A0" stroke="#22223A" strokeWidth="2.5" />
            <path d="M40 190q8-10 16 0t16 0" fill="none" stroke="#4A5AE8" strokeWidth="4" strokeLinecap="round" />
          </svg>
          <div className="relative">
            <Navigator mood="happy" size={150} />
          </div>
          <p className="relative text-center font-pop text-[26px] leading-normal">
            まちの はてなを
            <br />
            つかまえろ！
          </p>
        </div>

        <h2 id="safety-title" className="mt-1 text-center font-pop text-[22px] font-normal">
          でかける まえの やくそく
        </h2>

        <div className="flex items-center gap-3.5 rounded-card border-2 border-ink/15 bg-pink-light px-4 py-3.5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full border-3 border-ink bg-pink font-pop text-xl">1</span>
          <span className="grow text-[23px] font-black leading-[1.7]">
            <ruby>
              人<rt>ひと</rt>
            </ruby>
            の
            <ruby>
              顔<rt>かお</rt>
            </ruby>
            は
            <br />
            とらないでね
          </span>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#C23668" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
            <circle cx="12" cy="12" r="8" />
            <circle cx="9.5" cy="10.5" r="0.9" fill="#C23668" />
            <circle cx="14.5" cy="10.5" r="0.9" fill="#C23668" />
            <path d="M9.5 15c1.5 1 3.5 1 5 0" />
            <line x1="4" y1="4" x2="20" y2="20" strokeWidth="2.6" />
          </svg>
        </div>
        <div className="flex items-center gap-3.5 rounded-card border-2 border-ink/15 bg-mint-light px-4 py-3.5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full border-3 border-ink bg-mint font-pop text-xl">2</span>
          <span className="grow text-[23px] font-black leading-[1.7]">
            まわりに
            <br />
            <ruby>
              気<rt>き</rt>
            </ruby>
            を つけてね
          </span>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#0F7A63" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
            <path d="M12 3l10 18H2z" />
            <line x1="12" y1="10" x2="12" y2="14.5" />
            <circle cx="12" cy="17.6" r="0.9" fill="#0F7A63" />
          </svg>
        </div>

        <div className="mt-auto pt-4">
          <Button onClick={() => setOpen(false)}>やくそく する！</Button>
        </div>
      </div>
    </div>
  );
}
