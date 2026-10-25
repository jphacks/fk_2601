"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp } from "@/components/AuthProvider";
import { FieldLabel, INPUT_STYLE } from "@/components/Fields";
import { Icon } from "@/components/Icons";
import { Loading } from "@/components/Loading";
import { Navigator, type Mood } from "@/components/Navigator";
import { Page } from "@/components/Page";
import { Button } from "@/components/ui";
import { messageOf } from "@/lib/errors";

type Mode = "signup" | "signin";

// はじめて（ID を つくる）と、つづきから（ログイン）で、見出し・色・ボタンを変えて、ちがいが一目で分かるようにする
const MODE: Record<Mode, { tab: string; title: string; lead: string; mood: Mood; hero: string; button: string; busy: string }> = {
  signup: {
    tab: "はじめて",
    title: "はじめまして！",
    lead: "ログイン ID と パスワードを きめよう",
    mood: "happy",
    hero: "bg-yellow-light",
    button: "ID を つくる！",
    busy: "つくっているよ…",
  },
  signin: {
    tab: "つづきから",
    title: "おかえり！",
    lead: "まえに きめた ログイン ID と パスワードを いれてね",
    mood: "think",
    hero: "bg-navi-light",
    button: "ログイン",
    busy: "ちょっと まってね…",
  },
};

export default function LoginPage() {
  const { status, backend, signIn, signUp } = useApp();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signup");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

  const look = MODE[mode];
  const signup = mode === "signup";

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    // パスワードを わすれると もどれないので、はじめてのときは2回入れて、打ちまちがいを ふせぐ
    if (signup && password !== confirm) {
      setError("パスワードが 1かいめと 2かいめで ちがうよ。もういちど いれてね");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (signup) await signUp(username, password);
      else await signIn(username, password);
      // ホームへは、ログインの状態が「in」になってから上の useEffect で送る。
      // ここで送ると、まだ「out」のままのホームが ログイン画面へ もどしてしまう
    } catch (e) {
      setError(messageOf(e));
      setBusy(false);
    }
  }

  return (
    <main className="animate-rise flex min-h-dvh flex-col gap-4 p-6 pb-[30px]">
      <div className={`relative flex items-center justify-center gap-3 overflow-hidden rounded-[32px] p-5 ${look.hero}`}>
        <svg aria-hidden="true" viewBox="0 0 342 160" className="absolute left-0 top-0 h-[160px] w-[342px]">
          <path d="M314 112l5 10 11 2-8 7 2 11-10-6-10 6 2-11-8-7 11-2z" fill="#FFC83D" stroke="#22223A" strokeWidth="2.5" strokeLinejoin="round" />
          <circle cx="26" cy="26" r="7" fill="#FF6F9C" stroke="#22223A" strokeWidth="2.5" />
        </svg>
        <div className="relative">
          <Navigator mood={look.mood} size={112} />
        </div>
        <div className="relative flex flex-col gap-1">
          <h1 className="font-pop text-[28px] font-normal leading-tight">{look.title}</h1>
          <span className="text-[17px] font-black leading-normal">{look.lead}</span>
        </div>
      </div>

      <div role="tablist" aria-label="はじめてか、つづきからか" className="grid grid-cols-2 gap-1.5 rounded-[26px] border-3 border-ink bg-white p-[5px]">
        {(["signup", "signin"] as const).map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            onClick={() => {
              setMode(value);
              setError(null);
              setConfirm("");
            }}
            className={`flex h-[58px] flex-col items-center justify-center rounded-[20px] leading-tight ${mode === value ? "bg-navi text-white" : "text-ink-sub"}`}
          >
            <span className={mode === value ? "font-pop text-lg" : "text-lg font-black"}>{MODE[value].tab}</span>
            <span className="text-xs font-bold">{value === "signup" ? "ID を つくる" : "ID で ログイン"}</span>
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="flex flex-1 flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="uname">ログイン ID</FieldLabel>
          <input
            id="uname"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            required
            placeholder={signup ? "れい：sora2026" : "まえに きめた ID"}
            className={INPUT_STYLE}
          />
          <span className="text-sm font-bold leading-relaxed text-ink-sub">
            {signup
              ? "ログインに つかう じぶんだけの なまえ。ニックネーム（よばれる なまえ）とは べつだよ。えいご・すうじ・ひらがな・カタカナが つかえるよ（ひらがなは 10もじまで）"
              : "はじめての ときに きめた ID だよ"}
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="pw">パスワード</FieldLabel>
          <div className="flex gap-2">
            <input
              id="pw"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={signup ? "new-password" : "current-password"}
              required
              className={INPUT_STYLE}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="h-[60px] shrink-0 rounded-[20px] border-3 border-ink bg-white px-3.5 text-base font-black shadow-pop-xs active:translate-y-[3px] active:shadow-none"
            >
              {showPassword ? "かくす" : "みる"}
            </button>
          </div>
          {signup && <span className="text-sm font-bold text-ink-sub">6もじ いじょう</span>}
        </div>

        {signup && (
          <div className="flex flex-col gap-1.5">
            <FieldLabel htmlFor="pw2">パスワード（もういちど）</FieldLabel>
            <input
              id="pw2"
              type={showPassword ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              required
              className={INPUT_STYLE}
            />
          </div>
        )}

        {signup && (
          <div className="flex gap-2.5 rounded-[20px] bg-yellow-light px-4 py-3 text-base font-black leading-relaxed text-yellow-dark">
            <Icon name="lock" size={26} strokeWidth={2.2} className="mt-0.5" />
            <span>ID と パスワードを わすれると、ずかんに もどれないよ。おうちの ひとと メモしてね</span>
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-[20px] bg-pink-light px-4 py-3 text-base font-black text-pink-dark">
            {error}
          </p>
        )}

        {backend.mode === "local" && (
          <p className="rounded-[20px] bg-cloud px-4 py-2 text-sm font-bold text-ink-sub">
            デモモード：データは この たんまつの なかだけに ほぞんされるよ。パスワードは ほぞんも かくにんも しないよ。
          </p>
        )}

        <div className="mt-auto">
          <Button type="submit" disabled={busy}>
            {busy ? look.busy : look.button}
          </Button>
        </div>
      </form>
    </main>
  );
}
