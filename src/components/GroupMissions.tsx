"use client";

import { useEffect, useState } from "react";
import { jstDate } from "@/lib/missions";
import type { GroupMission } from "@/lib/types";
import { useApp } from "./AuthProvider";

/**
 * きょうの グループのミッション（#139）。入っているグループのうち、きょうのミッションを出したグループの分を、グループの順に返す。
 * 読み込み中は null。読めなかったグループは とばす（ミッションが出ないだけで、画面は止めない）
 */
export function useTodayGroupMissions(): GroupMission[] | null {
  const { backend, memberships } = useApp();
  const [loaded, setLoaded] = useState<{ key: string; missions: GroupMission[] } | null>(null);
  // 入っているグループが変わったら読み直す
  const key = memberships ? `${jstDate()}:${memberships.map((m) => m.groupId).join(",")}` : null;

  useEffect(() => {
    if (!memberships || key === null) return;
    let cancelled = false;
    const today = jstDate();
    Promise.all(memberships.map((m) => backend.getGroupMission(m.groupId, today).catch(() => null))).then((list) => {
      if (!cancelled) setLoaded({ key, missions: list.filter((m): m is GroupMission => m !== null) });
    });
    return () => {
      cancelled = true;
    };
  }, [backend, memberships, key]);

  return loaded && loaded.key === key ? loaded.missions : null;
}
