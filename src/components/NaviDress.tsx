import type { ReactNode } from "react";
import { outfitItem, type OutfitSlot } from "@/lib/navi";

// ナビの成長の飾りと きせかえ（#193）。ナビの画像（480px 四方）の上に重ねる SVG。座標は 480 四方の画像と同じ。
// 画像は変えない。7つの表情のどれにも重なるよう、顔のまわり（目・ほっぺ・頭のてっぺん）に合わせて描く

const INK = "#22223A";
const YELLOW = "#FFC83D";
const PINK = "#FF6F9C";
const MINT = "#24C3A0";
const RED = "#F0444F";
const ORANGE = "#FF8A3D";
const NAVI = "#4A5AE8";

/** 線の太さ（ナビの線に合わせて 3px くらい。画像が 124px のとき 480 の座標で 11 くらい） */
const LINE = 9;

function pts(cx: number, cy: number, outer: number, inner: number, n: number, rot = -90): string {
  return Array.from({ length: n * 2 }, (_, i) => {
    const r = i % 2 === 0 ? outer : inner;
    const a = ((rot + (i * 180) / n) * Math.PI) / 180;
    return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
  }).join(" ");
}

function Star({ x, y, r, fill = YELLOW, spin = -90 }: { x: number; y: number; r: number; fill?: string; spin?: number }) {
  return <polygon points={pts(x, y, r, r * 0.5, 5, spin)} fill={fill} stroke={INK} strokeWidth={LINE * 0.7} strokeLinejoin="round" />;
}

function Sparkle({ x, y, r }: { x: number; y: number; r: number }) {
  return <polygon points={pts(x, y, r, r * 0.32, 4)} fill={YELLOW} stroke={INK} strokeWidth={LINE * 0.6} strokeLinejoin="round" />;
}

/** 成長の飾り（段階が上がると、前の段階の飾りに足していく） */
function GrowthFront({ stage }: { stage: number }) {
  return (
    <>
      {stage >= 2 && (
        <>
          <Sparkle x={96} y={262} r={26} />
          <Sparkle x={126} y={222} r={13} />
          <Sparkle x={382} y={262} r={26} />
          <Sparkle x={352} y={222} r={13} />
        </>
      )}
      {stage >= 3 && (
        <>
          <path d="M248 144Q200 138 198 92Q250 98 248 144Z" fill={MINT} stroke={INK} strokeWidth={LINE * 0.8} strokeLinejoin="round" />
          <path d="M254 144Q302 136 306 94Q256 100 254 144Z" fill={MINT} stroke={INK} strokeWidth={LINE * 0.8} strokeLinejoin="round" />
        </>
      )}
      {stage >= 4 && (
        <>
          <Star x={52} y={170} r={26} />
          <Star x={432} y={158} r={22} spin={-80} />
        </>
      )}
      {stage >= 5 && (
        <>
          <Star x={86} y={96} r={16} fill={PINK} />
          <Star x={402} y={86} r={18} fill={MINT} spin={-100} />
        </>
      )}
    </>
  );
}

/** 成長の飾りのうち、ナビの うしろに敷くもの（いちばん上の段階の ひかり） */
function GrowthBack({ stage }: { stage: number }) {
  if (stage < 5) return null;
  return (
    <>
      <circle cx={240} cy={310} r={232} fill={YELLOW} opacity={0.22} />
      <circle cx={240} cy={310} r={190} fill={YELLOW} opacity={0.28} />
    </>
  );
}

const stroke = { stroke: INK, strokeWidth: LINE, strokeLinejoin: "round" as const, strokeLinecap: "round" as const };

/** きせかえの絵。front はナビの上、back はナビの うしろ */
const OUTFIT_ART: Record<string, { front?: ReactNode; back?: ReactNode }> = {
  ribbon: {
    front: (
      <g transform="translate(342 186) rotate(24)" {...stroke} fill={PINK}>
        <path d="M0 0L-64 -36Q-78 0 -64 36Z" />
        <path d="M0 0L64 -36Q78 0 64 36Z" />
        <circle r={14} />
      </g>
    ),
  },
  cap: {
    front: (
      <g {...stroke}>
        <path d="M300 214C352 196 414 206 432 230C382 242 330 236 300 226Z" fill={ORANGE} />
        <path d="M132 218C132 132 190 108 252 108C314 108 372 132 372 218Z" fill={ORANGE} />
        <path d="M132 196Q252 222 372 196" fill="none" strokeWidth={LINE * 0.8} />
        <circle cx={252} cy={106} r={13} fill={YELLOW} />
      </g>
    ),
  },
  crown: {
    front: (
      <g {...stroke}>
        <path d="M172 196L164 112L212 150L252 98L292 150L340 112L332 196Z" fill={YELLOW} />
        <circle cx={252} cy={160} r={12} fill={RED} />
        <circle cx={206} cy={176} r={8} fill={NAVI} />
        <circle cx={298} cy={176} r={8} fill={MINT} />
      </g>
    ),
  },
  glasses: {
    front: (
      <g {...stroke} fill="#FFFFFF" fillOpacity={0.3}>
        <circle cx={177} cy={256} r={42} />
        <circle cx={293} cy={256} r={42} />
        <path d="M218 250Q235 238 252 250" fill="none" />
        <path d="M136 248L108 236M334 248L362 236" fill="none" />
      </g>
    ),
  },
  stars: {
    front: (
      <g {...stroke}>
        <polygon points={pts(177, 258, 56, 28, 5)} fill={YELLOW} fillOpacity={0.55} />
        <polygon points={pts(293, 258, 56, 28, 5)} fill={YELLOW} fillOpacity={0.55} />
        <path d="M226 252Q235 244 244 252" fill="none" />
      </g>
    ),
  },
  scarf: {
    front: (
      <g {...stroke}>
        <path d="M312 428L348 484L296 492L282 436Z" fill={MINT} />
        <path d="M52 370Q250 452 428 370L432 418Q250 496 48 418Z" fill={MINT} />
        <path d="M120 404L116 430M176 418L172 444M240 424L240 450M304 418L308 444M366 404L372 428" fill="none" stroke="#FFFFFF" strokeWidth={LINE * 0.8} />
      </g>
    ),
  },
  medal: {
    front: (
      <g {...stroke}>
        <path d="M184 322L250 424M316 322L250 424" fill="none" strokeWidth={LINE * 3} />
        <path d="M184 322L250 424M316 322L250 424" fill="none" stroke={RED} strokeWidth={LINE * 1.7} />
        <circle cx={250} cy={440} r={36} fill={YELLOW} />
        <polygon points={pts(250, 440, 20, 9, 5)} fill="#FFFFFF" strokeWidth={LINE * 0.6} />
      </g>
    ),
  },
  cape: {
    back: (
      <g {...stroke}>
        <path d="M112 322C62 376 24 436 18 482L462 482C456 436 418 376 368 322Z" fill={RED} />
        <path d="M112 322C62 376 24 436 18 482L96 482C104 424 120 372 150 338Z" fill="#000000" fillOpacity={0.14} stroke="none" />
      </g>
    ),
    front: (
      <g {...stroke}>
        <path d="M92 336Q240 394 388 336" fill="none" strokeWidth={LINE * 2.6} />
        <path d="M92 336Q240 394 388 336" fill="none" stroke={RED} strokeWidth={LINE * 1.4} />
        <circle cx={96} cy={338} r={15} fill={YELLOW} />
        <circle cx={384} cy={338} r={15} fill={YELLOW} />
      </g>
    ),
  },
};

// 下から重ねる順（マントの首もと → マフラー・メダル → めがね → ぼうし）
const FRONT_ORDER: OutfitSlot[] = ["back", "neck", "face", "head"];

/** ナビの上に重ねる SVG。layer が "back" のときは、画像の うしろに敷く（きせかえの マント・いちばん上の段階の ひかり） */
export function NaviDress({ layer, stage, outfit }: { layer: "front" | "back"; stage: number; outfit: readonly string[] }) {
  const worn = outfit.flatMap((id) => {
    const item = outfitItem(id);
    return item ? [{ item, art: OUTFIT_ART[id] }] : [];
  });
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 480 480"
      className="pointer-events-none absolute inset-0 size-full overflow-visible"
    >
      {layer === "back" ? (
        <>
          <GrowthBack stage={stage} />
          {worn.map(({ item, art }) => (art?.back ? <g key={item.id}>{art.back}</g> : null))}
        </>
      ) : (
        <>
          <GrowthFront stage={stage} />
          {FRONT_ORDER.flatMap((slot) => worn.filter(({ item }) => item.slot === slot)).map(({ item, art }) =>
            art?.front ? <g key={item.id}>{art.front}</g> : null,
          )}
        </>
      )}
    </svg>
  );
}
