"use client";

import { useState } from "react";
import { STAMP_GOAL, SUBJECT_LABEL, TITLE_LABEL } from "@/lib/constants";
import { stampCounts } from "@/lib/collection";
import { messageOf } from "@/lib/errors";
import type { Guess, Rating } from "@/lib/rating";
import type { Question } from "@/server/llm/schema";
import { useArchive } from "./ArchiveProvider";
import { Button, Card, LinkButton, Say } from "./ui";

/** 答え合わせのあと、図鑑（アーカイブ）に保存する。匿名で他の人に見せるかも選べる */
export function SavePanel({
  question,
  guess,
  rating,
  image,
}: {
  question: Question;
  guess: Guess;
  rating: Rating;
  image: string;
}) {
  const { archives, add } = useArchive();
  const [publish, setPublish] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      const record = await add({ question, guess, rating, image, publish });
      setSavedId(record.id);
    } catch (e) {
      setError(messageOf(e));
    }
    setBusy(false);
  }

  if (savedId) {
    const count = stampCounts(archives)[question.subject];
    return (
      <Card className="space-y-3">
        <Say mood="happy">
          ずかんに ほぞんしたよ！ {SUBJECT_LABEL[question.subject]}のスタンプを 1こ ゲット！
          {count === STAMP_GOAL && ` 「${TITLE_LABEL[question.subject]}」の しょうごうも もらえたよ！`}
          {count < STAMP_GOAL && ` あと ${STAMP_GOAL - count}こで「${TITLE_LABEL[question.subject]}」！`}
        </Say>
        <LinkButton href="/archive" variant="secondary">
          ずかんを 見る
        </LinkButton>
      </Card>
    );
  }

  return (
    <Card className="space-y-3">
      <h2 className="text-lg font-bold">ずかんに ほぞんしよう</h2>
      <label className="flex items-start gap-3 rounded-2xl bg-paper p-3">
        <input
          type="checkbox"
          checked={publish}
          onChange={(e) => setPublish(e.target.checked)}
          className="mt-1 size-6 accent-[var(--color-brand)]"
        />
        <span className="text-base">
          みんなにも 見せる
          <span className="block text-sm text-ink/70">なまえは 出ないよ。囲んだ ぶぶんの しゃしんと もんだいだけ 見えるよ。</span>
        </span>
      </label>
      {error && (
        <p role="alert" className="rounded-xl bg-berry/10 px-3 py-2 text-base font-bold text-berry">
          {error}
        </p>
      )}
      <Button onClick={save} disabled={busy}>
        {busy ? "ほぞんしているよ…" : "ずかんに ほぞんする"}
      </Button>
    </Card>
  );
}
