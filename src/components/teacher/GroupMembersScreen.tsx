"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/components/AuthProvider";
import { groupOf, type GroupId } from "@/lib/constants";
import type { GroupMember, GroupRole, GroupSettings } from "@/lib/types";
import { JoinCodePanel } from "./JoinCodePanel";
import { AdminNotice, BTN_BASE, ConfirmDialog, DANGER_SUB, GroupAdminPage, groupLabel, SUB } from "./GroupAdmin";

// グループのメンバー（/teacher/groups/{グループ}/members。#129）。本番のデータを扱う。
// できること：一覧（ログイン ID・役割・入った日時）、管理者にする・メンバーにもどす、グループから外す、自動で入るのを止める。
// 自分の役割の変更と、自分を外すことはできない（firestore.rules でも断る）。メンバーを入れるのは参加コード（JoinCodePanel。#137）

const FIELD = "h-10 rounded-tbtn border border-t-field-line bg-white px-3 text-sm text-t-text pointer-coarse:h-11 pointer-coarse:text-base";
const ROLE_LABEL: Record<GroupRole, string> = { admin: "管理者", member: "メンバー" };

function formatAt(ms: number | null) {
  if (ms === null) return "—";
  return new Date(ms).toLocaleString("ja-JP", { year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** ログイン ID がない（#129 より前に入った）ときは、uid の頭を出す */
function nameOf(m: GroupMember) {
  return m.username ?? `（ログイン ID なし：${m.uid.slice(0, 6)}…）`;
}

type Pending = { kind: "role"; member: GroupMember; role: GroupRole } | { kind: "remove"; member: GroupMember } | { kind: "stop" };

function AutoJoinPanel({ groupId, settings, onStop }: { groupId: GroupId; settings: GroupSettings | null; onStop: () => void }) {
  const until = settings?.autoJoinUntil ?? null;
  const open = settings?.open ?? false;
  return (
    <section aria-label="自動で入る設定" className="flex flex-wrap items-center gap-3 rounded-tcard border border-t-line bg-t-surface px-4 py-3">
      <p className="flex-[1_1_360px] text-sm leading-[1.7]">
        {settings === null
          ? "自動で入る設定を読み込んでいます…"
          : open
            ? until === null
              ? `新しく登録した人は、「${groupLabel(groupId)}」に自動で入ります（期限なし）。`
              : `新しく登録した人は、${formatAt(until)} まで「${groupLabel(groupId)}」に自動で入ります。`
            : until === null
              ? `「${groupLabel(groupId)}」には、自動で入る期限が入っていません（新しく登録した人は入りません）。`
              : `自動で入るのは止まっています（${formatAt(until)} まで）。新しく登録した人は入りません。`}
        <span className="block text-xs text-t-text-2">止めたあとに また入れるようにするのは、Firebase のコンソールから行います。</span>
      </p>
      {open && (
        <button type="button" onClick={onStop} className={`${BTN_BASE} h-10 px-3.5 pointer-coarse:h-11 ${DANGER_SUB}`}>
          自動で入るのを止める
        </button>
      )}
    </section>
  );
}

function Members({ groupId }: { groupId: GroupId }) {
  const { backend, user } = useApp();
  const autoJoin = groupOf(groupId).autoJoin;
  const [members, setMembers] = useState<GroupMember[] | null>(null);
  const [settings, setSettings] = useState<GroupSettings | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState("");
  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    backend
      .listMembers(groupId)
      .then((list) => !cancelled && setMembers(list))
      .catch(() => !cancelled && setFailed(true));
    if (autoJoin) {
      backend
        .getGroupSettings(groupId)
        .then((s) => !cancelled && setSettings(s))
        .catch(() => !cancelled && setSettings({ autoJoinUntil: null, open: false }));
    }
    return () => {
      cancelled = true;
    };
  }, [backend, groupId, autoJoin, attempt]);

  // 管理者を先に、そのあとは新しく入った順
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (members ?? [])
      .filter((m) => q === "" || (m.username ?? "").toLowerCase().includes(q))
      .sort((a, b) => (a.role === b.role ? (b.joinedAt ?? 0) - (a.joinedAt ?? 0) : a.role === "admin" ? -1 : 1));
  }, [members, query]);
  const adminCount = members?.filter((m) => m.role === "admin").length ?? 0;

  function reload() {
    setFailed(false);
    setMembers(null);
    setAttempt((n) => n + 1);
  }

  function ask(next: Pending) {
    setActionError(null);
    setPending(next);
  }

  async function confirm() {
    if (!pending) return;
    setBusy(true);
    setActionError(null);
    try {
      if (pending.kind === "role") {
        await backend.setMemberRole(groupId, pending.member.uid, pending.role);
        setMembers((prev) => prev?.map((m) => (m.uid === pending.member.uid ? { ...m, role: pending.role } : m)) ?? null);
      } else if (pending.kind === "remove") {
        await backend.removeMember(groupId, pending.member.uid);
        setMembers((prev) => prev?.filter((m) => m.uid !== pending.member.uid) ?? null);
      } else {
        await backend.stopAutoJoin(groupId);
        setSettings(await backend.getGroupSettings(groupId));
      }
      setPending(null);
    } catch {
      setActionError("できませんでした。通信と、管理者になっているかを確かめて、もう一度試してください。");
    }
    setBusy(false);
  }

  const dialog = (() => {
    if (!pending) return { title: "", label: "", body: null };
    if (pending.kind === "stop") {
      return {
        title: "自動で入るのを止めますか？",
        label: "止める",
        body: (
          <ul className="flex list-disc flex-col gap-2 pl-5 text-sm leading-[1.75] text-t-text-2">
            <li>これから登録する人は「{groupLabel(groupId)}」に入らなくなります。もう入っている人はそのままです</li>
            <li>また入れるようにするのは、Firebase のコンソールから行います</li>
          </ul>
        ),
      };
    }
    const name = nameOf(pending.member);
    if (pending.kind === "remove") {
      return {
        title: `${name} をグループから外しますか？`,
        label: "外す",
        body: (
          <ul className="flex list-disc flex-col gap-2 pl-5 text-sm leading-[1.75] text-t-text-2">
            <li>「{groupLabel(groupId)}」の投稿が見られなくなり、新しく見せることもできなくなります</li>
            <li>この人がこれまでに見せた投稿は残ります（だれの投稿かは分からないので、消すときは投稿の画面から消してください）</li>
            <li>参加コードを知っていれば、また入れます。入れたくないときは、参加コードを作り直してください{autoJoin ? "（自動で入るのは はじめての登録のときだけなので、それで入りなおすことはありません）" : ""}</li>
          </ul>
        ),
      };
    }
    return pending.role === "admin"
      ? {
          title: `${name} を管理者にしますか？`,
          label: "管理者にする",
          body: (
            <ul className="flex list-disc flex-col gap-2 pl-5 text-sm leading-[1.75] text-t-text-2">
              <li>「{groupLabel(groupId)}」の投稿を消したり、メンバーを外したり、管理者を変えたりできるようになります</li>
              <li>チームメンバーなど、信頼できる人だけにしてください</li>
            </ul>
          ),
        }
      : {
          title: `${name} をメンバーにもどしますか？`,
          label: "メンバーにもどす",
          body: <p className="text-sm leading-[1.75] text-t-text-2">「{groupLabel(groupId)}」の管理画面が使えなくなります。投稿は今までどおり見られます。</p>,
        };
  })();

  return (
    <div className="flex flex-col gap-3">
      <JoinCodePanel groupId={groupId} />
      {autoJoin && <AutoJoinPanel groupId={groupId} settings={settings} onStop={() => ask({ kind: "stop" })} />}

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-sm">
          <span className="whitespace-nowrap text-t-text-2">ログイン ID でさがす</span>
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} className={`${FIELD} w-[200px]`} />
        </label>
        <p className="flex-[1_1_300px] text-xs leading-[1.7] text-t-text-2">
          {members ? `${members.length}人（管理者 ${adminCount}人）。` : ""}
          メンバーは、上の参加コードで入ります。自分の役割は変えられず、自分は外せません。
        </p>
        <button type="button" onClick={reload} className={`${BTN_BASE} h-10 px-3.5 pointer-coarse:h-11 ${SUB}`}>
          読み込み直す
        </button>
      </div>

      {failed && <AdminNotice>メンバーを読み込めませんでした。通信を確かめて「読み込み直す」を押してください。</AdminNotice>}
      {!failed && members === null && <AdminNotice>読み込んでいます…</AdminNotice>}
      {members && shown.length === 0 && <AdminNotice>{query ? "見つかりませんでした。" : "まだメンバーはいません。"}</AdminNotice>}
      {shown.length > 0 && (
        <ul aria-label="メンバー" className="overflow-hidden rounded-tcard border border-t-line bg-white">
          {shown.map((m) => {
            const me = m.uid === user?.uid;
            return (
              <li
                key={m.uid}
                className="grid min-h-[60px] grid-cols-[minmax(0,1fr)_80px_170px_240px] items-center gap-x-4 gap-y-2 border-b border-t-line-soft px-4 py-3 last:border-b-0 max-[760px]:grid-cols-[minmax(0,1fr)_auto]"
              >
                <span className="flex min-w-0 items-center gap-2 text-sm font-bold break-all">
                  {nameOf(m)}
                  {me && <span className="rounded-full bg-t-board-tint px-2 py-0.5 text-[11px] text-t-board">あなた</span>}
                </span>
                <span className={`text-[13px] ${m.role === "admin" ? "font-bold text-t-board" : "text-t-text-2"}`}>{ROLE_LABEL[m.role]}</span>
                <span className="text-xs text-t-text-sub tabular-nums">{formatAt(m.joinedAt)}</span>
                <span className="flex justify-end gap-2">
                  {!me && (
                    <>
                      <button
                        type="button"
                        onClick={() => ask({ kind: "role", member: m, role: m.role === "admin" ? "member" : "admin" })}
                        className={`${BTN_BASE} h-[34px] px-3 pointer-coarse:h-11 ${SUB}`}
                      >
                        {m.role === "admin" ? "メンバーにもどす" : "管理者にする"}
                      </button>
                      <button type="button" onClick={() => ask({ kind: "remove", member: m })} className={`${BTN_BASE} h-[34px] px-3 pointer-coarse:h-11 ${DANGER_SUB}`}>
                        外す
                      </button>
                    </>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={pending !== null}
        title={dialog.title}
        confirmLabel={dialog.label}
        busy={busy}
        error={actionError}
        onCancel={() => !busy && setPending(null)}
        onConfirm={() => void confirm()}
      >
        {dialog.body}
      </ConfirmDialog>
    </div>
  );
}

export function GroupMembersScreen({ groupId }: { groupId: string }) {
  return (
    <GroupAdminPage
      groupId={groupId}
      title={(id) => `${groupLabel(id)} のメンバー`}
      description="グループに入っている人です。ログイン ID だけを出します（ニックネームは出しません）。この画面は見本ではなく、本番のデータを扱います。"
    >
      {(id) => <Members key={id} groupId={id} />}
    </GroupAdminPage>
  );
}
