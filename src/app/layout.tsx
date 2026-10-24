import type { Metadata, Viewport } from "next";
import { Mochiy_Pop_One, Zen_Maru_Gothic } from "next/font/google";
import { ArchiveProvider } from "@/components/ArchiveProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { QuizProvider } from "@/components/QuizProvider";
import { APP_NAME } from "@/lib/constants";
import "./globals.css";

// 日本語の字は、使われる字だけが読み込まれる（preload は切る）。変数名は docs/design の README に合わせる
const body = Zen_Maru_Gothic({ weight: ["500", "700", "900"], display: "swap", preload: false, variable: "--nf-body" });
const pop = Mochiy_Pop_One({ weight: "400", display: "swap", preload: false, variable: "--nf-pop" });

export const metadata: Metadata = {
  title: APP_NAME,
  description: "日常の風景から、理系の問いを見つけるアプリ",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#4a5ae8",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className={`${body.variable} ${pop.variable}`}>
      <body>
        <AuthProvider>
          <ArchiveProvider>
            <QuizProvider>
              <div className="mx-auto min-h-dvh w-full max-w-md">{children}</div>
            </QuizProvider>
          </ArchiveProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
