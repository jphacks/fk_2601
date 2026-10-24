import Link from "next/link";
import type { ReactNode } from "react";

/** 画面の枠。上に戻るリンクとタイトルを出す（ノートの見出しのような、下線つき） */
export function Page({
  title,
  back,
  children,
}: {
  title?: string;
  back?: string | null;
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-dvh flex-col px-4 pb-12 pt-3">
      <header className="mb-5 flex min-h-12 items-center gap-3">
        {back ? (
          <Link
            href={back}
            aria-label="もどる"
            className="flex size-11 shrink-0 items-center justify-center rounded-full border-2 border-ink bg-white pb-1 text-3xl font-black leading-none text-ink shadow-[0_3px_0_var(--color-ink)] active:translate-y-[3px] active:shadow-none"
          >
            ‹
          </Link>
        ) : (
          <span className="size-11 shrink-0" />
        )}
        {title && (
          <h1 className="flex-1 border-b-4 border-sun pb-0.5 font-display text-xl leading-snug">{title}</h1>
        )}
      </header>
      <div className="animate-rise flex flex-1 flex-col gap-5">{children}</div>
    </main>
  );
}
