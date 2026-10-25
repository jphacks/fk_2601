"use client";

import { useArchive } from "@/components/ArchiveProvider";
import { Gate } from "@/components/Gate";
import { Icon } from "@/components/Icons";
import { Page } from "@/components/Page";
import { LinkButton, Say } from "@/components/ui";
import { CAPTURE_WITH_PROMISE } from "@/lib/constants";
import { missionDone, todaysMission } from "@/lib/missions";

function MissionContent() {
  const { archives } = useArchive();
  const done = missionDone(archives);

  return (
    <Page title="きょうの おだい" back="/">
      <section className="flex flex-col items-center gap-2 rounded-[28px] bg-yellow-soft px-5 py-6 text-center">
        <span className="flex size-[58px] items-center justify-center rounded-full bg-white">
          <Icon name="star" size={34} fill="#FFC83D" stroke="#22223A" strokeWidth={2} />
        </span>
        <p className="text-sm font-black">きょうの おだい</p>
        <p className="font-pop text-[22px] leading-[1.6]">{todaysMission()}</p>
        {done && <p className="rounded-xl bg-white px-4 py-1 text-base font-black">クリア！ ★</p>}
      </section>
      <Say mood={done ? "happy" : "think"} size={96}>
        {done
          ? "きょうも はてなを つかまえたね！ あしたの おだいも たのしみだね。"
          : "おだいに あう ものを みつけて、しゃしんを とってみよう！ まわりに きをつけてね。"}
      </Say>
      <div className="mt-auto">
        <LinkButton href={CAPTURE_WITH_PROMISE}>
          <Icon name="camera" size={30} strokeWidth={2.2} />
          はてなを さがす！
        </LinkButton>
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
