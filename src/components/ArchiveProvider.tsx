"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { newId } from "@/lib/id";
import { UserFacingError } from "@/lib/errors";
import type { Guess, Rating } from "@/lib/rating";
import type { ArchiveRecord, Profile, PublicPost } from "@/lib/types";
import type { Question } from "@/server/llm/schema";
import { useApp } from "./AuthProvider";

type ArchiveContext = {
  status: "loading" | "ready";
  archives: ArchiveRecord[];
  /** 図鑑に保存する。publish が true のときは、匿名で公開もする */
  add: (input: { question: Question; guess: Guess; rating: Rating; image: string; publish: boolean }) => Promise<ArchiveRecord>;
  remove: (id: string) => Promise<void>;
  removeAll: () => Promise<void>;
  /** 公開をやめる（図鑑には残す） */
  unpublish: (id: string) => Promise<void>;
};

const Context = createContext<ArchiveContext | null>(null);

export function useArchive(): ArchiveContext {
  const value = useContext(Context);
  if (!value) throw new Error("ArchiveProvider の中で使ってください");
  return value;
}

/** プロフィールごとの図鑑。プロフィールが変わったら読み込み直す */
export function ArchiveProvider({ children }: { children: React.ReactNode }) {
  const { profile } = useApp();
  return <ArchiveState key={profile?.id ?? "none"}>{children}</ArchiveState>;
}

function publicPost(uid: string, profile: Profile, record: ArchiveRecord): PublicPost {
  return {
    id: record.id,
    ownerUid: uid,
    createdAt: record.createdAt,
    image: record.image,
    text: record.question.text,
    subject: record.question.subject,
    topic: record.question.topic,
    title: profile.title,
  };
}

function ArchiveState({ children }: { children: React.ReactNode }) {
  const { backend, user, profile } = useApp();
  const [status, setStatus] = useState<"loading" | "ready">(profile && user ? "loading" : "ready");
  const [archives, setArchives] = useState<ArchiveRecord[]>([]);

  useEffect(() => {
    if (!user || !profile) return;
    let cancelled = false;
    backend
      .listArchives(user.uid, profile.id)
      .then((list) => !cancelled && setArchives(list))
      .catch(() => !cancelled && setArchives([]))
      .finally(() => !cancelled && setStatus("ready"));
    return () => {
      cancelled = true;
    };
  }, [backend, user, profile]);

  const add = useCallback<ArchiveContext["add"]>(
    async ({ question, guess, rating, image, publish }) => {
      if (!user || !profile) throw new UserFacingError("ログインしなおしてね");
      const id = newId();
      const record: ArchiveRecord = {
        id,
        createdAt: Date.now(),
        grade: profile.grade,
        question,
        guess,
        rating,
        image,
        publicId: publish ? id : null,
      };
      await backend.saveArchive(user.uid, profile.id, record);
      setArchives((prev) => [record, ...prev]);
      if (publish) {
        try {
          await backend.savePublic(publicPost(user.uid, profile, record));
        } catch {
          throw new UserFacingError("ずかんには のこせたけど、みんなには みせられなかったよ");
        }
      }
      return record;
    },
    [backend, user, profile],
  );

  const remove = useCallback(
    async (id: string) => {
      if (!user || !profile) return;
      const target = archives.find((a) => a.id === id);
      if (target?.publicId) await backend.deletePublic(target.publicId);
      await backend.deleteArchive(user.uid, profile.id, id);
      setArchives((prev) => prev.filter((a) => a.id !== id));
    },
    [backend, user, profile, archives],
  );

  const removeAll = useCallback(async () => {
    if (!user || !profile) return;
    for (const a of archives) if (a.publicId) await backend.deletePublic(a.publicId);
    await backend.deleteAllArchives(user.uid, profile.id);
    setArchives([]);
  }, [backend, user, profile, archives]);

  const unpublish = useCallback(
    async (id: string) => {
      if (!user || !profile) return;
      const target = archives.find((a) => a.id === id);
      if (!target?.publicId) return;
      await backend.deletePublic(target.publicId);
      const next = { ...target, publicId: null };
      await backend.saveArchive(user.uid, profile.id, next);
      setArchives((prev) => prev.map((a) => (a.id === id ? next : a)));
    },
    [backend, user, profile, archives],
  );

  const value = useMemo<ArchiveContext>(
    () => ({ status, archives, add, remove, removeAll, unpublish }),
    [status, archives, add, remove, removeAll, unpublish],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
