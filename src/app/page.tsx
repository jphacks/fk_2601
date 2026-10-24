"use client";

import Link from "next/link";
import { AlbumPicker } from "@/components/AlbumPicker";
import { useArchive } from "@/components/ArchiveProvider";
import { useApp } from "@/components/AuthProvider";
import { Meter } from "@/components/Decor";
import { Gate } from "@/components/Gate";
import { Icon } from "@/components/Icons";
import { Navigator } from "@/components/Navigator";
import { Page } from "@/components/Page";
import { SafetyNotice } from "@/components/SafetyNotice";
import { SceneSamples } from "@/components/SceneSamples";
import { stampCounts } from "@/lib/collection";
import { STAMP_GOAL, TITLE_LABEL } from "@/lib/constants";
import { missionDone, todaysMission } from "@/lib/missions";

/** まちの絵（見本 04）。いえ・き・しんごうに「はてな」がかくれている */
function TownArt() {
  return (
    <svg aria-hidden="true" viewBox="0 0 336 230" className="absolute left-0 top-0 h-[230px] w-full">
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

  const counts = stampCounts(archives);
  const done = missionDone(archives);
  const meters = [
    { label: "さんすう", value: counts.math, bg: "bg-navi-light", text: "text-navi-dark", bar: "#4A5AE8" },
    { label: "りか", value: counts.science, bg: "bg-mint-light", text: "text-mint-dark", bar: "#24C3A0" },
    { label: "じょうほう", value: counts.info, bg: "bg-purple-light", text: "text-purple-dark", bar: "#8B5CF6" },
  ];

  return (
    <>
      {/* 画面ぜんたいに出すので、動きのついた Page の外に置く（transform の中では fixed が効かない） */}
      <SafetyNotice once />
      <Page tab="home">
        <section
          role="img"
          aria-label="まちの え。いえ、き、しんごうに はてなが かくれている"
          className="relative h-[236px] shrink-0 overflow-hidden rounded-[32px] border-3 border-ink bg-navi-light"
        >
          <TownArt />
          <div className="absolute left-[18px] top-4 flex flex-col items-start gap-1.5">
            <span className="font-pop text-[21px]">こんにちは、{profile.nickname}！</span>
            {profile.title && (
              <span className="rounded-xl border-[2.5px] border-ink bg-purple px-3 py-[3px] text-sm font-black text-white">{TITLE_LABEL[profile.title]}</span>
            )}
          </div>
          <div className="absolute bottom-9 right-0.5">
            <Navigator mood="happy" size={124} />
          </div>
        </section>

        <Link
          href="/mission"
          className="flex items-center gap-3 rounded-card border-3 border-ink bg-yellow px-4 py-3 shadow-pop-md active:translate-y-1 active:shadow-none"
        >
          <span className="flex size-[46px] shrink-0 items-center justify-center rounded-full border-3 border-ink bg-white">
            <Icon name="star" size={26} fill="#FFC83D" stroke="#22223A" strokeWidth={2} />
          </span>
          <span className="flex min-w-0 grow flex-col">
            <span className="text-sm font-black">きょうの おだい{done ? "（クリア！）" : ""}</span>
            <span className="font-pop text-[17px] leading-snug">{todaysMission()}</span>
          </span>
        </Link>

        <Link
          href="/capture"
          className="mt-1 flex h-[92px] shrink-0 items-center justify-center gap-3 rounded-[30px] border-3 border-ink bg-navi font-pop text-[25px] text-white shadow-[0_7px_0_var(--color-ink)] active:translate-y-[7px] active:shadow-none"
        >
          <Icon name="camera" size={42} strokeWidth={2.2} />
          はてなを さがす！
        </Link>

        <AlbumPicker className="mt-1 flex h-14 shrink-0 items-center justify-center gap-2 rounded-[22px] border-3 border-ink bg-white text-[19px] font-black text-ink shadow-pop-sm active:translate-y-1 active:shadow-none">
          <Icon name="album" size={24} strokeWidth={2.2} />
          アルバムから えらぶ
        </AlbumPicker>

        <div className="mt-1.5 grid grid-cols-3 gap-2">
          {meters.map((m) => (
            <Link key={m.label} href="/archive" className={`flex flex-col gap-1 rounded-2xl px-2.5 py-2 ${m.bg}`}>
              <span className={`text-[13px] font-black ${m.text}`}>
                {m.label} {Math.min(m.value, STAMP_GOAL)}/{STAMP_GOAL}
              </span>
              <Meter value={Math.min(m.value, STAMP_GOAL)} max={STAMP_GOAL} color={m.bar} />
            </Link>
          ))}
        </div>

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
