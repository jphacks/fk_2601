"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useArchive } from "@/components/ArchiveProvider";
import { useApp } from "@/components/AuthProvider";
import { Gate } from "@/components/Gate";
import { Icon, Medal } from "@/components/Icons";
import { Loading } from "@/components/Loading";
import { ErrorNotice } from "@/components/ui";
import { Navigator } from "@/components/Navigator";
import { Page } from "@/components/Page";
import { StampCards } from "@/components/StampCards";
import { stampCounts } from "@/lib/collection";
import { messageOf } from "@/lib/errors";
import {
  canonicalTitle,
  earnedTitleIds,
  FIRST_TITLE_LABEL,
  nextGoal,
  TIER_LABEL,
  TIERS,
  TITLE_FAMILIES,
  titleId,
  titleLabel,
  titleStats,
  type TitleFamily,
  type TitleStats,
} from "@/lib/titles";

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

/**
 * 1つの種類の しょうごう（どう・ぎん・きん）。まとまりは押せないので地の色だけ。
 * もらった段階は押せる（線と影。えらんだものは うすい青で、押しこまれた形）。まだの段階は、かぎと 必要な数
 */
function FamilyCard({
  family,
  stats,
  selected,
  onPick,
}: {
  family: TitleFamily;
  stats: TitleStats;
  selected: string | null;
  onPick: (id: string) => void;
}) {
  const value = family.value(stats);
  const next = nextGoal(family, stats);
  return (
    <section className="flex flex-col gap-2 rounded-card bg-cloud px-3.5 pb-3.5 pt-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-lg font-black">{family.name}</h3>
        <span className="shrink-0 text-[13px] font-black text-ink-sub">いま {value}</span>
      </div>
      <span className="text-[13px] font-black leading-[1.6] text-ink-sub">
        {next ? `${TIER_LABEL[next.tier]}：${family.how.replace("{n}", String(family.goals[TIERS.indexOf(next.tier)]))}（あと ${next.left}）` : "きんまで ぜんぶ もらったよ！"}
      </span>
      <div className="grid grid-cols-3 gap-2">
        {TIERS.map((tier, i) => {
          const id = titleId(family.id, tier);
          const got = value >= family.goals[i];
          if (!got) {
            return (
              <div key={tier} className="flex min-h-[64px] flex-col items-center justify-center gap-0.5 rounded-[18px] bg-white/60 text-ink-muted">
                <Icon name="lock" size={22} stroke="#6B7090" strokeWidth={2.2} />
                <span className="text-xs font-black">
                  {TIER_LABEL[tier]} {family.goals[i]}
                </span>
              </div>
            );
          }
          const on = selected === id;
          return (
            <button
              key={tier}
              type="button"
              role="radio"
              aria-checked={on}
              aria-label={titleLabel(id)}
              onClick={() => onPick(id)}
              className={`flex min-h-[64px] flex-col items-center justify-center gap-0.5 rounded-[18px] border-3 border-ink text-ink ${on ? "translate-y-1 bg-navi-light shadow-none" : "bg-white shadow-pop-sm active:translate-y-1 active:shadow-none"}`}
            >
              <Medal size={26} tier={tier} />
              <span className="text-xs font-black">{TIER_LABEL[tier]}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function StampContent() {
  const { profile, saveProfile } = useApp();
  const { status, archives, reload } = useArchive();
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

  if (status === "error") {
    return (
      <Page tab="stamp">
        <ErrorNotice onRetry={() => void reload()}>スタンプを よみこめなかったよ。ネットに つながっているか みて、もういちど ためしてね</ErrorNotice>
      </Page>
    );
  }

  const counts = stampCounts(archives);
  const stats = titleStats(archives);
  const owned = earnedTitleIds(stats).length;
  // 前の形の称号（「math」）も、そろえた ID（「math-bronze」）でくらべる
  const current = canonicalTitle(profile.title);

  async function equip(title: string | null) {
    if (!profile || current === title) return;
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

          <div className="mt-2 flex items-baseline justify-between">
            <span className="font-pop text-lg">しょうごうを えらぶ</span>
            <span className="text-[15px] font-black text-ink-sub">
              もっている {owned} / {TITLE_FAMILIES.length * TIERS.length}
            </span>
          </div>
          <div role="radiogroup" aria-label="しょうごうを えらぶ" className="flex flex-col gap-3">
            <TitleRow name={FIRST_TITLE_LABEL} note="はじめて あそんだ ときに もらえる" selected={current === null} onClick={() => void equip(null)} />
            {TITLE_FAMILIES.map((family) => (
              <FamilyCard key={family.id} family={family} stats={stats} selected={current} onPick={(id) => void equip(id)} />
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
