"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { useArchive } from "@/components/ArchiveProvider";
import { useApp } from "@/components/AuthProvider";
import { Gate } from "@/components/Gate";
import { Icon } from "@/components/Icons";
import { Loading } from "@/components/Loading";
import { Navigator } from "@/components/Navigator";
import { Page } from "@/components/Page";
import { SUBJECT_STYLE } from "@/components/QuestionCard";
import { Jp, RubyText } from "@/components/RubyText";
import { ErrorNotice, LinkButton } from "@/components/ui";
import { CAPTURE_WITH_PROMISE, groupOf, REACTIONS, titleLabel, type GroupId, type ReactionId } from "@/lib/constants";
import type { GroupPost, GroupReactions } from "@/lib/types";

// リアクションの絵（ナビの表情）。src/lib/constants.ts の REACTIONS と同じ順
const REACTION_FACE: Record<ReactionId, string> = { sugoi: "wow", yaritai: "effort", naruhodo: "think" };

const DAY = 24 * 60 * 60 * 1000;

/** 日の区切り（「きょう」「きのう」「11がつ 12にち」）。ふりがなの記法で返す（小さい文字なので、<Jp> で学年に合わせて出す） */
function dayLabel(time: number, now: number): string {
  const start = (t: number) => new Date(t).setHours(0, 0, 0, 0);
  const diff = Math.round((start(now) - start(time)) / DAY);
  if (diff === 0) return "{今日|きょう}";
  if (diff === 1) return "{昨日|きのう}";
  const d = new Date(time);
  return `${d.getMonth() + 1}{月|がつ} ${d.getDate()}{日|にち}`;
}

function timeLabel(time: number): string {
  const d = new Date(time);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function ReactionFace({ id, size = 22 }: { id: ReactionId; size?: number }) {
  return <Image src={`/navi/navi-${REACTION_FACE[id]}.png`} alt="" width={size} height={size} className="shrink-0" style={{ width: size, height: size }} />;
}

function OthersContent() {
  const { backend, user, memberships, membershipsFailed, reloadMemberships } = useApp();
  const { archives } = useArchive();
  const [picked, setPicked] = useState<GroupId | null>(null);
  // えらんだグループ（まだ えらんでいない・もう入っていないときは、はじめのグループ）
  const groupId = memberships?.find((m) => m.groupId === picked)?.groupId ?? memberships?.[0]?.groupId ?? null;
  // 投稿には持ち主が入っていないので、自分のずかんで このグループに見せているものと照らして「きみの はてな」を出す
  const mine = useMemo(
    () => new Set(archives.flatMap((a) => (groupId && a.sharedGroups?.includes(groupId) ? [a.id] : []))),
    [archives, groupId],
  );
  // どのグループの投稿かも持つ（切り替えた直後に、前のグループの投稿を出さない）
  const [loaded, setLoaded] = useState<{ groupId: GroupId; posts: GroupPost[] } | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const posts = loaded && loaded.groupId === groupId ? loaded.posts : null;
  // チャットのように、古いものを上に、新しいものを下に ならべる
  const timeline = useMemo(() => (posts ? [...posts].sort((a, b) => a.createdAt - b.createdAt) : null), [posts]);
  // 通報：どの はてなを 通報するか たずねている最中（asking）と、通報したもの（reported）。グループを切りかえても残す
  const [asking, setAsking] = useState<string | null>(null);
  const [reported, setReported] = useState<Set<string>>(new Set());
  const [reportFailed, setReportFailed] = useState(false);
  // リアクション（どのグループの分かも持つ）。読めなかったときは数を出さずに、送ることだけできるようにする
  const [reactions, setReactions] = useState<{ groupId: GroupId; data: GroupReactions } | null>(null);
  const reacted = reactions && reactions.groupId === groupId ? reactions.data : null;
  const [sending, setSending] = useState<string | null>(null);
  // 送れなかった はてな（その はてなの すぐ下に、小さく知らせる）
  const [reactFailed, setReactFailed] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const [now] = useState(() => Date.now());

  async function report(postId: string) {
    if (!user || !groupId) return;
    setReportFailed(false);
    try {
      await backend.reportGroupPost(user.uid, groupId, postId);
      setReported((prev) => new Set(prev).add(postId));
      setAsking(null);
    } catch {
      setReportFailed(true);
    }
  }

  // 同じものを もういちど押すと とりけす。ちがうものを押すと置きかえる。先に画面を変え、失敗したら もどす
  async function react(postId: string, kind: ReactionId) {
    if (!user || !groupId || !reacted || sending) return;
    const before = reacted;
    const prev = before.mine[postId];
    const next = prev === kind ? null : kind;
    const counts = { ...before.counts[postId] };
    if (prev) counts[prev] = Math.max(0, (counts[prev] ?? 0) - 1);
    if (next) counts[next] = (counts[next] ?? 0) + 1;
    const mineNext = { ...before.mine };
    if (next) mineNext[postId] = next;
    else delete mineNext[postId];
    setReactFailed(null);
    setSending(postId);
    setReactions({ groupId, data: { counts: { ...before.counts, [postId]: counts }, mine: mineNext } });
    try {
      await backend.setGroupReaction(user.uid, groupId, postId, next);
    } catch {
      setReactions((cur) => (cur && cur.groupId === groupId ? { groupId, data: before } : cur));
      setReactFailed(postId);
    } finally {
      setSending(null);
    }
  }

  const many = (memberships?.length ?? 0) >= 3;

  useEffect(() => {
    if (!groupId) return;
    let cancelled = false;
    backend
      .listGroupPosts(groupId)
      .then((list) => !cancelled && setLoaded({ groupId, posts: list }))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [backend, groupId, attempt]);

  useEffect(() => {
    if (!user || !groupId || !posts) return;
    let cancelled = false;
    backend
      .listGroupReactions(
        user.uid,
        groupId,
        posts.map((p) => p.id),
      )
      .then((data) => !cancelled && setReactions({ groupId, data }))
      .catch(() => !cancelled && setReactions({ groupId, data: { counts: {}, mine: {} } }));
    return () => {
      cancelled = true;
    };
  }, [backend, user, groupId, posts]);

  // 読みこんだら、いちばん新しい（いちばん下の）はてなを見せる。リアクションは あとから読むので（ならぶと高さが変わる）、読めたときにも もういちど。
  // リアクションを押したときは動かさない（reactionsReady は、読めたときに1回だけ変わる）
  const reactionsReady = reacted !== null;
  useEffect(() => {
    const el = scroller.current;
    if (el && timeline) el.scrollTop = el.scrollHeight;
  }, [timeline, reactionsReady]);

  return (
    <Page tab="minna">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-pop text-[26px] font-normal">みんなの はてな</h1>
        <span className="flex items-center gap-1.5 self-start rounded-[14px] bg-pink-light px-3 py-1 text-sm font-black text-pink-dark">
          <Icon name="shield" size={18} fill="#FFFFFF" stroke="#A12A55" />
          <Jp>{"{名前|なまえ}は {出|で}ないよ"}</Jp>
        </span>
      </div>

      {memberships && memberships.length > 1 && (
        <div role="tablist" aria-label="グループ" className={`grid gap-2 ${many ? "grid-cols-3" : "grid-cols-2"}`}>
          {memberships.map((m) => {
            const active = m.groupId === groupId;
            return (
              <button
                key={m.groupId}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setFailed(false);
                  setReactFailed(null);
                  setPicked(m.groupId);
                }}
                className={`flex min-h-[60px] items-center justify-center rounded-[20px] border-3 border-ink px-1 font-pop ${many ? "whitespace-nowrap text-[clamp(12px,4.2vw,17px)]" : "text-[22px]"} ${active ? "bg-pink text-white shadow-pop-sm" : "bg-white text-ink"}`}
              >
                {/* 3つ以上ならぶときは 22px に おさまらないので、小さい文字にして、ひらがなで出す */}
                {many ? groupOf(m.groupId).kana : <RubyText text={groupOf(m.groupId).name} />}
              </button>
            );
          })}
        </div>
      )}
      {memberships && memberships.length === 1 && groupId && (
        <p className="self-start rounded-[16px] border-3 border-ink bg-white px-3 py-1 font-pop text-[22px]">
          <RubyText text={groupOf(groupId).name} />
        </p>
      )}

      {membershipsFailed && <ErrorNotice onRetry={() => void reloadMemberships()}>
          <Jp big>{"みんなの はてなを {開|ひら}けなかったよ。"}</Jp>
        </ErrorNotice>}
      {!membershipsFailed && memberships === null && <Loading message="{探|さが}しているよ" />}
      {memberships?.length === 0 && (
        <p className="rounded-card bg-pink-light px-4 py-3 text-lg font-black leading-[1.7]">
          <Jp>{"まだ どの グループにも {入|はい}っていないよ。グループに {入|はい}ると、なかまの はてなが {見|み}られるよ。"}</Jp>
        </p>
      )}
      {memberships?.length === 0 && (
        <LinkButton href="/join" variant="sub">
          <Jp>{"コードで グループに {入|はい}る"}</Jp>
        </LinkButton>
      )}

      {failed && (
        <ErrorNotice
          onRetry={() => {
            setFailed(false);
            setLoaded(null);
            setAttempt((n) => n + 1);
          }}
        >
          <Jp big>{"みんなの はてなを {開|ひら}けなかったよ。"}</Jp>
        </ErrorNotice>
      )}
      {groupId && !failed && posts === null && <Loading message="{探|さが}しているよ" />}

      {reportFailed && (
        <ErrorNotice>
          <Jp big>{"お{知|し}らせできなかったよ。ネットに つながっているか {見|み}て、もう{一度|いちど} {試|ため}してね"}</Jp>
        </ErrorNotice>
      )}

      {groupId && timeline && (
        // グループの へや（チャットのように、はてなが ふきだしで ならぶ。自分のは右、なかまのは左）
        <div ref={scroller} className="-mx-2 h-[calc(100dvh-400px)] min-h-[260px] overflow-y-auto rounded-card bg-pink-light/60 px-3 py-4">
          <ol aria-label={`${groupOf(groupId).kana} の はてな`} className="flex flex-col gap-4">
            <li className="flex items-center justify-center gap-2 text-center">
              <Navigator mood="think" size={40} />
              <span className="text-sm font-black leading-[1.6] text-ink-sub">
                {groupOf(groupId).kana} <Jp>{"の {部屋|へや}だよ。"}</Jp>
                <br />
                <Jp>{"みんなは {何|なに}を {見|み}つけたかな？"}</Jp>
              </span>
            </li>
            {timeline.length === 0 && (
              <li className="rounded-card bg-white px-4 py-3 text-center text-base font-black leading-[1.7]">
                <Jp>{"まだ だれも {見|み}せていないよ。きみが {最初|さいしょ}に {見|み}せてみよう！"}</Jp>
              </li>
            )}
            {timeline.map((p, i) => {
              const s = SUBJECT_STYLE[p.subject];
              const own = mine.has(p.id);
              const day = dayLabel(p.createdAt, now);
              const newDay = i === 0 || dayLabel(timeline[i - 1].createdAt, now) !== day;
              const counts = reacted?.counts[p.id] ?? {};
              return (
                <li key={p.id} className="flex flex-col gap-2">
                  {newDay && (
                    <span className="self-center rounded-full bg-white/80 px-3 py-0.5 text-xs font-black text-ink-muted">
                      <Jp>{day}</Jp>
                    </span>
                  )}
                  <div className={`flex items-start gap-2 ${own ? "flex-row-reverse" : ""}`}>
                    {/* なかまは みんな同じ ナビの顔（だれか分からないように） */}
                    {!own && (
                      <span className="mt-1 flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white">
                        <Image src="/navi/navi-smile.png" alt="" width={36} height={36} style={{ width: 36, height: 36 }} />
                      </span>
                    )}
                    <div className={`flex min-w-0 flex-1 flex-col gap-1 ${own ? "items-end pl-10" : "items-start pr-2"}`}>
                      <span className="px-1 text-xs font-black text-ink-muted">{own ? "きみの はてな" : titleLabel(p.title)}</span>
                      <article className={`w-full rounded-[22px] p-1.5 ${own ? "rounded-tr-md" : "rounded-tl-md"} ${s.solid}`}>
                        <div className="flex flex-col overflow-hidden rounded-[16px] bg-white">
                          <div className="flex h-32 items-center justify-center bg-photo">
                            {/* eslint-disable-next-line @next/next/no-img-element -- グループに見せた切り抜き（data URL） */}
                            <img src={p.image} alt="" className="size-full object-contain" />
                          </div>
                          <div className="flex flex-col gap-1.5 px-3 pb-2.5 pt-2">
                            {/* 小さい文字なので、ひらがなで出す */}
                            <RubyText kana className="block text-base font-black leading-[1.5]" text={p.text} />
                            {own && (
                              <span className={`self-start rounded-[10px] px-2 py-px text-xs font-black ${s.light} ${s.dark}`}>{titleLabel(p.title)}</span>
                            )}
                          </div>
                        </div>
                      </article>
                      <span className="px-1 text-xs font-bold text-ink-muted">{timeLabel(p.createdAt)}</span>

                      {/* リアクション：なかまの はてなには送れる。自分の はてなには、もらった数だけ出す */}
                      {own ? (
                        REACTIONS.some((r) => counts[r.id]) && (
                          <div className="flex flex-wrap justify-end gap-1.5">
                            {REACTIONS.filter((r) => counts[r.id]).map((r) => (
                              <span key={r.id} className="flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-xs font-black">
                                <ReactionFace id={r.id} size={20} />
                                {r.label} {counts[r.id]}
                              </span>
                            ))}
                          </div>
                        )
                      ) : (
                        <div className="grid w-full grid-cols-3 gap-1.5" role="group" aria-label="リアクション">
                          {REACTIONS.map((r) => {
                            const on = reacted?.mine[p.id] === r.id;
                            return (
                              <button
                                key={r.id}
                                type="button"
                                aria-pressed={on}
                                disabled={!reacted || sending === p.id}
                                onClick={() => void react(p.id, r.id)}
                                className={`flex min-h-12 flex-col items-center justify-center rounded-[14px] border-2 border-ink px-0.5 py-1 text-xs font-black text-ink disabled:opacity-60 ${on ? "translate-y-0.5 bg-pink" : "bg-white shadow-[0_2px_0_var(--color-ink)] active:translate-y-0.5 active:shadow-none"}`}
                              >
                                <span className="flex items-center gap-1">
                                  <ReactionFace id={r.id} size={20} />
                                  {counts[r.id] ? <span className="tabular-nums">{counts[r.id]}</span> : null}
                                </span>
                                <span className="whitespace-nowrap">{r.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {!own && reactFailed === p.id && (
                        <span role="alert" className="rounded-[12px] bg-white px-2 py-1 text-xs font-black leading-[1.5] text-pink-dark">
                          <Jp>{"{送|おく}れなかったよ。ネットに つながっているか {見|み}て、もう{一度|いちど} {試|ため}してね"}</Jp>
                        </span>
                      )}

                      {/* いやな はてなや、のせては いけない ものを 見つけたら、おしらせできる（きみの はてなには 出さない） */}
                      {!own &&
                        (reported.has(p.id) ? (
                          <span className="text-xs font-black text-ink-muted">
                            <Jp>{"{通報|つうほう} したよ。ありがとう"}</Jp>
                          </span>
                        ) : asking === p.id ? (
                          <div className="flex flex-col gap-1.5 rounded-[14px] bg-white p-2">
                            <span className="text-xs font-black leading-[1.5]">
                              <Jp>{"いやな はてな？ {大人|おとな}に お{知|し}らせするよ"}</Jp>
                            </span>
                            <div className="flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => void report(p.id)}
                                className="min-h-9 flex-1 rounded-[12px] border-2 border-ink bg-pink px-2 text-xs font-black text-ink active:translate-y-0.5"
                              >
                                <Jp>{"お{知|し}らせ"}</Jp>
                              </button>
                              <button
                                type="button"
                                onClick={() => setAsking(null)}
                                className="min-h-9 flex-1 rounded-[12px] border-2 border-ink bg-white px-2 text-xs font-black text-ink active:translate-y-0.5"
                              >
                                やめる
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setReportFailed(false);
                              setAsking(p.id);
                            }}
                            className="min-h-9 px-1.5 text-xs font-black text-ink-muted underline"
                          >
                            <Jp>{"{通報|つうほう}"}</Jp>
                          </button>
                        ))}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {/* 文字を打つ かわりに、はてなを さがして みせる（ほかの入口と同じく、さがす前に やくそくを見せる。ずかんに のこすときに「なかまにも みせる」を えらぶ） */}
      {groupId && timeline && (
        <LinkButton href={CAPTURE_WITH_PROMISE} variant="sub" className="flex items-center justify-center gap-2">
          <Icon name="camera" size={24} />
          <Jp>{"{探|さが}して {見|み}せよう"}</Jp>
        </LinkButton>
      )}
    </Page>
  );
}

export default function OthersPage() {
  return (
    <Gate>
      <OthersContent />
    </Gate>
  );
}
