"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useArchive } from "@/components/ArchiveProvider";
import { useApp } from "@/components/AuthProvider";
import { Gate } from "@/components/Gate";
import { Loading } from "@/components/Loading";
import { Page } from "@/components/Page";
import { Chips, QuestionText } from "@/components/QuestionCard";
import { useQuiz } from "@/components/QuizProvider";
import { Button, ErrorNotice, Say } from "@/components/ui";
import { requestCustom } from "@/lib/api";
import { messageOf } from "@/lib/errors";
import { buildGenerationContext } from "@/lib/progress";
import type { FirstMode } from "@/lib/types";

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
      setSorry(result.reason ?? "べつの 問いに してみてね");
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
    <Page title="もんだいを えらぼう" back="/recognize">
      <div className="paper-card grid grid-cols-2 gap-2 rounded-full p-1" role="tablist">
        {tabs.map(([value, label]) => (
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
            className={`min-h-11 rounded-full text-base font-black ${mode === value ? "bg-brand text-white shadow-[0_2px_0_var(--color-ink)]" : "text-ink/60"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {mode === "choices" && (
        <>
          {generation.status === "error" && <ErrorNotice onRetry={regenerate}>{generation.message}</ErrorNotice>}
          {(generation.status === "loading" || generation.status === "idle") && <Loading message="もんだいを 作っているよ…" />}
          {generation.status === "ready" && generation.data.questions.length > 0 && (
            <>
              <Say mood="happy">気になる もんだいを 1つ えらんでね！</Say>
              {generation.data.demo && (
                <p className="rounded-xl bg-sun/25 px-3 py-2 text-center text-sm font-bold">
                  みほんの もんだい（AIは つかっていないよ）
                </p>
              )}
              <ul className="space-y-3">
                {generation.data.questions.map((q, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => {
                        selectQuestion(q);
                        router.push("/predict");
                      }}
                      className="paper-card paper-card-press w-full space-y-2 p-4 text-left"
                    >
                      <Chips question={q} />
                      <QuestionText question={q} />
                    </button>
                  </li>
                ))}
              </ul>
              <Button variant="ghost" onClick={regenerate}>
                ほかの もんだいを 見る
              </Button>
            </>
          )}
        </>
      )}

      {mode === "custom" && (
        <form onSubmit={submitCustom} className="space-y-4">
          <Say mood="think">この しゃしんで 気になった ことを、もんだいに して かいてみてね。</Say>
          <label className="block">
            <span className="mb-1 block text-base font-bold">もんだい</span>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={100}
              rows={4}
              required
              placeholder="れい：このタイルは ぜんぶで 何まい あるのかな？"
              className="w-full rounded-xl border-2 border-ink/15 bg-white p-3 text-lg outline-none focus:border-brand"
            />
            <span className="block text-right text-sm text-ink/60">{text.length} / 100</span>
          </label>

          {busy && <Loading message="もんだいを しらべているよ…" />}

          {sorry && (
            <div className="space-y-3">
              <Say mood="sorry">{sorry}</Say>
              <Button
                variant="secondary"
                onClick={() => {
                  setMode("choices");
                  setSorry(null);
                }}
              >
                3つの もんだいから えらぶ
              </Button>
            </div>
          )}
          {error && (
            <p role="alert" className="rounded-xl bg-berry/10 px-3 py-2 text-base font-bold text-berry">
              {error}
            </p>
          )}
          {!busy && (
            <Button type="submit" disabled={text.trim().length === 0}>
              この もんだいに する
            </Button>
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
