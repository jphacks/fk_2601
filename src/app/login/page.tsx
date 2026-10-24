"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApp } from "@/components/AuthProvider";
import { Navigator } from "@/components/Navigator";
import { Button, Card } from "@/components/ui";
import { APP_NAME } from "@/lib/constants";
import { messageOf } from "@/lib/errors";

export default function LoginPage() {
  const { status, backend, signIn, signUp } = useApp();
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
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
    <main className="flex min-h-dvh flex-col gap-5 px-4 py-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <Navigator mood="happy" size={112} />
        <h1 className="text-2xl font-bold">{APP_NAME}</h1>
        <p className="text-base">まわりの ふうけいから、もんだいを さがそう！</p>
      </div>

      <Card className="space-y-4">
        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-paper p-1" role="tablist">
          {(
            [
              ["signin", "ログイン"],
              ["signup", "はじめての人"],
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
              className={`min-h-11 rounded-xl text-base font-bold ${mode === value ? "bg-white text-brand shadow-sm" : "text-ink/60"}`}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-base font-bold">なまえ</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              required
              className="min-h-12 w-full rounded-xl border-2 border-ink/15 bg-white px-3 text-lg outline-none focus:border-brand"
            />
            {mode === "signup" && (
              <span className="mt-1 block text-sm text-ink/70">ひらがな・カタカナ・えいごと数字が つかえるよ（ひらがな10もじまで）</span>
            )}
          </label>

          <label className="block">
            <span className="mb-1 block text-base font-bold">パスワード</span>
            <div className="flex gap-2">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                required
                className="min-h-12 w-full rounded-xl border-2 border-ink/15 bg-white px-3 text-lg outline-none focus:border-brand"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="min-h-12 shrink-0 rounded-xl border-2 border-ink/15 bg-white px-3 text-sm font-bold"
              >
                {showPassword ? "かくす" : "見る"}
              </button>
            </div>
            {mode === "signup" && (
              <span className="mt-1 block text-sm text-ink/70">
                6もじ以上。わすれると 入れなくなるので、おぼえておいてね
              </span>
            )}
          </label>

          {error && (
            <p role="alert" className="rounded-xl bg-berry/10 px-3 py-2 text-base font-bold text-berry">
              {error}
            </p>
          )}

          <Button type="submit" disabled={busy}>
            {busy ? "ちょっと まってね…" : mode === "signup" ? "とうろくする" : "ログインする"}
          </Button>
        </form>
      </Card>

      {backend.mode === "local" && (
        <p className="rounded-xl bg-sun/20 px-3 py-2 text-sm">
          デモモード：データは この たんまつ の中だけに ほぞんされます。パスワードは ほぞんも かくにんも しません。
        </p>
      )}
    </main>
  );
}
