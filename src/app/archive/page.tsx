"use client";

import Link from "next/link";
import { useState } from "react";
import { useArchive } from "@/components/ArchiveProvider";
import { useApp } from "@/components/AuthProvider";
import { Gate } from "@/components/Gate";
import { Medal } from "@/components/Icons";
import { Loading } from "@/components/Loading";
import { Page } from "@/components/Page";
import { SUBJECT_STYLE } from "@/components/QuestionCard";
import { StampCards } from "@/components/StampCards";
import { Button, LinkButton, Say } from "@/components/ui";
import { stampCounts } from "@/lib/collection";
import { SUBJECT_KANA, TITLE_LABEL } from "@/lib/constants";
import { messageOf } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import { stripRuby } from "@/lib/ruby";
import type { Rating } from "@/lib/rating";
import type { ArchiveRecord } from "@/lib/types";

// 評価の小さな札（赤は「ピタリ」だけ。おしい＝オレンジ、大はずれ＝青）
const BADGE: Record<Rating, { text: string; style: string }> = {
  pita: { text: "ピタリ", style: "border-red text-red-dark" },
  oshii: { text: "おしい", style: "border-orange text-orange-dark" },
  ohazure: { text: "大はずれ", style: "border-navi text-navi-dark" },
};

function Row({ a, selecting, selected, onToggle }: { a: ArchiveRecord; selecting: boolean; selected: boolean; onToggle: () => void }) {
  const s = SUBJECT_STYLE[a.question.subject];
  const badge = a.question.type === "why" ? { text: a.rating === "pita" ? "せいかい" : "ざんねん", style: a.rating === "pita" ? BADGE.pita.style : BADGE.ohazure.style } : BADGE[a.rating];
  const body = (
    <>
      {selecting && (
        <span
          aria-hidden
          className={`flex size-7 shrink-0 items-center justify-center rounded-full border-3 border-ink ${selected ? "bg-pink" : "bg-white"}`}
        >
          {selected && (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22223A" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12l5 5 9-10" />
            </svg>
          )}
        </span>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element -- 保存した切り抜き（data URL） */}
      <img src={a.image} alt={a.question.target} className="size-[54px] shrink-0 rounded-2xl border-[2.5px] border-ink bg-photo object-cover" />
      <span className="flex min-w-0 grow flex-col gap-0.5">
        <span className="line-clamp-2 text-[15px] font-black leading-snug">{stripRuby(a.question.text)}</span>
        <span className={`text-[13px] font-black ${s.dark}`}>
          {SUBJECT_KANA[a.question.subject]} ・ {formatDate(a.createdAt)}
        </span>
      </span>
      <span className={`shrink-0 rotate-[8deg] rounded-[10px] border-2 bg-white px-2 py-0.5 text-xs font-black ${badge.style}`}>{badge.text}</span>
    </>
  );
  const box = `flex items-center gap-3 rounded-[22px] border-3 bg-white px-3 py-2 text-ink shadow-pop-sm ${selected ? "border-pink" : "border-ink"}`;
  return selecting ? (
    <button type="button" onClick={onToggle} aria-pressed={selected} className={`${box} w-full text-left`}>
      {body}
    </button>
  ) : (
    <Link href={`/archive/${a.id}`} className={`${box} active:translate-y-1 active:shadow-none`}>
      {body}
    </Link>
  );
}

function ArchiveContent() {
  const { profile, saveProfile } = useApp();
  const { status, archives, remove } = useArchive();
  const [selecting, setSelecting] = useState(false);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!profile) return null;
  if (status === "loading") {
    return (
      <Page tab="zukan">
        <Loading message="ずかんを ひらいているよ" />
      </Page>
    );
  }

  const counts = stampCounts(archives);

  function toggle(id: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function deletePicked() {
    setError(null);
    try {
      for (const id of picked) await remove(id);
      setPicked(new Set());
      setConfirming(false);
      setSelecting(false);
    } catch (e) {
      setError(messageOf(e));
    }
  }

  return (
    <Page tab="zukan">
      <div className="flex h-[50px] items-center gap-2">
        <h1 className="font-pop text-2xl font-normal">はてなずかん</h1>
        <span className="rounded-xl border-[2.5px] border-ink bg-yellow px-2.5 py-0.5 font-pop text-sm">{archives.length}こ</span>
        {archives.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setSelecting((v) => !v);
              setPicked(new Set());
              setConfirming(false);
            }}
            className="ml-auto h-11 rounded-2xl border-[2.5px] border-ink bg-white px-3 text-sm font-black shadow-pop-xs active:translate-y-[3px] active:shadow-none"
          >
            {selecting ? "やめる" : "えらんで けす"}
          </button>
        )}
      </div>

      <div className="flex items-center gap-3 rounded-[22px] border-3 border-ink bg-purple px-4 py-2.5 text-white shadow-pop-sm">
        <Medal size={34} />
        <span className="text-sm font-black">いまの しょうごう</span>
        <span className="ml-auto font-pop text-lg">{profile.title ? TITLE_LABEL[profile.title] : "まだ ないよ"}</span>
      </div>

      <StampCards
        counts={counts}
        equipped={profile.title}
        onEquip={(title) => void saveProfile({ nickname: profile.nickname, grade: profile.grade, title })}
      />

      {archives.length === 0 ? (
        <>
          <Say mood="happy">まだ なにも ないよ。しゃしんを とって、さいしょの はてなを つかまえよう！</Say>
          <LinkButton href="/capture">はてなを さがす！</LinkButton>
        </>
      ) : (
        <ul className="flex flex-col gap-3">
          {archives.map((a) => (
            <li key={a.id}>
              <Row a={a} selecting={selecting} selected={picked.has(a.id)} onToggle={() => toggle(a.id)} />
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p role="alert" className="rounded-[20px] bg-pink-light px-4 py-3 text-base font-black text-pink-dark">
          {error}
        </p>
      )}

      {selecting && (
        <div className="sticky bottom-[96px] flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => setPicked(picked.size === archives.length ? new Set() : new Set(archives.map((a) => a.id)))}
            className="self-center rounded-xl border-[2.5px] border-ink bg-white px-4 py-1 text-sm font-black shadow-pop-xs"
          >
            {picked.size === archives.length ? "ぜんぶ はずす" : "ぜんぶ えらぶ"}
          </button>
          {confirming ? (
            <>
              <p className="rounded-[20px] bg-white py-2 text-center text-base font-black">{picked.size}こ けすよ。もとには もどせないよ。いいかな？</p>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="sub" onClick={() => setConfirming(false)}>
                  やめる
                </Button>
                <Button variant="danger" onClick={() => void deletePicked()}>
                  けす
                </Button>
              </div>
            </>
          ) : (
            <Button variant="danger" disabled={picked.size === 0} onClick={() => setConfirming(true)}>
              えらんだ {picked.size}こを けす
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
