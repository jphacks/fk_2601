"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/components/AuthProvider";
import { Gate } from "@/components/Gate";
import { Icon } from "@/components/Icons";
import { Loading } from "@/components/Loading";
import { Page } from "@/components/Page";
import { SUBJECT_STYLE } from "@/components/QuestionCard";
import { kanaOf } from "@/lib/ruby";
import { ErrorNotice, Say } from "@/components/ui";
import { TITLE_LABEL } from "@/lib/constants";
import type { PublicPost } from "@/lib/types";

function OthersContent() {
  const { backend, user } = useApp();
  const [posts, setPosts] = useState<PublicPost[] | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    backend
      .listPublic()
      .then((list) => !cancelled && setPosts(list))
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [backend, attempt]);

  return (
    <Page tab="minna">
      <div className="flex flex-col gap-1.5">
        <h1 className="font-pop text-[26px] font-normal">みんなの はてな</h1>
        <span className="flex items-center gap-1.5 self-start rounded-[14px] border-[2.5px] border-ink bg-pink-light px-3 py-1 text-sm font-black text-pink-dark">
          <Icon name="shield" size={18} fill="#FFFFFF" stroke="#A12A55" />
          なまえは でないよ
        </span>
      </div>

      {failed && (
        <ErrorNotice
          onRetry={() => {
            setFailed(false);
            setPosts(null);
            setAttempt((n) => n + 1);
          }}
        >
          みんなの はてなを ひらけなかったよ。
        </ErrorNotice>
      )}
      {!failed && posts === null && <Loading message="さがしているよ" />}
      {posts?.length === 0 && <Say mood="happy">まだ だれも みせていないよ。きみが さいしょに みせてみよう！</Say>}

      <ul className="grid grid-cols-2 gap-3.5">
        {posts?.map((p) => {
          const s = SUBJECT_STYLE[p.subject];
          return (
            <li key={p.id}>
              <article className={`h-full rounded-card border-3 border-ink p-1.5 shadow-pop-md ${s.solid}`}>
                <div className="flex h-full flex-col overflow-hidden rounded-[18px] border-[2.5px] border-ink bg-white">
                  <div className="flex h-24 items-center justify-center border-b-[2.5px] border-ink bg-photo">
                    {/* eslint-disable-next-line @next/next/no-img-element -- 公開された切り抜き（data URL） */}
                    <img src={p.image} alt="" className="size-full object-contain" />
                  </div>
                  <div className="flex flex-1 flex-col gap-1.5 px-2.5 pb-2.5 pt-2">
                    {/* 小さい文字なので、ひらがなで出す */}
                    <span className="line-clamp-4 block text-[15px] font-black leading-snug">{kanaOf(p.text)}</span>
                    <div className="mt-auto flex flex-wrap items-center gap-1">
                      {p.title && <span className={`rounded-[10px] px-2 py-px text-xs font-black ${s.light} ${s.dark}`}>{TITLE_LABEL[p.title]}</span>}
                      {p.ownerUid === user?.uid && <span className="text-xs font-black text-ink-muted">きみの はてな</span>}
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
