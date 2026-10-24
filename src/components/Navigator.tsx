import { NAVIGATOR_NAME } from "@/lib/constants";

export type Mood = "happy" | "think" | "surprise" | "sorry";

const MOUTH: Record<Mood, React.ReactNode> = {
  happy: <path d="M40 68 Q50 78 60 68" stroke="#1f2a44" strokeWidth="4" fill="none" strokeLinecap="round" />,
  think: <path d="M43 70 H57" stroke="#1f2a44" strokeWidth="4" fill="none" strokeLinecap="round" />,
  surprise: <ellipse cx="50" cy="71" rx="5" ry="6.5" fill="#1f2a44" />,
  sorry: <path d="M40 74 Q50 64 60 74" stroke="#1f2a44" strokeWidth="4" fill="none" strokeLinecap="round" />,
};

function Eyes({ mood }: { mood: Mood }) {
  if (mood === "happy") {
    return (
      <>
        <path d="M31 54 Q37 45 43 54" stroke="#1f2a44" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M57 54 Q63 45 69 54" stroke="#1f2a44" strokeWidth="4" fill="none" strokeLinecap="round" />
      </>
    );
  }
  const dy = mood === "think" ? -2 : 0;
  const r = mood === "surprise" ? 6 : 4.5;
  return (
    <>
      <circle cx="37" cy={53 + dy} r={r} fill="#1f2a44" />
      <circle cx="63" cy={53 + dy} r={r} fill="#1f2a44" />
      <circle cx="38.5" cy={51.5 + dy} r="1.6" fill="#fff" />
      <circle cx="64.5" cy={51.5 + dy} r="1.6" fill="#fff" />
    </>
  );
}

export function Navigator({ mood = "happy", size = 88 }: { mood?: Mood; size?: number }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={`${NAVIGATOR_NAME}`} className="shrink-0">
      <line x1="50" y1="12" x2="50" y2="22" stroke="#1e4fb8" strokeWidth="4" strokeLinecap="round" />
      <circle cx="50" cy="10" r="5" fill="#ffb703" />
      <rect x="12" y="22" width="76" height="68" rx="26" fill="#2f6fed" />
      <rect x="20" y="31" width="60" height="52" rx="20" fill="#fff8e7" />
      <Eyes mood={mood} />
      <circle cx="29" cy="64" r="5" fill="#f0558a" opacity="0.35" />
      <circle cx="71" cy="64" r="5" fill="#f0558a" opacity="0.35" />
      {MOUTH[mood]}
      <circle cx="10" cy="56" r="6" fill="#1e4fb8" />
      <circle cx="90" cy="56" r="6" fill="#1e4fb8" />
    </svg>
  );
}
