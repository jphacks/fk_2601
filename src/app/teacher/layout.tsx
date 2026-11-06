import type { Metadata, Viewport } from "next";
import { BIZ_UDPGothic } from "next/font/google";
import { TeacherHeader } from "@/components/teacher/TeacherHeader";
import { TeacherProvider } from "@/components/teacher/TeacherProvider";
import { APP_NAME } from "@/lib/constants";

// 先生の画面の中だけで読み込む（子どもの画面を重くしない）
const body = BIZ_UDPGothic({ weight: ["400", "700"], display: "swap", preload: false, variable: "--font-t-body" });

export const metadata: Metadata = {
  title: `先生用 管理画面（見本）｜${APP_NAME}`,
};

export const viewport: Viewport = {
  themeColor: "#1e4438",
};

// ルートのレイアウトは子どもの画面用に幅を max-w-md にしているので、fixed で画面全体に広げる
// 1画面に全体を入れ、幅 1100px より狭いときはページのスクロールにもどす（docs/design/teachers/README.md）
export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${body.variable} fixed inset-0 overflow-auto bg-t-ground font-t-body leading-normal text-t-text`}>
      <TeacherProvider>
        <div className="flex h-full flex-col overflow-hidden max-[1100px]:h-auto max-[1100px]:min-h-full max-[1100px]:overflow-visible">
          <TeacherHeader />
          {children}
        </div>
      </TeacherProvider>
    </div>
  );
}
