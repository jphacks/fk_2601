"use client";

import Link from "next/link";
import { useState } from "react";
import { useArchive } from "@/components/ArchiveProvider";
import { useApp } from "@/components/AuthProvider";
import { Gate } from "@/components/Gate";
import { Loading } from "@/components/Loading";
import { Page } from "@/components/Page";
import { StampCards } from "@/components/StampCards";
import { Button, LinkButton, Say } from "@/components/ui";
import { groupArchives, stampCounts } from "@/lib/collection";
import { SUBJECT_LABEL } from "@/lib/constants";
import { formatDate } from "@/lib/format";
import { messageOf } from "@/lib/errors";
import { ratingText } from "@/components/ResultSummary";

const RATING_COLOR = { pita: "bg-mint", oshii: "bg-sun", ohazure: "bg-berry" } as const;

function ArchiveContent() {
  const { profile, saveProfile } = useApp();
  const { status, archives, removeAll } = useArchive();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!profile) return null;
  if (status === "loading") {
    return (
      <Page title="ずかん" back="/">
        <Loading message="ずかんを ひらいているよ…" />
      </Page>
    );
  }

  const counts = stampCounts(archives);
  const groups = groupArchives(archives);

  return (
    <Page title="ずかん" back="/">
      <StampCards
        counts={counts}
        equipped={profile.title}
        onEquip={(title) => void saveProfile({ nickname: profile.nickname, grade: profile.grade, title })}
      />

      {archives.length === 0 ? (
        <>
          <Say mood="happy">まだ なにも ないよ。しゃしんを とって、さいしょの もんだいを 見つけよう！</Say>
          <LinkButton href="/capture">しゃしんを とる</LinkButton>
        </>
      ) : (
        groups.map(({ subject, topics }) => (
          <section key={subject} className="space-y-3">
            <h2 className="text-xl font-bold">{SUBJECT_LABEL[subject]}</h2>
            {topics.map(({ topic, items }) => (
              <div key={topic} className="space-y-2">
                <h3 className="text-base font-bold text-ink/70">{topic}</h3>
                <ul className="grid grid-cols-2 gap-3">
                  {items.map((a) => (
                    <li key={a.id}>
                      <Link href={`/archive/${a.id}`} className="block overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-ink/5">
                        {/* eslint-disable-next-line @next/next/no-img-element -- 保存した切り抜き（data URL） */}
                        <img src={a.image} alt={a.question.target} className="aspect-square w-full bg-paper object-cover" />
                        <div className="flex items-center justify-between gap-1 px-3 py-2">
                          <span className="truncate text-sm">{a.question.target}</span>
                          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold text-white ${RATING_COLOR[a.rating]}`}>
                            {ratingText(a.rating, a.question.type)}
                          </span>
                        </div>
                        <p className="px-3 pb-2 text-xs text-ink/60">{formatDate(a.createdAt)}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </section>
        ))
      )}

      {archives.length > 0 && (
        <div className="mt-6 space-y-3">
          {error && (
            <p role="alert" className="rounded-xl bg-berry/10 px-3 py-2 text-base font-bold text-berry">
              {error}
            </p>
          )}
          {confirming ? (
            <>
              <p className="text-center text-base font-bold">ぜんぶ けすと、もとに もどせないよ。ほんとうに いいかな？</p>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="secondary" onClick={() => setConfirming(false)}>
                  やめる
                </Button>
                <Button
                  variant="danger"
                  onClick={async () => {
                    try {
                      await removeAll();
                      setConfirming(false);
                    } catch (e) {
                      setError(messageOf(e));
                    }
                  }}
                >
                  ぜんぶ けす
                </Button>
              </div>
            </>
          ) : (
            <Button variant="ghost" onClick={() => setConfirming(true)}>
              ずかんを ぜんぶ けす
            </Button>
          )}
        </div>
      )}
    </Page>
  );
}

export default function ArchivePage() {
  return (
    <Gate>
      <ArchiveContent />
    </Gate>
  );
}
