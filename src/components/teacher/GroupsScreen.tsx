"use client";

import { useEffect, useRef, useState } from "react";
import { useApp } from "@/components/AuthProvider";
import { GROUP_POSTS_PAGE, SUBJECT_LABEL, titleLabel, type GroupId } from "@/lib/constants";
import { stripRuby } from "@/lib/ruby";
import type { GroupPost } from "@/lib/types";
import type { Subject } from "@/server/llm/schema";
import { GroupAdminPage, groupLabel } from "./GroupAdmin";

// グループの はてな（#120・#138）。見本（デモ）ではなく、本物の Firestore のデータを扱う。
// 管理者（groups/{id}/members/{uid} の role が "admin"）だけが、グループの投稿を消せる（firestore.rules で確かめる）。
// 管理者は、子どもの画面と同じアカウントでログインする。管理者にするのは Firebase のコンソールから（docs/03-technical.md 6章）

const BTN_BASE = "inline-flex items-center justify-center gap-1.5 rounded-tbtn border text-[13px] font-bold whitespace-nowrap";
const SIZE_40 = "h-10 px-3.5 pointer-coarse:h-11";
const SUB = "border-t-board bg-white text-t-board";
const FIELD_COLOR: Record<Subject, string> = { math: "bg-t-math", science: "bg-t-sci", info: "bg-t-info" };

const groupName = groupLabel;

function formatAt(ms: number) {
  return new Date(ms).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function Notice({ children }: { children: React.ReactNode }) {
  return <div className="rounded-tcard border border-t-line bg-t-surface p-5 text-sm leading-[1.8] text-t-text-2">{children}</div>;
}

function PostCard({ post, reports, onAskDelete }: { post: GroupPost; reports: number; onAskDelete: (post: GroupPost) => void }) {
  return (
    <article className={`flex flex-col overflow-hidden rounded-xl border bg-white ${reports > 0 ? "border-t-danger-line" : "border-[#E3E9E6]"}`}>
      <div className="flex h-[140px] items-center justify-center bg-t-ground">
        {/* eslint-disable-next-line @next/next/no-img-element -- グループに見せた切り抜き（data URL） */}
        <img src={post.image} alt="" className="size-full object-contain" />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 px-3 pt-2.5 pb-3">
        {reports > 0 && (
          <span className="self-start rounded-md border border-t-danger-line px-2 py-0.5 text-[11px] font-bold text-t-danger">通報 {reports}件</span>
        )}
        <span className="inline-flex items-center gap-1.5 text-[11px] text-t-text-2">
          <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${FIELD_COLOR[post.subject]}`} />
          {SUBJECT_LABEL[post.subject]}
          {post.topic && ` ・ ${stripRuby(post.topic)}`}
        </span>
        <p className="text-[13px] leading-[1.55] font-bold">{stripRuby(post.text)}</p>
        <span className="text-[11px] text-t-text-sub tabular-nums">
          称号「{titleLabel(post.title)}」 ・ {formatAt(post.createdAt)}
        </span>
        <span className="mt-auto flex justify-end pt-1">
          <button
            type="button"
            onClick={() => onAskDelete(post)}
            className={`${BTN_BASE} h-[34px] border-t-danger-line bg-white px-3 text-t-danger pointer-coarse:h-11`}
          >
            投稿を消す
          </button>
        </span>
      </div>
    </article>
  );
}

function DeleteDialog({
  post,
  group,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  post: GroupPost | null;
  group: GroupId;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (post && !dialog.open) dialog.showModal();
    if (!post && dialog.open) dialog.close();
  }, [post]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="h-delete-group-post"
      onClose={onCancel}
      className="m-auto w-[calc(100%-48px)] max-w-[500px] rounded-2xl bg-white p-7 text-t-text backdrop:bg-[rgba(14,28,22,0.55)]"
    >
      {post && (
        <div className="flex flex-col gap-4">
          <h2 id="h-delete-group-post" className="text-xl font-bold">
            この投稿を消しますか？
          </h2>
          <div className="flex items-center gap-3 rounded-[10px] bg-t-ground p-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- グループに見せた切り抜き（data URL） */}
            <img src={post.image} alt="" className="h-12 w-[72px] shrink-0 rounded-md bg-white object-contain" />
            <span className="flex min-w-0 flex-col gap-1">
              <span className="line-clamp-3 text-sm leading-normal font-bold">{stripRuby(post.text)}</span>
              <span className="text-xs text-t-text-sub tabular-nums">{formatAt(post.createdAt)}</span>
            </span>
          </div>
          <ul className="flex list-disc flex-col gap-2 pl-5 text-sm leading-[1.75] text-t-text-2">
            <li>「{groupName(group)}」のメンバーから見えなくなります。元に戻せません</li>
            <li>投稿した人のずかんには残ります（だれの投稿かは、管理者にも分かりません）</li>
          </ul>
          {error && (
            <p role="alert" className="rounded-[10px] border border-t-danger-line bg-white px-3 py-2 text-sm font-bold text-t-danger">
              {error}
            </p>
          )}
          <div className="mt-1 flex justify-end gap-2">
            <button type="button" onClick={onCancel} disabled={busy} className={`${BTN_BASE} ${SIZE_40} ${SUB}`}>
              やめる
            </button>
            <button type="button" onClick={onConfirm} disabled={busy} className={`${BTN_BASE} ${SIZE_40} border-t-danger bg-t-danger text-white`}>
              {busy ? "消しています…" : "投稿を消す"}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}

type FieldFilter = Subject | "all";
const FIELDS: Subject[] = ["math", "science", "info"];

/** 2つの一覧を ID で まとめる（あとのほうを優先しない。はじめに出たものを残す） */
function mergePosts(a: GroupPost[], b: GroupPost[]): GroupPost[] {
  const seen = new Set(a.map((p) => p.id));
  return [...a, ...b.filter((p) => !seen.has(p.id))];
}

// グループの はてな（#120・#138）。新しい順に GROUP_POSTS_PAGE 件ずつ読み、「もっと見る」で前の分を足す。
// 分野・単元で しぼりこむ（見本の はてなの画面と同じ形）。通報された投稿は、まだ読んでいない古いものも読みにいって先頭に出す（#85）
function GroupPosts({ groupId }: { groupId: GroupId }) {
  const { backend } = useApp();
  const [posts, setPosts] = useState<GroupPost[] | null>(null);
  // 「もっと見る」で続きを読む位置（新しい順に読んだ最後の投稿の時刻）。null は もう続きがない
  const [cursor, setCursor] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [moreFailed, setMoreFailed] = useState(false);
  // 通報された数（投稿の ID ごと）。読めなかったときは空にして、投稿の表示はそのまま続ける
  const [reports, setReports] = useState<Record<string, number>>({});
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [field, setField] = useState<FieldFilter>("all");
  const [unit, setUnit] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<GroupPost | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const page = await backend.listGroupPosts(groupId);
        if (cancelled) return;
        setPosts(page);
        setCursor(page.length === GROUP_POSTS_PAGE ? page[page.length - 1].createdAt : null);
        let counts: Record<string, number> = {};
        try {
          counts = await backend.listGroupReports(groupId);
        } catch {
          // 通報が読めなくても、投稿は出す
        }
        if (cancelled) return;
        setReports(counts);
        const loaded = new Set(page.map((p) => p.id));
        const missing = Object.keys(counts).filter((id) => !loaded.has(id));
        const extra = (await Promise.all(missing.map((id) => backend.getGroupPost(groupId, id).catch(() => null)))).filter((p): p is GroupPost => p !== null);
        if (!cancelled && extra.length > 0) setPosts((prev) => mergePosts(prev ?? [], extra));
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [backend, groupId, attempt]);

  async function loadMore() {
    if (cursor === null || loadingMore) return;
    setLoadingMore(true);
    setMoreFailed(false);
    try {
      const page = await backend.listGroupPosts(groupId, { before: cursor });
      setPosts((prev) => mergePosts(prev ?? [], page));
      setCursor(page.length === GROUP_POSTS_PAGE ? page[page.length - 1].createdAt : null);
    } catch {
      setMoreFailed(true);
    }
    setLoadingMore(false);
  }

  function reload() {
    setFailed(false);
    setPosts(null);
    setCursor(null);
    setMoreFailed(false);
    setAttempt((n) => n + 1);
  }

  // 分野で しぼり、その中の単元を件数の多い順にならべる
  const inField = (posts ?? []).filter((p) => field === "all" || p.subject === field);
  const unitCounts = new Map<string, { subject: Subject; count: number }>();
  for (const p of inField) {
    const name = stripRuby(p.topic) || "（単元なし）";
    const u = unitCounts.get(name);
    unitCounts.set(name, { subject: p.subject, count: (u?.count ?? 0) + 1 });
  }
  const units = [...unitCounts.entries()].sort((a, b) => b[1].count - a[1].count);
  // 選んでいた単元が消えたとき（最後の1件を消したときなど）は「すべて」にもどす
  const currentUnit = unit !== null && unitCounts.has(unit) ? unit : null;
  const shown = currentUnit === null ? inField : inField.filter((p) => (stripRuby(p.topic) || "（単元なし）") === currentUnit);
  // 通報された投稿を先に（通報の多い順）、そのあとは新しい順
  const sorted = [...shown].sort((a, b) => (reports[b.id] ?? 0) - (reports[a.id] ?? 0) || b.createdAt - a.createdAt);
  const reportedCount = (posts ?? []).filter((p) => (reports[p.id] ?? 0) > 0).length;

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    setDeleteError(null);
    try {
      await backend.deleteGroupPost(groupId, deleting.id);
      setPosts((prev) => prev?.filter((p) => p.id !== deleting.id) ?? null);
      setDeleting(null);
    } catch {
      setDeleteError("消せませんでした。通信と、管理者になっているかを確かめて、もう一度試してください。");
    }
    setBusy(false);
  }

  return (
    <section aria-label={`${groupName(groupId)}の はてな`} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <p className="flex-[1_1_420px] text-xs leading-[1.7] text-t-text-2">
          新しい順に{GROUP_POSTS_PAGE}件ずつ読みます（「もっと見る」で前の分を足します）。通報された投稿は、先頭に出ます（通報した人は、管理者にも分かりません）。投稿には、だれが出したかは入っていません。
        </p>
        <button type="button" onClick={reload} className={`${BTN_BASE} ${SIZE_40} ${SUB}`}>
          読み込み直す
        </button>
      </div>

      {failed && (
        <Notice>
          投稿を読み込めませんでした。通信を確かめて「読み込み直す」を押してください。
        </Notice>
      )}
      {!failed && posts === null && <Notice>読み込んでいます…</Notice>}
      {posts?.length === 0 && <Notice>まだ投稿はありません。</Notice>}
      {posts && posts.length > 0 && (
        <div className="grid grid-cols-[240px_minmax(0,1fr)] items-start gap-4 max-[900px]:grid-cols-1">
          <aside aria-label="分野と単元で しぼる" className="flex flex-col gap-2.5 rounded-tcard border border-t-line bg-t-surface p-3.5">
            <div role="group" aria-label="分野でしぼる" className="grid grid-cols-4 gap-1">
              {(["all", ...FIELDS] as FieldFilter[]).map((f) => {
                const on = field === f;
                return (
                  <button
                    key={f}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      setField(f);
                      setUnit(null);
                    }}
                    className={`inline-flex h-8 items-center justify-center rounded-tbtn border px-1 text-xs pointer-coarse:h-11 ${on ? "border-t-board bg-t-board font-bold text-white" : "border-t-line bg-white text-t-text-2"}`}
                  >
                    {f === "all" ? "すべて" : SUBJECT_LABEL[f]}
                  </button>
                );
              })}
            </div>
            <ul className="flex flex-col gap-0.5">
              {[{ key: null as string | null, name: "すべて（新しい順）", count: inField.length, subject: null as Subject | null }, ...units.map(([name, u]) => ({ key: name, name, count: u.count, subject: u.subject }))].map((u) => {
                const on = currentUnit === u.key;
                return (
                  <li key={u.key ?? "all"}>
                    <button
                      type="button"
                      onClick={() => setUnit(u.key)}
                      aria-current={on ? "true" : undefined}
                      className={`flex min-h-10 w-full items-center gap-2.5 rounded-tbtn px-2.5 py-1.5 text-left text-sm pointer-coarse:min-h-11 ${on ? "bg-t-board-tint font-bold" : "hover:bg-t-board-soft"}`}
                    >
                      <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${u.subject ? FIELD_COLOR[u.subject] : "bg-t-board"}`} />
                      <span className="min-w-0 flex-1">{u.name}</span>
                      <span className="text-xs font-normal text-t-text-sub tabular-nums">{u.count}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="border-t border-t-line-soft pt-2 text-[11px] leading-[1.6] text-t-text-sub">
              読み込んだ {posts.length}件{reportedCount > 0 ? `（うち通報 ${reportedCount}件）` : ""}の中で しぼります。
            </p>
          </aside>

          <div className="flex flex-col gap-3">
            {sorted.length === 0 ? (
              <Notice>この分野の投稿は、読み込んだ中にはありません。</Notice>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
                {sorted.map((p) => (
                  <PostCard
                    key={p.id}
                    post={p}
                    reports={reports[p.id] ?? 0}
                    onAskDelete={(post) => {
                      setDeleteError(null);
                      setDeleting(post);
                    }}
                  />
                ))}
              </div>
            )}
            {cursor !== null && (
              <div className="flex flex-col items-center gap-1.5">
                <button type="button" onClick={() => void loadMore()} disabled={loadingMore} className={`${BTN_BASE} ${SIZE_40} ${SUB}`}>
                  {loadingMore ? "読み込んでいます…" : `もっと見る（前の${GROUP_POSTS_PAGE}件）`}
                </button>
                {moreFailed && <span className="text-xs font-bold text-t-danger">読み込めませんでした。もう一度押してください。</span>}
              </div>
            )}
          </div>
        </div>
      )}

      <DeleteDialog
        post={deleting}
        group={groupId}
        busy={busy}
        error={deleteError}
        onCancel={() => !busy && setDeleting(null)}
        onConfirm={() => void confirmDelete()}
      />
    </section>
  );
}

/** グループの投稿（/teacher/groups/{グループ}）。groupId が null（/teacher/groups）なら、はじめのグループへ移る */
export function GroupsScreen({ groupId }: { groupId: string | null }) {
  return (
    <GroupAdminPage
      groupId={groupId}
      title={(id) => `${groupName(id)} の はてな`}
      description="「みんなの はてな」でグループのメンバーに見えている投稿です。不適切な投稿（顔・名札・住所が写っているなど）を見つけたら消してください。この画面は見本ではなく、本番のデータを扱います。"
    >
      {(id) => <GroupPosts key={id} groupId={id} />}
    </GroupAdminPage>
  );
}
