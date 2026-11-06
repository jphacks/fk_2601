"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp } from "@/components/AuthProvider";
import { Loading } from "@/components/Loading";
import { Navigator } from "@/components/Navigator";
import { BackButton, Page } from "@/components/Page";
import { Ask, MemoNotice, Notes, SIGNUP_INPUT, SIGNUP_LABEL, SignupError, StepHeader } from "@/components/Signup";
import { Button } from "@/components/ui";
import { messageOf, UsernameTakenError } from "@/lib/errors";
import { normalizeUsername, validateUsername } from "@/lib/username";

// はじめての人：ようこそ → ① ログイン ID → ② パスワード（ここで ID を つくる）→ /profile（③ ニックネーム → ④ 学年 → じゅんび できたよ）
// 2回目から：ようこそ → おかえり（ID と パスワード）→ ホーム（docs/design/first/README.md「流れ」）
type Step = "welcome" | "id" | "password" | "signin";

const PASSWORD_MIN = 6;

/** ようこその まわりの かざり（見本 01） */
function WelcomeDecor() {
  return (
    <svg aria-hidden="true" viewBox="0 0 390 844" className="pointer-events-none absolute left-0 top-0 -z-10 h-[844px] w-[390px]">
      <circle cx="34" cy="40" r="8" fill="#FFC83D" />
      <path d="M352 30l14 5-11 10z" fill="#FF6F9C" />
      <rect x="300" y="128" width="12" height="12" rx="2" fill="#24C3A0" transform="rotate(25 306 134)" />
      <path d="M300 96q8-10 16 0t16 0" fill="none" stroke="#8B5CF6" strokeWidth="4" strokeLinecap="round" />
      <circle cx="370" cy="330" r="6" fill="#4A5AE8" />
      <path d="M40 150l4 9 9 1-7 6 2 9-8-5-8 5 2-9-7-6 9-1z" fill="#FFC83D" />
    </svg>
  );
}

const LOGO_RING =
  "M70 12C140 2 228 14 230 44C232 76 160 86 108 84C52 82 8 72 10 46C12 24 40 14 78 10C86 9 92 7 96 3";

/** アプリの名前のロゴ（「はてな」を かこむ わっか） */
function Logo() {
  return (
    <div className="flex flex-col items-center gap-3.5" role="img" aria-label="かこって はてな!?">
      <span aria-hidden className="font-pop text-2xl text-ink-sub">
        かこって
      </span>
      <span aria-hidden className="relative px-[22px] py-1.5 font-pop text-[46px] leading-[1.2] text-navi">
        <svg viewBox="0 0 240 90" className="absolute left-[calc(50%-120px)] top-[calc(50%-45px)] h-[90px] w-[240px] overflow-visible">
          <path d={LOGO_RING} fill="none" stroke="#FFC83D" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" />
          <path d={LOGO_RING} fill="none" stroke="#22223A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className="relative">はてな!?</span>
      </span>
    </div>
  );
}

/** パスワードの「みる／かくす」 */
function ShowToggle({ shown, onToggle }: { shown: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={shown}
      onClick={onToggle}
      className="h-16 shrink-0 rounded-[20px] border-3 border-ink bg-white px-3.5 text-base font-black shadow-pop-xs active:translate-y-[3px] active:shadow-none"
    >
      {shown ? "かくす" : "みる"}
    </button>
  );
}

/** 入れたものが よいかを、その場で知らせる（よい：みどり／ちがう：ピンク／まだ：うすい字） */
function Check({ state, children }: { state: "ok" | "ng" | "wait"; children: React.ReactNode }) {
  const color = state === "ok" ? "text-mint-dark" : state === "ng" ? "text-pink-dark" : "text-ink-sub";
  return (
    <span aria-live="polite" className={`text-[15px] font-black ${color}`}>
      {children}
    </span>
  );
}

export default function LoginPage() {
  const { status, backend, signIn, signUp } = useApp();
  const router = useRouter();
  const [step, setStep] = useState<Step>("welcome");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  // ② で ID を作れなかったときの ID（① に戻して、同じ ID のままでは押せなくする）
  const [taken, setTaken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "in") router.replace("/");
  }, [status, router]);

  // ログインすると、ユーザーごとの状態（QuizProvider）が作り直されて、この画面も まっさらに作り直される。
  // そのまま入力らんを出すと、ホームへ行く前に 一瞬 ログイン画面に もどったように見えるので、待ちの表示にする
  if (status === "in") {
    return (
      <Page>
        <Loading message="じゅんびしているよ…" />
      </Page>
    );
  }

  function go(next: Step) {
    setError(null);
    setStep(next);
  }

  async function createAccount(id: string) {
    setBusy(true);
    setError(null);
    try {
      await signUp(id, password);
      // ホームへは、ログインの状態が「in」になってから上の useEffect で送る（そこから /profile の ③ へ進む）。
      // ここで送ると、まだ「out」のままのホームが ログイン画面へ もどしてしまう
    } catch (e) {
      setBusy(false);
      if (e instanceof UsernameTakenError) {
        // ID が使われているかは、作るときにしか分からない。① に戻して、パスワードは そのままにする
        setTaken(normalizeUsername(id));
        setStep("id");
        return;
      }
      setError(messageOf(e));
    }
  }

  function submitId(event: React.FormEvent) {
    event.preventDefault();
    try {
      validateUsername(username);
    } catch (e) {
      setError(messageOf(e));
      return;
    }
    if (taken) void createAccount(username);
    else go("password");
  }

  async function submitSignIn(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(username, password);
    } catch (e) {
      setError(messageOf(e));
      setBusy(false);
    }
  }

  const localNote = backend.mode === "local" && (
    <p className="rounded-[20px] bg-cloud px-4 py-2 text-sm font-bold text-ink-sub">
      デモモード：データは この たんまつの なかだけに ほぞんされるよ。パスワードは ほぞんも かくにんも しないよ。
    </p>
  );

  const main = "animate-rise flex min-h-dvh flex-col gap-4 p-6 pb-[30px]";

  if (step === "welcome") {
    return (
      <main className={`${main} relative isolate overflow-hidden`}>
        <WelcomeDecor />
        <div className="mt-auto">
          <Logo />
        </div>
        <div className="mt-auto flex flex-col items-center gap-3">
          <Navigator mood="happy" size={170} react />
          <div className="relative self-stretch rounded-[24px] bg-navi-light px-[18px] py-3.5 text-center">
            <span aria-hidden className="absolute left-[calc(50%-8px)] -top-2 size-4 rotate-45 bg-navi-light" />
            <h1 className="relative font-pop text-[30px] font-normal leading-[1.4]">はじめまして！</h1>
            <p className="relative text-lg font-black leading-[1.6]">
              かこって はてな!? へ ようこそ！
              <br />
              ぼくは ナビ。いっしょに あそぼう
            </p>
          </div>
          <p className="text-center text-base font-black leading-[1.6] text-ink-sub">
            まちで みつけた ものを かこむと、
            <br />
            はてなが でてくるよ
          </p>
        </div>
        <div className="mt-auto flex flex-col gap-4">
          <Button onClick={() => go("id")}>はじめる！</Button>
          {/* 見本どおり1行に入るよう、左右の余白を Button より せまくする */}
          <button
            type="button"
            onClick={() => go("signin")}
            className="mb-1.5 flex h-[60px] shrink-0 items-center justify-center rounded-[22px] border-3 border-ink bg-white px-2 text-lg font-black whitespace-nowrap text-ink shadow-pop-sm active:translate-y-1 active:shadow-none"
          >
            つづきから（ID を もっている ひと）
          </button>
        </div>
      </main>
    );
  }

  if (step === "signin") {
    return (
      <form onSubmit={submitSignIn} className={main}>
        <div className="flex h-[52px] shrink-0 items-center">
          <BackButton onBack={() => go("welcome")} />
        </div>
        <div className="relative flex items-center justify-center gap-3 overflow-hidden rounded-[32px] bg-navi-light px-5 py-[18px]">
          <Navigator mood="think" size={108} react />
          <div className="flex flex-col gap-1">
            <h1 className="font-pop text-[30px] font-normal">おかえり！</h1>
            <span className="text-[17px] font-black leading-normal">
              まえに きめた ID で
              <br />
              ログインしてね
            </span>
          </div>
        </div>

        <div className="mt-2 flex flex-col gap-2">
          <label htmlFor="uname" className={SIGNUP_LABEL}>
            ログイン ID
          </label>
          <input
            id="uname"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            placeholder="まえに きめた ID"
            className={SIGNUP_INPUT}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="pw" className={SIGNUP_LABEL}>
            パスワード
          </label>
          <div className="flex gap-2">
            <input
              id="pw"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className={SIGNUP_INPUT}
            />
            <ShowToggle shown={showPassword} onToggle={() => setShowPassword((v) => !v)} />
          </div>
        </div>
        <MemoNotice>わすれちゃったら、おうちの ひとと かいた メモを みてね</MemoNotice>
        {error && <SignupError>{error}</SignupError>}
        {localNote}

        <div className="mt-auto">
          <Button type="submit" disabled={busy || username.trim().length === 0 || password.length === 0}>
            {busy ? "ちょっと まってね…" : "ログイン"}
          </Button>
        </div>
      </form>
    );
  }

  if (step === "id") {
    const isTaken = taken !== null;
    const same = isTaken && normalizeUsername(username) === taken;
    return (
      <form onSubmit={submitId} className={main}>
        <StepHeader step={1} onBack={() => go("welcome")} />
        <Ask key={isTaken ? `taken-${taken}` : "id"} mood={isTaken ? "sorry" : "think"}>
          {isTaken ? (
            <>
              その ID は
              <br />
              つかわれてるよ
            </>
          ) : (
            <>
              ログイン ID を
              <br />
              きめてね
            </>
          )}
        </Ask>

        <div className="mt-2 flex flex-col gap-2">
          <label htmlFor="uname" className={SIGNUP_LABEL}>
            ログイン ID
          </label>
          <input
            id="uname"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError(null);
            }}
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            placeholder="れい：sora2026"
            className={SIGNUP_INPUT}
          />
        </div>
        {error && <SignupError>{error}</SignupError>}
        {isTaken ? (
          <>
            {!error && <SignupError>ほかの ひとが つかっているよ。ちがう ID に してね。すうじを たすと かぶりにくいよ（れい：sora2026）</SignupError>}
            <Notes tone="mint" items={["パスワードは さっき きめたまま だよ"]} />
          </>
        ) : (
          <>
            <Notes items={["ログインに つかう、きみだけの なまえ", "えいご・すうじ・ひらがな・カタカナが つかえるよ（ひらがなは 10もじまで）"]} />
            <span className="self-start rounded-[14px] bg-yellow-light px-3 py-1.5 text-[15px] font-black leading-normal text-yellow-dark">
              ニックネーム（よばれる なまえ）は あとで きめるよ
            </span>
          </>
        )}

        <div className="mt-auto">
          <Button type="submit" disabled={busy || username.trim().length === 0 || same}>
            {busy ? "つくっているよ…" : isTaken ? "この ID で つくる！" : "つぎへ"}
          </Button>
        </div>
      </form>
    );
  }

  // ② パスワード。わすれると戻れないので、2回入れて その場で たしかめる
  const lengthOk = password.length >= PASSWORD_MIN;
  const same = confirm.length > 0 && password === confirm;
  const differ = confirm.length > 0 && !same;
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void createAccount(username);
      }}
      className={main}
    >
      <StepHeader step={2} onBack={() => go("id")} />
      <Ask key="password" mood="effort">
        パスワードを
        <br />
        きめてね
      </Ask>

      <div className="mt-2 flex flex-col gap-2">
        <label htmlFor="pw" className={SIGNUP_LABEL}>
          パスワード
        </label>
        <div className="flex gap-2">
          <input
            id="pw"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
            className={SIGNUP_INPUT}
          />
          <ShowToggle shown={showPassword} onToggle={() => setShowPassword((v) => !v)} />
        </div>
        <Check state={lengthOk ? "ok" : "wait"}>{lengthOk ? "✓ 6もじ いじょう、OK！" : "6もじ いじょうに してね"}</Check>
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="pw2" className={SIGNUP_LABEL}>
          もういちど
        </label>
        <input
          id="pw2"
          type={showPassword ? "text" : "password"}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          required
          className={SIGNUP_INPUT}
        />
        <Check state={same ? "ok" : differ ? "ng" : "wait"}>
          {same ? "✓ おなじだよ！" : differ ? "1かいめと ちがうよ。もういちど いれてね" : "おなじ パスワードを もういちど いれてね"}
        </Check>
      </div>
      <MemoNotice>ID と パスワードを わすれると、ずかんに もどれないよ。おうちの ひとと メモしてね</MemoNotice>
      {error && <SignupError>{error}</SignupError>}
      {localNote}

      <div className="mt-auto">
        <Button type="submit" disabled={busy || !lengthOk || !same}>
          {busy ? "つくっているよ…" : "ID を つくる！"}
        </Button>
      </div>
    </form>
  );
}
