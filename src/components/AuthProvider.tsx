"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getBackend, type Backend } from "@/lib/backend";
import { newId } from "@/lib/id";
import type { AuthUser, Profile } from "@/lib/types";

type Status = "loading" | "out" | "in";

type ProfileInput = Partial<Omit<Profile, "id" | "createdAt">> & { nickname: string; grade: number };

type AppContext = {
  backend: Backend;
  status: Status;
  user: AuthUser | null;
  profile: Profile | null;
  signUp: (username: string, password: string) => Promise<void>;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** プロフィールがなければ作り、あれば更新する */
  saveProfile: (input: ProfileInput) => Promise<Profile>;
};

const Context = createContext<AppContext | null>(null);

export function useApp(): AppContext {
  const value = useContext(Context);
  if (!value) throw new Error("AuthProvider の中で使ってください");
  return value;
}

/** いまのプロフィールの学年（ログイン前・プロフィールがないときは null）。漢字を学年に合わせるのに使う */
export function useGrade(): number | null {
  return useContext(Context)?.profile?.grade ?? null;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const backend = useMemo(() => getBackend(), []);
  const [status, setStatus] = useState<Status>("loading");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);

  useEffect(() => {
    return backend.subscribeAuth(async (next) => {
      if (!next) {
        setUser(null);
        setProfiles([]);
        setStatus("out");
        return;
      }
      let loaded: Profile[] = [];
      try {
        loaded = await backend.listProfiles(next.uid);
      } catch {
        loaded = [];
      }
      setUser(next);
      setProfiles(loaded);
      setStatus("in");
    });
  }, [backend]);

  // 切り替え画面は MVP 以降。いまは最初のプロフィールを使う
  const profile = profiles[0] ?? null;

  const signUp = useCallback(
    async (username: string, password: string) => {
      await backend.signUp(username, password);
    },
    [backend],
  );
  const signIn = useCallback(
    async (username: string, password: string) => {
      await backend.signIn(username, password);
    },
    [backend],
  );
  const signOut = useCallback(async () => {
    await backend.signOut();
  }, [backend]);

  const saveProfile = useCallback(
    async (input: ProfileInput) => {
      if (!user) throw new Error("ログインしていません");
      const base: Profile = profile ?? {
        id: newId(),
        nickname: input.nickname,
        grade: input.grade,
        title: null,
        firstMode: "choices",
        createdAt: Date.now(),
      };
      const next: Profile = { ...base, ...input };
      await backend.saveProfile(user.uid, next);
      setProfiles((prev) => (prev.some((p) => p.id === next.id) ? prev.map((p) => (p.id === next.id ? next : p)) : [...prev, next]));
      return next;
    },
    [backend, user, profile],
  );

  const value = useMemo<AppContext>(
    () => ({ backend, status, user, profile, signUp, signIn, signOut, saveProfile }),
    [backend, status, user, profile, signUp, signIn, signOut, saveProfile],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}
