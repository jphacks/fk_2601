"use client";

import Link from "next/link";
import { useState } from "react";
import { useArchive } from "@/components/ArchiveProvider";
import { useApp } from "@/components/AuthProvider";
import { Gate } from "@/components/Gate";
import { Loading } from "@/components/Loading";
import { Navigator } from "@/components/Navigator";
import { Page } from "@/components/Page";
import { SUBJECT_STYLE } from "@/components/QuestionCard";
import { Button } from "@/components/ui";
import { stampCounts } from "@/lib/collection";
import { SUBJECT_KANA, SUBJECTS } from "@/lib/constants";
import { messageOf } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import { kanaOf } from "@/lib/ruby";
import type { Rating } from "@/lib/rating";
import type { ArchiveRecord } from "@/lib/types";
import type { Subject } from "@/server/llm/schema";

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
      <img src={a.image} alt={a.question.target} className="size-[60px] shrink-0 rounded-2xl bg-photo object-cover" />
      <span className="flex min-w-0 grow flex-col gap-0.5">
        <span className="line-clamp-2 text-[15px] font-black leading-[1.45]">{kanaOf(a.question.text)}</span>
        <span className={`text-[13px] font-black ${s.dark}`}>
          {kanaOf(a.question.topic)} ・ {formatDate(a.createdAt)}
        </span>
      </span>
      <span className={`shrink-0 rotate-[8deg] rounded-[10px] border-2 bg-white px-2 py-0.5 text-xs font-black ${badge.style}`}>{badge.text}</span>
    </>
  );
  const box = `flex items-center gap-3 rounded-[22px] border-3 bg-white py-2 pl-2 pr-3 text-ink shadow-pop-sm ${selected ? "border-pink" : "border-ink"}`;
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

// 分類のタブ（えらんだ分類の色でぬる）と、えらんだ分類で うすく変える画面の地の色（見本 20）
const CATEGORY: Record<Subject, { tab: string; bg: string }> = {
  math: { tab: "bg-navi text-white", bg: "bg-math-bg" },
  science: { tab: "bg-mint text-ink", bg: "bg-sci-bg" },
  info: { tab: "bg-purple text-white", bg: "bg-info-bg" },
};

const ALL = "";

function ArchiveContent() {
  const { profile } = useApp();
  const { status, archives, remove } = useArchive();
  // えらぶまでは、いちばん新しい はてなの分類をひらく（ずかんを読みこむ前は まだ分からないので、えらんだ分類だけを持つ）
  const [chosen, setSubject] = useState<Subject | null>(null);
  const [unit, setUnit] = useState(ALL);
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

  const subject: Subject = chosen ?? archives[0]?.question.subject ?? "math";
  const counts = stampCounts(archives);
  const inSubject = archives.filter((a) => a.question.subject === subject);
  // 単元は AI が返す topic のまま（ひらがな・カタカナ）。出てきた順にならべる
  const units = [...new Set(inSubject.map((a) => kanaOf(a.question.topic)))];
  const shown = unit === ALL ? inSubject : inSubject.filter((a) => kanaOf(a.question.topic) === unit);
  const style = SUBJECT_STYLE[subject];

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

  const allPicked = shown.length > 0 && shown.every((a) => picked.has(a.id));

  return (
    <Page tab="zukan" bg={CATEGORY[subject].bg}>
      <div className="flex h-[50px] items-center gap-2">
        <h1 className="font-pop text-2xl font-normal">はてなずかん</h1>
        <span className="rounded-xl bg-yellow px-2.5 py-0.5 font-pop text-sm">{archives.length}こ</span>
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

      <div role="tablist" aria-label="ぶんるい" className="grid grid-cols-3 gap-1.5 rounded-[26px] border-3 border-ink bg-white p-[5px]">
        {SUBJECTS.map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={subject === s}
            onClick={() => {
              setSubject(s);
              setUnit(ALL);
            }}
            className={`flex h-14 flex-col items-center justify-center gap-0.5 rounded-[20px] font-pop text-[17px] leading-[1.2] ${subject === s ? CATEGORY[s].tab : "text-ink-sub"}`}
          >
            {SUBJECT_KANA[s]}
            <span className="font-body text-[13px] font-black">{counts[s]}こ</span>
          </button>
        ))}
      </div>

      <div role="group" aria-label={`${SUBJECT_KANA[subject]}の にている はてな`} className="no-scrollbar -mx-6 flex gap-2 overflow-x-auto px-6">
        {[ALL, ...units].map((u) => (
          <button
            key={u || "all"}
            type="button"
            aria-pressed={unit === u}
            onClick={() => setUnit(u)}
            className={`h-11 shrink-0 whitespace-nowrap rounded-[22px] border-[2.5px] border-ink px-4 text-base font-black ${unit === u ? CATEGORY[subject].tab : "bg-white text-ink-sub"}`}
          >
            {u || "すべて"}
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-2.5 rounded-card bg-white p-6">
          <Navigator mood="think" size={96} />
          <span className={`font-pop text-[22px] ${style.dark}`}>まだ ないよ</span>
          <span className="text-base font-black text-ink-sub">まちで さがして みよう！</span>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {shown.map((a) => (
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
        <div className="sticky bottom-[108px] mt-auto flex flex-col gap-2.5">
          {shown.length > 0 && (
            <button
              type="button"
              onClick={() =>
                setPicked((prev) => {
                  const next = new Set(prev);
                  for (const a of shown) {
                    if (allPicked) next.delete(a.id);
                    else next.add(a.id);
                  }
                  return next;
                })
              }
              className="self-center rounded-xl border-[2.5px] border-ink bg-white px-4 py-1 text-sm font-black shadow-pop-xs active:translate-y-[3px] active:shadow-none"
            >
              {allPicked ? "ぜんぶ はずす" : "ぜんぶ えらぶ"}
            </button>
          )}
          {confirming ? (
            <>
              <p className="rounded-[20px] bg-pink-light py-2 text-center text-base font-black">{picked.size}こ けすよ。もとには もどせないよ。いいかな？</p>
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
