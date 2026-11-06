"use client";

import { useEffect, useRef, useState } from "react";
import { useApp } from "@/components/AuthProvider";
import { SUBJECT_LABEL, titleLabel, type GroupId } from "@/lib/constants";
import { stripRuby } from "@/lib/ruby";
import type { GroupPost } from "@/lib/types";
import type { Subject } from "@/server/llm/schema";
import { GroupAdminPage, groupLabel } from "./GroupAdmin";

// グループの管理（#120）。見本（デモ）ではなく、本物の Firestore のデータを扱う。
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

function PostCard({ post, onAskDelete }: { post: GroupPost; onAskDelete: (post: GroupPost) => void }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-[#E3E9E6] bg-white">
      <div className="flex h-[140px] items-center justify-center bg-t-ground">
        {/* eslint-disable-next-line @next/next/no-img-element -- グループに見せた切り抜き（data URL） */}
        <img src={post.image} alt="" className="size-full object-contain" />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 px-3 pt-2.5 pb-3">
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
    return () => {
      cancelled = true;
    };
  }, [backend, groupId, attempt]);

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
          新しい順に30件まで出します。消すと、次の投稿が出てきます。投稿には、だれが出したかは入っていません。
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
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3">
          {posts.map((p) => (
            <PostCard
              key={p.id}
              post={p}
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

/** グループの投稿（/teacher/groups/{グループ}）。groupId が null（/teacher/groups）なら、はじめのグループへ移る */
export function GroupsScreen({ groupId }: { groupId: string | null }) {
  return (
    <GroupAdminPage
      groupId={groupId}
      title={(id) => `${groupName(id)} の投稿`}
      description="「みんなの はてな」でグループのメンバーに見えている投稿です。不適切な投稿（顔・名札・住所が写っているなど）を見つけたら消してください。この画面は見本ではなく、本番のデータを扱います。"
    >
      {(id) => <GroupPosts key={id} groupId={id} />}
    </GroupAdminPage>
  );
}
