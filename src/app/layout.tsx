import type { Metadata, Viewport } from "next";
import { ArchiveProvider } from "@/components/ArchiveProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { QuizProvider } from "@/components/QuizProvider";
import { APP_NAME } from "@/lib/constants";
import "./globals.css";

export const metadata: Metadata = {
  title: APP_NAME,
  description: "日常の風景から、理系の問いを見つけるアプリ",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2f6fed",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
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
