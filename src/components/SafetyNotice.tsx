"use client";

import { useState } from "react";
import { Navigator } from "./Navigator";
import { Button } from "./ui";

// アプリを開いて最初のホームだけ、1回表示する（ページを読み込み直すと、また出る）
let shownAtLaunch = false;

/** 起動時・撮影時の注意表示（docs/02-spec.md 3章）。「人の顔はとらないでね」「まわりに気をつけてね」 */
export function SafetyNotice({ once = false }: { once?: boolean }) {
  const [open, setOpen] = useState(() => {
    if (!once) return true;
    if (shownAtLaunch) return false;
    shownAtLaunch = true;
    return true;
  });

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/60 p-4 sm:items-center" role="dialog" aria-modal="true" aria-labelledby="safety-title">
      <div className="w-full max-w-sm space-y-4 paper-card p-6 text-center">
        <div className="flex justify-center">
          <Navigator mood="happy" size={88} />
        </div>
        <h2 id="safety-title" className="text-xl font-bold">
          しゃしんを とる まえに
        </h2>
        <ul className="space-y-2 text-left text-lg font-bold">
          <li className="rounded-2xl bg-sun/25 px-4 py-3">人の 顔は とらないでね</li>
          <li className="rounded-2xl bg-sun/25 px-4 py-3">まわりに 気をつけてね</li>
        </ul>
        <Button onClick={() => setOpen(false)}>わかった！</Button>
      </div>
    </div>
  );
}
