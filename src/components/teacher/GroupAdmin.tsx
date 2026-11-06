"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useApp } from "@/components/AuthProvider";
import { GROUPS, groupOf, type GroupId } from "@/lib/constants";
import { stripRuby } from "@/lib/ruby";

// グループの管理（#120・#129）の画面で共通に使うもの。見本（デモ）ではなく、本番の Firestore のデータを扱う。
// 管理者（groups/{id}/members/{uid} の role が "admin"）だけが使える（firestore.rules で確かめる。ここは案内を出すだけ）

/** 管理画面に出すグループの名前（大人が読むので、ふりがなの記法を外して漢字で出す。docs/design/teachers/README.md「文字」） */
export const groupLabel = (id: GroupId) => stripRuby(groupOf(id).name);

export const BTN_BASE = "inline-flex items-center justify-center gap-1.5 rounded-tbtn border text-[13px] font-bold whitespace-nowrap";
export const SIZE_40 = "h-10 px-3.5 pointer-coarse:h-11";
export const SUB = "border-t-board bg-white text-t-board";
export const DANGER_SUB = "border-t-danger-line bg-white text-t-danger";

export function AdminNotice({ children }: { children: React.ReactNode }) {
  return <div className="rounded-tcard border border-t-line bg-t-surface p-5 text-sm leading-[1.8] text-t-text-2">{children}</div>;
}

/**
 * ログインと、そのグループの管理者かを確かめてから children を出す。
 * groupId が null（/teacher/groups）のときは、管理者になっている はじめのグループへ移る
 */
export function GroupAdminPage({
  groupId,
  title,
  description,
  children,
}: {
  groupId: string | null;
  title: (groupId: GroupId) => string;
  description: string;
  children: (groupId: GroupId) => React.ReactNode;
}) {
  const router = useRouter();
  const { status, user, memberships, membershipsFailed, reloadMemberships } = useApp();
  const admin = memberships?.filter((m) => m.role === "admin") ?? [];
  const known = GROUPS.find((g) => g.id === groupId)?.id ?? null;
  const allowed = known !== null && admin.some((m) => m.groupId === known);
  const first = admin[0]?.groupId ?? null;

  useEffect(() => {
    if (groupId === null && first) router.replace(`/teacher/groups/${first}`);
  }, [groupId, first, router]);

  let body: React.ReactNode;
  if (status === "loading" || (status === "in" && memberships === null && !membershipsFailed) || (groupId === null && first)) {
    body = <AdminNotice>読み込んでいます…</AdminNotice>;
  } else if (status === "out" || !user) {
    body = (
      <AdminNotice>
        管理者のアカウントでログインしてください（子どもの画面と同じログインです）。
        <Link href="/login" className="ml-2 font-bold text-t-board underline">
          ログインへ
        </Link>
      </AdminNotice>
    );
  } else if (membershipsFailed) {
    body = (
      <AdminNotice>
        グループを読み込めませんでした。
        <button type="button" onClick={() => void reloadMemberships()} className="ml-2 font-bold text-t-board underline">
          もう一度試す
        </button>
      </AdminNotice>
    );
  } else if (groupId !== null && known === null) {
    body = (
      <AdminNotice>
        このグループはありません。
        <Link href="/teacher/groups" className="ml-2 font-bold text-t-board underline">
          グループの管理へ
        </Link>
      </AdminNotice>
    );
  } else if (!allowed || known === null) {
    body = (
      <AdminNotice>
        このアカウント（{user.username}）は、{known ? `「${groupLabel(known)}」の` : "どのグループの"}管理者になっていません。管理者は Firebase のコンソールで、
        <code className="mx-1 rounded bg-t-ground px-1">groups/{"{グループ}"}/members/{"{uid}"}</code>
        の role を admin にします（docs/03-technical.md 6章）。
      </AdminNotice>
    );
  } else {
    body = children(known);
  }

  return (
    <main className="mx-auto flex min-h-0 w-full max-w-[1400px] flex-1 flex-col gap-3.5 px-6 pt-4 pb-5 max-[640px]:px-4">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <h1 className="text-[22px] font-bold tracking-[0.02em]">{allowed && known ? title(known) : "グループの管理"}</h1>
        <p className="flex-[1_1_420px] text-xs leading-[1.7] text-t-text-2">{description}</p>
      </div>
      {body}
    </main>
  );
}

/** 確かめてから行う操作のダイアログ（HatenaScreen の「クラスから外す」と同じ形） */
export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  confirmLabel: string;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="h-group-confirm"
      onClose={onCancel}
      className="m-auto w-[calc(100%-48px)] max-w-[500px] rounded-2xl bg-white p-7 text-t-text backdrop:bg-[rgba(14,28,22,0.55)]"
    >
      {open && (
        <div className="flex flex-col gap-4">
          <h2 id="h-group-confirm" className="text-xl font-bold">
            {title}
          </h2>
          {children}
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
              {busy ? "しています…" : confirmLabel}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );
}
