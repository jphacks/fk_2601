"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ConditionSliders } from "@/components/ConditionSliders";
import { Explanation, Sources } from "@/components/Explanation";
import { Gate } from "@/components/Gate";
import { Page } from "@/components/Page";
import { Chips, QuestionText } from "@/components/QuestionCard";
import { useQuiz } from "@/components/QuizProvider";
import { ResultSummary } from "@/components/ResultSummary";
import { Button, Card, ErrorNotice, Say } from "@/components/ui";
import { defaultScope } from "@/lib/calc";
import { describeGuess, evaluate } from "@/lib/rating";

function ResultContent() {
  const router = useRouter();
  const { selected, guess, crop, reset } = useQuiz();
  const [revealed, setRevealed] = useState(false);
  const [values, setValues] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    if (!selected) router.replace(crop ? "/choose" : "/capture");
    else if (!guess) router.replace("/predict");
  }, [selected, guess, crop, router]);

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
      <Page title="答え合わせ" back="/predict">
        <ErrorNotice>この もんだいは 答えを 出せなかったよ。ほかの もんだいを えらんでね。</ErrorNotice>
        <Button onClick={() => router.push("/choose")}>もんだいを えらびなおす</Button>
      </Page>
    );
  }

  const scope = values ?? defaultScope(selected);

  function next(to: string) {
    reset();
    router.push(to);
  }

  return (
    <Page title="答え合わせ">
      <Card className="space-y-3">
        <Chips question={selected} />
        <QuestionText question={selected} />
      </Card>

      {!revealed ? (
        <>
          <Say mood="think">
            {evaluation.guessValue !== null
              ? `きみの よそうは「${describeGuess(guess, selected.answerUnit)}」だね。さあ、せいかいは…？`
              : "きみの よそうを うけとったよ。さあ、せいかいは…？"}
          </Say>
          <div className="mt-auto">
            <Button onClick={() => setRevealed(true)}>こたえを 見る！</Button>
          </div>
        </>
      ) : (
        <>
          <ResultSummary question={selected} guess={guess} evaluation={evaluation} />

          <Card>
            <Explanation question={selected} />
          </Card>

          {selected.variables.length > 0 && selected.type !== "why" && (
            <Card className="space-y-3">
              <h2 className="text-lg font-bold">もし ちがう じょうけんだったら？</h2>
              <p className="text-base">スライダーを うごかして、こたえが どう かわるか 見てみよう！</p>
              <ConditionSliders question={selected} values={scope} onChange={setValues} />
            </Card>
          )}

          <Sources question={selected} />

          <div className="mt-4 space-y-3">
            <Button onClick={() => next("/capture")}>つぎの しゃしんを とる</Button>
            <Button variant="ghost" onClick={() => next("/")}>
              ホームへ もどる
            </Button>
          </div>
        </>
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
