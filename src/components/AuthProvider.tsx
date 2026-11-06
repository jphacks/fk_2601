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
  /** プロフィールの読み込みに失敗したか（はじめての登録の画面へ進ませないため） */
  profileFailed: boolean;
  /** プロフィールの読み込みをやり直す */
  retryProfiles: () => Promise<void>;
  user: AuthUser | null;
  profile: Profile | null;
  signUp: (username: string, password: string) => Promise<void>;
  signIn: (username: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** プロフィールがなければ作り、あれば更新する */
  saveProfile: (input: ProfileInput) => Promise<Profile>;
  /** あそびかたの説明を見おわった（とばした）ことを残す。残せなくても説明は閉じる（次に また出るだけ） */
  markGuideSeen: () => Promise<void>;
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
  const [profileFailed, setProfileFailed] = useState(false);

  useEffect(() => {
    return backend.subscribeAuth(async (next) => {
      if (!next) {
        setUser(null);
        setProfiles([]);
        setProfileFailed(false);
        setStatus("out");
        return;
      }
      let loaded: Profile[] = [];
      let failed = false;
      try {
        loaded = await backend.listProfiles(next.uid);
      } catch {
        failed = true;
      }
      setUser(next);
      setProfiles(loaded);
      setProfileFailed(failed);
      setStatus("in");
    });
  }, [backend]);

  const retryProfiles = useCallback(async () => {
    if (!user) return;
    try {
      setProfiles(await backend.listProfiles(user.uid));
      setProfileFailed(false);
    } catch {
      setProfileFailed(true);
    }
  }, [backend, user]);

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
        // はじめての登録なので、あそびかたの説明を まだ見ていない
        guideSeenAt: null,
        createdAt: Date.now(),
      };
      const next: Profile = { ...base, ...input };
      await backend.saveProfile(user.uid, next);
      setProfiles((prev) => (prev.some((p) => p.id === next.id) ? prev.map((p) => (p.id === next.id ? next : p)) : [...prev, next]));
      return next;
    },
    [backend, user, profile],
  );

  const markGuideSeen = useCallback(async () => {
    if (!profile) return;
    try {
      await saveProfile({ nickname: profile.nickname, grade: profile.grade, guideSeenAt: Date.now() });
    } catch {
      // 残せなかったときは、次に ホームを開いたときに もういちど出る（説明を閉じられないより よい）
    }
  }, [profile, saveProfile]);

  const value = useMemo<AppContext>(
    () => ({ backend, status, profileFailed, retryProfiles, user, profile, signUp, signIn, signOut, saveProfile, markGuideSeen }),
    [backend, status, profileFailed, retryProfiles, user, profile, signUp, signIn, signOut, saveProfile, markGuideSeen],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
}
