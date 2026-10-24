import type { ReactNode } from "react";

// docs/design/screens の線のアイコン（24×24、角の丸い線）。色は stroke / fill に渡す
const PATHS: Record<string, ReactNode> = {
  back: <path d="M15 5l-7 7 7 7" />,
  next: <path d="M9 5l7 7-7 7" />,
  down: <path d="M6 9l6 6 6-6" />,
  camera: (
    <>
      <path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" />
      <circle cx="12" cy="13.5" r="4" />
    </>
  ),
  album: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="3" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="M4 17l5-5 4 4 3-3 4 4" />
    </>
  ),
  home: (
    <>
      <path d="M3 11l9-7 9 7" />
      <path d="M5 10v10h14V10" />
    </>
  ),
  book: (
    <>
      <path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v15H5.5A1.5 1.5 0 0 0 4 19.5z" />
      <path d="M4 19.5A1.5 1.5 0 0 0 5.5 21H20v-3" />
    </>
  ),
  people: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M16.5 14.2c2.9.3 5 2.5 5 5.8" />
    </>
  ),
  gear: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1" />
    </>
  ),
  star: <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" />,
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M15.5 15.5L21 21" />
    </>
  ),
  undo: (
    <>
      <path d="M9 14L4 9l5-5" />
      <path d="M4 9h10a6 6 0 0 1 0 12h-3" />
    </>
  ),
  lasso: <path d="M10 5c6-2 11 1 11 6s-5 7-10 7S3 15 3 11c0-2.5 2-4.5 5-5.5 1-.3 1.6-1.2 1.4-2.5" />,
  dice: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
      <circle cx="8.5" cy="8.5" r="1.1" fill="currentColor" />
      <circle cx="15.5" cy="15.5" r="1.1" fill="currentColor" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" />
    </>
  ),
  pencil: <path d="M4 20l1-4L16 5a2.1 2.1 0 0 1 3 3L8 19z" />,
  shield: <path d="M12 3l8 3v6c0 4.5-3.4 8-8 9-4.6-1-8-4.5-8-9V6z" />,
  lock: (
    <>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="11" x2="12" y2="16" />
      <circle cx="12" cy="7.8" r="0.6" fill="currentColor" />
    </>
  ),
  bulb: (
    <>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" />
    </>
  ),
  flag: <path d="M6 21V4h11l-2 4 2 4H6" />,
  flask: (
    <>
      <path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4a2 2 0 0 0 1.8-3l-5-9V3" />
      <path d="M7.5 15h9" />
    </>
  ),
  calc: (
    <>
      <path d="M6 7h5M8.5 4.5v5M13 8h5" />
      <path d="M6.5 16h5M13 14.5l5 3M18 14.5l-5 3" />
    </>
  ),
  qr: (
    <>
      <rect x="4" y="4" width="6" height="6" rx="1" />
      <rect x="14" y="4" width="6" height="6" rx="1" />
      <rect x="4" y="14" width="6" height="6" rx="1" />
      <path d="M14 14h2v2h-2zM18 18h2v2h-2zM18 14h2" />
    </>
  ),
};

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 24,
  stroke = "currentColor",
  fill = "none",
  strokeWidth = 2.4,
  className,
}: {
  name: IconName;
  size?: number;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className ?? ""}`}
    >
      {PATHS[name]}
    </svg>
  );
}

/** しょうごうのメダル（見本 19・20） */
export function Medal({ size = 34 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#FFC83D" stroke="#22223A" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
      <circle cx="12" cy="9" r="6" />
      <path d="M8.5 14L7 22l5-3 5 3-1.5-8" fill="#FF6F9C" />
    </svg>
  );
}
