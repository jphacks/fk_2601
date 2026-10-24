"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { paintThumb, scenePhoto, SCENE_KEYS, SCENE_NAMES, type SceneKey } from "@/lib/scenes";
import { useQuiz } from "./QuizProvider";

function Thumb({ scene }: { scene: SceneKey }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) paintThumb(ref.current, scene);
  }, [scene]);
  return <canvas ref={ref} aria-hidden className="aspect-[3/4] w-full rounded-[14px] border-[2.5px] border-ink bg-photo object-cover" />;
}

const COLOR: Record<SceneKey, string> = { gacha: "bg-pink", signal: "bg-navi", ice: "bg-mint" };

/** 撮影できないとき（会場・AI が使えないとき）にも、囲む操作から最後まで試せる見本の絵 */
export function SceneSamples() {
  const router = useRouter();
  const { setPhoto } = useQuiz();

  return (
    <section className="space-y-2">
      <h2 className="font-pop text-base font-normal">みほんの えで ためす</h2>
      <div className="grid grid-cols-3 gap-3">
        {SCENE_KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setPhoto(scenePhoto(key), key);
              router.push("/lasso");
            }}
            className={`rounded-[20px] border-3 border-ink p-1.5 text-center shadow-pop-xs active:translate-y-[3px] active:shadow-none ${COLOR[key]}`}
          >
            <span className="block overflow-hidden rounded-[14px] bg-white">
              <Thumb scene={key} />
              <span className="block px-1 py-1 text-[13px] font-black">{SCENE_NAMES[key]}</span>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
