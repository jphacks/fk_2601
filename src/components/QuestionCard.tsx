import { SUBJECT_JP } from "@/lib/constants";
import type { Question } from "@/server/llm/schema";
import { Icon, type IconName } from "./Icons";
import { Jp, RubyText } from "./RubyText";

export const TYPE_LABEL: Record<Question["type"], string> = {
  estimate: "いくつ？",
  compare: "{比|くら}べる",
  why: "なぜ？",
};

/** 分類の色（さんすう＝青、りか＝みどり、じょうほう＝むらさき）。うすい地・こい色・その上の文字の色 */
export const SUBJECT_STYLE: Record<
  Question["subject"],
  { light: string; solid: string; dark: string; onSolid: string; icon: IconName; hex: string }
> = {
  math: { light: "bg-navi-light", solid: "bg-navi", dark: "text-navi-dark", onSolid: "text-white", icon: "calc", hex: "#4A5AE8" },
  science: { light: "bg-mint-light", solid: "bg-mint", dark: "text-mint-dark", onSolid: "text-ink", icon: "flask", hex: "#24C3A0" },
  info: { light: "bg-purple-light", solid: "bg-purple", dark: "text-purple-dark", onSolid: "text-white", icon: "qr", hex: "#8B5CF6" },
};

/** 「じょうほう ・ いくつ？」のような小さな見出し（学年に合わせて漢字か ひらがな） */
export function Eyebrow({ question }: { question: Question }) {
  return (
    <span className={`text-sm font-black ${SUBJECT_STYLE[question.subject].dark}`}>
      <Jp>{`${SUBJECT_JP[question.subject]} ・ ${TYPE_LABEL[question.type]}`}</Jp>
    </span>
  );
}

/** 分類の色の四角いアイコン */
export function SubjectIcon({ subject, size = 52 }: { subject: Question["subject"]; size?: number }) {
  const s = SUBJECT_STYLE[subject];
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-[18px] border-3 border-ink ${s.solid} ${s.onSolid}`}
      style={{ width: size, height: size }}
    >
      <Icon name={s.icon} size={Math.round(size * 0.54)} strokeWidth={subject === "info" ? 2 : 2.8} />
    </span>
  );
}

/** 札（分類と、問いの種類） */
export function Chips({ question }: { question: Question }) {
  const s = SUBJECT_STYLE[question.subject];
  return (
    <div className="flex flex-wrap gap-2">
      <span className={`rounded-xl px-3 py-0.5 text-sm font-black ${s.light} ${s.dark}`}>
        <Jp>{SUBJECT_JP[question.subject]}</Jp>
      </span>
      <span className="rounded-xl bg-pink-light px-3 py-0.5 text-sm font-black text-pink-dark">
        <Jp>{TYPE_LABEL[question.type]}</Jp>
      </span>
    </div>
  );
}

/** 問いの見かた・前提（答えのヒントではない）。前に保存した問いには無いので、なければ何も出さない */
export function QuestionHint({ question }: { question: Question }) {
  if (!question.hint) return null;
  return <RubyText text={question.hint} kana className="block text-base font-bold leading-[1.8] text-ink-sub" />;
}

/** 問題文。22px 以上なら漢字にふりがなを付け、それより小さいときは ひらがなで出す（docs/design/README.md「文字」） */
export function QuestionText({ question, size = 21, clamp = false }: { question: Question; size?: number; clamp?: boolean }) {
  return (
    <div style={{ fontSize: size }}>
      <RubyText text={question.text} kana={size < 22} className={clamp ? "line-clamp-3 font-black leading-[1.55]" : "block font-black leading-[1.75]"} />
    </div>
  );
}
