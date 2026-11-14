"use client";

import { Gate } from "@/components/Gate";
import { Page } from "@/components/Page";
import { Jp } from "@/components/RubyText";
import { SceneSamples } from "@/components/SceneSamples";
import { Say } from "@/components/ui";

/** 見本の絵を えらぶ（ホームの「みほんの えで ためす」から）。えらぶと 囲む画面へ進む */
export default function SamplesPage() {
  return (
    <Gate>
      <Page title="{見本|みほん}の {絵|え}" back="/">
        <Say mood="happy" size={84}>
          <Jp big>{"{好|す}きな {絵|え}を"}</Jp>
          <br />
          <Jp big>{"{選|えら}んでね！"}</Jp>
        </Say>
        <SceneSamples />
      </Page>
    </Gate>
  );
}
