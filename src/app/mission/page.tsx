"use client";

import { useArchive } from "@/components/ArchiveProvider";
import { Gate } from "@/components/Gate";
import { Page } from "@/components/Page";
import { Card, LinkButton, Say } from "@/components/ui";
import { missionDone, todaysMission } from "@/lib/missions";

function MissionContent() {
  const { archives } = useArchive();
  const done = missionDone(archives);

  return (
    <Page title="今日の おだい" back="/">
      <Card className="space-y-2 text-center">
        <p className="text-base font-bold text-brand">今日の ミッション</p>
        <p className="text-xl font-bold leading-loose">{todaysMission()}</p>
        {done && <p className="rounded-full bg-mint/25 px-4 py-1 text-base font-bold">今日の おだい クリア！ ★</p>}
      </Card>
      <Say mood={done ? "happy" : "think"}>
        {done ? "今日も もんだいを 見つけたね！ あしたの おだいも たのしみだね。" : "おだいに あう ものを 見つけて、しゃしんを とってみよう！ まわりに 気をつけてね。"}
      </Say>
      <div className="mt-auto">
        <LinkButton href="/capture">しゃしんを とる</LinkButton>
      </div>
    </Page>
  );
}

export default function MissionPage() {
  return (
    <Gate>
      <MissionContent />
    </Gate>
  );
}
