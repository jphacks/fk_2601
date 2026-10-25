"use client";

import { Navigator } from "./Navigator";
import { RubyText } from "./RubyText";
import { Button } from "./ui";

/**
 * さがしに いく まえの注意表示（docs/02-spec.md 3章、見本 01「でかける まえの やくそく」）。「人の顔はとらないでね」「まわりに気をつけてね」。
 * 「やくそく する！」を押すと onAgree を呼ぶ（出すか どうかは、使う画面が決める）
 */
export function SafetyNotice({ onAgree }: { onAgree: () => void }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white" role="dialog" aria-modal="true" aria-labelledby="safety-title">
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-4 p-6 pb-[30px]">
        <div className="relative mt-auto flex w-[284px] max-w-full flex-col items-center gap-1 self-center overflow-hidden rounded-[36px] bg-yellow-light px-6 pb-6 pt-[26px]">
          <svg aria-hidden="true" viewBox="0 0 342 290" className="absolute left-0 top-2.5 h-[290px] w-[342px]">
            <path d="M38 34l6 12 13 2-10 9 3 13-12-7-12 7 3-13-10-9 13-2z" fill="#FFFFFF" stroke="#22223A" strokeWidth="2.5" strokeLinejoin="round" />
            <circle cx="300" cy="46" r="10" fill="#FF6F9C" stroke="#22223A" strokeWidth="2.5" />
            <circle cx="292" cy="168" r="7" fill="#24C3A0" stroke="#22223A" strokeWidth="2.5" />
            <path d="M24 168q8-10 16 0t16 0" fill="none" stroke="#4A5AE8" strokeWidth="4" strokeLinecap="round" />
          </svg>
          <div className="relative">
            <Navigator mood="happy" size={160} />
          </div>
          <p className="relative text-center font-pop text-[26px] leading-normal">
            まちの はてなを
            <br />
            みつけろ！
          </p>
        </div>

        <h2 id="safety-title" className="mt-auto text-center font-pop text-[22px] font-normal">
          でかける まえの やくそく
        </h2>

        <div className="flex items-center gap-3.5 rounded-card bg-pink-light px-4 py-3.5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-pink font-pop text-xl">1</span>
          <span className="grow text-[23px] font-black leading-[1.7]">
            <RubyText text="{人|ひと}の{顔|かお}は" />
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
        <div className="flex items-center gap-3.5 rounded-card bg-mint-light px-4 py-3.5">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-mint font-pop text-xl">2</span>
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

        <div className="mt-auto">
          <Button onClick={onAgree}>やくそく する！</Button>
        </div>
      </div>
    </div>
  );
}
