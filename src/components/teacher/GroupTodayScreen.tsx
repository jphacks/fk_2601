"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useApp } from "@/components/AuthProvider";
import { groupOf, SUBJECT_LABEL, type GroupId } from "@/lib/constants";
import { formatJoinCode } from "@/lib/joinCode";
import { jstDate, jstDayStart } from "@/lib/missions";
import { stripRuby } from "@/lib/ruby";
import type { GroupMission, GroupPost, GroupSettings, JoinCode } from "@/lib/types";
import type { Subject } from "@/server/llm/schema";
import { BTN_BASE, GroupAdminPage, groupLabel, SUB } from "./GroupAdmin";

// グループの きょう（/teacher/groups/{グループ}。#140）。グループを選んで はじめに開く画面。本番のデータを扱う。
// その日のようす（投稿・通報・メンバー・ミッション・参加コード）を1画面に まとめる。
// 子どもどうしを比べないよう、人ごとの件数や当たり外れの割合は出さない（見本と同じ決まり。docs/06-school-expansion.md 5.5）。
// 1つが読めなくても、ほかは出す（読めなかったところだけ「読めませんでした」）

const FIELD_COLOR: Record<Subject, string> = { math: "bg-t-math", science: "bg-t-sci", info: "bg-t-info" };
const LINK = `${BTN_BASE} h-9 px-3 pointer-coarse:h-11 ${SUB}`;

type Loaded<T> = { ok: true; value: T } | { ok: false } | undefined;

async function settle<T>(p: Promise<T>): Promise<Loaded<T>> {
  try {
    return { ok: true, value: await p };
  } catch {
    return { ok: false };
  }
}

function Tile({ label, children, href, linkLabel }: { label: string; children: React.ReactNode; href?: string; linkLabel?: string }) {
  return (
    <section aria-label={label} className="flex min-h-[132px] flex-col gap-1.5 rounded-tcard border border-t-line bg-white px-4 py-3">
      <span className="text-xs font-bold text-t-text-2">{label}</span>
      <div className="flex flex-1 flex-col gap-1">{children}</div>
      {href && linkLabel && (
        <Link href={href} className={`${LINK} self-start`}>
          {linkLabel}
        </Link>
      )}
    </section>
  );
}

function Value<T>({ loaded, children }: { loaded: Loaded<T>; children: (value: T) => React.ReactNode }) {
  if (loaded === undefined) return <span className="text-sm text-t-text-sub">読み込んでいます…</span>;
  if (!loaded.ok) return <span className="text-sm text-t-danger">読めませんでした</span>;
  return <>{children(loaded.value)}</>;
}

const Big = ({ children }: { children: React.ReactNode }) => <strong className="text-[30px] leading-tight tabular-nums">{children}</strong>;

function Today({ groupId }: { groupId: GroupId }) {
  const { backend } = useApp();
  const base = `/teacher/groups/${groupId}`;
  const autoJoin = groupOf(groupId).autoJoin;
  // 開いたときの日付で決める（表示のたびに時計を読まない）
  const [day] = useState(() => ({ date: jstDate(), start: jstDayStart() }));
  const [attempt, setAttempt] = useState(0);
  const [posts, setPosts] = useState<Loaded<{ today: number; recent: GroupPost[] }>>();
  const [reports, setReports] = useState<Loaded<number>>();
  const [members, setMembers] = useState<Loaded<{ total: number; today: number }>>();
  const [mission, setMission] = useState<Loaded<GroupMission | null>>();
  const [joinCode, setJoinCode] = useState<Loaded<JoinCode | null>>();
  const [settings, setSettings] = useState<Loaded<GroupSettings>>();

  useEffect(() => {
    let cancelled = false;
    const set = <T,>(p: Promise<T>, apply: (v: Loaded<T>) => void) => void settle(p).then((v) => !cancelled && apply(v));
    set(
      Promise.all([backend.countGroupPostsSince(groupId, day.start), backend.listGroupPosts(groupId)]).then(([today, page]) => ({ today, recent: page.slice(0, 6) })),
      setPosts,
    );
    set(backend.listGroupReports(groupId).then((counts) => Object.values(counts).filter((n) => n > 0).length), setReports);
    set(
      backend.listMembers(groupId).then((list) => ({ total: list.length, today: list.filter((m) => m.joinedAt !== null && m.joinedAt >= day.start).length })),
      setMembers,
    );
    set(backend.getGroupMission(groupId, day.date), setMission);
    set(backend.getJoinCode(groupId), setJoinCode);
    if (autoJoin) set(backend.getGroupSettings(groupId), setSettings);
    return () => {
      cancelled = true;
    };
  }, [backend, groupId, autoJoin, day, attempt]);

  function reload() {
    setPosts(undefined);
    setReports(undefined);
    setMembers(undefined);
    setMission(undefined);
    setJoinCode(undefined);
    setSettings(undefined);
    setAttempt((n) => n + 1);
  }

  return (
    <div className="flex flex-col gap-3.5">
      <div className="flex justify-end">
        <button type="button" onClick={reload} className={`${BTN_BASE} h-10 px-3.5 pointer-coarse:h-11 ${SUB}`}>
          読み込み直す
        </button>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
        <Tile label="きょうの投稿" href={`${base}/hatena`} linkLabel="はてなを見る">
          <Value loaded={posts}>{(v) => <Big>{v.today}件</Big>}</Value>
          <span className="text-xs text-t-text-sub">日本時間の0時からあと</span>
        </Tile>
        <Tile label="通報された投稿" href={`${base}/hatena`} linkLabel="はてなで確かめる">
          <Value loaded={reports}>
            {(n) => (
              <>
                <Big>
                  <span className={n > 0 ? "text-t-danger" : ""}>{n}件</span>
                </Big>
                <span className="text-xs text-t-text-sub">{n > 0 ? "はてなの画面の先頭に出ています" : "いまはありません"}</span>
              </>
            )}
          </Value>
        </Tile>
        <Tile label="メンバー" href={`${base}/members`} linkLabel="メンバーを見る">
          <Value loaded={members}>
            {(v) => (
              <>
                <Big>{v.total}人</Big>
                <span className="text-xs text-t-text-sub">きょう入った人 {v.today}人</span>
              </>
            )}
          </Value>
        </Tile>
        <Tile label="きょうのミッション" href={`${base}/missions`} linkLabel={mission?.ok && mission.value ? "変える" : "出す"}>
          <Value loaded={mission}>
            {(m) =>
              m ? (
                <span className="text-[15px] leading-[1.6] font-bold">{m.text}</span>
              ) : (
                <span className="text-sm text-t-text-sub">出していません（メンバーには、いつもの きょうの おだいが出ます）</span>
              )
            }
          </Value>
        </Tile>
        <Tile label="入り方" href={`${base}/members`} linkLabel="参加コード・メンバー">
          <Value loaded={joinCode}>
            {(c) =>
              c ? (
                <span className="flex flex-wrap items-center gap-2">
                  <strong className={`text-lg tracking-[0.06em] tabular-nums ${c.open ? "" : "text-t-text-sub line-through"}`}>{formatJoinCode(c.code)}</strong>
                  <span className="text-xs text-t-text-2">{c.open ? "受付中" : "止めています"}</span>
                </span>
              ) : (
                <span className="text-sm text-t-text-sub">参加コードは まだ作っていません</span>
              )
            }
          </Value>
          {autoJoin && (
            <Value loaded={settings}>
              {(s) => <span className="text-xs text-t-text-2">新しく登録した人：{s.open ? "自動で入ります" : "自動では入りません"}</span>}
            </Value>
          )}
        </Tile>
      </div>

      <section aria-label="新しい投稿" className="flex flex-col gap-2.5 rounded-tcard border border-t-line bg-t-surface p-3.5">
        <div className="flex items-center gap-3">
          <h2 className="text-base font-bold">新しい投稿</h2>
          <Link href={`${base}/hatena`} className={`${LINK} ml-auto`}>
            ぜんぶ見る
          </Link>
        </div>
        <Value loaded={posts}>
          {(v) =>
            v.recent.length === 0 ? (
              <span className="text-sm text-t-text-sub">まだ投稿はありません。</span>
            ) : (
              <ul className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-2.5">
                {v.recent.map((p) => (
                  <li key={p.id} className="flex flex-col overflow-hidden rounded-xl border border-[#E3E9E6] bg-white">
                    <div className="flex h-[88px] items-center justify-center bg-t-ground">
                      {/* eslint-disable-next-line @next/next/no-img-element -- グループに見せた切り抜き（data URL） */}
                      <img src={p.image} alt="" className="size-full object-contain" />
                    </div>
                    <span className="flex flex-col gap-1 px-2.5 py-2">
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-t-text-2">
                        <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${FIELD_COLOR[p.subject]}`} />
                        {SUBJECT_LABEL[p.subject]}
                      </span>
                      <span className="line-clamp-2 text-xs leading-[1.5] font-bold">{stripRuby(p.text)}</span>
                    </span>
                  </li>
                ))}
              </ul>
            )
          }
        </Value>
      </section>
    </div>
  );
}

export function GroupTodayScreen({ groupId }: { groupId: string }) {
  return (
    <GroupAdminPage
      groupId={groupId}
      title={(id) => `きょうの ${groupLabel(id)}`}
      description="きょう（日本時間）のグループのようすです。子どもどうしを比べる数（人ごとの件数など）は出しません。この画面は見本ではなく、本番のデータを扱います。"
    >
      {(id) => <Today key={id} groupId={id} />}
    </GroupAdminPage>
  );
}
