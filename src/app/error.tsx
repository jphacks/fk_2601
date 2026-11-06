"use client";

import { useEffect } from "react";
import { ErrorScreen } from "@/components/ErrorScreen";

// 描画中の予期しないエラー（この Next.js では、やり直しの関数は retry）。ログには、エラーの種類と識別子だけを出す
export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error("[error]", error.name, error.digest ?? "");
  }, [error]);
  return <ErrorScreen kind="error" onRetry={retry} />;
}
