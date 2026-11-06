import type { ReactNode } from "react";
import { Icon } from "./Icons";
import { Navigator, type Mood } from "./Navigator";
import { BackButton } from "./Page";

// はじめての登録（ログイン ID → パスワード → ニックネーム → 学年）で使う部品（docs/design/first/README.md「登録の決まり」）

export const SIGNUP_STEPS = 4;

/** 入力欄（見本 02〜05・11・12 は 64px・22px。ほかの画面の INPUT_STYLE より ひとまわり大きい） */
export const SIGNUP_INPUT =
  "h-16 w-full rounded-[20px] border-3 border-ink bg-white px-[18px] text-[22px] font-bold text-ink outline-none focus:border-navi";

/** 入力欄の上のラベル */
export const SIGNUP_LABEL = "font-pop text-[19px]";

/** 上の もどるボタンと、進み具合（バーと「1/4」）。もどれない手順では onBack を渡さない */
export function StepHeader({ step, onBack }: { step: number; onBack?: () => void }) {
  return (
    <div className="flex h-[52px] shrink-0 items-center gap-3">
      {onBack ? <BackButton onBack={onBack} /> : <span aria-hidden className="size-[50px] shrink-0" />}
      <div
        role="progressbar"
        aria-label="とうろく"
        aria-valuemin={0}
        aria-valuemax={SIGNUP_STEPS}
        aria-valuenow={step}
        className="grid grow grid-cols-4 gap-1.5"
      >
        {Array.from({ length: SIGNUP_STEPS }, (_, i) => (
          <span key={i} className={`h-3 rounded-md ${i < step ? "bg-navi" : "bg-navi-light"}`} />
        ))}
      </div>
      <span className="font-pop text-[17px] text-navi-dark">
        {step}/{SIGNUP_STEPS}
      </span>
    </div>
  );
}

/** ナビが1つずつ聞く（ナビと、大きい字のふきだし）。画面が変わるたびに はねて出るよう、呼ぶ側で key を変える */
export function Ask({ mood, children }: { mood: Mood; children: ReactNode }) {
  return (
    <div className="mt-2 flex items-center gap-3">
      <Navigator mood={mood} size={112} react />
      <div className="relative grow rounded-[24px] bg-navi-light px-[18px] py-3.5 font-pop text-2xl leading-[1.55]">
        <span aria-hidden className="absolute -left-2 top-[calc(50%-8px)] size-4 rotate-45 bg-navi-light" />
        <h1 className="relative font-normal">{children}</h1>
      </div>
    </div>
  );
}

/** チェックつきの説明（押せないので、うすい地だけ） */
export function Notes({ items, tone = "cloud" }: { items: ReactNode[]; tone?: "cloud" | "mint" }) {
  const look = tone === "mint" ? "bg-mint-light text-mint-dark" : "bg-cloud text-ink-sub";
  return (
    <ul className={`flex flex-col gap-1.5 rounded-[20px] px-4 py-3 text-base font-black leading-[1.6] ${look}`}>
      {items.map((item, i) => (
        <li key={i} className="flex gap-2">
          <Icon name="check" size={20} strokeWidth={3} className="mt-[3px]" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

/** パスワードを わすれると戻れないことを伝える（黄色の地とカギ） */
export function MemoNotice({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-2.5 rounded-[20px] bg-yellow-light px-4 py-3 text-base font-black leading-[1.6] text-yellow-dark">
      <Icon name="lock" size={26} strokeWidth={2.2} className="mt-0.5" />
      <span>{children}</span>
    </div>
  );
}

/** うまくいかなかったときの文（ピンクの地） */
export function SignupError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-[20px] bg-pink-light px-4 py-3 text-base font-black leading-[1.6] text-pink-dark">
      {children}
    </p>
  );
}
