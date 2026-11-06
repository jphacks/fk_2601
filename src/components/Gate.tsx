"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useApp } from "./AuthProvider";
import { Loading } from "./Loading";
import { Page } from "./Page";
import { ErrorNotice } from "./ui";

/** ログインしていない人は /login へ、プロフィールがない人は /profile へ送る */
export function Gate({ children, needProfile = true }: { children: React.ReactNode; needProfile?: boolean }) {
  const { status, profile, profileFailed, retryProfiles } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (status === "out") router.replace("/login");
    // 読み込みに失敗したときは、「プロフィールがない人」として はじめての登録へ送らない
    else if (status === "in" && needProfile && !profile && !profileFailed) router.replace("/profile");
  }, [status, profile, profileFailed, needProfile, router]);

  // はじめての登録の画面（needProfile が false）も、読み込みに失敗しているあいだは、新しいプロフィールを作らせない
  if (status === "in" && !profile && profileFailed) {
    return (
      <Page>
        <ErrorNotice onRetry={retryProfiles}>よみこめなかったよ。ネットに つながっているか みて、もういちど ためしてね</ErrorNotice>
      </Page>
    );
  }

  if (status !== "in" || (needProfile && !profile)) {
    return (
      <Page>
        <Loading message="じゅんびしているよ…" />
      </Page>
    );
  }
  return <>{children}</>;
}
