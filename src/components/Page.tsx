import Link from "next/link";
import type { ReactNode } from "react";

/** 画面の枠。上に戻るリンクとタイトルを出す */
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
    <main className="flex min-h-dvh flex-col px-4 pb-10 pt-3">
      <header className="mb-4 flex min-h-11 items-center gap-2">
        {back ? (
          <Link
            href={back}
            aria-label="もどる"
            className="flex size-11 items-center justify-center rounded-full bg-white text-2xl font-bold text-brand shadow-sm"
          >
            ‹
          </Link>
        ) : (
          <span className="size-11" />
        )}
        {title && <h1 className="flex-1 text-xl font-bold">{title}</h1>}
      </header>
      <div className="flex flex-1 flex-col gap-4">{children}</div>
    </main>
  );
}
