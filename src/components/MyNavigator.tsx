"use client";

import { naviSize, naviStage, wornOutfit } from "@/lib/navi";
import { progressPoints } from "@/lib/progress";
import { useArchive } from "./ArchiveProvider";
import { useApp } from "./AuthProvider";
import { Navigator, type Mood } from "./Navigator";

/** いまの ナビの すがた：成長の点数・段階（ずかんから数える）と、着ている きせかえ（プロフィール）（#193） */
export function useNaviLook(): { points: number; stage: number; outfit: string[] } {
  const { profile } = useApp();
  const { archives } = useArchive();
  const points = progressPoints(archives);
  return { points, stage: naviStage(points), outfit: wornOutfit(profile?.outfit) };
}

/**
 * 自分のナビ（そだった すがたと、着ている きせかえ）。ホーム・ずかんに のこした直後・スタンプの「きせかえ」で使う。
 * grow を付けると、段階に合わせて大きさも変わる。先生用の画面・グループの投稿には使わない
 */
export function MyNavigator({ mood = "happy", size = 88, react = false, grow = false }: { mood?: Mood; size?: number; react?: boolean; grow?: boolean }) {
  const { stage, outfit } = useNaviLook();
  return <Navigator mood={mood} size={grow ? naviSize(size, stage) : size} react={react} stage={stage} outfit={outfit} />;
}
