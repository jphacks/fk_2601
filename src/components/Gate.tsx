"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useApp } from "./AuthProvider";
import { Loading } from "./Loading";
import { Page } from "./Page";

/** ログインしていない人は /login へ、プロフィールがない人は /profile へ送る */
export function Gate({ children, needProfile = true }: { children: React.ReactNode; needProfile?: boolean }) {
  const { status, profile } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (status === "out") router.replace("/login");
    else if (status === "in" && needProfile && !profile) router.replace("/profile");
  }, [status, profile, needProfile, router]);

  if (status !== "in" || (needProfile && !profile)) {
    return (
      <Page>
        <Loading message="じゅんびしているよ…" />
      </Page>
    );
  }
  return <>{children}</>;
}
