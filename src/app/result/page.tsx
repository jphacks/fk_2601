"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/components/AuthProvider";
import { ConditionSliders } from "@/components/ConditionSliders";
import { ExplanationSteps, Related, Sources } from "@/components/Explanation";
import { Gate } from "@/components/Gate";
import { Icon } from "@/components/Icons";
import { Page } from "@/components/Page";
import { useQuiz } from "@/components/QuizProvider";
import { ResultSummary } from "@/components/ResultSummary";
import { RubyText } from "@/components/RubyText";
import { SavePanel } from "@/components/SavePanel";
import { Button, ErrorNotice, Say } from "@/components/ui";
import { defaultScope } from "@/lib/calc";
import { formatNumber } from "@/lib/format";
import { describeGuess, evaluate } from "@/lib/rating";
import { unitKana } from "@/lib/ruby";

// こたえあわせ → なぞとき → もしも → ずかんにのこす（見本 14〜19）
type Step = "shoutai" | "nazo" | "moshimo" | "get";

function ResultContent() {
  const router = useRouter();
  const { profile } = useApp();
  const { selected, guess, crop, saved } = useQuiz();
  // 保存したあとに もどってきたときは、保存した画面（はてなゲット！）から見せる
  const [step, setStep] = useState<Step>(() => (saved ? "get" : "shoutai"));
  const [values, setValues] = useState<Record<string, number> | null>(null);

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
        <ErrorNotice>この はてなは こたえを だせなかったよ。ほかの はてなを えらんでね。</ErrorNotice>
        <Button onClick={() => router.push("/choose")}>はてなを えらびなおす</Button>
      </Page>
    );
  }

  const canChange = selected.variables.length > 0 && selected.type !== "why";
  const scope = values ?? defaultScope(selected);
  const unit = evaluation.type === "compare" ? "倍" : selected.answerUnit;
  const summary =
    evaluation.type === "why"
      ? evaluation.rating === "pita"
        ? "せいかい！"
        : "ざんねん…"
      : `きみ ${describeGuess(guess, unit)} → こたえ ${formatNumber(evaluation.actual ?? 0)}${unitKana(unit)}`;

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

  if (step === "nazo") {
    return (
      <Page title="なぞとき" icon={<Icon name="search" size={28} fill="#FFC83D" strokeWidth={2.4} />} onBack={() => setStep("shoutai")}>
        <Say mood="happy" size={88}>
          <RubyText kana text={selected.explanation.short} />
        </Say>
        <ExplanationSteps question={selected} />
        <Related question={selected} />
        <Sources question={selected} />
        <div className="mt-auto flex gap-2.5">
          <button
            type="button"
            onClick={() => setStep("get")}
            className="flex h-[68px] flex-1 items-center justify-center rounded-3xl border-3 border-ink bg-white text-lg font-black shadow-pop-md active:translate-y-[4px] active:shadow-none"
          >
            ずかんに のこす
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
      <Page title="もっとしりたい！" onBack={() => setStep("nazo")}>
        <Say mood="think" size={90}>
          <span className="text-[19px]">
            {selected.whatIf ? <RubyText kana text={selected.whatIf} /> : "じょうけんを かえると、こたえは どうなるかな？"}
          </span>
        </Say>
        <ConditionSliders question={selected} values={scope} onChange={setValues} grade={profile?.grade} />
        <div className="mt-auto">
          <Button onClick={() => setStep("get")}>ずかんに のこす！</Button>
        </div>
      </Page>
    );
  }

  return (
    <Page onBack={saved ? undefined : () => setStep(canChange ? "moshimo" : "nazo")}>
      {crop ? (
        <SavePanel question={selected} guess={guess} rating={evaluation.rating} image={crop.dataUrl} summary={summary} />
      ) : (
        <ErrorNotice>しゃしんが みつからなかったよ。もういちど とってみてね。</ErrorNotice>
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
