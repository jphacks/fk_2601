"use client";

import { useState } from "react";
import { useApp } from "@/components/AuthProvider";
import { Gate } from "@/components/Gate";
import { Page } from "@/components/Page";
import { Button, Card, LinkButton } from "@/components/ui";
import { messageOf } from "@/lib/errors";
import type { FirstMode } from "@/lib/types";

const OPTIONS: { value: FirstMode; label: string; note: string }[] = [
  { value: "choices", label: "3つから えらぶ", note: "さきに 3つの もんだいが 出るよ" },
  { value: "custom", label: "じぶんで かく", note: "さきに もんだいを かく 場所が 出るよ" },
];

function SettingsContent() {
  const { profile, saveProfile, signOut } = useApp();
  const [error, setError] = useState<string | null>(null);
  if (!profile) return null;

  async function choose(firstMode: FirstMode) {
    if (!profile) return;
    setError(null);
    try {
      await saveProfile({ nickname: profile.nickname, grade: profile.grade, firstMode });
    } catch (e) {
      setError(messageOf(e));
    }
  }

  return (
    <Page title="せってい" back="/">
      <Card className="space-y-3">
        <h2 className="text-lg font-bold">もんだいの だしかた</h2>
        <p className="text-base">さいしょに 出す ほうを えらんでね。あとで いつでも きりかえられるよ。</p>
        <div className="space-y-2" role="radiogroup" aria-label="もんだいの だしかた">
          {OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={profile.firstMode === o.value}
              onClick={() => void choose(o.value)}
              className={`w-full rounded-2xl border-2 px-4 py-3 text-left ${
                profile.firstMode === o.value ? "border-brand bg-brand/10" : "border-ink/15 bg-white"
              }`}
            >
              <span className="block text-lg font-bold">{o.label}</span>
              <span className="block text-sm text-ink/70">{o.note}</span>
            </button>
          ))}
        </div>
        {error && (
          <p role="alert" className="rounded-xl bg-berry/10 px-3 py-2 text-base font-bold text-berry">
            {error}
          </p>
        )}
      </Card>

      <Card className="space-y-3">
        <h2 className="text-lg font-bold">プロフィール</h2>
        <p className="text-base">
          {profile.nickname}さん（{profile.grade}年生）
        </p>
        <LinkButton href="/profile" variant="secondary">
          ニックネームと 学年を かえる
        </LinkButton>
      </Card>

      <div className="mt-auto">
        <Button variant="ghost" onClick={() => void signOut()}>
          ログアウト
        </Button>
      </div>
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
