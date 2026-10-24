import { STAMP_GOAL, SUBJECT_LABEL, SUBJECTS, TITLE_LABEL } from "@/lib/constants";
import type { Subject } from "@/server/llm/schema";

const COLOR: Record<Subject, { dot: string; card: string }> = {
  math: { dot: "bg-brand", card: "bg-brand/10" },
  science: { dot: "bg-mint", card: "bg-mint/15" },
  info: { dot: "bg-sun", card: "bg-sun/20" },
};

/** 分類ごとのスタンプカード。目標の数を集めると称号がもらえる（称号は切り替えて使える） */
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
    <div className="space-y-3">
      {SUBJECTS.map((subject) => {
        const count = counts[subject];
        const earned = count >= STAMP_GOAL;
        return (
          <div key={subject} className={`space-y-2 rounded-3xl p-4 ${COLOR[subject].card}`}>
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-lg font-bold">{SUBJECT_LABEL[subject]}のスタンプ</h3>
              <span className="text-base font-bold">{count}こ</span>
            </div>
            <div className="flex flex-wrap gap-2" aria-label={`スタンプ ${Math.min(count, STAMP_GOAL)} / ${STAMP_GOAL}`}>
              {Array.from({ length: STAMP_GOAL }, (_, i) => (
                <span
                  key={i}
                  className={`flex size-9 items-center justify-center rounded-full text-lg ${
                    i < count ? `${COLOR[subject].dot} text-white` : "border-2 border-dashed border-ink/25 bg-white/60"
                  }`}
                >
                  {i < count ? "★" : ""}
                </span>
              ))}
            </div>
            {earned ? (
              <div className="flex items-center justify-between gap-2">
                <p className="text-base font-bold">「{TITLE_LABEL[subject]}」を ゲット！</p>
                {onEquip && (
                  <button
                    type="button"
                    aria-pressed={equipped === subject}
                    onClick={() => onEquip(equipped === subject ? null : subject)}
                    className={`min-h-10 shrink-0 rounded-full px-4 text-sm font-bold ${
                      equipped === subject ? "bg-ink text-white" : "border-2 border-ink/30 bg-white"
                    }`}
                  >
                    {equipped === subject ? "つかっている" : "つかう"}
                  </button>
                )}
              </div>
            ) : (
              <p className="text-base">あと {STAMP_GOAL - count}こで「{TITLE_LABEL[subject]}」！</p>
            )}
          </div>
        );
      })}
    </div>
  );
}
