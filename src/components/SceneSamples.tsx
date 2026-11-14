"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { paintThumb, scenePhoto, SCENE_KEYS, SCENE_NAMES, type SceneKey } from "@/lib/scenes";
import { Icon } from "./Icons";
import { useQuiz } from "./QuizProvider";

function Thumb({ scene }: { scene: SceneKey }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    // 大きく見せるので、こまかく描く（表示は 104px。画面の こまかさ 3倍まで）
    if (ref.current) paintThumb(ref.current, scene, 312);
  }, [scene]);
  return <canvas ref={ref} aria-hidden className="size-[104px] shrink-0 rounded-[18px] border-3 border-ink bg-photo object-cover" />;
}

const COLOR: Record<SceneKey, string> = { gacha: "bg-pink-light", signal: "bg-navi-light", ice: "bg-mint-light" };

/**
 * 見本の絵の一覧（/samples）。撮影できないとき（会場・AI が使えないとき）にも、囲む操作から最後まで試せる。
 * えらぶと、そのまま 囲む画面へ進む（囲む画面の「もどる」は、この一覧へ もどる）
 */
export function SceneSamples() {
  const router = useRouter();
  const { setPhoto } = useQuiz();

  return (
    <ul className="flex flex-col gap-4">
      {SCENE_KEYS.map((key) => (
        <li key={key}>
          <button
            type="button"
            onClick={() => {
              setPhoto(scenePhoto(key), "/samples", key);
              router.push("/lasso");
            }}
            className={`flex w-full items-center gap-4 rounded-card border-3 border-ink p-2.5 pr-4 text-left shadow-pop-md active:translate-y-[5px] active:shadow-none ${COLOR[key]}`}
          >
            <Thumb scene={key} />
            <span className="min-w-0 grow font-pop text-[22px] leading-snug">{SCENE_NAMES[key]}</span>
            <Icon name="next" size={26} strokeWidth={3} />
          </button>
        </li>
      ))}
    </ul>
  );
}
