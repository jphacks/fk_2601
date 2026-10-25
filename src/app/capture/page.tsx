"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useRef, useState } from "react";
import { AlbumPicker } from "@/components/AlbumPicker";
import { Gate } from "@/components/Gate";
import { Icon } from "@/components/Icons";
import { Navigator } from "@/components/Navigator";
import { SafetyNotice } from "@/components/SafetyNotice";
import { useQuiz } from "@/components/QuizProvider";
import { messageOf } from "@/lib/errors";
import { photoFromVideo } from "@/lib/image";

type CameraState = "starting" | "live" | "unavailable";

function CaptureContent() {
  const router = useRouter();
  const { setPhoto } = useQuiz();
  const params = useSearchParams();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [camera, setCamera] = useState<CameraState>("starting");
  const [error, setError] = useState<string | null>(null);
  // 「はてなを さがす！」から来たときは、やくそくを してから カメラを起動する
  const [agreed, setAgreed] = useState(() => params.get("yakusoku") === null);

  useEffect(() => {
    if (!agreed) return;
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
  }, [agreed]);

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

  return (
    <>
      {/* 画面ぜんたいに出すので、動きのついた main の外に置く（transform の中では fixed が効かない） */}
      {!agreed && (
        <SafetyNotice
          onAgree={() => {
            setAgreed(true);
            // もどってきたときに、もう一度 出さないように URL から消す
            router.replace("/capture");
          }}
        />
      )}
      <main className="animate-rise flex h-dvh min-h-[600px] flex-col gap-4 p-6">
        <div className="flex h-[52px] items-center justify-between">
          <h1 className="font-pop text-2xl font-normal">しゃしんを とろう！</h1>
          <Link
            href="/"
            aria-label="とじる"
            className="flex size-[50px] items-center justify-center rounded-full border-3 border-ink bg-white shadow-pop-xs active:translate-y-[3px] active:shadow-none"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#22223A" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </Link>
        </div>

        <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden rounded-[32px] bg-photo">
          <video ref={videoRef} playsInline muted className={`absolute inset-0 size-full object-cover ${camera === "live" ? "" : "invisible"}`} />

          {camera === "starting" && <p className="relative px-6 text-center text-lg font-black text-ink-sub">カメラを じゅんびしているよ…</p>}
          {camera === "unavailable" && (
            <p className="relative px-6 text-center text-lg font-black leading-relaxed text-ink-sub">
              カメラが つかえなかったよ。
              <br />
              おうちの ひとに 「カメラを つかって いいよ」の せっていを たのむか、アルバムから えらんでね。
            </p>
          )}

          {/* ねらいの かど */}
          <svg aria-hidden="true" viewBox="0 0 336 534" preserveAspectRatio="xMidYMid slice" className="pointer-events-none absolute inset-0 size-full">
            <g fill="none" strokeLinecap="round" strokeLinejoin="round">
              <path d="M56 150v-34h34M246 116h34v34M280 300v34h-34M90 334H56v-34" stroke="#22223A" strokeWidth="12" />
              <path d="M56 150v-34h34M246 116h34v34M280 300v34h-34M90 334H56v-34" stroke="#FFC83D" strokeWidth="6" />
            </g>
          </svg>

          {/* 撮影時の注意（docs/02-spec.md 3章） */}
          <span className="absolute inset-x-3.5 top-3.5 flex items-center gap-2 rounded-2xl bg-pink-light px-3 py-2 text-[15px] font-black text-pink-dark">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#A12A55" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true" className="shrink-0">
              <circle cx="12" cy="12" r="8" />
              <line x1="4" y1="4" x2="20" y2="20" />
            </svg>
            ひとの かおは とらないでね。まわりにも きをつけてね
          </span>

          <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
            <Navigator mood="happy" size={68} />
            <span className="rounded-[18px] bg-white px-3.5 py-2 text-base font-black">どこに あるかな？</span>
          </div>
        </div>

        {error && (
          <p role="alert" className="rounded-[20px] bg-pink-light px-4 py-3 text-base font-black text-pink-dark">
            {error}
          </p>
        )}

        <div className="grid h-[108px] shrink-0 grid-cols-3 items-center">
          <AlbumPicker className="flex flex-col items-center gap-1.5 justify-self-start text-sm font-black">
            <span className="flex size-16 items-center justify-center rounded-[22px] border-3 border-ink bg-yellow shadow-pop-sm">
              <Icon name="album" size={30} strokeWidth={2.2} />
            </span>
            アルバム
          </AlbumPicker>
          <button
            type="button"
            aria-label="とる"
            onClick={shoot}
            disabled={camera !== "live"}
            className="flex size-24 items-center justify-center justify-self-center rounded-full border-3 border-ink bg-white shadow-pop-md active:translate-y-[5px] active:shadow-none disabled:opacity-40"
          >
            <span className="size-[70px] rounded-full border-3 border-ink bg-pink" />
          </button>
          <span />
        </div>
      </main>
    </>
  );
}

export default function CapturePage() {
  return (
    <Gate>
      {/* ?yakusoku=1 を読むため */}
      <Suspense>
        <CaptureContent />
      </Suspense>
    </Gate>
  );
}
