"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/components/AuthProvider";
import type { GroupId } from "@/lib/constants";
import { GROUP_MISSION_MAX, hasKanji, jstDate } from "@/lib/missions";
import { AdminNotice, BTN_BASE, ConfirmDialog, DANGER_SUB, GroupAdminPage, groupLabel, SUB } from "./GroupAdmin";

// グループのミッション（/teacher/groups/{グループ}/missions。#139）。本番のデータを扱う。
// 日付ごとに1つ。その日にミッションを出したグループの分が、メンバーのホームと お題の画面に出る（出していない日は、いつもの きょうの おだい）。
// 子どもの画面に出すので、ひらがなで書く（漢字は保存させない。firestore.rules でも断る）

const AHEAD = 14;
const BEHIND = 7;
const FIELD = "h-10 rounded-tbtn border border-t-field-line bg-white px-3 text-sm text-t-text pointer-coarse:h-11 pointer-coarse:text-base";
const BTN = `${BTN_BASE} h-[34px] px-3 pointer-coarse:h-11`;

/** 「2026-11-15」→「11/15（日）」（日本時間） */
function dateLabel(date: string) {
  return new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric", weekday: "short" })
    .format(new Date(`${date}T12:00:00+09:00`))
    .replace(/\((.)\)/, "（$1）");
}

function problemOf(text: string): string | null {
  const t = text.trim();
  if (t.length === 0) return "文を入れてください。";
  if (Array.from(t).length > GROUP_MISSION_MAX) return `${GROUP_MISSION_MAX}文字までにしてください。`;
  if (hasKanji(t)) return "子どもの画面に出すので、ひらがなで書いてください（漢字は使えません）。";
  return null;
}

function Missions({ groupId }: { groupId: GroupId }) {
  const { backend } = useApp();
  // 開いたときの日付で決める（表示のたびに時計を読まない）
  const [today] = useState(() => jstDate());
  const [range] = useState(() => ({
    past: Array.from({ length: BEHIND }, (_, i) => jstDate(new Date(), -(BEHIND - i))),
    future: Array.from({ length: AHEAD + 1 }, (_, i) => jstDate(new Date(), i)),
  }));
  const [missions, setMissions] = useState<Record<string, string> | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [editing, setEditing] = useState<{ date: string; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    backend
      .listGroupMissions(groupId, range.past[0], range.future[range.future.length - 1])
      .then((list) => !cancelled && setMissions(Object.fromEntries(list.map((m) => [m.date, m.text]))))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [backend, groupId, range, attempt]);

  async function save() {
    if (!editing) return;
    const problem = problemOf(editing.text);
    if (problem) {
      setEditError(problem);
      return;
    }
    setSaving(true);
    setEditError(null);
    try {
      const text = editing.text.trim();
      await backend.saveGroupMission(groupId, editing.date, text);
      setMissions((prev) => ({ ...prev, [editing.date]: text }));
      setEditing(null);
    } catch {
      setEditError("保存できませんでした。通信と、管理者になっているかを確かめて、もう一度試してください。");
    }
    setSaving(false);
  }

  async function remove() {
    if (!removing) return;
    setSaving(true);
    setRemoveError(null);
    try {
      await backend.deleteGroupMission(groupId, removing);
      setMissions((prev) => {
        const next = { ...prev };
        delete next[removing];
        return next;
      });
      setRemoving(null);
    } catch {
      setRemoveError("消せませんでした。通信と、管理者になっているかを確かめて、もう一度試してください。");
    }
    setSaving(false);
  }

  function row(date: string, past: boolean) {
    const text = missions?.[date];
    const isEditing = editing?.date === date;
    return (
      <li key={date} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-t-line-soft px-4 py-3 last:border-b-0">
        <span className="flex w-[130px] items-center gap-2 text-sm font-bold tabular-nums">
          {dateLabel(date)}
          {date === today && <span className="rounded-full bg-t-chalk px-2 py-0.5 text-[11px] text-t-text">きょう</span>}
        </span>
        {isEditing ? (
          <span className="flex min-w-0 flex-[1_1_360px] flex-col gap-1.5">
            <span className="flex flex-wrap items-center gap-2">
              <input
                aria-label={`${dateLabel(date)} のミッション`}
                value={editing.text}
                onChange={(e) => setEditing({ date, text: e.target.value })}
                placeholder="例：まるい ものを みつけよう"
                className={`${FIELD} min-w-0 flex-1`}
                autoFocus
              />
              <span className={`text-xs tabular-nums ${Array.from(editing.text.trim()).length > GROUP_MISSION_MAX ? "text-t-danger" : "text-t-text-sub"}`}>
                {Array.from(editing.text.trim()).length}/{GROUP_MISSION_MAX}
              </span>
              <button type="button" onClick={() => void save()} disabled={saving} className={`${BTN} border-t-board bg-t-board text-white`}>
                {saving ? "保存しています…" : "保存する"}
              </button>
              <button type="button" onClick={() => setEditing(null)} disabled={saving} className={`${BTN} ${SUB}`}>
                やめる
              </button>
            </span>
            {editError && (
              <span role="alert" className="text-xs font-bold text-t-danger">
                {editError}
              </span>
            )}
          </span>
        ) : (
          <>
            <span className={`min-w-0 flex-[1_1_300px] text-sm ${text ? "font-bold" : "text-t-text-sub"}`}>
              {text ?? (past ? "出していません" : "出していません（いつもの きょうの おだいが出ます）")}
            </span>
            {!past && (
              <span className="ml-auto flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditError(null);
                    setEditing({ date, text: text ?? "" });
                  }}
                  className={`${BTN} ${SUB}`}
                >
                  {text ? "変える" : "出す"}
                </button>
                {text && (
                  <button
                    type="button"
                    onClick={() => {
                      setRemoveError(null);
                      setRemoving(date);
                    }}
                    className={`${BTN} ${DANGER_SUB}`}
                  >
                    消す
                  </button>
                )}
              </span>
            )}
          </>
        )}
      </li>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <section aria-label="ミッションを書くときの注意" className="rounded-tcard border border-t-chalk-line bg-t-chalk-soft px-4 py-3 text-sm leading-[1.8] text-t-chalk-text">
        <strong>書くときの注意</strong>
        <ul className="list-disc pl-5">
          <li>子どもの画面にそのまま出ます。ひらがなで、わかち書き（ことばの間を空ける）にしてください（漢字は保存できません）。{GROUP_MISSION_MAX}文字まで</li>
          <li>火・刃物・電気・薬品・高い所・道路など、危ないことをさせるお題にしないでください。人の顔や名札を撮らせるお題にもしないでください</li>
          <li>その日にミッションを出すと、「{groupLabel(groupId)}」のメンバーのホームに、グループの名前つきで出ます（いくつかのグループに入っている子には、ぜんぶ ならびます）</li>
        </ul>
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            setFailed(false);
            setMissions(null);
            setAttempt((n) => n + 1);
          }}
          className={`${BTN_BASE} h-10 px-3.5 pointer-coarse:h-11 ${SUB}`}
        >
          読み込み直す
        </button>
      </div>

      {failed && <AdminNotice>ミッションを読み込めませんでした。通信を確かめて「読み込み直す」を押してください。</AdminNotice>}
      {!failed && missions === null && <AdminNotice>読み込んでいます…</AdminNotice>}
      {missions && (
        <>
          <h2 className="text-base font-bold">これから（{AHEAD + 1}日）</h2>
          <ul aria-label="これからのミッション" className="overflow-hidden rounded-tcard border border-t-line bg-white">
            {range.future.map((d) => row(d, false))}
          </ul>
          <h2 className="text-base font-bold">これまで（{BEHIND}日）</h2>
          <ul aria-label="これまでのミッション" className="overflow-hidden rounded-tcard border border-t-line bg-white">
            {[...range.past].reverse().map((d) => row(d, true))}
          </ul>
        </>
      )}

      <ConfirmDialog
        open={removing !== null}
        title={removing ? `${dateLabel(removing)} のミッションを消しますか？` : ""}
        confirmLabel="消す"
        busy={saving}
        error={removeError}
        onCancel={() => !saving && setRemoving(null)}
        onConfirm={() => void remove()}
      >
        <p className="text-sm leading-[1.75] text-t-text-2">その日は、「{groupLabel(groupId)}」のミッションは出ません（ほかのグループのミッションか、いつもの きょうの おだいが出ます）。</p>
      </ConfirmDialog>
    </div>
  );
}

export function GroupMissionsScreen({ groupId }: { groupId: string }) {
  return (
    <GroupAdminPage
      groupId={groupId}
      title={(id) => `${groupLabel(id)} のミッション`}
      description="日付ごとに、グループのメンバーへ きょうの おだいを出します。日付は日本時間です。この画面は見本ではなく、本番のデータを扱います。"
    >
      {(id) => <Missions key={id} groupId={id} />}
    </GroupAdminPage>
  );
}
