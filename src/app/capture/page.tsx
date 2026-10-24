"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Gate } from "@/components/Gate";
import { Loading } from "@/components/Loading";
import { Page } from "@/components/Page";
import { useQuiz } from "@/components/QuizProvider";
import { SafetyNotice } from "@/components/SafetyNotice";
import { Button, Say } from "@/components/ui";
import { messageOf } from "@/lib/errors";
import { photoFromFile, photoFromVideo } from "@/lib/image";

type CameraState = "starting" | "live" | "unavailable";

function CaptureContent() {
  const router = useRouter();
  const { setPhoto } = useQuiz();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [camera, setCamera] = useState<CameraState>("starting");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;
    (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("no camera api");
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false });
        const video = videoRef.current;
        if (cancelled || !video) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        video.srcObject = stream;
        await video.play();
        setCamera("live");
      } catch {
        if (!cancelled) setCamera("unavailable");
      }
    })();
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  function shoot() {
    const video = videoRef.current;
    if (!video) return;
    try {
      setPhoto(photoFromVideo(video));
      router.push("/lasso");
    } catch (e) {
      setError(messageOf(e));
    }
  }

  async function pick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      setPhoto(await photoFromFile(file));
      router.push("/lasso");
    } catch (e) {
      setError(messageOf(e));
      setBusy(false);
    }
  }

  return (
    <Page title="しゃしんを とろう" back="/">
      <SafetyNotice />
      {busy ? (
        <Loading message="しゃしんを よみこんでいるよ…" />
      ) : (
        <>
          <div className="relative overflow-hidden rounded-3xl bg-ink">
            <video
              ref={videoRef}
              playsInline
              muted
              className={`aspect-[3/4] w-full object-cover ${camera === "live" ? "" : "invisible h-0"}`}
            />
            {camera === "starting" && <p className="p-10 text-center text-white">カメラを じゅんびしているよ…</p>}
            {camera === "unavailable" && (
              <div className="p-4">
                <Say mood="sorry">
                  カメラが つかえなかったよ。おとなの人に 「カメラの きょか」を たのむか、アルバムから えらんでね。
                </Say>
              </div>
            )}
          </div>

          {error && (
            <p role="alert" className="rounded-xl bg-berry/10 px-3 py-2 text-base font-bold text-berry">
              {error}
            </p>
          )}

          <div className="mt-auto space-y-3">
            {camera === "live" && <Button onClick={shoot}>とる</Button>}
            <label className="inline-flex min-h-12 w-full cursor-pointer items-center justify-center rounded-2xl border-2 border-brand bg-white px-5 py-3 text-lg font-bold text-brand active:bg-brand/10">
              アルバムから えらぶ
              <input type="file" accept="image/*" className="sr-only" onChange={pick} />
            </label>
          </div>
        </>
      )}
    </Page>
  );
}

export default function CapturePage() {
  return (
    <Gate>
      <CaptureContent />
    </Gate>
  );
}
