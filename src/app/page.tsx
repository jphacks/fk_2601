"use client";

import { Jp } from "@/components/RubyText";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useRef, useState } from "react";
import { AlbumPicker } from "@/components/AlbumPicker";
import { useArchive } from "@/components/ArchiveProvider";
import { useApp } from "@/components/AuthProvider";
import { Gate } from "@/components/Gate";
import { Guide, GuideRing, type GuideStep } from "@/components/Guide";
import { Icon } from "@/components/Icons";
import { MyNavigator } from "@/components/MyNavigator";
import { Page } from "@/components/Page";
import { SceneSamples } from "@/components/SceneSamples";
import { CAPTURE_WITH_PROMISE, GUIDE_PARAM, groupOf, titleLabel } from "@/lib/constants";
import { useTodayGroupMissions } from "@/components/GroupMissions";
import { missionDone, todaysMission } from "@/lib/missions";

/** まちの絵（見本 04）。いえ・き・しんごうに「はてな」がかくれている */
function TownArt() {
  return (
    <svg aria-hidden="true" viewBox="0 0 336 230" className="absolute bottom-0 left-0 h-[230px] w-[336px] [@media(max-height:700px)]:hidden">
      <circle cx="296" cy="40" r="20" fill="#FFC83D" stroke="#22223A" strokeWidth="3" />
      <path d="M178 96a14 14 0 0 1 26-6 12 12 0 0 1 20 10h-46z" fill="#FFFFFF" stroke="#22223A" strokeWidth="3" strokeLinejoin="round" />
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
  const { profile, markGuideSeen } = useApp();
  const { archives } = useArchive();
  const router = useRouter();
  const params = useSearchParams();
  const captureRef = useRef<HTMLAnchorElement>(null);
  const [guideStep, setGuideStep] = useState<GuideStep>(0);
  const [guideClosed, setGuideClosed] = useState(false);
  // グループのミッション（#139）。どのグループも出していない日・読み込み中は、いつもの きょうの おだいを出す
  const groupMissions = useTodayGroupMissions();
  if (!profile) return null;

  const done = missionDone(archives);
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
        <section
          role="img"
          aria-label="まちの え。いえ、き、しんごうに はてなが かくれている"
          className="relative min-h-[170px] [@media(max-height:700px)]:min-h-[124px] flex-1 overflow-hidden rounded-[32px] bg-navi-light"
        >
          {/* 地面は絵の はばに しばらず、わくの はしまで のばす（右はしの ナビの足もとにも 地面が あるように） */}
          <div aria-hidden className="absolute inset-x-0 bottom-0 h-11 border-t-3 border-ink bg-[#9BE3C8]" />
          <TownArt />
          <div className="absolute left-[18px] top-4 flex flex-col items-start gap-1.5 [@media(max-height:700px)]:top-3 [@media(max-height:700px)]:flex-row [@media(max-height:700px)]:flex-wrap [@media(max-height:700px)]:items-center [@media(max-height:700px)]:gap-x-2">
            <span className="font-pop text-[21px]">こんにちは、{profile.nickname}！</span>
            <span className="rounded-xl bg-purple px-3 py-[3px] text-sm font-black text-white">{titleLabel(profile.title)}</span>
          </div>
          <div className="absolute bottom-9 right-0.5 origin-bottom-right [@media(max-height:700px)]:scale-[0.7]">
            <MyNavigator mood="happy" size={124} grow />
          </div>
        </section>

        {/* 今日のお題（押せないので地の色だけ）。グループのミッションがあれば、グループごとに ならべる */}
        {(groupMissions?.length ? groupMissions.map((m) => ({ key: m.groupId, label: `${groupOf(m.groupId).kana} の おだい`, text: m.text })) : [{ key: "daily", label: "{今日|きょう}の おだい", text: todaysMission() }]).map((m) => (
          <div key={m.key} className="flex items-center gap-3 rounded-card bg-yellow-soft px-4 py-3 [@media(max-height:700px)]:py-2">
            <span className="flex size-[46px] shrink-0 items-center justify-center rounded-full bg-white">
              <Icon name="star" size={26} fill="#FFC83D" stroke="#22223A" strokeWidth={2} />
            </span>
            <span className="flex min-w-0 grow flex-col">
              <span className="text-sm font-black">
                <Jp>{m.label}</Jp>
                {done ? "（クリア！）" : ""}
              </span>
              <Jp className="font-pop text-[19px] leading-snug">{m.text}</Jp>
            </span>
          </div>
        ))}

        <Link
          ref={captureRef}
          href={CAPTURE_WITH_PROMISE}
          className={`relative flex h-[92px] [@media(max-height:700px)]:h-[72px] shrink-0 items-center justify-center gap-3 rounded-[30px] border-3 border-ink bg-navi font-pop text-[25px] text-white shadow-[0_7px_0_var(--color-ink)] active:translate-y-[7px] active:shadow-none ${
            guideOpen && guideStep === 2 ? "pointer-events-none z-[45]" : ""
          }`}
        >
          <Icon name="camera" size={42} strokeWidth={2.2} />
          <Jp big>{"はてなを {探|さが}す！"}</Jp>
          {guideOpen && guideStep === 2 && <GuideRing />}
        </Link>

        <AlbumPicker className="flex h-14 [@media(max-height:700px)]:h-12 shrink-0 items-center justify-center gap-2 rounded-[22px] border-3 border-ink bg-white text-[19px] font-black text-ink shadow-pop-sm active:translate-y-1 active:shadow-none">
          <Icon name="album" size={24} strokeWidth={2.2} />
          <Jp>{"アルバムから {選|えら}ぶ"}</Jp>
        </AlbumPicker>

        <SceneSamples />
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
