"use client";

import Link from "next/link";
import { useArchive } from "@/components/ArchiveProvider";
import { useApp } from "@/components/AuthProvider";
import { Gate } from "@/components/Gate";
import { Page } from "@/components/Page";
import { SafetyNotice } from "@/components/SafetyNotice";
import { LinkButton, Say } from "@/components/ui";
import { stampCounts } from "@/lib/collection";
import { APP_NAME, TITLE_LABEL } from "@/lib/constants";
import { missionDone } from "@/lib/missions";

function Tile({ href, title, note, color }: { href: string; title: string; note: string; color: string }) {
  return (
    <Link href={href} className={`flex min-h-24 flex-col justify-center rounded-3xl p-4 shadow-sm ring-1 ring-ink/5 active:scale-[0.98] ${color}`}>
      <span className="text-lg font-bold">{title}</span>
      <span className="text-sm text-ink/70">{note}</span>
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
      <Say mood="happy">
        こんにちは、{profile.nickname}さん！
        {profile.title && <span className="ml-1 rounded-full bg-sun/40 px-2 py-0.5 text-sm font-bold">「{TITLE_LABEL[profile.title]}」</span>}
        <br />
        まわりの ふうけいから、もんだいを 見つけよう！
      </Say>

      <LinkButton href="/capture" className="min-h-20 text-2xl">
        しゃしんを とる
      </LinkButton>

      <div className="grid grid-cols-2 gap-3">
        <Tile href="/archive" title="ずかん" note={total === 0 ? "まだ ないよ" : `スタンプ ${total}こ`} color="bg-[#e1ecff]" />
        <Tile href="/mission" title="今日の おだい" note={done ? "クリア！ ★" : "ちょうせんしよう"} color="bg-sun/25" />
        <Tile href="/others" title="みんなの もんだい" note="見せてもらおう" color="bg-mint/20" />
        <Tile href="/settings" title="せってい" note="もんだいの だしかた など" color="bg-white" />
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
