"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { GroupId } from "@/lib/constants";
import { isDemo } from "@/lib/demo";
import { PRESENCE_ERROR_MAX, PRESENCE_HEARTBEAT_MS, PRESENCE_MIN_GAP_MS, screenOfPath } from "@/lib/presence";
import { stripRuby } from "@/lib/ruby";
import { useApp } from "./AuthProvider";
import { Jp } from "./RubyText";

// 子どもの画面が、入っているグループの先生に「いま どの画面か」を知らせる（#192。docs/03-technical.md 6章）。
// 書くのは、ログイン ID・いまの画面の名前・時刻・さいごのエラーの文・たすけて だけ（写真・問いの中身・位置・ニックネームは書かない）。
// 書きこみの回数をおさえる：画面かエラーが変わったとき（つづけて変わっても 5秒に1回まで）と、動いているあいだの 1分に1回。
// 同じ内容は、動いていなければ書かない（タブが見えていて、さわっているときだけ 1分ごとに時刻を更新する）。
// ルールを本番に反映する前は書きこみが断られる。そのときは何も出さずに、この回は あきらめる（書きなおしを くりかえさない）

type Notice = "sent" | "cancelled" | "failed";

type PresenceContext = {
  /** 「たすけて」を出せるか（グループに入っている子で、書きこみが断られていないとき） */
  canHelp: boolean;
  /** 「たすけて」を出しているか */
  help: boolean;
  toggleHelp: () => void;
  /** いまの画面の名前を、URL より くわしく知らせる（/result の なぞとき など）。画面が消えたら元にもどる */
  setSubScreen: (screen: string | null) => void;
  /** さいごのエラーの文を知らせる（子ども向けの文。ふりがなの記法は外して送る） */
  reportError: (message: string) => void;
};

const Context = createContext<PresenceContext | null>(null);

export function usePresence(): PresenceContext | null {
  return useContext(Context);
}

/** いまの画面を、URL より くわしく知らせる。画面が消えたら もとにもどる */
export function usePresenceScreen(screen: string): void {
  const setSubScreen = useContext(Context)?.setSubScreen;
  useEffect(() => {
    setSubScreen?.(screen);
    return () => setSubScreen?.(null);
  }, [setSubScreen, screen]);
}

/** エラーの文を、先生の画面の「さいごのエラー」に知らせる（画面に出ているあいだ）。null は何もしない */
export function useReportError(message: string | null): void {
  const reportError = useContext(Context)?.reportError;
  useEffect(() => {
    if (message && reportError) reportError(message);
  }, [message, reportError]);
}

export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useApp();
  return <PresenceState key={user?.uid ?? "none"}>{children}</PresenceState>;
}

function PresenceState({ children }: { children: React.ReactNode }) {
  const { backend, user, memberships } = useApp();
  const pathname = usePathname();
  const [subScreen, setSubScreen] = useState<string | null>(null);
  const [errorSeq, setErrorSeq] = useState(0);
  const [help, setHelp] = useState(false);
  const [denied, setDenied] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  // 先生（管理者）は書かない。グループに入っている子だけ。デモ（/demo）では書かない
  const groupsKey = useMemo(
    () => (isDemo() || !memberships ? "" : memberships.filter((m) => m.role === "member").map((m) => m.groupId).join(",")),
    [memberships],
  );
  const enabled = !!user && groupsKey !== "" && !denied;
  const screen = subScreen ?? screenOfPath(pathname);

  // 書きこみのようす（再描画のたびに作りなおさないよう、ref に置く）
  const sent = useRef({ screen: "", errorSeq: 0, groupsKey: "", at: 0 });
  const error = useRef<string | null>(null);
  const active = useRef(true);
  const busy = useRef(false);
  const latest = useRef({ screen, errorSeq, groupsKey, username: user?.username ?? "" });
  useEffect(() => {
    latest.current = { screen, errorSeq, groupsKey, username: user?.username ?? "" };
  }, [screen, errorSeq, groupsKey, user]);

  const write = useCallback(
    async (extra: { help?: boolean } = {}): Promise<boolean> => {
      const cur = latest.current;
      // 「たすけて」は、ほかの書きこみの最中でも書く（押したのに何も起きない、をなくす）
      if (!user || !cur.groupsKey || (busy.current && extra.help === undefined)) return false;
      busy.current = true;
      const withError = cur.errorSeq !== sent.current.errorSeq;
      const groups = cur.groupsKey.split(",") as GroupId[];
      const results = await Promise.allSettled(
        groups.map((g) =>
          backend.savePresence(user.uid, g, {
            username: cur.username,
            screen: cur.screen,
            ...(withError ? { error: error.current } : {}),
            ...extra,
          }),
        ),
      );
      busy.current = false;
      // 断られた（ルールがまだ）ときは、あきらめる。ネットのエラーなどは、つぎの機会まで待つ
      if (results.some((r) => r.status === "rejected" && (r.reason as { code?: string })?.code === "permission-denied")) {
        setDenied(true);
        return false;
      }
      const ok = results.every((r) => r.status === "fulfilled");
      if (ok) {
        sent.current = { screen: cur.screen, errorSeq: cur.errorSeq, groupsKey: cur.groupsKey, at: Date.now() };
        active.current = false;
      }
      return ok;
    },
    [backend, user],
  );

  // 画面が変わったとき・さわっているとき・（はじめに）書く。5秒ごとに、書くか どうかを見る
  useEffect(() => {
    if (!enabled) return;
    const tick = () => {
      const cur = latest.current;
      const now = Date.now();
      const changed = cur.screen !== sent.current.screen || cur.errorSeq !== sent.current.errorSeq || cur.groupsKey !== sent.current.groupsKey;
      const gap = now - sent.current.at;
      const visible = typeof document === "undefined" || document.visibilityState === "visible";
      if (changed ? gap >= PRESENCE_MIN_GAP_MS : visible && active.current && gap >= PRESENCE_HEARTBEAT_MS) void write();
    };
    const touch = () => {
      active.current = true;
    };
    const events = ["pointerdown", "keydown", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, touch, { passive: true }));
    document.addEventListener("visibilitychange", touch);
    const timer = setInterval(tick, PRESENCE_MIN_GAP_MS);
    tick();
    return () => {
      events.forEach((e) => window.removeEventListener(e, touch));
      document.removeEventListener("visibilitychange", touch);
      clearInterval(timer);
    };
  }, [enabled, write]);

  // 画面かエラーが変わったら、すぐ見る（上の timer を待たずに）
  useEffect(() => {
    if (!enabled) return;
    const gap = Date.now() - sent.current.at;
    if (gap >= PRESENCE_MIN_GAP_MS) void write();
  }, [enabled, write, screen, errorSeq]);

  // 開きなおしても、押した「たすけて」の状態を保つ（読めなければ、押していないことにする）
  useEffect(() => {
    if (!enabled || !user) return;
    let cancelled = false;
    Promise.all((groupsKey.split(",") as GroupId[]).map((g) => backend.getOwnHelp(user.uid, g)))
      .then((list) => !cancelled && setHelp(list.some(Boolean)))
      .catch((e: { code?: string }) => {
        if (!cancelled && e?.code === "permission-denied") setDenied(true);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, backend, user, groupsKey]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 4000);
    return () => clearTimeout(timer);
  }, [notice]);

  const toggleHelp = useCallback(() => {
    if (!enabled) return;
    const next = !help;
    void write({ help: next }).then((ok) => {
      if (ok) setHelp(next);
      setNotice(ok ? (next ? "sent" : "cancelled") : "failed");
    });
  }, [enabled, help, write]);

  const reportError = useCallback((message: string) => {
    const text = stripRuby(message).trim().slice(0, PRESENCE_ERROR_MAX);
    if (!text || text === error.current) return;
    error.current = text;
    setErrorSeq((n) => n + 1);
  }, []);

  const value = useMemo<PresenceContext>(
    () => ({ canHelp: enabled, help, toggleHelp, setSubScreen, reportError }),
    [enabled, help, toggleHelp, reportError],
  );

  return (
    <Context.Provider value={value}>
      {children}
      {notice && (
        <div className="pointer-events-none fixed inset-x-0 top-[88px] z-50 mx-auto w-full max-w-md px-6">
          <p role="status" className="rounded-card bg-yellow-light px-4 py-3 text-center text-[19px] font-black leading-[1.6]">
            <Jp>
              {notice === "sent"
                ? "{先生|せんせい}に しらせたよ"
                : notice === "cancelled"
                  ? "とりけしたよ"
                  : "とどかなかったよ。{手|て}を あげて {先生|せんせい}を よんでね"}
            </Jp>
          </p>
        </div>
      )}
    </Context.Provider>
  );
}
