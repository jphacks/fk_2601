"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useApp } from "@/components/AuthProvider";
import { Confetti } from "@/components/Decor";
import { GradePicker, INPUT_STYLE } from "@/components/Fields";
import { Gate } from "@/components/Gate";
import { Page } from "@/components/Page";
import { Button, Say } from "@/components/ui";
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
      setError("がくねんを えらんでね");
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
    <Page back={isNew ? null : "/settings"}>
      <form onSubmit={submit} className="relative flex flex-1 flex-col gap-4">
        <Confetti tone="calm" />
        <Say mood="happy" size={108}>
          <span className="font-pop text-[22px] font-normal leading-normal">
            {isNew ? (
              <>
                きみの こと
                <br />
                おしえて！
              </>
            ) : (
              <>
                すすんだら
                <br />
                かえてね！
              </>
            )}
          </span>
        </Say>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="nick" className="font-pop text-[19px]">
            ニックネーム
          </label>
          <input
            id="nick"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={10}
            required
            placeholder="れい：そら"
            className={INPUT_STYLE}
          />
          <span className="text-[15px] font-black text-pink-deep">ほんとうの なまえは いれないでね</span>
        </div>

        <fieldset className="flex flex-col gap-2.5 border-0 p-0">
          <legend className="mb-2.5 p-0 font-pop text-[22px] leading-[1.6]">
            <ruby>
              学年<rt>がくねん</rt>
            </ruby>
          </legend>
          <GradePicker value={grade} onChange={setGrade} />
          <span className="text-[15px] font-bold text-ink-sub">あとから かえられるよ</span>
        </fieldset>

        {error && (
          <p role="alert" className="rounded-[20px] bg-pink-light px-4 py-3 text-base font-black text-pink-dark">
            {error}
          </p>
        )}
        <div className="mt-auto pt-2">
          <Button type="submit" disabled={busy || nickname.trim().length === 0}>
            {busy ? "ちょっと まってね…" : "けってい！"}
          </Button>
        </div>
      </form>
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
