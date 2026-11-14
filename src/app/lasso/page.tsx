"use client";

import { Jp } from "@/components/RubyText";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Gate } from "@/components/Gate";
import { Icon } from "@/components/Icons";
import { LassoPicker } from "@/components/LassoPicker";
import { Page } from "@/components/Page";
import { useQuiz } from "@/components/QuizProvider";
import { Button, LinkButton, Say } from "@/components/ui";
import { messageOf } from "@/lib/errors";
import { cropLasso, type Point } from "@/lib/image";

function LassoContent() {
  const router = useRouter();
  const { photo, photoFrom, startGeneration } = useQuiz();
  const [points, setPoints] = useState<Point[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!photo) router.replace("/capture");
  }, [photo, router]);

  if (!photo) return null;

  async function confirm() {
    if (!photo || !points) return;
    setBusy(true);
    setError(null);
    try {
      const crop = await cropLasso(photo, points);
      startGeneration(crop);
      router.push("/recognize");
    } catch (e) {
      setError(messageOf(e));
      setBusy(false);
    }
  }

  return (
    // もどるは、写真を手に入れた画面へ（ホームの見本の絵・アルバムなら ホーム、撮影の画面なら 撮影）。
    // 履歴で1つ前にもどると、はてなの画面から「かこみなおす」で来たときに そちらへもどってしまうので、行き先を決めておく
    <Page title="ぐるっと {囲|かこ}もう！" back={photoFrom}>
      <LassoPicker photo={photo} points={points} onChange={setPoints} />
      {/* 写真を大きく見せたいので、ナビは 小さな ふきだしで ひとことだけ言う */}
      <Say mood={points ? "happy" : "think"} size={56} small>
        {points ? (
          <>
            これで いいかな？
            <br />
            <Jp>{"「OK！」を {押|お}してね"}</Jp>
          </>
        ) : (
          <>
            <Jp>{"{気|き}になる ところを"}</Jp>
            <br />
            <Jp>{"{指|ゆび}で ぐるっと {囲|かこ}もう！"}</Jp>
          </>
        )}
      </Say>
      {error && (
        <p role="alert" className="rounded-[20px] bg-pink-light px-4 py-3 text-base font-black text-pink-dark">
          <Jp>{error}</Jp>
        </p>
      )}
      <div className="flex gap-2.5">
        <Button variant="sub" className="flex-1 !h-14 whitespace-nowrap !px-2 !text-lg" onClick={() => setPoints(null)} disabled={!points || busy}>
          <Icon name="undo" size={22} strokeWidth={2.6} />
          もどす
        </Button>
        <LinkButton href="/capture" variant="sub" className="flex-1 !h-14 whitespace-nowrap !px-2 !text-lg">
          <Icon name="camera" size={22} />
          とりなおす
        </LinkButton>
      </div>
      {/* 写真が縦に長くても、スクロールなしで「OK！」が見えるよう、画面の下にとめる（囲む場所は変えない） */}
      <div className="sticky bottom-0 z-10 mt-auto -mx-6 bg-gradient-to-t from-white from-70% to-transparent px-6 pb-[30px] pt-6 -mb-[30px]">
        <Button onClick={confirm} disabled={!points || busy}>
          {busy ? <Jp big>{"{待|ま}ってね…"}</Jp> : "OK！"}
        </Button>
      </div>
    </Page>
  );
}

export default function LassoPage() {
  return (
    <Gate>
      <LassoContent />
    </Gate>
  );
}
