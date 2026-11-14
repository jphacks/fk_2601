"use client";

import { Jp } from "@/components/RubyText";
import { useState } from "react";
import { useApp } from "@/components/AuthProvider";
import { INPUT_STYLE } from "@/components/Fields";
import { Gate } from "@/components/Gate";
import { PresenceNote } from "@/components/HelpButton";
import { Page } from "@/components/Page";
import { Button, LinkButton, Say } from "@/components/ui";
import { groupOf, type GroupId } from "@/lib/constants";
import { messageOf } from "@/lib/errors";
import { JOIN_CODE_LENGTH, normalizeJoinCode } from "@/lib/joinCode";

// 参加コードでグループに入る（#137）。コードは、グループの管理者（おとな）が管理画面で作って伝える。
// 小さい文字は ひらがなで書く（docs/design/README.md「文字」）。グループの名前も、ひらがな・英数字の表記（kana）で出す

function JoinContent() {
  const { backend, user, memberships, reloadMemberships } = useApp();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [joined, setJoined] = useState<{ groupId: GroupId; already: boolean } | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!user || busy) return;
    const normalized = normalizeJoinCode(code);
    if (!normalized) {
      setError(`コードは {英語|えいご}と {数字|すうじ}の ${JOIN_CODE_LENGTH}{文字|もじ}だよ。もう{一度|いちど} たしかめてね`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await backend.joinWithCode(user.uid, user.username, normalized);
      await reloadMemberships();
      setJoined(result);
    } catch (e) {
      setError(messageOf(e));
    }
    setBusy(false);
  }

  if (joined) {
    const name = groupOf(joined.groupId).kana;
    return (
      <Page title="グループに {入|はい}る" back="/settings">
        <Say mood="happy" size={76}>
          <Jp className="text-lg">{joined.already ? `「${name}」には もう {入|はい}っているよ！` : `「${name}」に {入|はい}ったよ！`}</Jp>
        </Say>
        <p className="rounded-card bg-pink-light px-4 py-3 text-lg font-black leading-[1.7]">
          <Jp>{"ずかんに {残|のこ}すときに「なかまにも {見|み}せる」で {選|えら}ぶと、{同|おな}じ グループの なかまに はてなを {見|み}せられるよ。{名前|なまえ}は {出|で}ないよ。"}</Jp>
        </p>
        <PresenceNote />
        <div className="mt-auto flex flex-col gap-3">
          <LinkButton href="/others">
            <Jp big>{"みんなの はてなを {見|み}る"}</Jp>
          </LinkButton>
          <LinkButton href="/settings" variant="sub">
            <Jp>{"{設定|せってい}に {戻|もど}る"}</Jp>
          </LinkButton>
        </div>
      </Page>
    );
  }

  return (
    <Page title="グループに {入|はい}る" back="/settings">
      <Say mood="think" size={76}>
        <span className="text-lg">
          <Jp>{"{大人|おとな}の {人|ひと}に"}</Jp>
          <br />
          もらった コードを
          <br />
          <Jp>{"{入|い}れてね"}</Jp>
        </span>
      </Say>

      <form onSubmit={submit} className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="join-code" className="font-pop text-lg">
            <Jp>{"{参加|さんか} コード"}</Jp>
          </label>
          <input
            id="join-code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="off"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            maxLength={16}
            placeholder="ABCD-EFGH"
            className={`${INPUT_STYLE} font-pop tracking-[0.12em] uppercase`}
          />
          <span className="text-sm font-bold text-ink-sub">
            <Jp>{`{英語|えいご}と {数字|すうじ}の ${JOIN_CODE_LENGTH}{文字|もじ}（「-」は なくても いいよ）`}</Jp>
          </span>
        </div>

        <PresenceNote />

        {memberships && memberships.length > 0 && (
          <p className="text-base font-black text-ink-sub"><Jp>{"{今|いま} {入|はい}っている グループ："}</Jp>{memberships.map((m) => groupOf(m.groupId).kana).join("・")}</p>
        )}

        {error && (
          <p role="alert" className="rounded-[20px] bg-pink-light px-4 py-3 text-base font-black text-pink-dark">
            <Jp>{error}</Jp>
          </p>
        )}

        <div className="mt-auto">
          <Button type="submit" disabled={busy || code.trim().length === 0}>
            <Jp big>{busy ? "{調|しら}べているよ…" : "{入|はい}る！"}</Jp>
          </Button>
        </div>
      </form>
    </Page>
  );
}

export default function JoinPage() {
  return (
    <Gate>
      <JoinContent />
    </Gate>
  );
}
