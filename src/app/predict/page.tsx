"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useApp } from "@/components/AuthProvider";
import { Gate } from "@/components/Gate";
import { Page } from "@/components/Page";
import { PredictionForm } from "@/components/PredictionForm";
import { Chips, QuestionText } from "@/components/QuestionCard";
import { useQuiz } from "@/components/QuizProvider";
import { Card, Say } from "@/components/ui";

function PredictContent() {
  const router = useRouter();
  const { profile } = useApp();
  const { selected, crop, setGuess } = useQuiz();

  useEffect(() => {
    if (!selected) router.replace(crop ? "/choose" : "/capture");
  }, [selected, crop, router]);

  if (!selected || !profile) return null;

  return (
    <Page title="こたえを よそうしよう" back="/choose">
      <Card className="space-y-3">
        <Chips question={selected} />
        <QuestionText question={selected} />
      </Card>
      <Say mood="think">こたえは まだ ひみつ！ まず、きみの 直感で よそうしてね。</Say>
      <PredictionForm
        question={selected}
        grade={profile.grade}
        onSubmit={(guess) => {
          setGuess(guess);
          router.push("/result");
        }}
      />
    </Page>
  );
}

export default function PredictPage() {
  return (
    <Gate>
      <PredictContent />
    </Gate>
  );
}
