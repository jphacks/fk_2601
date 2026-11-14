"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/components/AuthProvider";
import { ConditionSliders } from "@/components/ConditionSliders";
import { ExplanationSteps, Related, ThinkMore, TryIt, Sources } from "@/components/Explanation";
import { Gate } from "@/components/Gate";
import { Icon } from "@/components/Icons";
import { Navigator } from "@/components/Navigator";
import { Page } from "@/components/Page";
import { useQuiz } from "@/components/QuizProvider";
import { ResultSummary } from "@/components/ResultSummary";
import { Jp, RubyText } from "@/components/RubyText";
import { usePresenceScreen } from "@/components/PresenceProvider";
import { SavePanel } from "@/components/SavePanel";
import { Button, ErrorNotice, LinkButton, Say } from "@/components/ui";
import { defaultScope } from "@/lib/calc";
import { formatNumber } from "@/lib/format";
import { describeGuess, evaluate } from "@/lib/rating";
import { unitKana } from "@/lib/ruby";

// こたえあわせ → なぞとき → もしも → ずかんにのこす（見本 14〜19）
type Step = "shoutai" | "nazo" | "moshimo" | "get";
// 先生の画面に知らせる画面の名前（src/lib/presence.ts の PRESENCE_SCREENS。#192）
const STEP_SCREEN: Record<Step, string> = { shoutai: "result", nazo: "nazo", moshimo: "moshimo", get: "save" };

function ResultContent() {
  const router = useRouter();
  const { profile } = useApp();
  const { selected, guess, crop, saved, detail, retryDetail } = useQuiz();
  // 保存したあとに もどってきたときは、保存した画面（はてなゲット！）から見せる
  const [step, setStep] = useState<Step>(() => (saved ? "get" : "shoutai"));
  const [values, setValues] = useState<Record<string, number> | null>(null);
  usePresenceScreen(STEP_SCREEN[step]);

  useEffect(() => {
    if (!selected) router.replace(crop ? "/choose" : "/capture");
    else if (!guess) router.replace("/predict");
  }, [selected, guess, crop, router]);

  // 画面を切りかえたとき、いちばん上から見せる
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [step]);

  const evaluation = useMemo(() => {
    if (!selected || !guess) return null;
    try {
      return evaluate(selected, guess);
    } catch {
      return null;
    }
  }, [selected, guess]);

  if (!selected || !guess) return null;
  if (!evaluation) {
    return (
      <Page title="こたえあわせ" back="/choose">
        <ErrorNotice>
          <Jp big>{"この はてなは {答|こた}えを {出|だ}せなかったよ。ほかの はてなを {選|えら}んでね。"}</Jp>
        </ErrorNotice>
        <Button onClick={() => router.push("/choose")}>
          <Jp big>{"はてなを {選|えら}びなおす"}</Jp>
        </Button>
      </Page>
    );
  }

  const canChange = selected.variables.length > 0 && selected.type !== "why";
  const scope = values ?? defaultScope(selected);
  const unit = evaluation.type === "compare" ? "倍" : selected.answerUnit;
  const summary =
    evaluation.type === "why"
      ? evaluation.rating === "pita"
        ? "{正解|せいかい}！"
        : "ざんねん…"
      : `きみ ${describeGuess(guess, unit, profile?.grade)} → こたえ ${formatNumber(evaluation.actual ?? 0, profile?.grade)}${unitKana(unit, profile?.grade)}`;

  if (step === "shoutai") {
    return (
      <Page>
        <ResultSummary question={selected} guess={guess} evaluation={evaluation} grade={profile?.grade} />
        <div className="mt-auto">
          <Button onClick={() => setStep("nazo")}>
            <Icon name="search" size={28} strokeWidth={2.8} />
            なぞときへ！
          </Button>
        </div>
      </Page>
    );
  }

  // なぞとき：解説は、えらんだときに 裏で作っている（2回目。#165）。まだなら すこし まつ。できなかったら もう一度 ためす
  if (step === "nazo" && (detail.status === "loading" || detail.status === "error")) {
    return (
      <Page title="なぞとき" icon={<Icon name="search" size={28} fill="#FFC83D" strokeWidth={2.4} />} onBack={() => setStep("shoutai")}>
        {detail.status === "loading" ? (
          <div role="status" aria-live="polite" className="flex flex-1 flex-col items-center justify-center gap-5">
            <Navigator mood="think" size={160} />
            <p className="text-center font-pop text-[24px] font-normal leading-normal">
              <Jp big>{"なぞを {調|しら}べているよ"}</Jp>
              <span aria-hidden className="inline-flex gap-1 pl-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="inline-block size-2.5 animate-pulse rounded-full bg-navi" style={{ animationDelay: `${i * 0.25}s` }} />
                ))}
              </span>
            </p>
          </div>
        ) : (
          <>
            <ErrorNotice onRetry={retryDetail}>{detail.message}</ErrorNotice>
            <LinkButton href="/choose" variant="sub">
              <Jp big>{"ほかの はてなを {選|えら}ぶ"}</Jp>
            </LinkButton>
          </>
        )}
      </Page>
    );
  }

  if (step === "nazo") {
    return (
      <Page title="なぞとき" icon={<Icon name="search" size={28} fill="#FFC83D" strokeWidth={2.4} />} onBack={() => setStep("shoutai")}>
        <Say mood="happy" size={88}>
          <RubyText kana text={selected.explanation.short} />
        </Say>
        <ExplanationSteps question={selected} />
        <ThinkMore question={selected} />
        <TryIt question={selected} />
        <Related question={selected} />
        <Sources question={selected} />
        <div className="mt-auto flex gap-2.5">
          <button
            type="button"
            onClick={() => setStep("get")}
            className="flex h-[68px] flex-1 items-center justify-center rounded-3xl border-3 border-ink bg-white text-lg font-black shadow-pop-md active:translate-y-[4px] active:shadow-none"
          >
            <Jp>{"ずかんに {残|のこ}す"}</Jp>
          </button>
          {canChange && (
            <button
              type="button"
              onClick={() => setStep("moshimo")}
              className="flex h-[68px] flex-1 items-center justify-center rounded-3xl border-3 border-ink bg-pink font-pop text-[21px] shadow-pop-md active:translate-y-[4px] active:shadow-none"
            >
              もっと！
            </button>
          )}
        </div>
      </Page>
    );
  }

  if (step === "moshimo") {
    return (
      <Page title="もっと {知|し}りたい！" onBack={() => setStep("nazo")}>
        <Say mood="think" size={90}>
          <span className="text-[19px]">
            {selected.whatIf ? <RubyText kana text={selected.whatIf} /> : <Jp>{"{条件|じょうけん}を {変|か}えると、{答|こた}えは どうなるかな？"}</Jp>}
          </span>
        </Say>
        <ConditionSliders question={selected} values={scope} onChange={setValues} grade={profile?.grade} />
        <div className="mt-auto">
          <Button onClick={() => setStep("get")}>
            <Jp big>{"ずかんに {残|のこ}す！"}</Jp>
          </Button>
        </div>
      </Page>
    );
  }

  return (
    <Page onBack={saved ? undefined : () => setStep(canChange ? "moshimo" : "nazo")}>
      {crop ? (
        <SavePanel question={selected} guess={guess} rating={evaluation.rating} image={crop.dataUrl} summary={summary} />
      ) : (
        <ErrorNotice>
          <Jp big>{"{写真|しゃしん}が {見|み}つからなかったよ。もう{一度|いちど} とってみてね。"}</Jp>
        </ErrorNotice>
      )}
    </Page>
  );
}

export default function ResultPage() {
  return (
    <Gate>
      <ResultContent />
    </Gate>
  );
}
