"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useApp } from "@/components/AuthProvider";
import { Gate } from "@/components/Gate";
import { Page } from "@/components/Page";
import { PredictionForm } from "@/components/PredictionForm";
import { QuestionHint, QuestionText, SUBJECT_STYLE } from "@/components/QuestionCard";
import { useQuiz } from "@/components/QuizProvider";
import { LinkButton, Say } from "@/components/ui";
import { SUBJECT_KANA } from "@/lib/constants";

function PredictContent() {
  const router = useRouter();
  const { profile } = useApp();
  const { selected, crop, guess, setGuess } = useQuiz();

  useEffect(() => {
    if (!selected) router.replace(crop ? "/choose" : "/capture");
  }, [selected, crop, router]);

  if (!selected || !profile) return null;

  // 答えを見たあとは、予想を変えられないようにする（もどってきたときは、答え合わせか、ほかの はてなへ）
  if (guess) {
    return (
      <Page title="せーので よそう！" back="/choose">
        <Say mood="happy">
          この はてなは、もう よそうしたよ！
          <br />
          こたえを みるか、ほかの はてなを えらんでね。
        </Say>
        <div className="mt-auto flex flex-col gap-3.5 pt-2">
          <LinkButton href="/result">こたえを みる</LinkButton>
          <LinkButton href="/choose" variant="sub">
            ほかの はてなを えらぶ
          </LinkButton>
        </div>
      </Page>
    );
  }

  const style = SUBJECT_STYLE[selected.subject];
  const hint =
    selected.type === "why"
      ? "これかな？と おもった ものを えらんでね！"
      : selected.type === "compare"
        ? "なんとなくで いいよ！"
        : "ぱっと おもった かずで いいよ！";

  return (
    <Page title="せーので よそう！" back="/choose">
      <section className={`rounded-[26px] border-3 border-ink px-5 py-3.5 shadow-pop-md ${style.light}`}>
        <span className={`text-sm font-black ${style.dark}`}>{SUBJECT_KANA[selected.subject]}の はてな</span>
        <QuestionText question={selected} size={23} />
        <QuestionHint question={selected} />
      </section>
      <PredictionForm
        question={selected}
        grade={profile.grade}
        onSubmit={(next) => {
          setGuess(next);
          router.push("/result");
        }}
        hint={
          <Say mood="effort" size={76}>
            {hint}
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
