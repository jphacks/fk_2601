"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp } from "@/components/AuthProvider";
import { FieldLabel, INPUT_STYLE } from "@/components/Fields";
import { Icon } from "@/components/Icons";
import { Navigator } from "@/components/Navigator";
import { Button } from "@/components/ui";
import { messageOf } from "@/lib/errors";

export default function LoginPage() {
  const { status, backend, signIn, signUp } = useApp();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "in") router.replace("/");
  }, [status, router]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "signup") await signUp(username, password);
      else await signIn(username, password);
      router.replace("/");
    } catch (e) {
      setError(messageOf(e));
      setBusy(false);
    }
  }

  return (
    <main className="animate-rise flex min-h-dvh flex-col gap-3.5 px-6 pb-8">
      <div className="relative -mx-6 flex items-center gap-3 rounded-b-[44px] border-b-3 border-ink bg-navi-light px-6 pb-[22px] pt-7">
        <svg aria-hidden="true" viewBox="0 0 390 190" className="absolute left-0 top-0 h-[190px] w-full">
          <path d="M350 30l5 10 11 2-8 7 2 11-10-6-10 6 2-11-8-7 11-2z" fill="#FFC83D" stroke="#22223A" strokeWidth="2.5" strokeLinejoin="round" />
          <circle cx="300" cy="150" r="7" fill="#FF6F9C" stroke="#22223A" strokeWidth="2.5" />
        </svg>
        <div className="relative">
          <Navigator mood="happy" size={120} />
        </div>
        <div className="relative flex flex-col gap-1">
          <h1 className="font-pop text-[30px] font-normal leading-tight">ようこそ！</h1>
          <span className="text-[17px] font-black leading-normal">
            はてなハンターに
            <br />
            なろう！
          </span>
        </div>
      </div>

      <div role="tablist" className="grid grid-cols-2 gap-1.5 rounded-[26px] border-3 border-ink bg-white p-[5px]">
        {(
          [
            ["signup", "はじめて"],
            ["signin", "つづきから"],
          ] as const
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            onClick={() => {
              setMode(value);
              setError(null);
            }}
            className={`h-[50px] rounded-[20px] text-lg ${mode === value ? "bg-navi font-pop text-white" : "font-black text-ink-sub"}`}
          >
            {label}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="flex flex-1 flex-col gap-3.5">
        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="uname" note="ひらがなで いいよ">
            ログインの なまえ
          </FieldLabel>
          <input
            id="uname"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoCapitalize="none"
            required
            placeholder="れい：そらまめ"
            className={INPUT_STYLE}
          />
          {mode === "signup" && <span className="text-sm font-bold text-ink-sub">ひらがな・カタカナ・えいご・すうじが つかえるよ（ひらがな10もじまで）</span>}
        </div>

        <div className="flex flex-col gap-1.5">
          <FieldLabel htmlFor="pw">パスワード</FieldLabel>
          <div className="flex gap-2">
            <input
              id="pw"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
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
          {mode === "signup" && <span className="text-sm font-bold text-ink-sub">6もじ いじょう</span>}
        </div>

        <div className="flex gap-2.5 rounded-[20px] bg-yellow-light px-4 py-3 text-base font-black leading-relaxed text-yellow-dark">
          <Icon name="lock" size={26} strokeWidth={2.2} className="mt-0.5" />
          <span>パスワードを わすれると、ずかんに もどれないよ。おうちの ひとと メモしてね</span>
        </div>

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

        <div className="mt-auto pt-2">
          <Button type="submit" disabled={busy}>
            {busy ? "ちょっと まってね…" : mode === "signup" ? "はじめる！" : "ログイン"}
          </Button>
        </div>
      </form>
    </main>
  );
}
