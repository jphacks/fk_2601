"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/components/AuthProvider";
import { Gate } from "@/components/Gate";
import { Page } from "@/components/Page";
import { Button, Card, Say } from "@/components/ui";
import { GRADES } from "@/lib/constants";
import { messageOf } from "@/lib/errors";

function ProfileForm() {
  const { profile, saveProfile } = useApp();
  const router = useRouter();
  const isNew = !profile;
  const [nickname, setNickname] = useState(profile?.nickname ?? "");
  const [grade, setGrade] = useState<number | null>(profile?.grade ?? null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (grade === null) {
      setError("学年を えらんでね");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await saveProfile({ nickname: nickname.trim(), grade });
      router.replace("/");
    } catch (e) {
      setError(messageOf(e));
      setBusy(false);
    }
  }

  return (
    <Page title={isNew ? "はじめに おしえてね" : "プロフィール"} back={isNew ? null : "/"}>
      <Say mood="happy">
        {isNew ? "ぼくは ナビ！ きみのことを おしえてね。学年に あわせた もんだいを だすよ。" : "学年は、すすんだら かえてね。"}
      </Say>
      <Card>
        <form onSubmit={submit} className="space-y-5">
          <label className="block">
            <span className="mb-1 block text-base font-bold">ニックネーム</span>
            <input
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              maxLength={10}
              required
              placeholder="ほんとうの なまえは いれないでね"
              className="min-h-12 w-full rounded-xl border-2 border-ink/15 bg-white px-3 text-lg outline-none focus:border-brand"
            />
          </label>

          <fieldset>
            <legend className="mb-2 text-base font-bold">学年</legend>
            <div className="grid grid-cols-3 gap-2">
              {GRADES.map((g) => (
                <button
                  key={g}
                  type="button"
                  aria-pressed={grade === g}
                  onClick={() => setGrade(g)}
                  className={`min-h-12 rounded-xl border-2 text-lg font-bold ${
                    grade === g ? "border-brand bg-brand text-white" : "border-ink/15 bg-white"
                  }`}
                >
                  {g}年生
                </button>
              ))}
            </div>
          </fieldset>

          {error && (
            <p role="alert" className="rounded-xl bg-berry/10 px-3 py-2 text-base font-bold text-berry">
              {error}
            </p>
          )}
          <Button type="submit" disabled={busy || nickname.trim().length === 0}>
            {busy ? "ちょっと まってね…" : "これで きまり！"}
          </Button>
        </form>
      </Card>
    </Page>
  );
}

export default function ProfilePage() {
  return (
    <Gate needProfile={false}>
      <ProfileForm />
    </Gate>
  );
}
