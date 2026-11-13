"use client";

import { Jp } from "@/components/RubyText";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useApp } from "@/components/AuthProvider";
import { Gate } from "@/components/Gate";
import { Page } from "@/components/Page";
import { PredictionForm } from "@/components/PredictionForm";
import { QuestionHint, QuestionText, SUBJECT_STYLE } from "@/components/QuestionCard";
import { useQuiz } from "@/components/QuizProvider";
import { LinkButton, Say } from "@/components/ui";
import { SUBJECT_JP } from "@/lib/constants";

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
      <Page title="せーので {予想|よそう}！" back="/choose">
        <Say mood="happy">
          <Jp big>{"この はてなは、もう {予想|よそう}したよ！"}</Jp>
          <br />
          <Jp big>{"こたえを {見|み}るか、ほかの はてなを {選|えら}んでね。"}</Jp>
        </Say>
        <div className="mt-auto flex flex-col gap-3.5">
          <LinkButton href="/result">
            <Jp big>{"こたえを {見|み}る"}</Jp>
          </LinkButton>
          <LinkButton href="/choose" variant="sub">
            <Jp>{"ほかの はてなを {選|えら}ぶ"}</Jp>
          </LinkButton>
        </div>
      </Page>
    );
  }

  const style = SUBJECT_STYLE[selected.subject];
  const hint =
    selected.type === "why"
      ? "これかな？と {思|おも}った ものを {選|えら}んでね！"
      : selected.type === "compare"
        ? "なんとなくで いいよ！"
        : "ぱっと {思|おも}った {数|かず}で いいよ！";

  return (
    <Page title="せーので {予想|よそう}！" back="/choose">
      <section className={`rounded-[26px] px-5 py-3.5 ${style.light}`}>
        <span className={`text-sm font-black ${style.dark}`}>
          <Jp>{`${SUBJECT_JP[selected.subject]}の はてな`}</Jp>
        </span>
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
          <Say mood="effort" size={80}>
            <Jp className="text-[19px]">{hint}</Jp>
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
