"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Confetti } from "@/components/Decor";
import { CropCircle } from "@/components/CropCircle";
import { Gate } from "@/components/Gate";
import { Icon } from "@/components/Icons";
import { Loading } from "@/components/Loading";
import { Navigator } from "@/components/Navigator";
import { Page } from "@/components/Page";
import { useQuiz } from "@/components/QuizProvider";
import { RubyText } from "@/components/RubyText";
import { Button, ErrorNotice, LinkButton, Say } from "@/components/ui";

/** 「ちがうよ」のあと：どうする？（見本 09） */
function Denied() {
  return (
    <div className="relative flex flex-1 flex-col items-center gap-4">
      <Confetti tone="calm" />
      <div className="mt-auto">
        <Navigator mood="sorry" size={180} />
      </div>
      <h2 className="text-center font-pop text-[30px] font-normal leading-normal">
        あれれ？
        <br />
        どうする？
      </h2>
      <div className="mt-auto flex w-full flex-col gap-4">
        <LinkButton
          href="/capture"
          variant="plain"
          className="h-[104px] !justify-start gap-4 rounded-[28px] border-3 border-ink bg-yellow font-pop text-[21px] text-ink shadow-pop active:translate-y-[6px] active:shadow-none"
        >
          <span className="flex size-[62px] shrink-0 items-center justify-center rounded-full border-3 border-ink bg-white">
            <Icon name="camera" size={32} />
          </span>
          しゃしんを とりなおす
        </LinkButton>
        <LinkButton
          href="/lasso"
          variant="plain"
          className="h-[104px] !justify-start gap-4 rounded-[28px] border-3 border-ink bg-pink font-pop text-[21px] text-ink shadow-pop active:translate-y-[6px] active:shadow-none"
        >
          <span className="flex size-[62px] shrink-0 items-center justify-center rounded-full border-3 border-ink bg-white">
            <Icon name="lasso" size={32} />
          </span>
          かこみなおす
        </LinkButton>
      </div>
    </div>
  );
}

function RecognizeContent() {
  const router = useRouter();
  const { crop, generation, regenerate } = useQuiz();
  const [denied, setDenied] = useState(false);
  // 待ちの画面で「できた！ みてみる」を押したか（もどってきたときなど、はじめから できていれば待ちは出さない）
  const [revealed, setRevealed] = useState(generation.status === "ready");

  useEffect(() => {
    if (!crop) router.replace("/capture");
  }, [crop, router]);

  if (!crop) return null;

  if (denied) {
    return (
      <Page back="/lasso">
        <Denied />
      </Page>
    );
  }

  const waiting = generation.status === "loading" || generation.status === "idle" || (generation.status === "ready" && !revealed);

  return (
    <Page back="/lasso">
      {generation.status === "error" && (
        <>
          <ErrorNotice onRetry={regenerate}>{generation.message}</ErrorNotice>
          <LinkButton href="/capture" variant="sub">
            しゃしんを とりなおす
          </LinkButton>
        </>
      )}

      {waiting && <Loading image={crop.dataUrl} done={generation.status === "ready"} onDone={() => setRevealed(true)} />}

      {!waiting && generation.status === "ready" && !generation.data.recognition.canAsk && (
        <>
          <div className="relative flex flex-1 flex-col items-center gap-4">
            <Confetti tone="calm" />
            <div className="mt-auto">
              <Navigator mood="sorry" size={160} />
            </div>
            <p className="rounded-card bg-navi-light px-4 py-3 text-center text-[19px] font-black leading-[1.75]">
              この しゃしんからは、
              <br />
              はてなが つくれなかったよ。
              <br />
              べつの ものを かこんでみてね。
            </p>
          </div>
          <div className="mt-auto flex flex-col gap-3.5">
            <LinkButton href="/lasso" variant="seeno">
              かこみなおす
            </LinkButton>
            <LinkButton href="/capture" variant="sub">
              しゃしんを とりなおす
            </LinkButton>
          </div>
        </>
      )}

      {!waiting && generation.status === "ready" && generation.data.recognition.canAsk && (
        <div className="flex flex-1 flex-col items-center gap-4">
          <div className="mt-auto">
            <CropCircle src={crop.dataUrl} alt="つかまえた ところ" />
          </div>
          <div className="w-full">
            <Say mood="think" size={112}>
              <span className="font-pop text-[24px] font-normal leading-normal">
                これは
                <br />
                <RubyText text={generation.data.recognition.label} /> だね？
              </span>
            </Say>
          </div>
          <div className="mt-auto flex w-full flex-col gap-3.5">
            <Button variant="plain" className="h-[76px] rounded-[28px] border-3 border-ink bg-mint font-pop text-[26px] text-ink shadow-pop active:translate-y-[6px] active:shadow-none" onClick={() => router.push("/choose")}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22223A" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12l5 5 9-10" />
              </svg>
              うん！
            </Button>
            <Button variant="plain" className="h-16 rounded-[24px] border-3 border-ink bg-white text-[21px] font-black text-ink shadow-pop-md active:translate-y-[5px] active:shadow-none" onClick={() => setDenied(true)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22223A" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
              ちがうよ
            </Button>
          </div>
        </div>
      )}
    </Page>
  );
}

export default function RecognizePage() {
  return (
    <Gate>
      <RecognizeContent />
    </Gate>
  );
}
