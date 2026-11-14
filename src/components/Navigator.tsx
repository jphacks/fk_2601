import Image from "next/image";
import { NAVIGATOR_NAME } from "@/lib/constants";
import { NaviDress } from "./NaviDress";

/** ナビの表情（docs/design/README.md「ナビの表情」）。pitari・oshii・hazure は答え合わせ専用 */
export type Mood = "happy" | "think" | "surprise" | "sorry" | "effort" | "pitari" | "oshii" | "hazure";

const FACE: Record<Mood, { file: string; label: string }> = {
  happy: { file: "smile", label: "にこにこ" },
  think: { file: "think", label: "はてな" },
  sorry: { file: "blank", label: "ぽかん" },
  effort: { file: "effort", label: "ぎゅっ" },
  surprise: { file: "wow", label: "びっくり" },
  pitari: { file: "shock", label: "びっくり・赤" },
  oshii: { file: "shy", label: "てれ" },
  hazure: { file: "wow", label: "びっくり・青" },
};

/**
 * ナビキャラ。ふだんは ぷにぷに動く。react を付けると、下から飛び出して登場する（答え合わせ・ゲットの画面。docs/design/README.md「ナビの出しかた」）。
 * stage（成長の段階。2 からかざりが つく）と outfit（着ている きせかえの ID）を渡すと、画像の上に SVG を重ねる（#193。画像は そのまま）。
 * ふたつとも ないときは、いつもの ナビの画像だけ
 */
export function Navigator({
  mood = "happy",
  size = 88,
  react = false,
  stage = 1,
  outfit = [],
}: {
  mood?: Mood;
  size?: number;
  react?: boolean;
  stage?: number;
  outfit?: readonly string[];
}) {
  const face = FACE[mood];
  const motion = react ? "navi-react" : "navi";
  const image = (className: string) => (
    <Image
      src={`/navi/navi-${face.file}.png`}
      alt={`${NAVIGATOR_NAME}（${face.label}）`}
      width={size}
      height={size}
      priority={size >= 100}
      className={className}
      style={{ width: size, height: size }}
    />
  );
  if (stage <= 1 && outfit.length === 0) return image(`shrink-0 ${motion}`);
  // かざり・きせかえと いっしょに ぷにぷに動くよう、動きは まとめて つける
  return (
    <span className={`relative block shrink-0 ${motion}`} style={{ width: size, height: size }}>
      <NaviDress layer="back" stage={stage} outfit={outfit} />
      {/* うしろの SVG（位置を決めた要素）より前に出すため、画像も relative にする */}
      {image("relative block")}
      <NaviDress layer="front" stage={stage} outfit={outfit} />
    </span>
  );
}
