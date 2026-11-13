"use client";

import { Jp } from "@/components/RubyText";
import { useArchive } from "@/components/ArchiveProvider";
import { Gate } from "@/components/Gate";
import { Icon } from "@/components/Icons";
import { Page } from "@/components/Page";
import { LinkButton, Say } from "@/components/ui";
import { useTodayGroupMissions } from "@/components/GroupMissions";
import { CAPTURE_WITH_PROMISE, groupOf } from "@/lib/constants";
import { missionDone, todaysMission } from "@/lib/missions";

function MissionContent() {
  const { archives } = useArchive();
  const done = missionDone(archives);
  // グループのミッション（#139）。どのグループも出していない日・読み込み中は、いつもの きょうの おだいを出す
  const groupMissions = useTodayGroupMissions();
  const missions = groupMissions?.length
    ? groupMissions.map((m) => ({ key: m.groupId, label: `${groupOf(m.groupId).kana} の おだい`, text: m.text }))
    : [{ key: "daily", label: "{今日|きょう}の おだい", text: todaysMission() }];

  return (
    <Page title="{今日|きょう}の おだい" back="/">
      {missions.map((m) => (
        <section key={m.key} className="flex flex-col items-center gap-2 rounded-[28px] bg-yellow-soft px-5 py-6 text-center">
          <span className="flex size-[58px] items-center justify-center rounded-full bg-white">
            <Icon name="star" size={34} fill="#FFC83D" stroke="#22223A" strokeWidth={2} />
          </span>
          <p className="text-sm font-black">
            <Jp>{m.label}</Jp>
          </p>
          <p className="font-pop text-[22px] leading-[1.6]">
            <Jp big>{m.text}</Jp>
          </p>
          {done && <p className="rounded-xl bg-white px-4 py-1 text-base font-black">クリア！ ★</p>}
        </section>
      ))}
      <Say mood={done ? "happy" : "think"} size={96}>
        <Jp big>
          {done
            ? "{今日|きょう}も はてなを つかまえたね！ {明日|あした}の おだいも {楽|たの}しみだね。"
            : "おだいに {合|あ}う ものを {見|み}つけて、{写真|しゃしん}を とってみよう！ まわりに {気|き}を つけてね。"}
        </Jp>
      </Say>
      <div className="mt-auto">
        <LinkButton href={CAPTURE_WITH_PROMISE}>
          <Icon name="camera" size={30} strokeWidth={2.2} />
          <Jp big>{"はてなを {探|さが}す！"}</Jp>
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
