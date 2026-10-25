import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "./Icons";
import { TabBar, type Tab } from "./TabBar";

const BACK_STYLE =
  "flex size-[50px] shrink-0 items-center justify-center rounded-full border-3 border-ink bg-white shadow-pop-xs active:translate-y-[3px] active:shadow-none";

/** 「もどる」の丸いボタン。href を渡すとリンク、onBack を渡すとボタンになる */
export function BackButton({ href, onBack }: { href?: string; onBack?: () => void }) {
  if (onBack) {
    return (
      <button type="button" aria-label="もどる" onClick={onBack} className={BACK_STYLE}>
        <Icon name="back" size={24} strokeWidth={3} />
      </button>
    );
  }
  if (!href) return null;
  return (
    <Link href={href} aria-label="もどる" className={BACK_STYLE}>
      <Icon name="back" size={24} strokeWidth={3} />
    </Link>
  );
}

/**
 * 画面の枠。上に「もどる」とタイトル、下にタブ（tab を渡したときだけ）を出す。
 * 余白は 24px（下のボタンだけ影のぶん +6px）、ブロックのあいだは 16px（docs/design/README.md「余白」）
 */
export function Page({
  title,
  back,
  onBack,
  tab,
  icon,
  bg = "bg-white",
  children,
}: {
  title?: string;
  back?: string | null;
  onBack?: () => void;
  /** タイトルの前に置く小さな絵 */
  icon?: ReactNode;
  tab?: Tab;
  /** 画面の地の色（ずかんだけ、えらんだ分類で うすく変える） */
  bg?: string;
  children: ReactNode;
}) {
  return (
    <main className={`flex min-h-dvh flex-col transition-colors ${bg}`}>
      <div className={`animate-rise flex flex-1 flex-col gap-4 px-6 pt-6 ${tab ? "pb-4" : "pb-[30px]"}`}>
        {(back || onBack || title) && (
          <header className="flex min-h-[52px] items-center gap-2.5">
            <BackButton href={back ?? undefined} onBack={onBack} />
            {title && (
              <h1 className="flex items-center gap-2 font-pop text-[24px] font-normal leading-tight">
                {icon}
                {title}
              </h1>
            )}
          </header>
        )}
        {children}
      </div>
      {tab && <TabBar current={tab} />}
    </main>
  );
}
