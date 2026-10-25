"use client";

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
    <Page title="ぐるっと つかまえよう！" back={photoFrom}>
      <LassoPicker photo={photo} points={points} onChange={setPoints} />
      <Say mood={points ? "happy" : "think"} size={84}>
        {points ? (
          <>
            これで いいかな？
            <br />
            ちがうときは もういちど！
          </>
        ) : (
          <>
            <ruby>
              気<rt>き</rt>
            </ruby>
            になる ところを
            <br />
            ゆびで ぐるっと！
          </>
        )}
      </Say>
      {error && (
        <p role="alert" className="rounded-[20px] bg-pink-light px-4 py-3 text-base font-black text-pink-dark">
          {error}
        </p>
      )}
      <div className="flex gap-2.5">
        <Button variant="sub" className="flex-1 !h-14 !text-lg" onClick={() => setPoints(null)} disabled={!points || busy}>
          <Icon name="undo" size={22} strokeWidth={2.6} />
          もどす
        </Button>
        <LinkButton href="/capture" variant="sub" className="flex-1 !h-14 !text-lg">
          <Icon name="camera" size={22} />
          とりなおす
        </LinkButton>
      </div>
      <div className="mt-auto pt-1.5">
        <Button onClick={confirm} disabled={!points || busy}>
          <Icon name="lasso" size={30} strokeWidth={2.6} />
          {busy ? "まってね…" : "つかまえる！"}
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
