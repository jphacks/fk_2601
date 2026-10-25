"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useArchive } from "@/components/ArchiveProvider";
import { useApp } from "@/components/AuthProvider";
import { Gate } from "@/components/Gate";
import { Icon, Medal } from "@/components/Icons";
import { Loading } from "@/components/Loading";
import { Navigator } from "@/components/Navigator";
import { Page } from "@/components/Page";
import { StampCards } from "@/components/StampCards";
import { earnedTitles, stampCounts } from "@/lib/collection";
import { FIRST_TITLE_LABEL, STAMP_GOAL, SUBJECT_KANA, SUBJECTS, TITLE_LABEL, titleLabel } from "@/lib/constants";
import { messageOf } from "@/lib/errors";
import type { Subject } from "@/server/llm/schema";

type View = "cards" | "titles";

const VIEWS: [View, string][] = [
  ["cards", "スタンプカード"],
  ["titles", "しょうごう"],
];

/** つけられる しょうごうの行（押せる：線と影。えらんだものは うすい青と、ぬった丸） */
function TitleRow({ name, note, selected, onClick }: { name: string; note: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`flex min-h-[68px] w-full items-center gap-3 rounded-[22px] border-3 border-ink px-4 py-2 text-left text-ink shadow-pop-sm active:translate-y-1 active:shadow-none ${
        selected ? "bg-navi-light" : "bg-white"
      }`}
    >
      <span aria-hidden className={`size-[26px] shrink-0 rounded-full border-3 border-ink ${selected ? "bg-navi shadow-[inset_0_0_0_4px_var(--color-white)]" : "bg-white"}`} />
      <Medal size={30} />
      <span className="flex flex-col gap-0.5">
        <span className="text-lg font-black">{name}</span>
        <span className="text-[13px] font-black text-ink-sub">{note}</span>
      </span>
    </button>
  );
}

/** まだ もらっていない しょうごう（押せないので地の色だけ。かぎと「あと ○こ」） */
function LockedRow({ subject, left }: { subject: Subject; left: number }) {
  return (
    <div className="flex min-h-[68px] items-center gap-3 rounded-[22px] bg-cloud px-4 py-2 text-ink-sub">
      <Icon name="lock" size={30} stroke="#6B7090" strokeWidth={2.2} />
      <span className="flex flex-col gap-0.5">
        <span className="text-lg font-black">{TITLE_LABEL[subject]}</span>
        <span className="text-[13px] font-black">
          {SUBJECT_KANA[subject]}の スタンプ あと {left}こ
        </span>
      </span>
    </div>
  );
}

function StampContent() {
  const { profile, saveProfile } = useApp();
  const { status, archives } = useArchive();
  const params = useSearchParams();
  const [view, setView] = useState<View>(params.get("view") === "titles" ? "titles" : "cards");
  const [error, setError] = useState<string | null>(null);

  if (!profile) return null;
  if (status === "loading") {
    return (
      <Page tab="stamp">
        <Loading message="スタンプを ひらいているよ" />
      </Page>
    );
  }

  const counts = stampCounts(archives);
  const earned = earnedTitles(counts);
  const locked = SUBJECTS.filter((s) => !earned.includes(s));

  async function equip(title: Subject | null) {
    if (!profile || profile.title === title) return;
    setError(null);
    try {
      await saveProfile({ nickname: profile.nickname, grade: profile.grade, title });
    } catch (e) {
      setError(messageOf(e));
    }
  }

  return (
    <Page tab="stamp">
      <div className="flex h-[50px] items-center gap-2">
        <h1 className="font-pop text-2xl font-normal">スタンプ</h1>
        <span className="rounded-xl bg-yellow px-2.5 py-0.5 font-pop text-sm">{archives.length}こ</span>
      </div>

      <div role="tablist" aria-label="きりかえ" className="grid grid-cols-2 gap-1.5 rounded-[26px] border-3 border-ink bg-white p-[5px]">
        {VIEWS.map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={view === value}
            onClick={() => setView(value)}
            className={`h-[50px] rounded-[20px] font-pop text-[17px] ${view === value ? "bg-navi text-white" : "text-ink-sub"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {view === "cards" && <StampCards counts={counts} />}

      {view === "titles" && (
        <div className="flex flex-1 flex-col gap-3">
          <div className="flex items-center gap-3 rounded-card bg-purple px-4 py-2.5 text-white">
            <Navigator mood="surprise" size={68} />
            <span className="flex flex-col gap-0.5">
              <span className="text-sm font-black">いま つけている しょうごう</span>
              <span className="font-pop text-[23px]">{titleLabel(profile.title)}</span>
            </span>
          </div>
          <span className="text-[15px] font-black leading-[1.6] text-ink-sub">みんなの はてなに のせると、この しょうごうが でるよ</span>

          <span className="mt-2 font-pop text-lg">しょうごうを えらぶ</span>
          <div role="radiogroup" aria-label="しょうごうを えらぶ" className="flex flex-col gap-3">
            <TitleRow name={FIRST_TITLE_LABEL} note="はじめて あそんだ ときに もらえる" selected={profile.title === null} onClick={() => void equip(null)} />
            {earned.map((subject) => (
              <TitleRow
                key={subject}
                name={TITLE_LABEL[subject]}
                note={`${SUBJECT_KANA[subject]}の スタンプを ${STAMP_GOAL}こ あつめた`}
                selected={profile.title === subject}
                onClick={() => void equip(subject)}
              />
            ))}
            {locked.map((subject) => (
              <LockedRow key={subject} subject={subject} left={STAMP_GOAL - counts[subject]} />
            ))}
          </div>
          {error && (
            <p role="alert" className="rounded-[20px] bg-pink-light px-4 py-3 text-base font-black text-pink-dark">
              {error}
            </p>
          )}
        </div>
      )}
    </Page>
  );
}

export default function StampPage() {
  return (
    <Gate>
      {/* ?view=titles で「しょうごう」を ひらいて くる（せっていの「しょうごう」から） */}
      <Suspense>
        <StampContent />
      </Suspense>
    </Gate>
  );
}
