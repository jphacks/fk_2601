import Image from "next/image";
import { STAMP_GOAL, SUBJECT_LABEL, SUBJECT_KANA, SUBJECTS } from "@/lib/constants";
import { TIER_LABEL, TITLE_FAMILIES, titleLabel } from "@/lib/titles";
import type { Subject } from "@/server/llm/schema";
import { SUBJECT_STYLE } from "./QuestionCard";

// スタンプはナビの形（さんすう＝青／りか＝ミント／じょうほう＝むらさき）。まだのものは点線のナビに「？」（docs/design/README.md「ナビの出しかた」）
const STAMP_FILE: Record<Subject, string> = { math: "stamp-blue", science: "stamp-mint", info: "stamp-purple" };

/** スタンプ1つ。subject が null のときは、まだ もらっていない（点線） */
export function Stamp({ subject, size = 54, react = false }: { subject: Subject | null; size?: number; react?: boolean }) {
  return (
    <Image
      src={`/navi/${subject ? STAMP_FILE[subject] : "stamp-empty"}.png`}
      alt=""
      width={size}
      height={size}
      className={`shrink-0 ${react ? "navi-react" : ""}`}
      style={{ width: size, height: size }}
    />
  );
}

/** その分類の称号で、つぎの段階まで あといくつか（もう きん なら null） */
function nextTier(subject: Subject, count: number) {
  const family = TITLE_FAMILIES.find((f) => f.id === subject);
  const i = family ? family.goals.findIndex((g) => count < g) : -1;
  return family && i >= 0 ? { label: TIER_LABEL[(["bronze", "silver", "gold"] as const)[i]], left: family.goals[i] - count } : null;
}

/**
 * 分類ごとのスタンプカード（見本 21）。押せないので地の色だけ。
 * 5こ集めると、その分類の称号の「どう」がもらえる。そのあとは、ぎん（15こ）・きん（30こ）まで あといくつかを出す（称号は「しょうごう」のタブで えらぶ）
 */
export function StampCards({ counts }: { counts: Record<Subject, number> }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      {SUBJECTS.map((subject) => {
        const count = counts[subject];
        const shown = Math.min(count, STAMP_GOAL);
        const earned = count >= STAMP_GOAL;
        const s = SUBJECT_STYLE[subject];
        return (
          <section key={subject} className={`flex flex-1 flex-col justify-center gap-2 rounded-card px-4 pb-3.5 pt-3 ${s.light}`}>
            <div className="flex items-center justify-between">
              <h2 className={`font-pop text-[22px] font-normal leading-[1.7] ${s.dark}`}>
                <ruby>
                  {SUBJECT_LABEL[subject]}
                  <rt>{SUBJECT_KANA[subject]}</rt>
                </ruby>
              </h2>
              <span className={`font-pop text-[17px] ${s.dark}`}>{earned ? `${count}こ` : `${shown}/${STAMP_GOAL}`}</span>
            </div>
            <div role="img" aria-label={`スタンプ ${STAMP_GOAL}こちゅう ${shown}こ`} className="grid grid-cols-5 justify-items-center">
              {Array.from({ length: STAMP_GOAL }, (_, i) => (
                <Stamp key={i} subject={i < shown ? subject : null} />
              ))}
            </div>
            <span className={`text-[15px] font-black ${s.dark}`}>
              {(() => {
                const next = nextTier(subject, count);
                if (!next) return `「${titleLabel(`${subject}-gold`)}」 ゲット！ ぜんぶ あつめたよ`;
                if (!earned) return `あと ${next.left}こで「${titleLabel(`${subject}-bronze`)}」`;
                return `あと ${next.left}こで「${TITLE_FAMILIES.find((f) => f.id === subject)?.name ?? ""}（${next.label}）」`;
              })()}
            </span>
          </section>
        );
      })}
    </div>
  );
}
