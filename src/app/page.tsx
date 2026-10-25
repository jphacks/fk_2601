"use client";

import Link from "next/link";
import { AlbumPicker } from "@/components/AlbumPicker";
import { useArchive } from "@/components/ArchiveProvider";
import { useApp } from "@/components/AuthProvider";
import { Gate } from "@/components/Gate";
import { Icon } from "@/components/Icons";
import { Navigator } from "@/components/Navigator";
import { Page } from "@/components/Page";
import { SceneSamples } from "@/components/SceneSamples";
import { CAPTURE_WITH_PROMISE, titleLabel } from "@/lib/constants";
import { missionDone, todaysMission } from "@/lib/missions";

/** まちの絵（見本 04）。いえ・き・しんごうに「はてな」がかくれている */
function TownArt() {
  return (
    <svg aria-hidden="true" viewBox="0 0 336 230" className="absolute bottom-0 left-0 h-[230px] w-[336px]">
      <circle cx="296" cy="40" r="20" fill="#FFC83D" stroke="#22223A" strokeWidth="3" />
      <path d="M178 96a14 14 0 0 1 26-6 12 12 0 0 1 20 10h-46z" fill="#FFFFFF" stroke="#22223A" strokeWidth="3" strokeLinejoin="round" />
      <rect x="-4" y="186" width="344" height="50" fill="#9BE3C8" stroke="#22223A" strokeWidth="3" />
      <path d="M16 140L50 110L84 140Z" fill="#FF6F9C" stroke="#22223A" strokeWidth="3" strokeLinejoin="round" />
      <rect x="22" y="140" width="56" height="46" fill="#FFE8F0" stroke="#22223A" strokeWidth="3" />
      <rect x="42" y="158" width="16" height="28" fill="#FFC83D" stroke="#22223A" strokeWidth="3" />
      <rect x="112" y="152" width="10" height="34" fill="#B08968" stroke="#22223A" strokeWidth="3" />
      <circle cx="117" cy="138" r="24" fill="#24C3A0" stroke="#22223A" strokeWidth="3" />
      <rect x="164" y="128" width="8" height="58" fill="#B7BCCD" stroke="#22223A" strokeWidth="3" />
      <rect x="140" y="110" width="56" height="24" rx="12" fill="#3B3F52" stroke="#22223A" strokeWidth="3" />
      <circle cx="154" cy="122" r="6" fill="#5B6074" />
      <circle cx="168" cy="122" r="6" fill="#5B6074" />
      <circle cx="182" cy="122" r="6" fill="#F0444F" />
      <circle cx="64" cy="92" r="13" fill="#FFFFFF" stroke="#22223A" strokeWidth="2.5" />
      <text x="64" y="98" textAnchor="middle" fontFamily="var(--font-pop)" fontSize="15" fill="#8B5CF6">?</text>
      <circle cx="136" cy="96" r="13" fill="#FFFFFF" stroke="#22223A" strokeWidth="2.5" />
      <text x="136" y="102" textAnchor="middle" fontFamily="var(--font-pop)" fontSize="15" fill="#FF6F9C">?</text>
    </svg>
  );
}

function HomeContent() {
  const { profile } = useApp();
  const { archives } = useArchive();
  if (!profile) return null;

  const done = missionDone(archives);

  return (
    <>
      <Page tab="home">
        <section
          role="img"
          aria-label="まちの え。いえ、き、しんごうに はてなが かくれている"
          className="relative min-h-[236px] flex-1 overflow-hidden rounded-[32px] bg-navi-light"
        >
          <TownArt />
          <div className="absolute left-[18px] top-4 flex flex-col items-start gap-1.5">
            <span className="font-pop text-[21px]">こんにちは、{profile.nickname}！</span>
            <span className="rounded-xl bg-purple px-3 py-[3px] text-sm font-black text-white">{titleLabel(profile.title)}</span>
          </div>
          <div className="absolute bottom-9 right-0.5">
            <Navigator mood="happy" size={124} />
          </div>
        </section>

        {/* 今日のお題（押せないので地の色だけ） */}
        <div className="flex items-center gap-3 rounded-card bg-yellow-soft px-4 py-3">
          <span className="flex size-[46px] shrink-0 items-center justify-center rounded-full bg-white">
            <Icon name="star" size={26} fill="#FFC83D" stroke="#22223A" strokeWidth={2} />
          </span>
          <span className="flex min-w-0 grow flex-col">
            <span className="text-sm font-black">きょうの おだい{done ? "（クリア！）" : ""}</span>
            <span className="font-pop text-[19px] leading-snug">{todaysMission()}</span>
          </span>
        </div>

        <Link
          href={CAPTURE_WITH_PROMISE}
          className="flex h-[92px] shrink-0 items-center justify-center gap-3 rounded-[30px] border-3 border-ink bg-navi font-pop text-[25px] text-white shadow-[0_7px_0_var(--color-ink)] active:translate-y-[7px] active:shadow-none"
        >
          <Icon name="camera" size={42} strokeWidth={2.2} />
          はてなを さがす！
        </Link>

        <AlbumPicker className="flex h-14 shrink-0 items-center justify-center gap-2 rounded-[22px] border-3 border-ink bg-white text-[19px] font-black text-ink shadow-pop-sm active:translate-y-1 active:shadow-none">
          <Icon name="album" size={24} strokeWidth={2.2} />
          アルバムから えらぶ
        </AlbumPicker>

        <SceneSamples />
      </Page>
    </>
  );
}

export default function Home() {
  return (
    <Gate>
      <HomeContent />
    </Gate>
  );
}
