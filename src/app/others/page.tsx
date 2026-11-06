"use client";

import { useEffect, useMemo, useState } from "react";
import { useArchive } from "@/components/ArchiveProvider";
import { useApp } from "@/components/AuthProvider";
import { Gate } from "@/components/Gate";
import { Icon } from "@/components/Icons";
import { Loading } from "@/components/Loading";
import { Page } from "@/components/Page";
import { SUBJECT_STYLE } from "@/components/QuestionCard";
import { kanaOf } from "@/lib/ruby";
import { RubyText } from "@/components/RubyText";
import { ErrorNotice, Say } from "@/components/ui";
import { groupOf, titleLabel, type GroupId } from "@/lib/constants";
import type { GroupPost } from "@/lib/types";

function OthersContent() {
  const { backend, memberships, membershipsFailed, reloadMemberships } = useApp();
  const { archives } = useArchive();
  const [picked, setPicked] = useState<GroupId | null>(null);
  // えらんだグループ（まだ えらんでいない・もう入っていないときは、はじめのグループ）
  const groupId = memberships?.find((m) => m.groupId === picked)?.groupId ?? memberships?.[0]?.groupId ?? null;
  // 投稿には持ち主が入っていないので、自分のずかんで このグループに見せているものと照らして「きみの はてな」を出す
  const mine = useMemo(
    () => new Set(archives.flatMap((a) => (groupId && a.sharedGroups?.includes(groupId) ? [a.id] : []))),
    [archives, groupId],
  );
  // どのグループの投稿かも持つ（切り替えた直後に、前のグループの投稿を出さない）
  const [loaded, setLoaded] = useState<{ groupId: GroupId; posts: GroupPost[] } | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const posts = loaded && loaded.groupId === groupId ? loaded.posts : null;
  const many = (memberships?.length ?? 0) >= 3;

  useEffect(() => {
    if (!groupId) return;
    let cancelled = false;
    backend
      .listGroupPosts(groupId)
      .then((list) => !cancelled && setLoaded({ groupId, posts: list }))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [backend, groupId, attempt]);

  return (
    <Page tab="minna">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-pop text-[26px] font-normal">みんなの はてな</h1>
        <span className="flex items-center gap-1.5 self-start rounded-[14px] bg-pink-light px-3 py-1 text-sm font-black text-pink-dark">
          <Icon name="shield" size={18} fill="#FFFFFF" stroke="#A12A55" />
          なまえは でないよ
        </span>
      </div>

      {memberships && memberships.length > 1 && (
        <div role="tablist" aria-label="グループ" className={`grid gap-2 ${many ? "grid-cols-3" : "grid-cols-2"}`}>
          {memberships.map((m) => {
            const active = m.groupId === groupId;
            return (
              <button
                key={m.groupId}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => {
                  setFailed(false);
                  setPicked(m.groupId);
                }}
                className={`flex min-h-[60px] items-center justify-center rounded-[20px] border-3 border-ink px-1 font-pop ${many ? "whitespace-nowrap text-[clamp(12px,4.2vw,17px)]" : "text-[22px]"} ${active ? "bg-pink text-white shadow-pop-sm" : "bg-white text-ink"}`}
              >
                {/* 3つ以上ならぶときは 22px に おさまらないので、小さい文字にして、ひらがなで出す */}
                {many ? groupOf(m.groupId).kana : <RubyText text={groupOf(m.groupId).name} />}
              </button>
            );
          })}
        </div>
      )}
      {memberships && memberships.length === 1 && groupId && (
        <p className="self-start rounded-[16px] border-3 border-ink bg-white px-3 py-1 font-pop text-[22px]">
          <RubyText text={groupOf(groupId).name} />
        </p>
      )}

      <Say mood="think" size={76}>
        <span className="text-lg">
          みんなは なにを
          <br />
          みつけたかな？
        </span>
      </Say>

      {membershipsFailed && <ErrorNotice onRetry={() => void reloadMemberships()}>みんなの はてなを ひらけなかったよ。</ErrorNotice>}
      {!membershipsFailed && memberships === null && <Loading message="さがしているよ" />}
      {memberships?.length === 0 && (
        <p className="rounded-card bg-pink-light px-4 py-3 text-lg font-black leading-[1.7]">
          まだ どの グループにも はいっていないよ。グループに はいると、なかまの はてなが みられるよ。
        </p>
      )}

      {failed && (
        <ErrorNotice
          onRetry={() => {
            setFailed(false);
            setLoaded(null);
            setAttempt((n) => n + 1);
          }}
        >
          みんなの はてなを ひらけなかったよ。
        </ErrorNotice>
      )}
      {groupId && !failed && posts === null && <Loading message="さがしているよ" />}
      {posts?.length === 0 && (
        <p className="rounded-card bg-pink-light px-4 py-3 text-lg font-black leading-[1.7]">まだ だれも みせていないよ。きみが さいしょに みせてみよう！</p>
      )}

      <ul className="grid grid-cols-2 gap-3">
        {posts?.map((p) => {
          const s = SUBJECT_STYLE[p.subject];
          return (
            <li key={p.id}>
              <article className={`h-full rounded-card p-1.5 ${s.solid}`}>
                <div className="flex h-full flex-col overflow-hidden rounded-[18px] bg-white">
                  <div className="flex h-24 items-center justify-center bg-photo">
                    {/* eslint-disable-next-line @next/next/no-img-element -- グループに見せた切り抜き（data URL） */}
                    <img src={p.image} alt="" className="size-full object-contain" />
                  </div>
                  <div className="flex flex-1 flex-col gap-1.5 px-2.5 pb-2.5 pt-2">
                    {/* 小さい文字なので、ひらがなで出す */}
                    <span className="line-clamp-4 block text-base font-black leading-[1.4]">{kanaOf(p.text)}</span>
                    <div className="mt-auto flex flex-wrap items-center gap-1">
                      <span className={`rounded-[10px] px-2 py-px text-xs font-black ${s.light} ${s.dark}`}>{titleLabel(p.title)}</span>
                      {mine.has(p.id) && <span className="text-xs font-black text-ink-muted">きみの はてな</span>}
                    </div>
                  </div>
                </div>
              </article>
            </li>
          );
        })}
      </ul>
    </Page>
  );
}

export default function OthersPage() {
  return (
    <Gate>
      <OthersContent />
    </Gate>
  );
}
