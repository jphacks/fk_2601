import { NAVIGATOR_NAME } from "@/lib/constants";

export type Mood = "happy" | "think" | "surprise" | "sorry";

const INK = "#1f2a44";

const MOUTH: Record<Mood, React.ReactNode> = {
  happy: <path d="M38 66 Q50 80 62 66 Z" fill="#fff" stroke={INK} strokeWidth="3.5" strokeLinejoin="round" />,
  think: <path d="M43 71 H57" stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round" />,
  surprise: <ellipse cx="50" cy="72" rx="6" ry="8" fill={INK} />,
  sorry: <path d="M40 75 Q50 65 60 75" stroke={INK} strokeWidth="4" fill="none" strokeLinecap="round" />,
};

function Eyes({ mood }: { mood: Mood }) {
  if (mood === "happy") {
    return (
      <>
        <path d="M31 54 Q37 44 43 54" stroke={INK} strokeWidth="4.5" fill="none" strokeLinecap="round" />
        <path d="M57 54 Q63 44 69 54" stroke={INK} strokeWidth="4.5" fill="none" strokeLinecap="round" />
      </>
    );
  }
  const dy = mood === "think" ? -2 : 0;
  const r = mood === "surprise" ? 6.5 : 4.8;
  return (
    <g className="animate-blink">
      <circle cx="37" cy={53 + dy} r={r} fill={INK} />
      <circle cx="63" cy={53 + dy} r={r} fill={INK} />
      <circle cx="38.8" cy={51.2 + dy} r="1.8" fill="#fff" />
      <circle cx="64.8" cy={51.2 + dy} r="1.8" fill="#fff" />
    </g>
  );
}

/** ナビゲーターキャラ。ふわふわ浮き、おどろいたときははねる */
export function Navigator({ mood = "happy", size = 88 }: { mood?: Mood; size?: number }) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      role="img"
      aria-label={`${NAVIGATOR_NAME}`}
      className={`shrink-0 overflow-visible ${mood === "surprise" ? "animate-hop" : "animate-float"}`}
    >
      <ellipse cx="50" cy="96" rx="26" ry="3.5" fill="#1f2a44" opacity="0.14" />
      <line x1="50" y1="14" x2="50" y2="23" stroke={INK} strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="50" cy="10" r="5.5" fill="#ffb703" stroke={INK} strokeWidth="2.5" />
      <rect x="12" y="22" width="76" height="68" rx="26" fill="#2f6fed" stroke={INK} strokeWidth="3.5" />
      <rect x="20" y="31" width="60" height="52" rx="20" fill="#fff8e7" stroke={INK} strokeWidth="2.5" />
      <Eyes mood={mood} />
      <circle cx="28" cy="65" r="5.5" fill="#f0558a" opacity="0.4" />
      <circle cx="72" cy="65" r="5.5" fill="#f0558a" opacity="0.4" />
      {MOUTH[mood]}
      <circle cx="9" cy="56" r="6.5" fill="#1e4fb8" stroke={INK} strokeWidth="2.5" />
      <circle cx="91" cy="56" r="6.5" fill="#1e4fb8" stroke={INK} strokeWidth="2.5" />
    </svg>
  );
}
