import Image from "next/image";
import { NAVIGATOR_NAME } from "@/lib/constants";

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

const HOP: Mood[] = ["pitari", "hazure", "surprise"];

/** ナビキャラ。ふわふわ浮き、おどろいたときははねる */
export function Navigator({ mood = "happy", size = 88 }: { mood?: Mood; size?: number }) {
  const face = FACE[mood];
  return (
    <Image
      src={`/navi/navi-${face.file}.png`}
      alt={`${NAVIGATOR_NAME}（${face.label}）`}
      width={size}
      height={size}
      priority={size >= 100}
      className={`shrink-0 ${HOP.includes(mood) ? "animate-hop" : "animate-float"}`}
      style={{ width: size, height: size }}
    />
  );
}
