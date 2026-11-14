"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { newId } from "@/lib/id";
import { makeThumb } from "@/lib/image";
import { UserFacingError } from "@/lib/errors";
import type { Guess, Rating } from "@/lib/rating";
import { GROUPS, type GroupId } from "@/lib/constants";
import type { ArchiveRecord, Feeling, GroupPost, Profile } from "@/lib/types";
import type { Question } from "@/server/llm/schema";
import { legacyTitle } from "@/lib/titles";
import { useApp } from "./AuthProvider";

type ArchiveContext = {
  /** error は、読み込みに失敗したとき（ずかんが空に見えないよう、「ない」とは分ける） */
  status: "loading" | "ready" | "error";
  archives: ArchiveRecord[];
  /** 読み込みをやり直す。成功したら、ずかんの中身を返す（失敗したら null） */
  reload: () => Promise<ArchiveRecord[] | null>;
  /**
   * 図鑑に保存する。groups に入れたグループにも見せる（名前は出さない）。
   * 図鑑に保存できなかったときだけ例外にする（見せるのに失敗したときは shareFailed。もう一度押して、二重に保存しないように）
   */
  add: (input: { question: Question; guess: Guess; rating: Rating; image: string; groups: GroupId[]; feeling?: Feeling }) => Promise<{ record: ArchiveRecord; shareFailed: boolean }>;
  remove: (id: string) => Promise<void>;
  removeAll: () => Promise<void>;
  /** グループに見せるのをやめる（図鑑には残す） */
  unshare: (id: string) => Promise<void>;
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

function groupPost(profile: Profile, record: ArchiveRecord, image: string): GroupPost {
  return {
    id: record.id,
    createdAt: record.createdAt,
    image,
    text: record.question.text,
    subject: record.question.subject,
    topic: record.question.topic,
    title: profile.title,
  };
}

function ArchiveState({ children }: { children: React.ReactNode }) {
  const { backend, user, profile } = useApp();
  const [status, setStatus] = useState<"loading" | "ready" | "error">(profile && user ? "loading" : "ready");
  const [archives, setArchives] = useState<ArchiveRecord[]>([]);

  // グループの投稿がもうない（管理者が消した・見せるのに失敗した）のに、見せている印が残っているものは、印を外す。
  // 失敗しても ずかんは そのまま見せる（次に読み込んだときに また確かめる）
  const clearGoneShares = useCallback(
    async (list: ArchiveRecord[]) => {
      if (!user || !profile) return;
      try {
        const gone = new Map<GroupId, Set<string>>();
        for (const g of GROUPS) {
          const ids = list.filter((a) => a.sharedGroups?.includes(g.id)).map((a) => a.id);
          if (ids.length > 0) gone.set(g.id, new Set(await backend.missingGroupPosts(g.id, ids)));
        }
        const fixed = list.flatMap((a) => {
          const left = a.sharedGroups?.filter((g) => !gone.get(g)?.has(a.id));
          return a.sharedGroups && left && left.length < a.sharedGroups.length ? [{ ...a, sharedGroups: left }] : [];
        });
        if (fixed.length === 0) return;
        await Promise.all(fixed.map((r) => backend.saveArchive(user.uid, profile.id, r)));
        const byId = new Map(fixed.map((r) => [r.id, r]));
        setArchives((prev) => prev.map((a) => byId.get(a.id) ?? a));
      } catch {
        // 何もしない
      }
    },
    [backend, user, profile],
  );

  const reload = useCallback(async (): Promise<ArchiveRecord[] | null> => {
    if (!user || !profile) return [];
    setStatus("loading");
    try {
      const list = await backend.listArchives(user.uid, profile.id);
      setArchives(list);
      setStatus("ready");
      void clearGoneShares(list);
      return list;
    } catch {
      setStatus("error");
      return null;
    }
  }, [backend, user, profile, clearGoneShares]);

  useEffect(() => {
    if (!user || !profile) return;
    let cancelled = false;
    backend
      .listArchives(user.uid, profile.id)
      .then((list) => {
        if (cancelled) return;
        setArchives(list);
        setStatus("ready");
        void clearGoneShares(list);
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
    };
  }, [backend, user, profile, clearGoneShares]);

  const add = useCallback<ArchiveContext["add"]>(
    async ({ question, guess, rating, image, groups, feeling }) => {
      if (!user || !profile) throw new UserFacingError("ログインしなおしてね");
      // ずかんの記録には小さな画像だけを入れ、大きな切り抜きは別の文書に分ける（#88）。
      // 小さな画像が作れないときは、前のように大きな切り抜きを記録に入れる（保存は止めない）
      const thumb = await makeThumb(image).catch(() => null);
      const record: ArchiveRecord = {
        id: newId(),
        createdAt: Date.now(),
        grade: profile.grade,
        question,
        guess,
        rating,
        ...(feeling ? { feeling } : {}),
        ...(thumb ? { thumb } : { image }),
        sharedGroups: [],
      };
      await backend.saveArchive(user.uid, profile.id, record);
      if (thumb) {
        try {
          await backend.saveArchiveImage(user.uid, profile.id, record.id, image);
        } catch {
          // 大きな切り抜きは、いまは画面で使わない（ずかんには小さな画像が出る）ので、保存できなくても続ける
        }
      }
      setArchives((prev) => [record, ...prev]);
      if (groups.length === 0) return { record, shareFailed: false };

      // 見せられたグループだけを印にのこす（1つ失敗しても、ほかのグループには見せる）
      const post = groupPost(profile, record, image);
      const results = await Promise.allSettled(
        groups.map((g) =>
          backend.saveGroupPost(user.uid, g, post).catch((error: unknown) => {
            // 新しい称号（「math-gold」など）を、まだ読めないルールに断られたときだけ、前の形（分類の名前か null）で出しなおす
            const legacy = legacyTitle(post.title);
            if ((error as { code?: string }).code !== "permission-denied" || legacy === post.title) throw error;
            return backend.saveGroupPost(user.uid, g, { ...post, title: legacy });
          }),
        ),
      );
      const shared = groups.filter((_, i) => results[i].status === "fulfilled");
      const next = { ...record, sharedGroups: shared };
      if (shared.length > 0) {
        try {
          await backend.saveArchive(user.uid, profile.id, next);
        } catch {
          // 印を残せなくても、投稿は見えている（次に ずかんを読み込んだときには、印がないまま）
        }
        setArchives((prev) => prev.map((a) => (a.id === record.id ? next : a)));
      }
      return { record: next, shareFailed: shared.length < groups.length };
    },
    [backend, user, profile],
  );

  const remove = useCallback(
    async (id: string) => {
      if (!user || !profile) return;
      const target = archives.find((a) => a.id === id);
      for (const g of target?.sharedGroups ?? []) await backend.deleteGroupPost(g, id);
      await backend.deleteArchive(user.uid, profile.id, id);
      setArchives((prev) => prev.filter((a) => a.id !== id));
    },
    [backend, user, profile, archives],
  );

  const removeAll = useCallback(async () => {
    if (!user || !profile) return;
    for (const a of archives) for (const g of a.sharedGroups ?? []) await backend.deleteGroupPost(g, a.id);
    await backend.deleteAllArchives(user.uid, profile.id);
    setArchives([]);
  }, [backend, user, profile, archives]);

  const unshare = useCallback(
    async (id: string) => {
      if (!user || !profile) return;
      const target = archives.find((a) => a.id === id);
      if (!target?.sharedGroups?.length) return;
      for (const g of target.sharedGroups) await backend.deleteGroupPost(g, id);
      const next = { ...target, sharedGroups: [] };
      await backend.saveArchive(user.uid, profile.id, next);
      setArchives((prev) => prev.map((a) => (a.id === id ? next : a)));
    },
    [backend, user, profile, archives],
  );

  const value = useMemo<ArchiveContext>(
    () => ({ status, archives, reload, add, remove, removeAll, unshare }),
    [status, archives, reload, add, remove, removeAll, unshare],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
