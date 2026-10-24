"use client";

import { useApp } from "@/components/AuthProvider";
import { Gate } from "@/components/Gate";
import { Page } from "@/components/Page";
import { Button, LinkButton, Say } from "@/components/ui";
import { APP_NAME } from "@/lib/constants";

function HomeContent() {
  const { profile, signOut } = useApp();
  return (
    <Page title={APP_NAME}>
      <Say mood="happy">こんにちは、{profile?.nickname}さん！</Say>
      <div className="mt-auto space-y-3">
        <LinkButton href="/profile" variant="secondary">
          プロフィール
        </LinkButton>
        <Button variant="ghost" onClick={() => void signOut()}>
          ログアウト
        </Button>
      </div>
    </Page>
  );
}

export default function Home() {
  return (
    <Gate>
      <HomeContent />
    </Gate>
  );
}
