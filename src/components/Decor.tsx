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

/** 横長の進みぐあい（スタンプの数など）。色は分類の色 */
export function Meter({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <span className="block h-2 overflow-hidden rounded bg-white" role="img" aria-label={`${value} / ${max}`}>
      <span className="block h-2" style={{ width: `${pct}%`, background: color }} />
    </span>
  );
}
