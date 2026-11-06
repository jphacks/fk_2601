"use client";

import { useState } from "react";
import { useApp } from "@/components/AuthProvider";
import { INPUT_STYLE } from "@/components/Fields";
import { Gate } from "@/components/Gate";
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
      setError(`コードは えいごと すうじの ${JOIN_CODE_LENGTH}もじだよ。もういちど たしかめてね`);
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
      <Page title="グループに はいる" back="/settings">
        <Say mood="happy" size={76}>
          <span className="text-lg">{joined.already ? `「${name}」には もう はいっているよ！` : `「${name}」に はいったよ！`}</span>
        </Say>
        <p className="rounded-card bg-pink-light px-4 py-3 text-lg font-black leading-[1.7]">
          ずかんに のこすときに「なかまにも みせる」で えらぶと、おなじ グループの なかまに はてなを みせられるよ。なまえは でないよ。
        </p>
        <div className="mt-auto flex flex-col gap-3">
          <LinkButton href="/others">みんなの はてなを みる</LinkButton>
          <LinkButton href="/settings" variant="sub">
            せっていに もどる
          </LinkButton>
        </div>
      </Page>
    );
  }

  return (
    <Page title="グループに はいる" back="/settings">
      <Say mood="think" size={76}>
        <span className="text-lg">
          おとなの ひとに
          <br />
          もらった コードを
          <br />
          いれてね
        </span>
      </Say>

      <form onSubmit={submit} className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="join-code" className="font-pop text-lg">
            さんか コード
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
          <span className="text-sm font-bold text-ink-sub">えいごと すうじの {JOIN_CODE_LENGTH}もじ（「-」は なくても いいよ）</span>
        </div>

        {memberships && memberships.length > 0 && (
          <p className="text-base font-black text-ink-sub">いま はいっている グループ：{memberships.map((m) => groupOf(m.groupId).kana).join("・")}</p>
        )}

        {error && (
          <p role="alert" className="rounded-[20px] bg-pink-light px-4 py-3 text-base font-black text-pink-dark">
            {error}
          </p>
        )}

        <div className="mt-auto">
          <Button type="submit" disabled={busy || code.trim().length === 0}>
            {busy ? "しらべているよ…" : "はいる！"}
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
