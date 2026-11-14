"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/components/AuthProvider";
import type { GroupId } from "@/lib/constants";
import { agoLabel, PRESENCE_ACTIVE_MS, PRESENCE_HELP_KEEP_MS, screenLabel } from "@/lib/presence";
import type { GroupPresence } from "@/lib/types";

// グループの「きょう」の「いま つかっている人」（#192）。5分以内に動いた人と、「たすけて」を出している人を出す。
// 子どもの画面が書く presence（いまの画面・時刻・さいごのエラーの文・たすけて）だけを読む。写真・問いの中身・ニックネームは持っていない。
// 30秒ごとに読みなおす（タブが見えているときだけ）。読む数は、30分以内に動いた人の分だけ

const REFRESH_MS = 30_000;

type State = { ok: true; list: GroupPresence[]; at: number } | { ok: false } | undefined;

export function GroupPresencePanel({ groupId, reloadKey }: { groupId: GroupId; reloadKey: number }) {
  const { backend } = useApp();
  const [state, setState] = useState<State>();

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      const now = Date.now();
      backend
        .listGroupPresence(groupId, now - PRESENCE_HELP_KEEP_MS)
        .then((list) => !cancelled && setState({ ok: true, list, at: now }))
        .catch(() => !cancelled && setState((before) => (before?.ok ? before : { ok: false })));
    };
    load();
    const timer = setInterval(() => document.visibilityState === "visible" && load(), REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [backend, groupId, reloadKey]);

  const rows = state?.ok
    ? state.list
        .filter((p) => p.help || state.at - p.at <= PRESENCE_ACTIVE_MS)
        // たすけて を先に、そのあとは新しく動いた順
        .sort((a, b) => Number(b.help) - Number(a.help) || b.at - a.at)
    : [];
  const activeCount = state?.ok ? state.list.filter((p) => state.at - p.at <= PRESENCE_ACTIVE_MS).length : 0;
  const helpCount = rows.filter((p) => p.help).length;

  return (
    <section aria-label="いま使っている人" className="flex flex-col gap-2.5 rounded-tcard border border-t-line bg-white p-3.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <h2 className="text-base font-bold">いま使っている人</h2>
        {state?.ok && (
          <>
            <strong className="text-[26px] leading-tight tabular-nums">{activeCount}人</strong>
            {helpCount > 0 && (
              <span role="status" className="rounded-full border border-t-chalk-line bg-t-chalk-soft px-2.5 py-0.5 text-[13px] font-bold text-t-chalk-text">
                たすけて {helpCount}人
              </span>
            )}
          </>
        )}
        <p className="flex-[1_1_260px] text-xs leading-[1.7] text-t-text-sub">
          5分以内に動いた人です（30秒ごとに更新）。いまの画面とエラーの文だけで、写真や問いの中身は見えません。
        </p>
      </div>

      {state === undefined && <span className="text-sm text-t-text-sub">読み込んでいます…</span>}
      {state && !state.ok && (
        <span className="text-sm text-t-danger">読めませんでした（子どもの画面側の設定が反映されていないか、通信が切れています）</span>
      )}
      {state?.ok && rows.length === 0 && <span className="text-sm text-t-text-sub">いま使っている人はいません。</span>}
      {state?.ok && rows.length > 0 && (
        <ul aria-label="使っている人" className="overflow-hidden rounded-xl border border-t-line">
          {rows.map((p) => {
            const idle = state.at - p.at > PRESENCE_ACTIVE_MS;
            return (
              <li
                key={p.uid}
                className={`grid min-h-[52px] grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)_92px_minmax(0,1.6fr)] items-center gap-x-4 gap-y-1 border-b border-t-line-soft px-3.5 py-2.5 text-sm last:border-b-0 max-[760px]:grid-cols-[minmax(0,1fr)_auto] ${
                  p.help ? "bg-t-chalk-soft" : ""
                }`}
              >
                <span className="flex min-w-0 flex-wrap items-center gap-2 font-bold break-all">
                  {p.username ?? `（ID なし ${p.uid.slice(0, 6)}）`}
                  {p.help && (
                    <span className="rounded-full bg-t-chalk px-2 py-0.5 text-[11px] text-t-chalk-text">
                      たすけて{p.helpAt ? `（${agoLabel(state.at - p.helpAt)}）` : ""}
                    </span>
                  )}
                </span>
                <span className="text-[13px] text-t-text-2">{screenLabel(p.screen)}</span>
                <span className={`text-xs tabular-nums ${idle ? "text-t-text-sub" : "text-t-text-2"}`}>
                  {idle ? `${agoLabel(state.at - p.at)}（離席）` : agoLabel(state.at - p.at)}
                </span>
                <span className="text-xs leading-[1.6] max-[760px]:col-span-2">
                  {p.error ? (
                    <span className="text-t-danger">
                      {p.error}
                      {p.errorAt ? <span className="ml-1 text-t-text-sub">（{agoLabel(state.at - p.errorAt)}）</span> : null}
                    </span>
                  ) : (
                    <span className="text-t-text-sub">エラーなし</span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
