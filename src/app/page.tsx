"use client";

import { Jp } from "@/components/RubyText";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useRef, useState } from "react";
import { AlbumPicker } from "@/components/AlbumPicker";
import { useArchive } from "@/components/ArchiveProvider";
import { useApp } from "@/components/AuthProvider";
import { Gate } from "@/components/Gate";
import { Guide, type GuideStep } from "@/components/Guide";
import { Icon } from "@/components/Icons";
import { MyNavigator } from "@/components/MyNavigator";
import { Page } from "@/components/Page";
import { usePresence } from "@/components/PresenceProvider";
import { CAPTURE_WITH_PROMISE, GUIDE_PARAM, groupOf, titleLabel } from "@/lib/constants";
import { useTodayGroupMissions } from "@/components/GroupMissions";
import { missionDone, todaysMission } from "@/lib/missions";

/** まちの絵（見本 04）の、いえ・き・しんごう。下 134px ぶんだけを描く（わくの たかさ 230 に対して 58.3%）。たいよう・地面・「？」・ナビは、べつに 重ねる */
function TownArt() {
  return (
    <svg aria-hidden="true" viewBox="0 96 336 134" className="absolute bottom-0 left-0 h-[58.3%]">
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
    </svg>
  );
}

/** 空に うかぶ くも（見本 04 の くもと同じ形） */
function Cloud({ className, delay }: { className: string; delay: number }) {
  return (
    <svg aria-hidden="true" viewBox="174 76 54 28" className={`animate-cloud absolute ${className}`} style={{ animationDelay: `${delay}s` }}>
      <path d="M178 100a14 14 0 0 1 26-6 12 12 0 0 1 20 6z" fill="#FFFFFF" stroke="#22223A" strokeWidth="3" strokeLinejoin="round" />
    </svg>
  );
}

/** まちに かくれている「？」（ふわふわ うく）。left は わくの たかさを もとに（cqh。絵と いっしょに ちぢむ）、bottom は % で決める */
function HiddenHatena({ left, bottom, color, delay }: { left: string; bottom: string; color: string; delay: number }) {
  return (
    <span
      aria-hidden
      className="animate-hatena absolute flex aspect-square h-[12%] min-h-[22px] items-center justify-center rounded-full border-[2.5px] border-ink bg-white font-pop text-[clamp(12px,6cqh,15px)] leading-none"
      style={{ left, bottom, color, animationDelay: `${delay}s` }}
    >
      ?
    </span>
  );
}

// 下の2つの 小さな入口（アルバム・見本の絵）。上に絵、下に ことば
const TILE =
  "flex h-[76px] flex-col items-center justify-center gap-1 rounded-[22px] border-3 border-ink bg-white text-[15px] font-black leading-none text-ink shadow-pop-sm active:translate-y-1 active:shadow-none [@media(max-height:700px)]:h-16";

function HomeContent() {
  const { profile, markGuideSeen } = useApp();
  const { archives } = useArchive();
  const router = useRouter();
  const params = useSearchParams();
  const captureRef = useRef<HTMLAnchorElement>(null);
  const [guideStep, setGuideStep] = useState<GuideStep>(0);
  const [guideClosed, setGuideClosed] = useState(false);
  const [albumError, setAlbumError] = useState<string | null>(null);
  // グループのミッション（#139）。どのグループも出していない日・読み込み中は、いつもの きょうの おだいを出す
  const groupMissions = useTodayGroupMissions();
  // 「たすけて」ボタン（グループに入っている子だけ。画面の枠が 右上に重ねる：#192）が出るときは、あいさつの右を あけておく
  const canHelp = usePresence()?.canHelp ?? false;
  if (!profile) return null;

  const done = missionDone(archives);
  const missions = groupMissions?.length
    ? groupMissions.map((m) => ({ key: m.groupId, label: `${groupOf(m.groupId).kana} の おだい`, text: m.text }))
    : [{ key: "daily", label: "{今日|きょう}の おだい", text: todaysMission() }];
  // はじめての1回（まだ見ていない）と、せっていから もういちど見るとき（docs/02-spec.md 4.2）
  const guideOpen = !guideClosed && (profile.guideSeenAt === null || params.get(GUIDE_PARAM) === "1");

  // とばす・とじる・ホームを みる・やってみる！ の どれでも、見おわったことにする
  function closeGuide(next?: string) {
    setGuideClosed(true);
    void markGuideSeen();
    if (next) router.push(next);
    // せっていから来たときの「?guide=1」を消す（読み込み直しても もう出ないように）
    else if (params.get(GUIDE_PARAM)) router.replace("/");
  }

  return (
    <>
      <Page tab="home" tabRaised={guideOpen && guideStep === 1}>
        {/* 主役：空と まちの絵。ナビが、今日のお題を ふきだしで言う（のこった たかさは、空が うめる） */}
        <section className="flex min-h-[300px] flex-1 flex-col overflow-hidden rounded-[32px] bg-navi-light [@media(max-height:700px)]:min-h-[260px]">
          <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 pl-[18px] pt-4 ${canHelp ? "pr-[116px]" : "pr-[18px]"}`}>
            <h1 className="font-pop text-[21px] font-normal leading-snug">こんにちは、{profile.nickname}！</h1>
            <span className="rounded-xl bg-purple px-3 py-[3px] text-sm font-black text-white">{titleLabel(profile.title)}</span>
          </div>

          {/* 今日のお題（押せないので地の色だけ）。グループのミッションがあれば、グループごとに ならべる */}
          <div className="relative mx-3.5 mt-3 flex flex-col gap-2 rounded-[22px] bg-white px-4 py-3">
            <span aria-hidden className="absolute -bottom-2 right-[58px] size-5 rotate-45 rounded-[4px] bg-white" />
            {missions.map((m) => (
              <div key={m.key} className="relative flex flex-col gap-0.5">
                <span className="flex items-center gap-1.5 text-sm font-black text-yellow-deep">
                  <Icon name="star" size={18} fill="#FFC83D" stroke="#22223A" strokeWidth={2} />
                  <Jp>{m.label}</Jp>
                  {done && (
                    <span className="ml-auto flex items-center gap-1 rounded-full bg-mint-light px-2.5 py-0.5 text-[13px] text-mint-dark">
                      <Icon name="check" size={14} strokeWidth={3.4} />
                      クリア！
                    </span>
                  )}
                </span>
                <Jp className="font-pop text-[18px] leading-[1.45]">{m.text}</Jp>
              </div>
            ))}
          </div>

          <div role="img" aria-label="まちの え。いえ、き、しんごうに はてなが かくれている" className="relative min-h-[104px] flex-1">
            {/* 空：たかい画面では、あいた空に くもを うかべる（ゆっくり ながれる） */}
            <Cloud className="left-[7%] top-[9%] w-[74px] [@media(max-height:760px)]:hidden" delay={0} />
            <Cloud className="left-[44%] top-[27%] w-[54px] [@media(max-height:800px)]:hidden" delay={-4} />
            {/* まち：地面は わくの はしまで のばす。絵は 230px までで、ひくい画面では いっしょに ちぢむ */}
            <div className="absolute inset-x-0 bottom-0 h-full max-h-[230px] [container-type:size]">
              <span aria-hidden className="absolute right-[7%] top-[8%] aspect-square h-[19%] rounded-full border-3 border-ink bg-yellow" />
              <div aria-hidden className="absolute inset-x-0 bottom-0 h-[19.2%] border-t-3 border-ink bg-[#9BE3C8]" />
              <TownArt />
              <HiddenHatena left="22.2cqh" bottom="54.3%" color="#8B5CF6" delay={0} />
              <HiddenHatena left="53.5cqh" bottom="52.6%" color="#FF6F9C" delay={0.9} />
              {/* 自分のナビ（そだつと 少しずつ大きくなる。#193）。ひくい画面では、絵と いっしょに 小さくする */}
              <div className="absolute bottom-[15.6%] right-0.5 origin-bottom-right [@media(max-height:700px)]:scale-[0.7] [@media(min-height:701px)_and_(max-height:760px)]:scale-[0.8]">
                <MyNavigator mood="happy" size={124} grow />
              </div>
            </div>
          </div>
        </section>

        <Link
          ref={captureRef}
          href={CAPTURE_WITH_PROMISE}
          className="flex h-[92px] shrink-0 items-center justify-center gap-3 rounded-[30px] border-3 border-ink bg-navi font-pop text-[25px] text-white shadow-[0_7px_0_var(--color-ink)] active:translate-y-[7px] active:shadow-none [@media(max-height:700px)]:h-[72px]"
        >
          <Icon name="camera" size={42} strokeWidth={2.2} />
          <Jp big>{"はてなを {探|さが}す！"}</Jp>
        </Link>

        {/* カメラを使わない 2つの入口。見本の絵は、一覧の画面で えらぶ */}
        <div className="grid shrink-0 grid-cols-2 gap-3">
          <AlbumPicker className={TILE} onError={setAlbumError}>
            <Icon name="album" size={28} strokeWidth={2.2} />
            <Jp>{"アルバムから {選|えら}ぶ"}</Jp>
          </AlbumPicker>
          <Link href="/samples" className={TILE}>
            <Icon name="palette" size={28} strokeWidth={2.2} />
            <Jp>{"{見本|みほん}の {絵|え}で {試|ため}す"}</Jp>
          </Link>
        </div>
        {albumError && (
          <p role="alert" className="rounded-[20px] bg-pink-light px-4 py-3 text-base font-black leading-relaxed text-pink-dark">
            <Jp>{albumError}</Jp>
          </p>
        )}
      </Page>
      {guideOpen && (
        <Guide
          step={guideStep}
          onNext={() => setGuideStep((s) => (s < 2 ? ((s + 1) as GuideStep) : s))}
          onClose={() => closeGuide()}
          onTry={() => closeGuide(CAPTURE_WITH_PROMISE)}
          captureRef={captureRef}
        />
      )}
    </>
  );
}

export default function Home() {
  return (
    <Gate>
      <Suspense>
        <HomeContent />
      </Suspense>
    </Gate>
  );
}
