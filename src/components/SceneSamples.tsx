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
  return <canvas ref={ref} aria-hidden className="aspect-[3/4] w-full rounded-xl border-2 border-ink bg-paper object-cover" />;
}

/** 撮影できないとき（会場・AI が使えないとき）にも、囲む操作から最後まで試せる見本の絵 */
export function SceneSamples() {
  const router = useRouter();
  const { setPhoto } = useQuiz();

  return (
    <section className="space-y-2">
      <h2 className="font-display text-base">みほんの えで ためす</h2>
      <div className="grid grid-cols-3 gap-3">
        {SCENE_KEYS.map((key, i) => (
          <button
            key={key}
            type="button"
            onClick={() => {
              setPhoto(scenePhoto(key), key);
              router.push("/lasso");
            }}
            className={`paper-card paper-card-press space-y-1 p-2 text-center ${i === 1 ? "rotate-1" : i === 0 ? "-rotate-1" : "-rotate-[0.5deg]"}`}
          >
            <Thumb scene={key} />
            <span className="block text-sm font-black">{SCENE_NAMES[key]}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
