"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useArchive } from "@/components/ArchiveProvider";
import { useApp } from "@/components/AuthProvider";
import { Gate } from "@/components/Gate";
import { Navigator } from "@/components/Navigator";
import { Page } from "@/components/Page";
import { SafetyNotice } from "@/components/SafetyNotice";
import { SceneSamples } from "@/components/SceneSamples";
import { stampCounts } from "@/lib/collection";
import { APP_NAME, TITLE_LABEL } from "@/lib/constants";
import { missionDone } from "@/lib/missions";

const ICON_PROPS = { width: 34, height: 34, viewBox: "0 0 32 32", fill: "none", stroke: "#1f2a44", strokeWidth: 2.4, strokeLinecap: "round", strokeLinejoin: "round" } as const;

const ICONS = {
  book: (
    <svg {...ICON_PROPS} aria-hidden>
      <path d="M5 6h9a3 3 0 0 1 3 3v17a3 3 0 0 0-3-3H5zM27 6h-5a3 3 0 0 0-3 3v17a3 3 0 0 1 3-3h5z" fill="#fff" />
    </svg>
  ),
  star: (
    <svg {...ICON_PROPS} aria-hidden>
      <path d="M16 3l3.7 8 8.3 1-6.1 5.8 1.7 8.7L16 22.4 8.4 26.5l1.7-8.7L4 12l8.3-1z" fill="#ffb703" />
    </svg>
  ),
  people: (
    <svg {...ICON_PROPS} aria-hidden>
      <circle cx="11" cy="11" r="4" fill="#fff" />
      <circle cx="22" cy="12" r="3.2" fill="#fff" />
      <path d="M3 26c0-5 3.5-8 8-8s8 3 8 8zM19 26c.4-3.6 2.4-5.6 5.4-5.6 2.6 0 4.6 1.8 4.6 5.6z" fill="#fff" />
    </svg>
  ),
  gear: (
    <svg {...ICON_PROPS} aria-hidden>
      <circle cx="16" cy="16" r="4.5" fill="#fff" />
      <path d="M16 3v4M16 25v4M3 16h4M25 16h4M7 7l2.8 2.8M22.2 22.2L25 25M25 7l-2.8 2.8M9.8 22.2L7 25" />
    </svg>
  ),
  camera: (
    <svg width={40} height={40} viewBox="0 0 32 32" fill="none" stroke="#1f2a44" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 10h5l2-3h10l2 3h5v16H4z" fill="#fff" />
      <circle cx="16" cy="17" r="5" fill="#ffb703" />
    </svg>
  ),
};

function Tile({ href, title, note, color, icon }: { href: string; title: string; note: string; color: string; icon: ReactNode }) {
  return (
    <Link href={href} className={`paper-card paper-card-press flex min-h-28 flex-col justify-between gap-1 p-4 ${color}`}>
      <span className="flex size-11 items-center justify-center rounded-2xl border-2 border-ink bg-white/80">{icon}</span>
      <span>
        <span className="block text-lg font-black leading-tight">{title}</span>
        <span className="block text-sm font-medium text-ink/70">{note}</span>
      </span>
    </Link>
  );
}

function HomeContent() {
  const { profile } = useApp();
  const { archives } = useArchive();
  if (!profile) return null;

  const counts = stampCounts(archives);
  const total = counts.math + counts.science + counts.info;
  const done = missionDone(archives);

  return (
    <Page title={APP_NAME} back={null}>
      <SafetyNotice once />

      <section className="paper-card relative overflow-hidden bg-[#e1ecff] px-4 pb-5 pt-4">
        <span aria-hidden className="absolute -right-6 -top-6 size-24 rounded-full bg-sun/50" />
        <span aria-hidden className="absolute -bottom-8 -left-6 size-24 rounded-full bg-mint/30" />
        <div className="relative flex items-center gap-3">
          <Navigator mood="happy" size={92} />
          <div className="space-y-1">
            <p className="text-lg font-black leading-snug">
              こんにちは、{profile.nickname}さん！
              {profile.title && (
                <span className="ml-1 inline-block rounded-full border-2 border-ink bg-sun px-2 py-0.5 align-middle text-xs font-black">
                  {TITLE_LABEL[profile.title]}
                </span>
              )}
            </p>
            <p className="text-base font-medium">まわりの ふうけいから、もんだいを 見つけよう！</p>
          </div>
        </div>
      </section>

      <Link
        href="/capture"
        className="flex min-h-24 items-center justify-center gap-3 rounded-full border-2 border-ink bg-brand px-6 py-4 font-display text-2xl text-white shadow-[0_7px_0_var(--color-ink)] transition active:translate-y-[7px] active:shadow-[0_0_0_var(--color-ink)]"
      >
        <span className="flex size-14 items-center justify-center rounded-full border-2 border-ink bg-white">{ICONS.camera}</span>
        しゃしんを とる
      </Link>

      <SceneSamples />

      <div className="grid grid-cols-2 gap-4">
        <Tile href="/archive" title="ずかん" note={total === 0 ? "まだ ないよ" : `スタンプ ${total}こ`} color="bg-[#e1ecff]" icon={ICONS.book} />
        <Tile href="/mission" title="今日の おだい" note={done ? "クリア！ ★" : "ちょうせんしよう"} color="bg-sun/30" icon={ICONS.star} />
        <Tile href="/others" title="みんなの もんだい" note="見せてもらおう" color="bg-mint/25" icon={ICONS.people} />
        <Tile href="/settings" title="せってい" note="もんだいの だしかた など" color="bg-white" icon={ICONS.gear} />
      </div>
    </Page>
  );
}

export default function Home() {
  return (
    <Gate>
      <HomeContent />
    </Gate>
  );
}
