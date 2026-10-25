import { GRADES } from "@/lib/constants";
import { CHOICE_DOWN, CHOICE_UP } from "./ui";

// 学年ごとの色（見本 03・22）。えらぶと、こい色になる
const GRADE_STYLE: Record<number, { off: string; on: string }> = {
  1: { off: "bg-pink-light", on: "bg-pink" },
  2: { off: "bg-orange-light", on: "bg-orange" },
  3: { off: "bg-yellow-light", on: "bg-yellow" },
  4: { off: "bg-mint-light", on: "bg-mint" },
  5: { off: "bg-navi-light", on: "bg-navi text-white" },
  6: { off: "bg-purple-light", on: "bg-purple text-white" },
};

/** 学年のボタン。lg：大きい（プロフィール）／sm：6つ横ならび（せってい） */
export function GradePicker({ value, onChange, size = "lg" }: { value: number | null; onChange: (grade: number) => void; size?: "lg" | "sm" }) {
  const large = size === "lg";
  return (
    <div className={`grid ${large ? "grid-cols-3 gap-3" : "grid-cols-6 gap-1.5"}`}>
      {GRADES.map((g) => {
        const on = value === g;
        const style = GRADE_STYLE[g];
        return (
          <button
            key={g}
            type="button"
            aria-pressed={on}
            aria-label={`${g}ねんせい`}
            onClick={() => onChange(g)}
            className={`flex flex-col items-center justify-center border-3 border-ink text-ink ${
              large ? "h-[92px] gap-0.5 rounded-card" : "h-[50px] rounded-2xl"
            } ${on ? `${style.on} ${CHOICE_DOWN}` : `${style.off} ${CHOICE_UP}`}`}
          >
            <span className={`font-pop leading-[1.1] ${large ? "text-[34px]" : "text-xl"}`}>{g}</span>
            {large && <span className="text-sm font-black">ねんせい</span>}
          </button>
        );
      })}
    </div>
  );
}

/** 文字の入力欄（太い線の丸い枠） */
export const INPUT_STYLE =
  "h-[60px] w-full rounded-[20px] border-3 border-ink bg-white px-[18px] text-xl font-bold text-ink outline-none focus:border-navi";

/** 入力欄の上のラベル（ポップな字） */
export function FieldLabel({ htmlFor, children, note }: { htmlFor?: string; children: React.ReactNode; note?: React.ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-[19px] font-black">
      {children} {note && <span className="text-[15px] font-bold text-ink-sub">{note}</span>}
    </label>
  );
}

/** ラジオ風の選択肢（見本 22「はてなの だしかた」） */
export function RadioRow({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onClick}
      className={`flex min-h-[60px] items-center gap-3 rounded-[20px] border-3 border-ink px-4 py-2 text-left text-lg ${
        selected ? `bg-navi-light font-black ${CHOICE_DOWN}` : `bg-white font-bold ${CHOICE_UP}`
      }`}
    >
      <span
        aria-hidden
        className={`size-6 shrink-0 rounded-full ${selected ? "border-[7px] border-navi outline-[2.5px] outline-ink" : "border-3 border-ink bg-white"}`}
      />
      <span>{children}</span>
    </button>
  );
}
