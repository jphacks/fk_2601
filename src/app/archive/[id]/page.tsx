"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useArchive } from "@/components/ArchiveProvider";
import { ConditionSliders } from "@/components/ConditionSliders";
import { Explanation, Sources } from "@/components/Explanation";
import { Gate } from "@/components/Gate";
import { Page } from "@/components/Page";
import { Chips, QuestionText } from "@/components/QuestionCard";
import { ResultSummary } from "@/components/ResultSummary";
import { Button, Card, LinkButton, Say } from "@/components/ui";
import { defaultScope } from "@/lib/calc";
import { messageOf } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import { evaluate } from "@/lib/rating";

function DetailContent() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { archives, remove, unpublish } = useArchive();
  const record = archives.find((a) => a.id === id);
  const [values, setValues] = useState<Record<string, number> | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const evaluation = useMemo(() => {
    if (!record) return null;
    try {
      return evaluate(record.question, record.guess);
    } catch {
      return null;
    }
  }, [record]);

  if (!record) {
    return (
      <Page title="ずかん" back="/archive">
        <Say mood="sorry">この もんだいは 見つからなかったよ。</Say>
        <LinkButton href="/archive">ずかんへ もどる</LinkButton>
      </Page>
    );
  }

  const { question } = record;
  const related = archives.filter((a) => a.id !== record.id && a.question.topic === question.topic).slice(0, 5);

  async function run(action: () => Promise<void>) {
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(messageOf(e));
    }
  }

  return (
    <Page title={question.target} back="/archive">
      {/* eslint-disable-next-line @next/next/no-img-element -- 保存した切り抜き（data URL） */}
      <img src={record.image} alt={question.target} className="mx-auto max-h-72 rounded-3xl bg-white object-contain shadow-sm" />
      <p className="text-center text-sm text-ink/60">{formatDate(record.createdAt)}</p>

      <Card className="space-y-3">
        <Chips question={question} />
        <QuestionText question={question} />
      </Card>

      {evaluation && <ResultSummary question={question} guess={record.guess} evaluation={evaluation} />}

      <Card>
        <Explanation question={question} />
      </Card>

      {question.variables.length > 0 && question.type !== "why" && (
        <Card className="space-y-3">
          <h2 className="text-lg font-bold">じょうけんを かえてみよう</h2>
          <ConditionSliders question={question} values={values ?? defaultScope(question)} onChange={setValues} />
        </Card>
      )}

      <Sources question={question} />

      {related.length > 0 && (
        <Card className="space-y-2">
          <h2 className="text-lg font-bold">おなじ たんげんの もんだい</h2>
          <ul className="space-y-1">
            {related.map((a) => (
              <li key={a.id}>
                <Link href={`/archive/${a.id}`} className="text-brand underline">
                  {a.question.target}（{formatDate(a.createdAt)}）
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="mt-4 space-y-3">
        {error && (
          <p role="alert" className="rounded-xl bg-berry/10 px-3 py-2 text-base font-bold text-berry">
            {error}
          </p>
        )}
        {record.publicId && (
          <Button variant="secondary" onClick={() => run(() => unpublish(record.id))}>
            みんなに 見せるのを やめる
          </Button>
        )}
        {confirming ? (
          <>
            <p className="text-center text-base font-bold">この もんだいを けすよ。いいかな？</p>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="secondary" onClick={() => setConfirming(false)}>
                やめる
              </Button>
              <Button
                variant="danger"
                onClick={() =>
                  run(async () => {
                    await remove(record.id);
                    router.replace("/archive");
                  })
                }
              >
                けす
              </Button>
            </div>
          </>
        ) : (
          <Button variant="ghost" onClick={() => setConfirming(true)}>
            この もんだいを けす
          </Button>
        )}
      </div>
    </Page>
  );
}

export default function ArchiveDetailPage() {
  return (
    <Gate>
      <DetailContent />
    </Gate>
  );
}
