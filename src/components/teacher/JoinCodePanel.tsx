"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/components/AuthProvider";
import type { GroupId } from "@/lib/constants";
import { formatJoinCode } from "@/lib/joinCode";
import type { JoinCode } from "@/lib/types";
import { BTN_BASE, ConfirmDialog, DANGER_SUB, groupLabel, SUB } from "./GroupAdmin";

// 参加コード（#137）。管理者がコードを作る・作り直す・受付を止める・再開する。
// 子どもは「せってい」→「グループに はいる」（/join）でコードを入れて、member として入る（firestore.rules で確かめる）

const BTN = `${BTN_BASE} h-10 px-3.5 pointer-coarse:h-11`;

type Pending = "create" | "close";

export function JoinCodePanel({ groupId }: { groupId: GroupId }) {
  const { backend } = useApp();
  const [joinCode, setJoinCode] = useState<JoinCode | null | undefined>(undefined);
  const [failed, setFailed] = useState(false);
  const [pending, setPending] = useState<Pending | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    backend
      .getJoinCode(groupId)
      .then((c) => !cancelled && setJoinCode(c))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [backend, groupId]);

  async function run(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      setPending(null);
    } catch {
      setError("できませんでした。通信と、管理者になっているかを確かめて、もう一度試してください。");
    }
    setBusy(false);
  }

  const reopen = () => joinCode && void run(async () => {
    await backend.setJoinCodeOpen(joinCode.code, true);
    setJoinCode({ ...joinCode, open: true });
  });

  const confirm = () =>
    void run(async () => {
      if (pending === "create") setJoinCode(await backend.createJoinCode(groupId));
      else if (joinCode) {
        await backend.setJoinCodeOpen(joinCode.code, false);
        setJoinCode({ ...joinCode, open: false });
      }
    });

  return (
    <section aria-label="参加コード" className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-tcard border border-t-line bg-t-surface px-4 py-3">
      <div className="flex flex-col gap-1">
        <span className="text-xs font-bold text-t-text-2">参加コード</span>
        {joinCode === undefined && !failed && <span className="text-sm">読み込んでいます…</span>}
        {failed && <span className="text-sm text-t-danger">読み込めませんでした。ページを読み込み直してください。</span>}
        {joinCode === null && <span className="text-sm">まだ作っていません。</span>}
        {joinCode && (
          <span className="flex items-center gap-3">
            {/* 見まちがえにくいよう、管理画面の字（BIZ UDPゴシック）の太字で大きく出す */}
            <strong className={`text-[28px] tracking-[0.08em] tabular-nums ${joinCode.open ? "" : "text-t-text-sub line-through"}`}>
              {formatJoinCode(joinCode.code)}
            </strong>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${joinCode.open ? "bg-[rgba(76,211,138,0.18)] text-t-board" : "bg-t-ground text-t-text-2"}`}
            >
              {joinCode.open ? "受付中" : "止めています"}
            </span>
          </span>
        )}
      </div>
      <p className="flex-[1_1_300px] text-xs leading-[1.7] text-t-text-2">
        子どもは「せってい」→「グループに はいる」でこのコードを入れると、「{groupLabel(groupId)}」にメンバーとして入ります（管理者にはなりません）。
        作り直すと、前のコードは使えなくなります。もう入っている人はそのままです。
      </p>
      {joinCode !== undefined && !failed && (
        <span className="flex flex-wrap gap-2">
          {joinCode?.open && (
            <button type="button" onClick={() => setPending("close")} className={`${BTN} ${DANGER_SUB}`}>
              受付を止める
            </button>
          )}
          {joinCode && !joinCode.open && (
            <button type="button" onClick={reopen} disabled={busy} className={`${BTN} ${SUB}`}>
              受付を再開する
            </button>
          )}
          <button type="button" onClick={() => setPending("create")} className={`${BTN} ${joinCode ? SUB : "border-t-board bg-t-board text-white"}`}>
            {joinCode ? "コードを作り直す" : "コードを作る"}
          </button>
        </span>
      )}
      {error && pending === null && (
        <p role="alert" className="w-full text-sm font-bold text-t-danger">
          {error}
        </p>
      )}

      <ConfirmDialog
        open={pending !== null}
        title={pending === "close" ? "参加コードの受付を止めますか？" : joinCode ? "参加コードを作り直しますか？" : "参加コードを作りますか？"}
        confirmLabel={pending === "close" ? "止める" : joinCode ? "作り直す" : "作る"}
        busy={busy}
        error={error}
        onCancel={() => !busy && setPending(null)}
        onConfirm={confirm}
      >
        <ul className="flex list-disc flex-col gap-2 pl-5 text-sm leading-[1.75] text-t-text-2">
          {pending === "close" ? (
            <>
              <li>このコードを入れても、「{groupLabel(groupId)}」に入れなくなります。もう入っている人はそのままです</li>
              <li>あとで「受付を再開する」で、同じコードを また使えるようにできます</li>
            </>
          ) : (
            <>
              {joinCode && <li>いまのコード（{formatJoinCode(joinCode.code)}）は使えなくなります</li>}
              <li>コードを知っている人は、だれでも「{groupLabel(groupId)}」に入れます。伝える相手に気をつけてください</li>
            </>
          )}
        </ul>
      </ConfirmDialog>
    </section>
  );
}
