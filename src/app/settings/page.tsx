"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useApp } from "@/components/AuthProvider";
import { GradePicker, RadioRow } from "@/components/Fields";
import { Gate } from "@/components/Gate";
import { Icon, Medal } from "@/components/Icons";
import { Page } from "@/components/Page";
import { Button, Say } from "@/components/ui";
import { GUIDE_AGAIN, groupOf, titleLabel } from "@/lib/constants";
import { messageOf } from "@/lib/errors";
import type { FirstMode } from "@/lib/types";

const OPTIONS: { value: FirstMode; label: string }[] = [
  { value: "choices", label: "「3つから えらぶ」を さきに" },
  { value: "custom", label: "「じぶんで かく」を さきに" },
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
      setError(messageOf(e, "ぜんぶは けせなかったよ。ネットに つながっているか みて、もういちど ためしてね"));
    } finally {
      setPassword("");
      setDeleting(false);
      deleteLock.current = false;
    }
  }

  // プロフィールを消した後で失敗し、再読み込みした場合も退会をやり直せる。
  if (confirmDelete || !profile) return (
    <Page title="アカウントを けす">
      <Say mood={error ? "sorry" : "think"}>ほんとうに けす？</Say>
      <p className="rounded-card bg-pink-light p-4 text-base font-black leading-relaxed">
        この アカウントの ずかんと、なかまに みせた はてな、ニックネームや がくねんを ぜんぶ けすよ。<br />
        けしたものは もとに もどせないよ。この ログイン ID では あそべなくなるよ。
      </p>
      <form className="flex flex-col gap-4" onSubmit={(event) => { event.preventDefault(); void deleteAccount(); }}>
        {backend.mode === "firebase" ? (
          <label className="flex flex-col gap-2 text-base font-black">
            きみの アカウントか たしかめるため、パスワードを もういちど いれてね
            <input type="password" autoComplete="current-password" required value={password} disabled={deleting}
              onChange={(event) => setPassword(event.target.value)}
              className="h-[60px] w-full min-w-0 rounded-[20px] border-3 border-ink bg-white px-4 text-xl" />
          </label>
        ) : <p className="text-base font-black">この ブラウザに のこした データを けすよ。</p>}
        {error && <p role="alert" className="rounded-card bg-pink-light p-4 text-base font-black text-pink-dark">{error}</p>}
        <p role="status" className="text-base font-black">{deleting ? "けしているよ。そのまま まってね" : ""}</p>
        <Button type="submit" variant="danger" disabled={deleting || (backend.mode === "firebase" && !password)}>
          {deleting ? "けしているよ…" : error ? "もういちど ためす" : "ぜんぶ けす"}
        </Button>
        {profile && (
          <Button variant="sub" disabled={deleting} onClick={() => { setConfirmDelete(false); setPassword(""); setError(null); }}>
            せっていに もどる
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
      <h1 className="flex h-[46px] items-center font-pop text-[26px] font-normal">せってい</h1>

      <section className="flex flex-col gap-2.5 rounded-card bg-cloud px-4 py-3.5">
        <div className="flex items-center justify-between">
          <span className="text-[17px] font-black text-ink-sub">ニックネーム</span>
          <Link href="/profile" className="flex items-center gap-1 font-pop text-xl">
            {profile.nickname}
            <Icon name="pencil" size={18} strokeWidth={2.4} />
          </Link>
        </div>
        <span className="font-pop text-xl leading-[1.6]">
          <ruby>
            学年<rt>がくねん</rt>
          </ruby>
        </span>
        <GradePicker size="sm" value={profile.grade} onChange={(grade) => void update({ grade })} />
      </section>

      <fieldset className="flex flex-col gap-2.5 border-0 p-0">
        <legend className="mb-2.5 p-0 font-pop text-lg">はてなの だしかた</legend>
        <div role="radiogroup" aria-label="はてなの だしかた" className="flex flex-col gap-2.5">
          {OPTIONS.map((o) => (
            <RadioRow key={o.value} selected={profile.firstMode === o.value} onClick={() => void update({ firstMode: o.value })}>
              {o.label}
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
          <span className="text-[17px] font-black">グループに はいる</span>
          {memberships && memberships.length > 0 && (
            <span className="text-sm font-bold text-ink-sub">いま：{memberships.map((m) => groupOf(m.groupId).kana).join("・")}</span>
          )}
        </span>
        <Icon name="next" size={20} strokeWidth={3} className="ml-auto" />
      </Link>

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
        <span className="text-[17px] font-black">あそびかたを もういちど みる</span>
        <Icon name="next" size={20} strokeWidth={3} className="ml-auto" />
      </Link>

      {error && (
        <p role="alert" className="rounded-[20px] bg-pink-light px-4 py-3 text-base font-black text-pink-dark">
          {error}
        </p>
      )}

      <Button variant="sub" onClick={() => { setError(null); setConfirmDelete(true); }}>
        アカウントを けす
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
