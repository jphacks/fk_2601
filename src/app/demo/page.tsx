"use client";

import { useEffect } from "react";
import { Loading } from "@/components/Loading";
import { Page } from "@/components/Page";
import { exitDemo, startDemo } from "@/lib/demo";

/**
 * ピッチ用のデモ版の入り口。
 * /demo を開くと、前のデモのデータを消して、はじめからデモを始める（ホームが開く）。
 * /demo?exit=1 を開くと、デモを終わって、本物の使いかたにもどる。
 */
export default function DemoPage() {
  useEffect(() => {
    const leaving = new URLSearchParams(window.location.search).get("exit") === "1";
    if (leaving) exitDemo();
    else startDemo();
    // ログインの状態を読み直すため、画面ごと読み込みなおす
    window.location.replace(leaving ? "/login" : "/");
  }, []);

  return (
    <Page>
      <Loading message="じゅんびしているよ…" />
    </Page>
  );
}
