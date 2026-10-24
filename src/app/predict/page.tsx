"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useApp } from "@/components/AuthProvider";
import { Gate } from "@/components/Gate";
import { Page } from "@/components/Page";
import { PredictionForm } from "@/components/PredictionForm";
import { QuestionHint, QuestionText, SUBJECT_STYLE } from "@/components/QuestionCard";
import { useQuiz } from "@/components/QuizProvider";
import { Say } from "@/components/ui";
import { SUBJECT_KANA } from "@/lib/constants";

function PredictContent() {
  const router = useRouter();
  const { profile } = useApp();
  const { selected, crop, setGuess } = useQuiz();

  useEffect(() => {
    if (!selected) router.replace(crop ? "/choose" : "/capture");
  }, [selected, crop, router]);

  if (!selected || !profile) return null;

  const style = SUBJECT_STYLE[selected.subject];

  return (
    <Page title="せーのでよそう！" back="/choose">
      <section className={`rounded-[26px] border-3 border-ink px-5 py-3.5 shadow-pop-md ${style.light}`}>
        <span className={`text-sm font-black ${style.dark}`}>{SUBJECT_KANA[selected.subject]}の はてな</span>
        <QuestionText question={selected} size={23} />
        <QuestionHint question={selected} />
      </section>
      <PredictionForm
        question={selected}
        grade={profile.grade}
        onSubmit={(guess) => {
          setGuess(guess);
          router.push("/result");
        }}
        hint={
          <Say mood="effort" size={76}>
            ぱっと おもった かずで いいよ！
          </Say>
        }
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
