"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useArchive } from "@/components/ArchiveProvider";
import { ConditionSliders } from "@/components/ConditionSliders";
import { CropCircle } from "@/components/CropCircle";
import { ExplanationSteps, Related, Sources } from "@/components/Explanation";
import { Gate } from "@/components/Gate";
import { Page } from "@/components/Page";
import { QuestionHint, QuestionText, SUBJECT_STYLE, Eyebrow } from "@/components/QuestionCard";
import { ResultSummary } from "@/components/ResultSummary";
import { RubyText } from "@/components/RubyText";
import { Button, LinkButton, Say } from "@/components/ui";
import { defaultScope } from "@/lib/calc";
import { messageOf } from "@/lib/errors";
import { formatDate } from "@/lib/format";
import { evaluate } from "@/lib/rating";
import { kanaOf, stripRuby } from "@/lib/ruby";
import { Loading } from "@/components/Loading";

function DetailContent() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { status, archives, remove, unpublish } = useArchive();
  const record = archives.find((a) => a.id === id);
  const [values, setValues] = useState<Record<string, number> | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const evaluation = useMemo(() => {
    if (!record) return null;
    try {
      return evaluate(record.question, record.guess);
    } catch {
      return null;
    }
  }, [record]);

  // ずかんを読みこんでいるあいだ・けしている あいだは、「みつからない」と出さない
  if (status === "loading" || deleting) {
    return (
      <Page back="/archive">
        <Loading message={deleting ? "けしているよ" : "ずかんを ひらいているよ"} />
      </Page>
    );
  }

  if (!record) {
    return (
      <Page title="ずかん" back="/archive">
        <Say mood="sorry">この はてなは みつからなかったよ。</Say>
        <LinkButton href="/archive">ずかんへ もどる</LinkButton>
      </Page>
    );
  }

  const { question } = record;
  const style = SUBJECT_STYLE[question.subject];
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
    <Page title="はてなの きろく" back="/archive">
      <div className="flex items-center gap-4">
        <CropCircle src={record.image} alt={stripRuby(question.target)} size={120} />
        <p className="text-base font-black text-ink-sub">{formatDate(record.createdAt)} に つかまえたよ</p>
      </div>

      <section className={`rounded-[26px] border-3 border-ink px-5 py-3.5 shadow-pop-md ${style.light}`}>
        <Eyebrow question={question} />
        <QuestionText question={question} size={22} />
        <QuestionHint question={question} />
      </section>

      {evaluation && <ResultSummary question={question} guess={record.guess} evaluation={evaluation} animate={false} />}

      <div className="flex items-start gap-3 rounded-card border-3 border-ink bg-white px-4 py-3 shadow-pop-sm">
        <span className="text-[19px] font-black leading-[1.75]">
          <RubyText text={question.explanation.short} kana />
        </span>
      </div>
      <ExplanationSteps question={question} />

      {question.variables.length > 0 && question.type !== "why" && (
        <section className="flex flex-col gap-3">
          <h2 className="font-pop text-xl font-normal">もしも…？</h2>
          <ConditionSliders question={question} values={values ?? defaultScope(question)} onChange={setValues} />
        </section>
      )}

      <Related question={question} />
      <Sources question={question} />

      {related.length > 0 && (
        <section className="flex flex-col gap-2 rounded-card border-3 border-ink bg-white px-4 py-3">
          <h2 className="font-pop text-base font-normal">にている はてな</h2>
          <ul className="flex flex-col gap-1.5">
            {related.map((a) => (
              <li key={a.id}>
                <Link href={`/archive/${a.id}`} className="line-clamp-2 text-base font-black text-navi-dark underline">
                  {kanaOf(a.question.text)}（{formatDate(a.createdAt)}）
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-2 flex flex-col gap-3">
        {error && (
          <p role="alert" className="rounded-[20px] bg-pink-light px-4 py-3 text-base font-black text-pink-dark">
            {error}
          </p>
        )}
        {record.publicId && (
          <Button variant="sub" onClick={() => run(() => unpublish(record.id))}>
            みんなに みせるのを やめる
          </Button>
        )}
        {confirming ? (
          <>
            <p className="text-center text-base font-black">この はてなを けすよ。いいかな？</p>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="sub" onClick={() => setConfirming(false)}>
                やめる
              </Button>
              <Button
                variant="danger"
                onClick={() =>
                  run(async () => {
                    setDeleting(true);
                    try {
                      await remove(record.id);
                      router.replace("/archive");
                    } catch (e) {
                      setDeleting(false);
                      throw e;
                    }
                  })
                }
              >
                けす
              </Button>
            </div>
          </>
        ) : (
          <Button variant="ghost" onClick={() => setConfirming(true)}>
            この はてなを けす
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
