"use client";

import { useEffect } from "react";
import "./globals.css";

// 全体の枠（layout）そのものが壊れたときの最後の画面。layout の外なので、自分で html・body を持つ（ナビの絵は静かな表情）
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error("[global-error]", error.name, error.digest ?? "");
  }, [error]);
  return (
    <html lang="ja">
      <body className="bg-white text-ink">
        <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center gap-4 px-6 py-10">
          <div className="mt-auto">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/navi/navi-blank.png" alt="ナビ（ぽかん）" width={160} height={160} />
          </div>
          <h1 className="text-center text-[30px] font-black leading-normal">
            あれれ？
            <br />
            うまくいかなかったよ
          </h1>
          <p className="rounded-card bg-navi-light px-4 py-3 text-center text-[19px] font-black leading-[1.75]">
            もういちど ためしてね。
            <br />
            だめなときは ホームに もどろう！
          </p>
          <div className="mt-auto flex w-full flex-col gap-3.5">
            <button
              type="button"
              onClick={() => retry()}
              className="h-16 w-full rounded-[24px] border-3 border-ink bg-navi text-[22px] font-black text-white shadow-pop active:translate-y-[6px] active:shadow-none"
            >
              もういちど ためす
            </button>
            {/* layout が壊れているので、ページを読み込みなおして ホームへ行く */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" className="flex h-14 w-full items-center justify-center rounded-[22px] border-3 border-ink bg-white text-[19px] font-black shadow-pop-sm">
              ホームに もどる
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
