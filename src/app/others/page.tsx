"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/components/AuthProvider";
import { Gate } from "@/components/Gate";
import { Loading } from "@/components/Loading";
import { Page } from "@/components/Page";
import { RubyText } from "@/components/RubyText";
import { ErrorNotice, Say } from "@/components/ui";
import { SUBJECT_LABEL, TITLE_LABEL } from "@/lib/constants";
import { formatDate } from "@/lib/format";
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
    <Page title="みんなの もんだい" back="/">
      <p className="text-base">ほかの 人が 見せてくれた もんだいだよ。なまえは 出ないよ。</p>

      {failed && (
        <ErrorNotice
          onRetry={() => {
            setFailed(false);
            setPosts(null);
            setAttempt((n) => n + 1);
          }}
        >
          みんなの もんだいを ひらけなかったよ。
        </ErrorNotice>
      )}
      {!failed && posts === null && <Loading message="さがしているよ…" />}
      {posts?.length === 0 && <Say mood="happy">まだ だれも 見せていないよ。きみが さいしょに 見せてみよう！</Say>}

      <ul className="space-y-4">
        {posts?.map((p) => (
          <li key={p.id} className="paper-card space-y-3 p-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- 公開された切り抜き（data URL） */}
            <img src={p.image} alt="" className="mx-auto max-h-56 rounded-2xl bg-paper object-contain" />
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-brand/10 px-3 py-0.5 text-sm font-bold text-brand-dark">{SUBJECT_LABEL[p.subject]}</span>
              {p.title && (
                <span className="rounded-full bg-sun/30 px-3 py-0.5 text-sm font-bold">「{TITLE_LABEL[p.title]}」</span>
              )}
              {p.ownerUid === user?.uid && <span className="text-sm text-ink/60">きみの もんだい</span>}
              <span className="ml-auto text-sm text-ink/60">{formatDate(p.createdAt)}</span>
            </div>
            <RubyText text={p.text} className="block text-lg font-bold leading-loose" />
          </li>
        ))}
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
