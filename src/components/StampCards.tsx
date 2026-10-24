import { STAMP_GOAL, SUBJECT_KANA, SUBJECTS, TITLE_LABEL } from "@/lib/constants";
import type { Subject } from "@/server/llm/schema";
import { Icon } from "./Icons";
import { SUBJECT_STYLE } from "./QuestionCard";

/**
 * 分類ごとのスタンプカード（見本 20）。目標の数を集めると称号がもらえる（称号は切り替えて使える）。
 * そろった分類には、星のスタンプと、称号をつかうボタンが出る
 */
export function StampCards({
  counts,
  equipped,
  onEquip,
}: {
  counts: Record<Subject, number>;
  equipped?: Subject | null;
  onEquip?: (title: Subject | null) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      {SUBJECTS.map((subject) => {
        const count = counts[subject];
        const earned = count >= STAMP_GOAL;
        const s = SUBJECT_STYLE[subject];
        return (
          <section
            key={subject}
            className={`flex flex-col gap-2 rounded-[22px] border-3 border-ink px-3.5 pb-3 pt-2.5 ${s.light} ${earned ? "shadow-pop-sm" : ""}`}
          >
            <div className="flex items-center justify-between">
              <h3 className={`font-pop text-xl font-normal ${s.dark}`}>{SUBJECT_KANA[subject]}</h3>
              <span className={`font-pop text-base ${s.dark}`}>{earned ? `${STAMP_GOAL}/${STAMP_GOAL} コンプリート！` : `${count}/${STAMP_GOAL}`}</span>
            </div>
            <div className="grid grid-cols-5 justify-items-center" aria-label={`スタンプ ${Math.min(count, STAMP_GOAL)} / ${STAMP_GOAL}`}>
              {Array.from({ length: STAMP_GOAL }, (_, i) => {
                const last = earned && i === STAMP_GOAL - 1;
                return (
                  <span
                    key={i}
                    className={`flex size-11 items-center justify-center rounded-full ${
                      i < count
                        ? `border-3 border-ink ${last ? "bg-yellow" : s.solid}`
                        : "border-[2.5px] border-dashed border-ink-muted bg-white"
                    }`}
                  >
                    {last && <Icon name="star" size={22} fill="#FFFFFF" stroke="#22223A" strokeWidth={2} />}
                  </span>
                );
              })}
            </div>
            {earned ? (
              <div className="flex items-center justify-between gap-2">
                <span className={`text-sm font-black ${s.dark}`}>「{TITLE_LABEL[subject]}」を ゲット！</span>
                {onEquip && (
                  <button
                    type="button"
                    aria-pressed={equipped === subject}
                    onClick={() => onEquip(equipped === subject ? null : subject)}
                    className={`min-h-10 shrink-0 rounded-[14px] border-[2.5px] border-ink px-3.5 text-sm font-black shadow-pop-xs active:translate-y-[3px] active:shadow-none ${
                      equipped === subject ? "bg-ink text-white" : "bg-white"
                    }`}
                  >
                    {equipped === subject ? "つかっている" : "つかう"}
                  </button>
                )}
              </div>
            ) : (
              <span className={`text-sm font-black ${s.dark}`}>
                あと {STAMP_GOAL - count}こで「{TITLE_LABEL[subject]}」
              </span>
            )}
          </section>
        );
      })}
    </div>
  );
}
