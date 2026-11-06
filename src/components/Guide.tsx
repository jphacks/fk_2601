"use client";

import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { Icon, type IconName } from "./Icons";
import { Navigator } from "./Navigator";
import { Button } from "./ui";

/**
 * あそびかたの説明（3枚）。ホームを暗くして、その上に出す（docs/design/first/README.md「あそびかたの決まり」・見本 07〜09）。
 * いま説明しているもの（2枚目は下のナビ、3枚目は「はてなを さがす！」）は、ホームの側で暗い幕の上に持ち上げる
 */
export const GUIDE_STEPS = 3;
export type GuideStep = 0 | 1 | 2;

// 1枚目：あそぶ じゅんばん（見本 07 の番号の色と絵）
const FLOW: { title: string; text: string; color: string; icon: ReactNode }[] = [
  {
    title: "さがす",
    text: "カメラで まちを とる",
    color: "bg-navi text-white",
    icon: (
      <>
        <path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
        <circle cx="12" cy="13.5" r="3.5" />
      </>
    ),
  },
  {
    title: "かこむ",
    text: "きに なる ところを ゆびで ぐるっと",
    color: "bg-yellow text-ink",
    icon: <path d="M10 5c6-2 11 1 11 6s-5 7-10 7S3 15 3 11c0-2.5 2-4.5 5-5.5 1-.3 1.6-1.2 1.4-2.5" />,
  },
  {
    title: "えらぶ",
    text: "でてきた はてなを 1つ えらぶ",
    color: "bg-orange text-ink",
    icon: (
      <>
        <rect x="3" y="4" width="18" height="5" rx="2" />
        <rect x="3" y="11" width="18" height="5" rx="2" />
        <path d="M7 20h10" />
      </>
    ),
  },
  {
    title: "せーの！",
    text: "こたえを よそうする",
    color: "bg-pink text-ink",
    icon: (
      <>
        <path d="M12 3v3M5.6 5.6l2 2M3 12h3M18.4 5.6l-2 2M21 12h-3" />
        <circle cx="12" cy="14" r="5" />
      </>
    ),
  },
  {
    title: "こたえあわせ",
    text: "ぴたり？ おしい？ おおはずれ？",
    color: "bg-navi text-white",
    icon: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M8 12.5l3 3 5-6" />
      </>
    ),
  },
  {
    title: "もしも",
    text: "きまりを かえて もういちど",
    color: "bg-mint text-ink",
    icon: (
      <>
        <path d="M4 12a8 8 0 0 1 14-5.3M20 12a8 8 0 0 1-14 5.3" />
        <path d="M18 3v4h-4M6 21v-4h4" />
      </>
    ),
  },
  {
    title: "のこす",
    text: "ずかんに のこして スタンプ ゲット",
    color: "bg-purple text-white",
    icon: (
      <>
        <path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v15H5.5A1.5 1.5 0 0 0 4 19.5z" />
        <path d="M4 19.5A1.5 1.5 0 0 0 5.5 21H20v-3" />
      </>
    ),
  },
];

// 2枚目：下のナビの5つ（見本 08。色は下のナビと同じ）
const TABS: { label: string; text: string; icon: IconName; chip: string; stroke: string }[] = [
  { label: "ずかん", text: "つかまえた はてなが ならぶ", icon: "book", chip: "bg-yellow-soft", stroke: "#9A6B00" },
  { label: "スタンプ", text: "スタンプと しょうごうを みる", icon: "stamp", chip: "bg-purple-light", stroke: "#6A3FD6" },
  { label: "ホーム", text: "いつでも ここに もどれる", icon: "home", chip: "bg-navi", stroke: "#FFFFFF" },
  { label: "みんな", text: "みんなの はてなを みる", icon: "people", chip: "bg-pink-light", stroke: "#C23668" },
  { label: "せってい", text: "がくねんや、この あそびかたも ここ", icon: "gear", chip: "bg-mint-light", stroke: "#0F7A63" },
];

/** 説明のカード（白。暗い地の上なので線はつけない）。tail を渡すと、説明しているものへ しっぽを向ける */
function Sheet({ tail, className = "", style, children }: { tail?: "up" | "down"; className?: string; style?: React.CSSProperties; children: ReactNode }) {
  return (
    <div
      className={`animate-sheet pointer-events-auto absolute inset-x-4 flex flex-col gap-3 rounded-[28px] bg-white px-5 pb-[18px] pt-4 ${className}`}
      style={style}
    >
      {tail && (
        <span
          aria-hidden
          className={`absolute left-[calc(50%-12px)] size-6 rotate-45 bg-white ${tail === "down" ? "-bottom-[11px] rounded-br" : "-top-[11px] rounded-tl"}`}
        />
      )}
      {children}
    </div>
  );
}

const SKIP_STYLE =
  "pointer-events-auto flex h-11 items-center rounded-[22px] border-3 border-ink bg-white px-[18px] text-base font-black text-ink shadow-pop-xs active:translate-y-[3px] active:shadow-none";

// 3枚目の2つのボタン（半分の はばに1行で入るよう、Button より左右の余白を せまくする）
const PAIR_STYLE =
  "flex h-14 items-center justify-center whitespace-nowrap rounded-[22px] border-3 border-ink px-1 text-ink shadow-pop-sm active:translate-y-1 active:shadow-none";

/** 3枚目のカードを「はてなを さがす！」の上に置く（上に すきまがないときは下に置く） */
function useAnchor(target: RefObject<HTMLElement | null>, active: boolean) {
  const [place, setPlace] = useState<{ side: "above" | "below"; offset: number } | null>(null);
  useLayoutEffect(() => {
    if (!active) return;
    const el = target.current;
    if (!el) return;
    el.scrollIntoView({ block: "center" });
    function measure() {
      if (!el) return;
      const rect = el.getBoundingClientRect();
      // カードの高さは 200px ほど。上の「とじる」（24 + 44px）と重ならないだけの すきまがあれば上に置く
      const above = rect.top > 300;
      // しっぽ（11px）と、黄色の点線（上 12px・下 19px）の ぶん はなす
      setPlace(above ? { side: "above", offset: window.innerHeight - rect.top + 24 } : { side: "below", offset: rect.bottom + 31 });
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [target, active]);
  return active ? place : null;
}

export function Guide({
  step,
  onNext,
  onClose,
  onTry,
  captureRef,
}: {
  step: GuideStep;
  onNext: () => void;
  /** とばす・とじる・ホームを みる */
  onClose: () => void;
  /** やってみる！（やくそく → カメラ） */
  onTry: () => void;
  captureRef: RefObject<HTMLElement | null>;
}) {
  const place = useAnchor(captureRef, step === 2);
  const dialog = useRef<HTMLDivElement>(null);

  // 説明のあいだは、うしろの ホームを うごかさない
  useEffect(() => {
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = before;
    };
  }, []);

  // 読み上げで、いまの カードから読めるように
  useEffect(() => {
    dialog.current?.focus();
  }, [step]);

  const last = step === GUIDE_STEPS - 1;

  return (
    <>
      <div aria-hidden className="fixed inset-0 z-40 bg-ink/74" />
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-label={`あそびかた（${step + 1}/${GUIDE_STEPS}）`}
        tabIndex={-1}
        className="pointer-events-none fixed inset-y-0 left-1/2 z-50 w-full max-w-md -translate-x-1/2 outline-none"
      >
        <div className="absolute inset-x-6 top-6 flex items-center justify-between">
          <div role="progressbar" aria-label="あそびかた" aria-valuemin={1} aria-valuemax={GUIDE_STEPS} aria-valuenow={step + 1} className="flex gap-2">
            {Array.from({ length: GUIDE_STEPS }, (_, i) => (
              <span key={i} className={`h-3 rounded-md ${i === step ? "w-7 bg-white" : i < step ? "w-3 bg-white" : "w-3 bg-white/40"}`} />
            ))}
          </div>
          <button type="button" onClick={onClose} className={SKIP_STYLE}>
            {last ? "とじる" : "とばす"}
          </button>
        </div>

        {step === 0 && (
          <Sheet key="flow" className="bottom-6 top-[88px] rounded-[32px] pb-5 pt-[18px]">
            <div className="flex items-center gap-2.5">
              <Navigator mood="happy" size={72} react />
              <h2 className="font-pop text-[22px] font-normal leading-normal">
                あそびかたは
                <br />
                この じゅんばん！
              </h2>
            </div>
            {/* 低い画面では、リストだけスクロールして「つぎへ」は いつも見せる */}
            <ol className="relative my-auto flex min-h-0 flex-col gap-2.5 overflow-y-auto [@media(max-height:720px)]:gap-1">
              <span aria-hidden className="absolute bottom-[22px] left-5 top-[22px] border-l-4 border-dotted border-[#C9CCDA]" />
              {FLOW.map((item, i) => (
                <li key={item.title} className="relative flex items-center gap-3">
                  <span className={`flex size-11 shrink-0 items-center justify-center rounded-full font-pop text-lg ${item.color}`}>{i + 1}</span>
                  <span className="flex grow flex-col">
                    <span className="font-pop text-lg leading-[1.4]">{item.title}</span>
                    <span className="text-sm font-black leading-[1.4] text-ink-sub">{item.text}</span>
                  </span>
                  <svg aria-hidden width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4A4E6A" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
                    {item.icon}
                  </svg>
                </li>
              ))}
            </ol>
            <Button className="mb-1.5 shrink-0" onClick={onNext}>
              つぎへ
            </Button>
          </Sheet>
        )}

        {step === 1 && (
          // 下のナビ（102px）の上に、すきま 24px で置く
          <Sheet key="nav" tail="down" className="bottom-[126px] max-h-[calc(100dvh-126px-88px)] overflow-y-auto">
            <div className="flex items-center gap-2.5">
              <Navigator mood="happy" size={60} react />
              <h2 className="font-pop text-lg font-normal leading-normal">
                したの ボタンで
                <br />
                いろんな ページに いけるよ
              </h2>
            </div>
            <ul className="flex flex-col gap-2">
              {TABS.map((tab) => (
                <li key={tab.label} className="flex items-center gap-3">
                  <span className={`flex h-9 w-11 shrink-0 items-center justify-center rounded-[18px] ${tab.chip}`}>
                    <Icon name={tab.icon} size={22} stroke={tab.stroke} strokeWidth={2.4} />
                  </span>
                  <span className="flex flex-col">
                    <span className="text-[17px] font-black leading-[1.4]">{tab.label}</span>
                    <span className="text-sm font-black leading-[1.4] text-ink-sub">{tab.text}</span>
                  </span>
                </li>
              ))}
            </ul>
            <Button
              variant="plain"
              className="h-[60px] shrink-0 rounded-[22px] border-3 border-ink bg-navi font-pop text-[21px] text-white shadow-pop-md active:translate-y-[5px] active:shadow-none"
              onClick={onNext}
            >
              つぎへ
            </Button>
          </Sheet>
        )}

        {step === 2 && place && (
          <Sheet
            key="capture"
            tail={place.side === "above" ? "down" : "up"}
            style={place.side === "above" ? { bottom: place.offset } : { top: place.offset }}
          >
            <div className="flex items-center gap-3">
              <Navigator mood="happy" size={84} react />
              <div className="flex flex-col gap-1">
                <h2 className="font-pop text-2xl font-normal leading-[1.4]">まずは ここから！</h2>
                <p className="text-base font-black leading-[1.6]">
                  おすと カメラが ひらくよ。
                  <br />
                  まちの はてなを さがそう！
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button type="button" onClick={onClose} className={`${PAIR_STYLE} bg-white text-[17px] font-black`}>
                ホームを みる
              </button>
              <button type="button" onClick={onTry} className={`${PAIR_STYLE} bg-pink font-pop text-[19px]`}>
                やってみる！
              </button>
            </div>
          </Sheet>
        )}
      </div>
    </>
  );
}

/** 3枚目で「はてなを さがす！」を囲む 黄色の点線。ボタンの下の影（7px）の ぶん、下を広くする */
export function GuideRing() {
  return <span aria-hidden className="pointer-events-none absolute -inset-x-3 -bottom-[19px] -top-3 rounded-[40px] border-4 border-dashed border-yellow" />;
}
