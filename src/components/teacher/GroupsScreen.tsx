"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useApp } from "@/components/AuthProvider";
import { groupOf, SUBJECT_LABEL, titleLabel, type GroupId } from "@/lib/constants";
import { stripRuby } from "@/lib/ruby";
import type { GroupPost } from "@/lib/types";
import type { Subject } from "@/server/llm/schema";

// グループの管理（#120）。見本（デモ）ではなく、本物の Firestore のデータを扱う。
// 管理者（groups/{id}/members/{uid} の role が "admin"）だけが、グループの投稿を消せる（firestore.rules で確かめる）。
// 管理者は、子どもの画面と同じアカウントでログインする。管理者にするのは Firebase のコンソールから（docs/03-technical.md 6章）

const BTN_BASE = "inline-flex items-center justify-center gap-1.5 rounded-tbtn border text-[13px] font-bold whitespace-nowrap";
const SIZE_40 = "h-10 px-3.5 pointer-coarse:h-11";
const SUB = "border-t-board bg-white text-t-board";
const FIELD_COLOR: Record<Subject, string> = { math: "bg-t-math", science: "bg-t-sci", info: "bg-t-info" };

// 管理者が読む画面なので、ふりがなの記法は外して漢字で出す（docs/design/teachers/README.md「文字」）
const groupName = (id: GroupId) => stripRuby(groupOf(id).name);

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

function GroupPosts({ groupId }: { groupId: GroupId }) {
  const { backend } = useApp();
  const [posts, setPosts] = useState<GroupPost[] | null>(null);
  // 通報された数（投稿の ID ごと）。読めなかったときは空にして、投稿の表示はそのまま続ける
  const [reports, setReports] = useState<Record<string, number>>({});
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [deleting, setDeleting] = useState<GroupPost | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    backend
      .listGroupPosts(groupId)
      .then((list) => !cancelled && setPosts(list))
      .catch(() => !cancelled && setFailed(true));
    backend
      .listGroupReports(groupId)
      .then((counts) => !cancelled && setReports(counts))
      .catch(() => !cancelled && setReports({}));
    return () => {
      cancelled = true;
    };
  }, [backend, groupId, attempt]);

  // 通報された投稿を先に（通報の多い順）、そのあとは新しい順
  const sorted = posts ? [...posts].sort((a, b) => (reports[b.id] ?? 0) - (reports[a.id] ?? 0) || b.createdAt - a.createdAt) : null;

  function reload() {
    setFailed(false);
    setPosts(null);
    setAttempt((n) => n + 1);
  }

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
    <section aria-label={`${groupName(groupId)}の投稿`} className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <p className="flex-[1_1_420px] text-xs leading-[1.7] text-t-text-2">
          新しい順に30件まで出します。通報された投稿は、先頭に出ます（通報した人は、管理者にも分かりません）。消すと、次の投稿が出てきます。投稿には、だれが出したかは入っていません。
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
      {sorted && sorted.length > 0 && (
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

export function GroupsScreen() {
  const { status, user, memberships, membershipsFailed, reloadMemberships } = useApp();
  const [picked, setPicked] = useState<GroupId | null>(null);
  const admin = memberships?.filter((m) => m.role === "admin") ?? [];
  const groupId = admin.find((m) => m.groupId === picked)?.groupId ?? admin[0]?.groupId ?? null;

  const tabClass = (on: boolean) =>
    `inline-flex h-[34px] items-center gap-1.5 rounded-md px-3 text-[13px] whitespace-nowrap pointer-coarse:h-11 ${on ? "bg-white font-bold text-t-text" : "text-t-text-2"}`;

  let body: React.ReactNode;
  if (status === "loading" || (status === "in" && memberships === null && !membershipsFailed)) {
    body = <Notice>読み込んでいます…</Notice>;
  } else if (status === "out" || !user) {
    body = (
      <Notice>
        管理者のアカウントでログインしてください（子どもの画面と同じログインです）。
        <Link href="/login" className="ml-2 font-bold text-t-board underline">
          ログインへ
        </Link>
      </Notice>
    );
  } else if (membershipsFailed) {
    body = (
      <Notice>
        グループを読み込めませんでした。
        <button type="button" onClick={() => void reloadMemberships()} className="ml-2 font-bold text-t-board underline">
          もう一度試す
        </button>
      </Notice>
    );
  } else if (!groupId) {
    body = (
      <Notice>
        このアカウント（{user.username}）は、どのグループの管理者にもなっていません。管理者は Firebase のコンソールで、
        <code className="mx-1 rounded bg-t-ground px-1">groups/{"{グループ}"}/members/{"{uid}"}</code>
        の role を admin にします（docs/03-technical.md 6章）。
      </Notice>
    );
  } else {
    body = (
      <>
        {admin.length > 1 && (
          <div role="tablist" aria-label="グループ" className="flex max-w-full flex-wrap gap-[3px] self-start rounded-[9px] bg-[#E6ECE9] p-[3px]">
            {admin.map((m) => (
              <button key={m.groupId} type="button" role="tab" aria-selected={m.groupId === groupId} onClick={() => setPicked(m.groupId)} className={tabClass(m.groupId === groupId)}>
                {groupName(m.groupId)}
              </button>
            ))}
          </div>
        )}
        <GroupPosts key={groupId} groupId={groupId} />
      </>
    );
  }

  return (
    <main className="mx-auto flex min-h-0 w-full max-w-[1400px] flex-1 flex-col gap-3.5 px-6 pt-4 pb-5 max-[640px]:px-4">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <h1 className="text-[22px] font-bold tracking-[0.02em]">グループの管理</h1>
        <p className="flex-[1_1_420px] text-xs leading-[1.7] text-t-text-2">
          「みんなの はてな」でグループのメンバーに見えている投稿です。不適切な投稿（顔・名札・住所が写っているなど）を見つけたら消してください。
          この画面は見本ではなく、本番のデータを扱います。
        </p>
      </div>
      {body}
    </main>
  );
}
