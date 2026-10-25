"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useArchive } from "@/components/ArchiveProvider";
import { useApp } from "@/components/AuthProvider";
import { CropCircle } from "@/components/CropCircle";
import { Gate } from "@/components/Gate";
import { Icon } from "@/components/Icons";
import { Loading } from "@/components/Loading";
import { Page } from "@/components/Page";
import { Eyebrow, QuestionText, SUBJECT_STYLE, SubjectIcon } from "@/components/QuestionCard";
import { useQuiz } from "@/components/QuizProvider";
import { RubyText } from "@/components/RubyText";
import { Button, ErrorNotice, Say } from "@/components/ui";
import { requestCustom } from "@/lib/api";
import { messageOf } from "@/lib/errors";
import { buildGenerationContext } from "@/lib/progress";
import type { FirstMode } from "@/lib/types";

// 「こんな ことばから はじめてみよう」（見本 11）
const STARTERS: { text: string; color: string }[] = [
  { text: "なんかい？", color: "bg-navi-light" },
  { text: "どっちが おおきい？", color: "bg-pink-light" },
  { text: "なぜ？", color: "bg-mint-light" },
];

function ChooseContent() {
  const router = useRouter();
  const { backend, profile } = useApp();
  const { archives } = useArchive();
  const { crop, scene, generation, regenerate, selectQuestion } = useQuiz();
  const [mode, setMode] = useState<FirstMode>(profile?.firstMode ?? "choices");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [sorry, setSorry] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!crop) router.replace("/capture");
    else if (generation.status === "ready" && generation.data.questions.length === 0) router.replace("/recognize");
  }, [crop, generation, router]);

  if (!crop || !profile) return null;

  const label = generation.status === "ready" ? generation.data.recognition.label : "";

  async function submitCustom(event: React.FormEvent) {
    event.preventDefault();
    if (!crop || !profile) return;
    setBusy(true);
    setSorry(null);
    setError(null);
    try {
      const result = await requestCustom(backend, {
        image: crop.base64,
        ...buildGenerationContext(profile, archives.map((a) => a.question)),
        text: text.trim(),
        ...(scene ? { scene } : {}),
      });
      if (result.answerable && result.question) {
        selectQuestion(result.question);
        router.push("/predict");
        return;
      }
      setSorry(result.reason ?? "べつの はてなに してみてね");
    } catch (e) {
      setError(messageOf(e));
    }
    setBusy(false);
  }

  const tabs: [FirstMode, string][] = [
    ["choices", "3つから えらぶ"],
    ["custom", "じぶんで かく"],
  ];

  return (
    <Page>
      <header className="-mt-1 flex h-14 items-center gap-2.5">
        <button
          type="button"
          aria-label="もどる"
          onClick={() => router.push("/recognize")}
          className="flex size-[50px] shrink-0 items-center justify-center rounded-full border-3 border-ink bg-white shadow-pop-xs active:translate-y-[3px] active:shadow-none"
        >
          <Icon name="back" size={24} strokeWidth={3} />
        </button>
        <CropCircle src={crop.dataUrl} alt="つかまえた ところ" size={54} />
        <h1 className="min-w-0 truncate font-pop text-xl font-normal">{label ? <RubyText kana text={label} /> : "はてな"} の はてな</h1>
      </header>

      <div role="tablist" className="grid grid-cols-2 gap-1.5 rounded-[26px] border-3 border-ink bg-white p-[5px]">
        {tabs.map(([value, tabLabel]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={mode === value}
            onClick={() => {
              setMode(value);
              setSorry(null);
              setError(null);
            }}
            className={`h-12 rounded-[20px] ${mode === value ? "bg-navi font-pop text-base text-white" : "text-[17px] font-black text-ink-sub"}`}
          >
            {tabLabel}
          </button>
        ))}
      </div>

      {mode === "choices" && (
        <>
          {generation.status === "error" && <ErrorNotice onRetry={regenerate}>{generation.message}</ErrorNotice>}
          {(generation.status === "loading" || generation.status === "idle") && <Loading message="はてなを さがしているよ" image={crop.dataUrl} />}
          {generation.status === "ready" && generation.data.questions.length > 0 && (
            <>
              <Say mood="happy" size={78}>
                どの はてなが{" "}
                <ruby>
                  気<rt>き</rt>
                </ruby>
                になる？
              </Say>
              {generation.data.demo && (
                <p className="rounded-2xl border-[2.5px] border-ink bg-yellow-light px-3 py-2 text-center text-sm font-black">
                  みほんの はてなだよ（AIは つかっていないよ）
                </p>
              )}
              <ul className="mt-0.5 flex flex-col gap-3.5">
                {generation.data.questions.map((q, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => {
                        selectQuestion(q);
                        router.push("/predict");
                      }}
                      className={`flex w-full items-center gap-3 rounded-card border-3 border-ink p-3 text-left text-ink shadow-pop-md active:translate-y-[4px] active:shadow-none ${SUBJECT_STYLE[q.subject].light}`}
                    >
                      <SubjectIcon subject={q.subject} />
                      <span className="flex min-w-0 grow flex-col gap-0.5">
                        <Eyebrow question={q} />
                        <QuestionText question={q} size={19} />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-auto pt-2">
                <Button variant="sub" onClick={regenerate}>
                  <Icon name="dice" size={22} strokeWidth={2.4} />
                  ほかの はてなを だす
                </Button>
              </div>
            </>
          )}
        </>
      )}

      {mode === "custom" && (
        <form onSubmit={submitCustom} className="flex flex-1 flex-col gap-3.5">
          <Say mood="think" size={86}>
            この しゃしんの なにが{" "}
            <ruby>
              気<rt>き</rt>
            </ruby>
            になる？
          </Say>
          <div className="flex flex-col gap-2">
            <label htmlFor="q" className="font-pop text-lg">
              はてなを かいてみよう
            </label>
            <textarea
              id="q"
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={100}
              rows={3}
              required
              placeholder="れい：このタイルは ぜんぶで なんまい あるのかな？"
              className="h-[150px] resize-none rounded-card border-3 border-ink bg-white px-[18px] py-4 text-[21px] font-black leading-[1.6] text-ink outline-none focus:border-navi"
            />
            <span className="text-right text-sm font-bold text-ink-sub">{text.length} / 100</span>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="text-[15px] font-black text-ink-sub">こんな ことばから はじめてみよう</span>
            <div className="flex flex-wrap gap-2.5">
              {STARTERS.map((s) => (
                <button
                  key={s.text}
                  type="button"
                  onClick={() => setText(`${label ? `${label.replace(/\{([^{}|]+)\|[^{}|]+\}/g, "$1")} は ` : ""}${s.text}`)}
                  className={`h-[50px] rounded-[22px] border-3 border-ink px-[18px] text-lg font-black shadow-pop-sm active:translate-y-1 active:shadow-none ${s.color}`}
                >
                  {s.text}
                </button>
              ))}
            </div>
          </div>

          {busy && <Loading message="はてなを しらべているよ" image={crop.dataUrl} />}

          {sorry && (
            <div className="flex flex-col gap-3.5">
              <Say mood="sorry">{sorry}</Say>
              <Button
                variant="sub"
                onClick={() => {
                  setMode("choices");
                  setSorry(null);
                }}
              >
                3つの はてなから えらぶ
              </Button>
            </div>
          )}
          {error && (
            <p role="alert" className="rounded-[20px] bg-pink-light px-4 py-3 text-base font-black text-pink-dark">
              {error}
            </p>
          )}
          {!busy && (
            <div className="mt-auto pt-2">
              <Button type="submit" disabled={text.trim().length === 0} className="!text-[23px]">
                この はてなで いく！
              </Button>
            </div>
          )}
        </form>
      )}
    </Page>
  );
}

export default function ChoosePage() {
  return (
    <Gate>
      <ChooseContent />
    </Gate>
  );
}
