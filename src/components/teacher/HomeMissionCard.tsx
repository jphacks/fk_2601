import { Icon } from "@/components/Icons";

// 子どものホームの「きょうの おだい」と同じ見た目（src/app/page.tsx）。先生が出す前に見え方を確かめるためのもので、ホームそのものは変えない
export function HomeMissionCard({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-card bg-yellow-soft px-4 py-3 font-body text-ink">
      <span className="flex size-[46px] shrink-0 items-center justify-center rounded-full bg-white">
        <Icon name="star" size={26} fill="#FFC83D" stroke="#22223A" strokeWidth={2} />
      </span>
      <span className="flex min-w-0 grow flex-col">
        <span className="text-sm font-black">きょうの おだい</span>
        <span className="font-pop text-[19px] leading-snug [overflow-wrap:anywhere]">{text}</span>
      </span>
    </div>
  );
}
