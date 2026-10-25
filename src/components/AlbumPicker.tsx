"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { useQuiz } from "@/components/QuizProvider";
import { messageOf } from "@/lib/errors";
import { photoFromFile } from "@/lib/image";

/**
 * アルバムから写真を選ぶ（ホームと撮影画面で使う）。選んだら、そのまま「つかまえる」画面へ進む。
 * 子の要素が見た目になる（label の中に、見えない input を置く）
 */
export function AlbumPicker({ className = "", children }: { className?: string; children: ReactNode }) {
  const router = useRouter();
  // 囲む画面の「もどる」で、選んだ画面（ホームか撮影）へ戻すため
  const pathname = usePathname();
  const { setPhoto } = useQuiz();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      setPhoto(await photoFromFile(file), pathname);
      router.push("/lasso");
    } catch (e) {
      setError(messageOf(e));
      setBusy(false);
    }
  }

  return (
    <>
      <label className={`cursor-pointer ${busy ? "pointer-events-none opacity-60" : ""} ${className}`}>
        {children}
        <input type="file" accept="image/*" className="sr-only" onChange={pick} disabled={busy} />
      </label>
      {error && (
        <p role="alert" className="rounded-[20px] bg-pink-light px-4 py-3 text-base font-black leading-relaxed text-pink-dark">
          {error}
        </p>
      )}
    </>
  );
}
