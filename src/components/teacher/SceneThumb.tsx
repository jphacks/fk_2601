"use client";

import { useEffect, useRef } from "react";
import { paintThumb, SCENE_NAMES, type SceneKey } from "@/lib/scenes";

// 切り抜き画像の代わりに、見本の絵を描く（管理画面の見本では、実際の子どもの写真を使わない）
export function SceneThumb({ scene, className = "" }: { scene: SceneKey; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (ref.current) paintThumb(ref.current, scene);
  }, [scene]);
  return <canvas ref={ref} role="img" aria-label={`切り抜き画像（見本の絵：${SCENE_NAMES[scene]}）`} className={`block bg-t-ground object-cover ${className}`} />;
}
