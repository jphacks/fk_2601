"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Gate } from "@/components/Gate";
import { LassoPicker } from "@/components/LassoPicker";
import { Page } from "@/components/Page";
import { useQuiz } from "@/components/QuizProvider";
import { Button, Say } from "@/components/ui";
import { messageOf } from "@/lib/errors";
import { cropLasso, type Point } from "@/lib/image";

function LassoContent() {
  const router = useRouter();
  const { photo, startGeneration } = useQuiz();
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
    <Page title="きになる ところを かこもう" back="/capture">
      <Say mood={points ? "happy" : "think"}>
        {points ? "これで いいかな？ ちがうときは、もういちど なぞってね。" : "ゆびで ぐるっと なぞって、気になる ところを 囲んでね。"}
      </Say>
      <LassoPicker photo={photo} points={points} onChange={setPoints} />
      {error && (
        <p role="alert" className="rounded-xl bg-berry/10 px-3 py-2 text-base font-bold text-berry">
          {error}
        </p>
      )}
      <div className="mt-auto grid grid-cols-2 gap-3">
        <Button variant="secondary" onClick={() => setPoints(null)} disabled={!points || busy}>
          やりなおす
        </Button>
        <Button onClick={confirm} disabled={!points || busy}>
          {busy ? "まってね…" : "これで OK！"}
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
