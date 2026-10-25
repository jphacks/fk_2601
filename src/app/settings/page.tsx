"use client";

import Link from "next/link";
import { useState } from "react";
import { useApp } from "@/components/AuthProvider";
import { GradePicker, RadioRow } from "@/components/Fields";
import { Gate } from "@/components/Gate";
import { Icon, Medal } from "@/components/Icons";
import { Page } from "@/components/Page";
import { Button } from "@/components/ui";
import { titleLabel } from "@/lib/constants";
import { messageOf } from "@/lib/errors";
import type { FirstMode } from "@/lib/types";

const OPTIONS: { value: FirstMode; label: string }[] = [
  { value: "choices", label: "「3つから えらぶ」を さきに" },
  { value: "custom", label: "「じぶんで かく」を さきに" },
];

function SettingsContent() {
  const { profile, saveProfile, signOut } = useApp();
  const [error, setError] = useState<string | null>(null);
  if (!profile) return null;

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

      {error && (
        <p role="alert" className="rounded-[20px] bg-pink-light px-4 py-3 text-base font-black text-pink-dark">
          {error}
        </p>
      )}

      <Button variant="danger" onClick={() => void signOut()}>
        ログアウト
      </Button>
    </Page>
  );
}

export default function SettingsPage() {
  return (
    <Gate>
      <SettingsContent />
    </Gate>
  );
}
