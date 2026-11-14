"use client";

import { Jp } from "@/components/RubyText";
import Link from "next/link";
import { useRef, useState } from "react";
import { useApp } from "@/components/AuthProvider";
import { GradePicker, RadioRow } from "@/components/Fields";
import { Gate } from "@/components/Gate";
import { PresenceNote } from "@/components/HelpButton";
import { Icon, Medal } from "@/components/Icons";
import { Page } from "@/components/Page";
import { Button, Say } from "@/components/ui";
import { GUIDE_AGAIN, groupOf, titleLabel } from "@/lib/constants";
import { messageOf } from "@/lib/errors";
import type { FirstMode } from "@/lib/types";

const OPTIONS: { value: FirstMode; label: string }[] = [
  { value: "choices", label: "「3つから {選|えら}ぶ」を {先|さき}に" },
  { value: "custom", label: "「{自分|じぶん}で {書|か}く」を {先|さき}に" },
];

function SettingsContent() {
  const { profile, saveProfile, signOut, backend, memberships } = useApp();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const deleteLock = useRef(false);
  const [error, setError] = useState<string | null>(null);

  async function deleteAccount() {
    if (deleteLock.current) return;
    deleteLock.current = true;
    setDeleting(true);
    setError(null);
    try {
      await backend.deleteAccount(password);
    } catch (e) {
      setError(messageOf(e, "{全部|ぜんぶ}は {消|け}せなかったよ。ネットに つながっているか {見|み}て、もう{一度|いちど} {試|ため}してね"));
    } finally {
      setPassword("");
      setDeleting(false);
      deleteLock.current = false;
    }
  }

  // プロフィールを消した後で失敗し、再読み込みした場合も退会をやり直せる。
  if (confirmDelete || !profile) return (
    <Page title="アカウントを {消|け}す">
      <Say mood={error ? "sorry" : "think"}>
        <Jp big>{"{本当|ほんとう}に {消|け}す？"}</Jp>
      </Say>
      <p className="rounded-card bg-pink-light p-4 text-base font-black leading-relaxed">
        <Jp>{"この アカウントの ずかんと、なかまに {見|み}せた はてな、ニックネームや {学年|がくねん}を {全部|ぜんぶ} {消|け}すよ。"}</Jp>
        <br />
        <Jp>{"{消|け}したものは もとに {戻|もど}せないよ。この ログイン ID では {遊|あそ}べなくなるよ。"}</Jp>
      </p>
      <form className="flex flex-col gap-4" onSubmit={(event) => { event.preventDefault(); void deleteAccount(); }}>
        {backend.mode === "firebase" ? (
          <label className="flex flex-col gap-2 text-base font-black">
            <Jp>{"きみの アカウントか たしかめるため、パスワードを もう{一度|いちど} {入|い}れてね"}</Jp>
            <input type="password" autoComplete="current-password" required value={password} disabled={deleting}
              onChange={(event) => setPassword(event.target.value)}
              className="h-[60px] w-full min-w-0 rounded-[20px] border-3 border-ink bg-white px-4 text-xl" />
          </label>
        ) : <p className="text-base font-black"><Jp>{"この ブラウザに {残|のこ}した データを {消|け}すよ。"}</Jp></p>}
        {error && <p role="alert" className="rounded-card bg-pink-light p-4 text-base font-black text-pink-dark"><Jp>{error}</Jp></p>}
        <p role="status" className="text-base font-black">{deleting ? <Jp>{"{消|け}しているよ。そのまま {待|ま}ってね"}</Jp> : ""}</p>
        <Button type="submit" variant="danger" disabled={deleting || (backend.mode === "firebase" && !password)}>
          <Jp>{deleting ? "{消|け}しているよ…" : error ? "もう{一度|いちど} {試|ため}す" : "{全部|ぜんぶ} {消|け}す"}</Jp>
        </Button>
        {profile && (
          <Button variant="sub" disabled={deleting} onClick={() => { setConfirmDelete(false); setPassword(""); setError(null); }}>
            <Jp>{"{設定|せってい}に {戻|もど}る"}</Jp>
          </Button>
        )}
      </form>
    </Page>
  );

  async function update(change: { grade?: number; firstMode?: FirstMode }) {
    if (!profile) return;
    setError(null);
    try {
      await saveProfile({ nickname: profile.nickname, grade: change.grade ?? profile.grade, firstMode: change.firstMode ?? profile.firstMode });
    } catch (e) {
      setError(messageOf(e));
    }
  }

  return (
    <Page tab="settings">
      <h1 className="flex h-[46px] items-center font-pop text-[26px] font-normal">
        <Jp big>{"{設定|せってい}"}</Jp>
      </h1>

      <section className="flex flex-col gap-2.5 rounded-card bg-cloud px-4 py-3.5">
        <div className="flex items-center justify-between">
          <span className="text-[17px] font-black text-ink-sub">ニックネーム</span>
          <Link href="/profile" className="flex items-center gap-1 font-pop text-xl">
            {profile.nickname}
            <Icon name="pencil" size={18} strokeWidth={2.4} />
          </Link>
        </div>
        <span className="font-pop text-xl leading-[1.6]">
          <Jp>{"{学年|がくねん}"}</Jp>
        </span>
        <GradePicker size="sm" value={profile.grade} onChange={(grade) => void update({ grade })} />
      </section>

      <fieldset className="flex flex-col gap-2.5 border-0 p-0">
        <legend className="mb-2.5 p-0 font-pop text-lg">
          <Jp>{"はてなの {出|だ}しかた"}</Jp>
        </legend>
        <div role="radiogroup" aria-label="はてなの だしかた" className="flex flex-col gap-2.5">
          {OPTIONS.map((o) => (
            <RadioRow key={o.value} selected={profile.firstMode === o.value} onClick={() => void update({ firstMode: o.value })}>
              <Jp>{o.label}</Jp>
            </RadioRow>
          ))}
        </div>
      </fieldset>

      <Link
        href="/stamp?view=titles"
        className="flex h-[62px] items-center gap-2.5 rounded-[22px] border-3 border-ink bg-white px-4 shadow-pop-sm active:translate-y-1 active:shadow-none"
      >
        <Medal size={28} />
        <span className="text-[17px] font-black">しょうごう</span>
        <span className="ml-auto rounded-xl bg-purple px-2.5 py-0.5 text-sm font-black text-white">{titleLabel(profile.title)}</span>
        <Icon name="next" size={20} strokeWidth={3} />
      </Link>

      {/* 参加コードでグループに入る（#137） */}
      <Link
        href="/join"
        className="flex min-h-[62px] items-center gap-2.5 rounded-[22px] border-3 border-ink bg-white px-4 py-2 shadow-pop-sm active:translate-y-1 active:shadow-none"
      >
        <Icon name="people" size={28} strokeWidth={2.2} />
        <span className="flex flex-col">
          <span className="text-[17px] font-black">
            <Jp>{"グループに {入|はい}る"}</Jp>
          </span>
          {memberships && memberships.length > 0 && (
            <span className="text-sm font-bold text-ink-sub"><Jp>{"{今|いま}："}</Jp>{memberships.map((m) => groupOf(m.groupId).kana).join("・")}</span>
          )}
        </span>
        <Icon name="next" size={20} strokeWidth={3} className="ml-auto" />
      </Link>
      {memberships && memberships.length > 0 && <PresenceNote className="-mt-2 px-1" />}

      {/* あそびかたの説明を、1枚目から もういちど出す（docs/design/first/screens/10） */}
      <Link
        href={GUIDE_AGAIN}
        className="flex h-[62px] items-center gap-2.5 rounded-[22px] border-3 border-ink bg-white px-4 shadow-pop-sm active:translate-y-1 active:shadow-none"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true" className="shrink-0">
          <circle cx="12" cy="12" r="10" fill="#4A5AE8" stroke="#22223A" strokeWidth="1.8" />
          <path d="M9.3 9.4a2.8 2.8 0 0 1 5.4 1c0 1.8-2.7 2.3-2.7 3.9" fill="none" stroke="#FFFFFF" strokeWidth="2.4" strokeLinecap="round" />
          <circle cx="12" cy="17.3" r="1.3" fill="#FFFFFF" />
        </svg>
        <span className="text-[17px] font-black">
          <Jp>{"{遊|あそ}びかたを もう{一度|いちど} {見|み}る"}</Jp>
        </span>
        <Icon name="next" size={20} strokeWidth={3} className="ml-auto" />
      </Link>

      {error && (
        <p role="alert" className="rounded-[20px] bg-pink-light px-4 py-3 text-base font-black text-pink-dark">
          <Jp>{error}</Jp>
        </p>
      )}

      <Button variant="sub" onClick={() => { setError(null); setConfirmDelete(true); }}>
        <Jp>{"アカウントを {消|け}す"}</Jp>
      </Button>

      <Button variant="danger" onClick={() => void signOut()}>
        ログアウト
      </Button>
    </Page>
  );
}

export default function SettingsPage() {
  return (
    <Gate needProfile={false}>
      <SettingsContent />
    </Gate>
  );
}
