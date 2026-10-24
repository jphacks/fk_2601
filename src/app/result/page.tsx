"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ConditionSliders } from "@/components/ConditionSliders";
import { ExplanationSteps, Related, Sources } from "@/components/Explanation";
import { Gate } from "@/components/Gate";
import { Icon } from "@/components/Icons";
import { Navigator } from "@/components/Navigator";
import { Page } from "@/components/Page";
import { useQuiz } from "@/components/QuizProvider";
import { ResultSummary } from "@/components/ResultSummary";
import { RubyText } from "@/components/RubyText";
import { SavePanel } from "@/components/SavePanel";
import { Button, ErrorNotice, Say } from "@/components/ui";
import { defaultScope } from "@/lib/calc";
import { formatNumber } from "@/lib/format";
import { describeGuess, evaluate } from "@/lib/rating";

// しょうたい → なぞとき → もしも → ずかんにのこす（見本 14〜19）
type Step = "shoutai" | "nazo" | "moshimo" | "get";

function ResultContent() {
  const router = useRouter();
  const { selected, guess, crop } = useQuiz();
  const [step, setStep] = useState<Step>("shoutai");
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
      <Page title="しょうたい" back="/predict">
        <ErrorNotice>この はてなは こたえを 出せなかったよ。ほかの はてなを えらんでね。</ErrorNotice>
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
      : `きみ ${describeGuess(guess, unit)} → こたえ ${formatNumber(evaluation.actual ?? 0)}${unit}`;

  if (step === "shoutai") {
    return (
      <Page>
        <ResultSummary question={selected} guess={guess} evaluation={evaluation} />
        <div className="mt-auto pt-2">
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
          <RubyText text={selected.explanation.short} />
        </Say>
        <ExplanationSteps question={selected} defaultOpen />
        <Related question={selected} />
        <Sources question={selected} />
        <div className="mt-auto flex gap-2.5 pt-2">
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
              もしも…？
            </button>
          )}
        </div>
      </Page>
    );
  }

  if (step === "moshimo") {
    return (
      <Page title="もしも…？" onBack={() => setStep("nazo")}>
        <div className="flex items-center gap-3">
          <Navigator mood="think" size={90} />
          <div className="relative grow rounded-[22px] border-3 border-ink bg-white px-4 py-2.5 text-[19px] font-black leading-[1.75] shadow-pop-sm">
            <span aria-hidden className="absolute -left-[11px] top-[calc(50%-9px)] size-4 rotate-45 border-b-3 border-l-3 border-ink bg-white" />
            <span className="relative">
              {selected.whatIf ? <RubyText text={selected.whatIf} /> : "じょうけんを かえると、こたえは どうなるかな？"}
            </span>
          </div>
        </div>
        <ConditionSliders question={selected} values={scope} onChange={setValues} />
        <div className="mt-auto pt-2">
          <Button onClick={() => setStep("get")}>ずかんに のこす！</Button>
        </div>
      </Page>
    );
  }

  return (
    <Page>
      {crop ? (
        <SavePanel question={selected} guess={guess} rating={evaluation.rating} image={crop.dataUrl} summary={summary} />
      ) : (
        <ErrorNotice>しゃしんが 見つからなかったよ。もういちど とってみてね。</ErrorNotice>
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
