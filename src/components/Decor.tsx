import type { Rating } from "@/lib/rating";

/**
 * 画面の後ろにちらばる、紙ふぶきの飾り（見本 14〜16・19）。クリックの邪魔をしない。
 * 画面の ふち（左右と上の 24px）まで広げる（中身の はばに おさめると、はしの飾りが とちゅうで切れて見えるため）。Page の中で使う
 */
export function Confetti({ tone = "party" }: { tone?: "party" | "calm" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 390 844"
      preserveAspectRatio="xMidYMin slice"
      className="pointer-events-none absolute -inset-x-6 -top-6 -z-10 h-[calc(100%+24px)] w-[calc(100%+48px)]"
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

// ---- こたえあわせ・はてなゲット！の、1回だけ出る演出 ----
// どれも 画面ぜんたいに重ねる（押すのの邪魔をしない）。動きを減らす設定のときは、出ない（globals.css で すぐ終わって消える）

// 画面の ふちまで広げた、演出の わく（Page の 24px の余白の ぶん 外へ出す。Page の いちばん上に置く部品の中で使う）
const FX_LAYER = "pointer-events-none absolute -inset-x-6 -top-6 z-20 h-dvh overflow-hidden";

// お祝いの色。赤は「ピタリ・正解」だけに使うので、ふだんは入れない
const PARTY_COLORS = ["#FFC83D", "#FF6F9C", "#24C3A0", "#4A5AE8", "#8B5CF6", "#FF8A3D"];

/** 決まった ならびの数（描くたびに同じ形になる。Math.random は、描くたびに変わるので使わない） */
function sequence(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

type Piece = { x: number; y: number; fall: number; turn: number; delay: number; dur: number; color: string; w: number; h: number; round: boolean };

/** まんなかから ぐるっと 外へ とぶ 紙ふぶき（とぶ先は、上のほうを 多めにする） */
function burstPieces(count: number, seed: number, colors: string[], near: number, far: number): Piece[] {
  const next = sequence(seed);
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + next() * 0.5;
    const reach = near + next() * (far - near);
    const round = next() < 0.3;
    const w = 7 + Math.round(next() * 6);
    return {
      x: Math.round(Math.cos(angle) * reach),
      y: Math.round(Math.sin(angle) * reach * 0.85 - 40),
      fall: 260 + Math.round(next() * 260),
      turn: Math.round((next() - 0.5) * 720),
      delay: Math.round(next() * 12) / 100,
      dur: 1.6 + Math.round(next() * 8) / 10,
      color: colors[i % colors.length],
      w,
      h: round ? w : Math.round(w * (0.5 + next() * 1.2)),
      round,
    };
  });
}

/** 上から ふる 紙ふぶき（x は 左からの %） */
function rainPieces(count: number, seed: number, colors: string[]): Piece[] {
  const next = sequence(seed);
  return Array.from({ length: count }, (_, i) => {
    const round = next() < 0.3;
    const w = 7 + Math.round(next() * 5);
    return {
      x: Math.round(((i + next()) / count) * 100),
      y: 0,
      fall: 380 + Math.round(next() * 360),
      turn: Math.round((next() - 0.5) * 900),
      delay: Math.round(next() * 150) / 100,
      dur: 1.9 + Math.round(next() * 12) / 10,
      color: colors[i % colors.length],
      w,
      h: round ? w : Math.round(w * (0.5 + next() * 1.2)),
      round,
    };
  });
}

const BURSTS = {
  // ピタリ・正解：いちばん はなやかに（赤も まぜる）
  pita: burstPieces(48, 7, [...PARTY_COLORS, "#F0444F"], 110, 250),
  // はてなゲット！
  party: burstPieces(48, 11, PARTY_COLORS, 110, 250),
  // おしい：ひかえめに（オレンジと黄色）
  oshii: burstPieces(20, 23, ["#FF8A3D", "#FFC83D", "#FFB547", "#FFFFFF"], 70, 160),
} as const;

const RAINS = {
  pita: rainPieces(26, 3, [...PARTY_COLORS, "#F0444F"]),
  party: rainPieces(26, 5, PARTY_COLORS),
} as const;

const pieceStyle = (p: Piece) =>
  ({
    width: p.w,
    height: p.h,
    background: p.color,
    borderRadius: p.round ? "50%" : 2,
    "--br": `${p.turn}deg`,
    "--fall": `${p.fall}px`,
    "--dur": `${p.dur}s`,
  }) as React.CSSProperties;

/**
 * 紙ふぶきが、ぱんっと はじけて、ひらひら おちる（1回だけ）。x・y は はじける場所（画面の 左・上からの %）。
 * rain を付けると、上からも ふらせる（ピタリ・正解・はてなゲット！）
 */
export function Burst({ tone, x = 50, y = 34, delay = 0, rain = false }: { tone: keyof typeof BURSTS; x?: number; y?: number; delay?: number; rain?: boolean }) {
  return (
    <div aria-hidden="true" className={FX_LAYER}>
      <div className="absolute" style={{ left: `${x}%`, top: `${y}%` }}>
        {BURSTS[tone].map((p, i) => (
          <span
            key={i}
            className="burst-piece absolute block"
            style={{ ...pieceStyle(p), "--bx": `${p.x}px`, "--by": `${p.y}px`, "--delay": `${delay + p.delay}s` } as React.CSSProperties}
          />
        ))}
      </div>
      {rain &&
        RAINS[tone === "pita" ? "pita" : "party"].map((p, i) => (
          <span
            key={i}
            className="rain-piece absolute top-0 block"
            style={{ ...pieceStyle(p), left: `${p.x}%`, "--delay": `${delay + 0.25 + p.delay}s` } as React.CSSProperties}
          />
        ))}
    </div>
  );
}

// びっくりの線：まんなかを あけて、外へ のびる 三角を ぐるっと ならべる（長いのと 短いのを かわりばんこに）
const SHOCK_LINES = Array.from({ length: 20 }, (_, i) => ({ deg: i * 18, long: i % 2 === 0 }));

/** 「こんなに ちがうの！？」の びっくり（大はずれ）。線が まんなかから 外へ 広がり、「！？」が とび出す（1回だけ） */
export function Shock({ x = 50, y = 34 }: { x?: number; y?: number }) {
  return (
    <div aria-hidden="true" className={FX_LAYER}>
      {[0, 0.16].map((delay, wave) => (
        <svg
          key={wave}
          viewBox="-100 -100 200 200"
          className="animate-shock absolute size-[760px] -translate-x-1/2 -translate-y-1/2"
          style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${delay}s` }}
        >
          <g transform={`rotate(${wave * 9})`}>
            {SHOCK_LINES.map((l) => (
              <path
                key={l.deg}
                d={l.long ? "M0 -42L-2.6 -96H2.6z" : "M0 -52L-1.8 -84H1.8z"}
                fill={l.long ? "#4A5AE8" : "#FFC83D"}
                transform={`rotate(${l.deg})`}
              />
            ))}
          </g>
        </svg>
      ))}
      {[
        // ふきだしと カードの文字に かさならない、あいた ところに出す
        { text: "！？", left: "40%", top: "18.5%", size: 44, turn: -8, delay: 0.1 },
        { text: "！", left: "5%", top: "24.5%", size: 36, turn: -16, delay: 0.25 },
        { text: "！", left: "88%", top: "50%", size: 32, turn: 18, delay: 0.38 },
      ].map((m, i) => (
        <span key={i} className="absolute" style={{ left: m.left, top: m.top, rotate: `${m.turn}deg` }}>
          <span
            className="animate-pop-fade block font-pop leading-none text-navi [text-shadow:2px_0_0_#fff,-2px_0_0_#fff,0_2px_0_#fff,0_-2px_0_#fff]"
            style={{ fontSize: m.size, animationDelay: `${m.delay}s` }}
          >
            {m.text}
          </span>
        </span>
      ))}
    </div>
  );
}

// おしい：カードの まわりで、星が きらっと 光って 消える
const GLINTS = [
  { left: "6%", top: "25%", size: 30, color: "#FFC83D", delay: 0.05 },
  { left: "86%", top: "20%", size: 24, color: "#FF8A3D", delay: 0.2 },
  { left: "76%", top: "47%", size: 30, color: "#FFC83D", delay: 0.32 },
  { left: "3%", top: "48%", size: 22, color: "#FF8A3D", delay: 0.44 },
  { left: "44%", top: "15%", size: 20, color: "#FFB547", delay: 0.56 },
];

/** 「おしい！」の きらきら。星が ぽんぽんと 光って消える（1回だけ） */
export function Glints() {
  return (
    <div aria-hidden="true" className={FX_LAYER}>
      {GLINTS.map((g, i) => (
        <svg key={i} width={g.size} height={g.size} viewBox="0 0 24 24" className="animate-pop-fade absolute" style={{ left: g.left, top: g.top, animationDelay: `${g.delay}s` }}>
          <path d="M12 1.5l2.4 7.1 7.1 2.4-7.1 2.4L12 20.5l-2.4-7.1L2.5 11l7.1-2.4z" fill={g.color} stroke="#22223A" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      ))}
    </div>
  );
}

// はなまる：まんなかから うずを かいて、まわりに 花びらを 7まい かく（ひとふでで かける 1本の線）
const HANAMARU = (() => {
  const ring = 27;
  const petal = 12.6;
  const count = 7;
  const at = (k: number) => {
    const a = Math.PI + (k * 2 * Math.PI) / count;
    return `${(50 + ring * Math.cos(a)).toFixed(1)} ${(50 + ring * Math.sin(a)).toFixed(1)}`;
  };
  const petals = Array.from({ length: count }, (_, k) => `A${petal} ${petal} 0 1 1 ${at(k + 1)}`).join("");
  return `M50 50a3 3 0 0 1 6 0a6.5 6.5 0 0 1-13 0a10 10 0 0 1 20 0a13.5 13.5 0 0 1-27 0a17 17 0 0 1 34 0a20 20 0 0 1-40 0L${at(0)}${petals}`;
})();

/** はなまる（正解の しるし。学校の 赤丸と 同じ意味なので、赤は ここと ピタリだけ）。animate のときは、ペンで かくように 出す */
export function Hanamaru({ size = 84, animate = false, delay = 0, className = "" }: { size?: number; animate?: boolean; delay?: number; className?: string }) {
  return (
    <svg role="img" aria-label="はなまる" width={size} height={size} viewBox="0 0 100 100" className={`shrink-0 -rotate-6 ${className}`}>
      <circle cx="50" cy="50" r="46" fill="#FFFFFF" fillOpacity="0.85" />
      <path
        d={HANAMARU}
        pathLength={1}
        fill="none"
        stroke="#F0444F"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={animate ? "animate-draw" : ""}
        style={animate ? ({ "--delay": `${delay}s` } as React.CSSProperties) : undefined}
      />
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
 * 画面ぜんたいの後ろで、黄色と白の光が ぐるっと回る（ずかんに のこそう）。
 * 親（relative。Page の いちばん上に置く）の まわり 24px の ふちまで広げる。centerY は 光の中心の高さ（親の上からの %）
 */
export function Rays({ centerY = 42 }: { centerY?: number }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute -inset-x-6 -bottom-[30px] -top-6 -z-20 overflow-hidden">
      <div className="absolute left-1/2 size-[1600px] -translate-x-1/2 -translate-y-1/2" style={{ top: `${centerY}%` }}>
        <svg viewBox="-100 -100 200 200" className="animate-spin-slow size-full">
          {RAYS.map((deg) => (
            <path key={deg} d="M0 0L-7 -100H7z" fill="#FFE07A" fillOpacity="0.5" transform={`rotate(${deg})`} />
          ))}
        </svg>
      </div>
    </div>
  );
}

/**
 * カードの見せ場（ずかんに のこそう）。カードが はずんで出てきて、ふわふわ うく。後ろに 白い光、まわりに 星、下に 影。
 * 星は この わくの中（左右の ふちまで）だけに出すので、カードの文字には重ならない
 */
export function Spotlight({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative -mx-6 flex flex-col items-center px-6 pt-4">
      <span aria-hidden className="absolute left-1/2 top-1/2 -z-10 aspect-square w-full max-w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,#fff_58%,rgba(255,255,255,0))]" />
      <span className="absolute left-2 top-6">
        <Sparkle color="#FFC83D" size={30} />
      </span>
      <span className="absolute right-3 top-2">
        <Sparkle color="#FF6F9C" size={24} delay={0.4} />
      </span>
      <span className="absolute bottom-12 left-3">
        <Sparkle color="#8B5CF6" size={22} delay={0.8} />
      </span>
      <span className="absolute bottom-8 right-2">
        <Sparkle color="#24C3A0" size={30} delay={1.2} />
      </span>
      <div className="animate-card-pop max-w-full">
        <div className="animate-float-card">
          <div className="-rotate-3">{children}</div>
        </div>
      </div>
      <span aria-hidden className="animate-float-shadow mt-3 h-3.5 w-[210px] rounded-[50%] bg-ink opacity-20" />
    </div>
  );
}
