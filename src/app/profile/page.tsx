"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useApp } from "@/components/AuthProvider";
import { Confetti } from "@/components/Decor";
import { GradePicker, INPUT_STYLE } from "@/components/Fields";
import { Gate } from "@/components/Gate";
import { Icon } from "@/components/Icons";
import { Navigator } from "@/components/Navigator";
import { Page } from "@/components/Page";
import { Ask, Notes, SIGNUP_INPUT, SIGNUP_LABEL, SignupError, StepHeader } from "@/components/Signup";
import { Button, Say } from "@/components/ui";
import { messageOf } from "@/lib/errors";

const NICKNAME_MAX = 10;

// ④ で保存すると、プロフィールの ID で作り直される部分（ArchiveProvider）ごと この画面も作り直されて、手順の状態が消える。
// そのため「じゅんび できたよ」は URL で覚えておく
const READY_PARAM = "ready";

/**
 * はじめての登録の つづき（ログイン ID と パスワードの あと）：③ ニックネーム → ④ 学年 → じゅんび できたよ
 * 見本は docs/design/first/screens/04〜06
 */
function FirstProfile() {
  const { saveProfile } = useApp();
  const [step, setStep] = useState<"nickname" | "grade" | "ready">("nickname");
  const [nickname, setNickname] = useState("");
  const [grade, setGrade] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const main = "animate-rise flex min-h-dvh flex-col gap-4 p-6 pb-[30px]";

  async function submitGrade(event: React.FormEvent) {
    event.preventDefault();
    if (grade === null) return;
    setBusy(true);
    setError(null);
    // 保存より前に、同じ動きで URL を変えておく（作り直されたあとに「じゅんび できたよ」を出すため）
    window.history.replaceState(null, "", `/profile?${READY_PARAM}=1`);
    try {
      await saveProfile({ nickname: nickname.trim(), grade });
      setStep("ready");
    } catch (e) {
      window.history.replaceState(null, "", "/profile");
      setError(messageOf(e));
      setBusy(false);
    }
  }

  if (step === "nickname") {
    const length = Array.from(nickname).length;
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setStep("grade");
        }}
        className={main}
      >
        {/* ID は ② で もう作ったので、ここからは もどらない */}
        <StepHeader step={3} />
        <Ask key="nickname" mood="happy">
          ニックネームを
          <br />
          きめてね
        </Ask>

        <div className="mt-2 flex flex-col gap-2">
          <div className="flex items-baseline justify-between">
            <label htmlFor="nick" className={SIGNUP_LABEL}>
              ニックネーム
            </label>
            <span className="font-pop text-[15px] text-ink-sub">
              {length}/{NICKNAME_MAX}
            </span>
          </div>
          <input
            id="nick"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            maxLength={NICKNAME_MAX}
            required
            placeholder="れい：そら"
            className={SIGNUP_INPUT}
          />
        </div>
        <Notes items={["アプリで よばれる なまえだよ（ログイン ID とは べつ）", "あとから かえられるよ"]} />
        <div className="flex items-center gap-2.5 rounded-[20px] bg-pink-light px-4 py-3 text-[17px] font-black leading-normal text-pink-dark">
          <Icon name="shield" size={26} fill="#FFFFFF" stroke="#A12A55" />
          <span>ほんとうの なまえは いれないでね</span>
        </div>

        <div className="mt-auto">
          <Button type="submit" disabled={nickname.trim().length === 0}>
            つぎへ
          </Button>
        </div>
      </form>
    );
  }

  if (step === "grade") {
    return (
      <form onSubmit={submitGrade} className={main}>
        <StepHeader step={4} onBack={() => setStep("nickname")} />
        <Ask key="grade" mood="think">
          <ruby>
            学年<rt>がくねん</rt>
          </ruby>
          を
          <br />
          おしえてね
        </Ask>

        <div className="mt-2">
          <GradePicker value={grade} onChange={setGrade} />
        </div>
        <Notes items={["がくねんに あわせて、はてなの むずかしさが かわるよ", "がくねんが あがったら、せっていで かえられるよ"]} />
        {error && <SignupError>{error}</SignupError>}

        <div className="mt-auto">
          <Button type="submit" disabled={busy || grade === null}>
            {busy ? "ちょっと まってね…" : "けってい！"}
          </Button>
        </div>
      </form>
    );
  }

  return <Ready />;
}

/** じゅんび できたよ：きめたものを まとめて見せて、あそびかたへ（ホームを開くと、まだ見ていない説明が出る） */
function Ready() {
  const { user, profile, markGuideSeen } = useApp();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function skipGuide() {
    setBusy(true);
    await markGuideSeen();
    router.replace("/");
  }

  return (
    <main className="animate-rise flex min-h-dvh flex-col gap-4 p-6 pb-[30px]">
      <div role="progressbar" aria-label="とうろく" aria-valuemin={0} aria-valuemax={4} aria-valuenow={4} className="grid grid-cols-4 gap-1.5 pt-5">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className="h-3 rounded-md bg-mint" />
        ))}
      </div>

      <div className="mt-auto flex flex-col items-center gap-2 text-center">
        <Navigator mood="happy" size={168} react />
        <h1 className="font-pop text-[32px] font-normal leading-[1.4]">じゅんび できたよ！</h1>
        <span className="font-pop text-xl leading-[1.6] text-navi-dark">
          かこって はてなを
          <br />
          みつけちゃおう！
        </span>
      </div>

      <div className="mt-auto flex flex-col gap-2.5 rounded-[24px] bg-navi-light px-[18px] py-3.5">
        <div className="flex items-center gap-2.5">
          <span className="font-pop text-[26px]">{profile?.nickname}</span>
          <span className="rounded-xl bg-navi px-2.5 py-0.5 text-[15px] font-black text-white">{profile?.grade}ねんせい</span>
        </div>
        <div className="flex items-center justify-between gap-2 rounded-[14px] bg-white px-3 py-2">
          <span className="text-sm font-black text-ink-sub">ログイン ID</span>
          <span className="break-all font-pop text-xl">{user?.username}</span>
        </div>
        <span className="flex gap-2 text-[15px] font-black leading-normal text-yellow-dark">
          <Icon name="lock" size={20} strokeWidth={2.2} className="mt-0.5" />
          ID と パスワードは おうちの ひとと メモしてね
        </span>
      </div>

      <div className="mt-auto flex flex-col gap-4">
        <Button disabled={busy} onClick={() => router.replace("/")}>
          あそびかたを みる！
        </Button>
        <Button variant="sub" disabled={busy} onClick={() => void skipGuide()}>
          とばして はじめる
        </Button>
      </div>
    </main>
  );
}

/** せっていから、ニックネームと学年を なおす */
function EditProfile() {
  const { profile, saveProfile } = useApp();
  const router = useRouter();
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
      router.replace("/settings");
    } catch (e) {
      setError(messageOf(e));
      setBusy(false);
    }
  }

  return (
    <Page back="/settings">
      <form onSubmit={submit} className="relative flex flex-1 flex-col gap-4">
        <Confetti tone="calm" />
        <Say mood="happy" size={108}>
          <span className="font-pop text-[22px] font-normal leading-normal">
            なまえや がくねんを
            <br />
            かえられるよ！
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
            maxLength={NICKNAME_MAX}
            required
            placeholder="れい：そら"
            className={INPUT_STYLE}
          />
          <span className="text-[15px] font-bold text-ink-sub">アプリで よばれる なまえだよ（ログイン ID とは べつ）</span>
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
        <div className="mt-auto">
          <Button type="submit" disabled={busy || nickname.trim().length === 0}>
            {busy ? "ちょっと まってね…" : "けってい！"}
          </Button>
        </div>
      </form>
    </Page>
  );
}

function ProfileContent() {
  const { profile } = useApp();
  const params = useSearchParams();
  if (profile && params.get(READY_PARAM)) return <Ready />;
  return profile ? <EditProfile /> : <FirstProfile />;
}

export default function ProfilePage() {
  return (
    <Gate needProfile={false}>
      <Suspense>
        <ProfileContent />
      </Suspense>
    </Gate>
  );
}
