import type { Rating } from "@/lib/rating";

/** 画面の後ろにちらばる、紙ふぶきの飾り（見本 14〜16・19）。クリックの邪魔をしない */
export function Confetti({ tone = "party" }: { tone?: "party" | "calm" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 390 844"
      preserveAspectRatio="xMidYMin slice"
      className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-full w-full"
    >
      {tone === "party" ? (
        <>
          <circle cx="20" cy="18" r="7" fill="#FFC83D" />
          <path d="M356 14l14 5-11 10z" fill="#FF6F9C" />
          <rect x="178" y="8" width="12" height="12" rx="2" fill="#24C3A0" transform="rotate(25 184 14)" />
          <path d="M120 20q8-10 16 0t16 0" fill="none" stroke="#8B5CF6" strokeWidth="4" strokeLinecap="round" />
          <circle cx="244" cy="16" r="6" fill="#4A5AE8" />
          <path d="M372 120l4 9 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z" fill="#FFC83D" />
          <rect x="8" y="150" width="10" height="10" rx="2" fill="#FF6F9C" transform="rotate(-20 13 155)" />
          <circle cx="380" cy="190" r="5" fill="#24C3A0" />
          <circle cx="10" cy="90" r="5" fill="#8B5CF6" />
          <path d="M8 470q7-9 14 0t14 0" fill="none" stroke="#FFC83D" strokeWidth="4" strokeLinecap="round" />
          <circle cx="378" cy="480" r="6" fill="#FF6F9C" />
          <path d="M14 620l10 3-7 8z" fill="#4A5AE8" />
          <rect x="368" y="640" width="10" height="10" rx="2" fill="#FFC83D" transform="rotate(30 373 645)" />
        </>
      ) : (
        <>
          <g stroke="#4A5AE8" strokeWidth="4" strokeLinecap="round">
            <path d="M14 40l14 8" />
            <path d="M10 70h16" />
            <path d="M14 100l14-8" />
          </g>
          <circle cx="372" cy="22" r="6" fill="#FFC83D" />
          <path d="M352 160l12 4-9 9z" fill="#FF6F9C" />
          <path d="M8 470q7-9 14 0t14 0" fill="none" stroke="#8B5CF6" strokeWidth="4" strokeLinecap="round" />
          <circle cx="378" cy="480" r="6" fill="#24C3A0" />
        </>
      )}
    </svg>
  );
}

const HANKO: Record<Rating, { text: string; color: string; size: number }> = {
  pita: { text: "ピタリ", color: "#F0444F", size: 22 },
  oshii: { text: "おしい", color: "#FF8A3D", size: 22 },
  ohazure: { text: "大はずれ", color: "#4A5AE8", size: 18 },
};

/** 答え合わせの「はんこ」。ピタリ＝赤、おしい＝オレンジ、大はずれ＝青（赤は正解だけに使う） */
export function Hanko({ rating, label, size = 112, animate = false, className = "" }: { rating: Rating; label?: string; size?: number; animate?: boolean; className?: string }) {
  const h = HANKO[rating];
  const text = label ?? h.text;
  return (
    <svg
      role="img"
      aria-label={`${text}の はんこ`}
      width={size}
      height={size}
      viewBox="0 0 112 112"
      className={`${animate ? "animate-stamp" : "rotate-12"} ${className}`}
    >
      <circle cx="56" cy="56" r="50" fill="#FFFFFF" fillOpacity="0.85" stroke={h.color} strokeWidth="6" />
      <circle cx="56" cy="56" r="41" fill="none" stroke={h.color} strokeWidth="2.5" />
      <text x="56" y="64" textAnchor="middle" fontFamily="var(--font-pop)" fontSize={text.length > 3 ? 18 : h.size} fill={h.color}>
        {text}
      </text>
    </svg>
  );
}

/** 小さな星（見出しの横などに、文字と重ならないように ならべて置く）。きらきら光る */
export function Sparkle({ color = "#FFC83D", size = 26, delay = 0 }: { color?: string; size?: number; delay?: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" className="animate-twinkle shrink-0" style={{ animationDelay: `${delay}s` }}>
      <path d="M12 2l2.6 6.6L21 10l-5 4.4L17.4 21 12 17.4 6.6 21 8 14.4 3 10l6.4-1.4z" fill={color} stroke="#22223A" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

// カードの後ろの光：黄色い すじを ぐるっと ならべる
const RAYS = Array.from({ length: 16 }, (_, i) => i * (360 / 16));

/**
 * カードの後ろで光が回り、まわりで星が光る（ずかんに のこそう）。
 * 光と星は この わくの中だけに出す（上下の見出しや文字には重ならない）
 */
export function Spotlight({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative -mx-6 flex justify-center overflow-hidden py-6">
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 size-[560px] -translate-x-1/2 -translate-y-1/2">
        <svg viewBox="-100 -100 200 200" className="animate-spin-slow size-full">
          {RAYS.map((deg) => (
            <path key={deg} d="M0 0L-7 -100H7z" fill="#FFE07A" fillOpacity="0.55" transform={`rotate(${deg})`} />
          ))}
          <circle r="34" fill="#FFF6D6" />
        </svg>
      </div>
      <span className="absolute left-3 top-4">
        <Sparkle color="#FFC83D" size={28} />
      </span>
      <span className="absolute right-4 top-10">
        <Sparkle color="#FF6F9C" size={22} delay={0.4} />
      </span>
      <span className="absolute bottom-6 left-5">
        <Sparkle color="#8B5CF6" size={22} delay={0.8} />
      </span>
      <span className="absolute bottom-4 right-3">
        <Sparkle color="#24C3A0" size={28} delay={1.2} />
      </span>
      <div className="animate-card-pop relative flex w-full justify-center px-6">{children}</div>
    </div>
  );
}

// ふってくる 紙ふぶき（色・形・はやさ・おくれ・よこの ばしょ）
const PIECES: { color: string; round: boolean; dur: number; delay: number; x: number }[] = [
  { color: "#FFC83D", round: true, dur: 3.2, delay: 0, x: 4 },
  { color: "#FF6F9C", round: false, dur: 4.1, delay: 0.8, x: 10 },
  { color: "#24C3A0", round: false, dur: 3.6, delay: 1.7, x: 2 },
  { color: "#4A5AE8", round: true, dur: 4.6, delay: 2.4, x: 8 },
  { color: "#8B5CF6", round: false, dur: 3.9, delay: 3.1, x: 5 },
];

function ConfettiStrip({ side }: { side: "left" | "right" }) {
  return (
    <div className={`absolute inset-y-0 w-5 ${side === "left" ? "left-0.5" : "right-0.5"}`}>
      {PIECES.map((p, i) => (
        <span
          key={i}
          className={`animate-confetti-fall absolute -top-4 size-2.5 ${p.round ? "rounded-full" : "rounded-[2px]"}`}
          style={{
            background: p.color,
            left: p.x,
            animationDuration: `${p.dur}s`,
            // 左と右で おくれを ずらして、同じ うごきに 見えないようにする
            animationDelay: `${side === "left" ? p.delay : p.delay + 0.5}s`,
          }}
        />
      ))}
    </div>
  );
}

/** 画面の左右の ふち（文字の ない 24px）だけに、紙ふぶきを ふらせる。押すのの邪魔をしない */
export function SideConfetti() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute -inset-x-6 -bottom-[30px] -top-6 -z-10 overflow-hidden">
      <ConfettiStrip side="left" />
      <ConfettiStrip side="right" />
    </div>
  );
}
