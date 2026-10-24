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
import { Button, ErrorNotice, LinkButton } from "@/components/ui";

/** 「ちがうよ」のあと：どうする？（見本 09） */
function Denied() {
  return (
    <div className="relative flex flex-1 flex-col items-center gap-4 pt-12">
      <Confetti tone="calm" />
      <Navigator mood="sorry" size={180} />
      <h2 className="text-center font-pop text-[30px] font-normal leading-normal">
        あれれ？
        <br />
        どうする？
      </h2>
      <div className="mt-3.5 flex w-full flex-col gap-4">
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

  const loading = generation.status === "loading" || generation.status === "idle";

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

      {loading && <Loading image={crop.dataUrl} />}

      {generation.status === "ready" && !generation.data.recognition.canAsk && (
        <>
          <div className="relative flex flex-1 flex-col items-center gap-4 pt-6">
            <Confetti tone="calm" />
            <Navigator mood="sorry" size={160} />
            <p className="rounded-card border-3 border-ink bg-white px-4 py-3 text-center text-[19px] font-black leading-[1.75] shadow-pop-sm">
              この しゃしんからは、
              <br />
              はてなが 作れなかったよ。
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

      {generation.status === "ready" && generation.data.recognition.canAsk && (
        <div className="flex flex-1 flex-col items-center gap-4">
          <CropCircle src={crop.dataUrl} alt="つかまえた ところ" />
          <div className="mt-1.5 flex w-full items-center gap-3">
            <Navigator mood="think" size={112} />
            <div className="relative grow rounded-card border-3 border-ink bg-white px-[18px] py-3.5 font-pop text-[24px] leading-normal shadow-pop-sm">
              <span aria-hidden className="absolute -left-[11px] top-[calc(50%-9px)] size-4 rotate-45 border-b-3 border-l-3 border-ink bg-white" />
              <span className="relative">
                これは
                <br />
                <RubyText text={generation.data.recognition.label} /> だね？
              </span>
            </div>
          </div>
          <div className="mt-auto flex w-full flex-col gap-3.5 pt-3">
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
