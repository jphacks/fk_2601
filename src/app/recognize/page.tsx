"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Gate } from "@/components/Gate";
import { Loading } from "@/components/Loading";
import { Page } from "@/components/Page";
import { useQuiz } from "@/components/QuizProvider";
import { Button, ErrorNotice, LinkButton, Say } from "@/components/ui";

function RecognizeContent() {
  const router = useRouter();
  const { crop, generation, regenerate } = useQuiz();
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (!crop) router.replace("/capture");
  }, [crop, router]);

  if (!crop) return null;

  return (
    <Page title="なにが うつってる？" back="/lasso">
      {generation.status === "error" && (
        <>
          <ErrorNotice onRetry={regenerate}>{generation.message}</ErrorNotice>
          <LinkButton href="/capture" variant="secondary">
            しゃしんを とりなおす
          </LinkButton>
        </>
      )}

      {(generation.status === "loading" || generation.status === "idle") && (
        <Loading message="しゃしんを 見ているよ…" />
      )}

      {generation.status === "ready" && !generation.data.recognition.canAsk && (
        <>
          <Say mood="sorry">この しゃしんからは、もんだいが 作れなかったよ。べつの ものを 囲んでみてね。</Say>
          <div className="mt-auto space-y-3">
            <LinkButton href="/lasso">かこみなおす</LinkButton>
            <LinkButton href="/capture" variant="secondary">
              しゃしんを とりなおす
            </LinkButton>
          </div>
        </>
      )}

      {generation.status === "ready" && generation.data.recognition.canAsk && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- 囲んだ部分の切り抜き（data URL） */}
          <img src={crop.dataUrl} alt="囲んだ ところ" className="mx-auto max-h-64 rounded-3xl bg-white object-contain shadow-sm" />
          <Say mood={denied ? "sorry" : "think"}>
            {denied ? (
              "ごめんね！ もういちど やってみよう。"
            ) : (
              <>
                これは「<b>{generation.data.recognition.label}</b>」だね？
              </>
            )}
          </Say>
          <div className="mt-auto space-y-3">
            {denied ? (
              <>
                <LinkButton href="/lasso">かこみなおす</LinkButton>
                <LinkButton href="/capture" variant="secondary">
                  しゃしんを とりなおす
                </LinkButton>
              </>
            ) : (
              <>
                <Button onClick={() => router.push("/choose")}>そうだよ！</Button>
                <Button variant="secondary" onClick={() => setDenied(true)}>
                  ちがうよ
                </Button>
              </>
            )}
          </div>
        </>
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
