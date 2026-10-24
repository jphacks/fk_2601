import { SUBJECT_LABEL } from "@/lib/constants";
import type { Question } from "@/server/llm/schema";
import { RubyText } from "./RubyText";

export const TYPE_LABEL: Record<Question["type"], string> = {
  estimate: "いくつ？",
  compare: "くらべよう",
  why: "なぜ？",
};

const SUBJECT_COLOR = {
  math: "bg-brand/10 text-brand-dark",
  science: "bg-mint/20 text-ink",
  info: "bg-sun/30 text-ink",
} as const;

export function Chips({ question }: { question: Question }) {
  return (
    <div className="flex flex-wrap gap-2">
      <span className={`rounded-full border-2 border-ink px-3 py-0.5 text-sm font-black ${SUBJECT_COLOR[question.subject]}`}>
        {SUBJECT_LABEL[question.subject]}
      </span>
      <span className="rounded-full border-2 border-ink bg-white px-3 py-0.5 text-sm font-black text-berry">{TYPE_LABEL[question.type]}</span>
    </div>
  );
}

/** 問いの見かた・前提（答えのヒントではない）。前に保存した問いには無いので、なければ何も出さない */
export function QuestionHint({ question }: { question: Question }) {
  if (!question.hint) return null;
  return <RubyText text={question.hint} className="block text-base text-ink/80" />;
}

export function QuestionText({ question }: { question: Question }) {
  return <RubyText text={question.text} className="text-lg font-bold leading-loose" />;
}
