"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/Icons";
import { APP_NAME } from "@/lib/constants";
import { classUntilNow, DEMO_TEACHER } from "@/lib/teacherDemo";
import { useTeacher } from "./TeacherProvider";

const NAV = [
  { href: "/teacher", label: "きょう" },
  { href: "/teacher/hatena", label: "はてな" },
  { href: "/teacher/missions", label: "ミッション" },
  { href: "/teacher/members", label: "メンバー" },
];

const SETTINGS_HREF = "/teacher/settings";
// グループの管理（#120）は見本ではなく本物のデータを扱うので、見本のクラス・先生・メニューを出さない
const GROUPS_HREF = "/teacher/groups";

function isActive(pathname: string, href: string) {
  if (href === "/teacher") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

// 見本は PC 向けに 36px。タブレットでは押せるものを 44px 以上にする（docs/design/teachers/README.md「形とレイアウト」）
const CONTROL_HEIGHT = "h-9 pointer-coarse:h-11";

// クラスの切りかえ：見た目は見本のボタンのまま、選ぶところは端末の標準の選択肢を使う
function ClassSwitcher() {
  const { classes, currentClass, selectClass } = useTeacher();
  return (
    <label
      className={`relative inline-flex ${CONTROL_HEIGHT} cursor-pointer items-center gap-2 rounded-tbtn border border-white/30 px-2.5 text-sm font-bold whitespace-nowrap text-white focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-white`}
    >
      {currentClass.name}
      <span className="text-[11px] font-normal text-t-on-board">{currentClass.schoolYear}</span>
      <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 9l6 6 6-6" />
      </svg>
      <select
        aria-label={`クラスを切り替える（表示中：${currentClass.name}）`}
        value={currentClass.id}
        onChange={(e) => selectClass(e.target.value)}
        className="absolute inset-0 cursor-pointer text-base text-t-text opacity-0"
      >
        {classes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}（{c.schoolYear}・{c.role}）
          </option>
        ))}
      </select>
    </label>
  );
}

// いま何が見えるかを、いつも出す（docs/06-school-expansion.md 5.2）
function SessionStatus() {
  const { currentClass } = useTeacher();
  const until = classUntilNow(currentClass.hours);
  const inClass = until !== null;
  return (
    <Link
      href={SETTINGS_HREF}
      title={inClass ? "この時間に保存された はてなは、内容まで見られます" : "いま保存されたものは件数だけ数えます"}
      className={`inline-flex ${CONTROL_HEIGHT} items-center gap-2 rounded-full border border-white/30 px-3 text-[13px] whitespace-nowrap text-white ${FOCUS} ${inClass ? "bg-[rgba(76,211,138,0.14)]" : "bg-white/5"}`}
    >
      <span aria-hidden="true" className={`size-[9px] rounded-full ${inClass ? "bg-t-live shadow-[0_0_0_3px_rgba(76,211,138,0.25)]" : "bg-[#9AA7A1]"}`} />
      <strong>{inClass ? "授業時間中" : "授業時間の外"}</strong>
      <span className="text-t-on-board tabular-nums">{inClass ? `〜${until} ・ 内容まで見えます` : "件数だけ数えます"}</span>
    </Link>
  );
}

function Logo({ href, sub }: { href: string; sub: string }) {
  return (
    <Link href={href} className={`flex items-center gap-2.5 py-2 text-white ${FOCUS}`}>
      <Image src="/navi/navi-smile.png" alt="" width={32} height={32} className="size-8 rounded-[9px] bg-white p-[3px]" />
      <span className="flex flex-col gap-px leading-[1.2]">
        <span className="font-pop text-sm">{APP_NAME}</span>
        <span className="text-[10px] text-t-on-board">{sub}</span>
      </span>
    </Link>
  );
}

export function TeacherHeader() {
  const pathname = usePathname();
  const onSettings = isActive(pathname, SETTINGS_HREF);

  if (isActive(pathname, GROUPS_HREF)) {
    return (
      <header className="w-full shrink-0 bg-t-board text-white">
        <div className="mx-auto flex min-h-14 max-w-[1400px] flex-wrap items-center gap-x-3.5 px-6">
          <Logo href={GROUPS_HREF} sub="管理者用" />
          <span className="text-sm font-bold">グループの管理</span>
        </div>
      </header>
    );
  }

  return (
    <header className="w-full shrink-0 bg-t-board text-white">
      <div className="mx-auto flex min-h-14 max-w-[1400px] flex-wrap items-center gap-x-3.5 px-6 min-[1360px]:gap-x-[22px]">
        <Logo href="/teacher" sub="先生用" />

        <span
          title="架空のクラスのデータです。実際の子どもの情報は入っていません"
          className="inline-flex h-6 items-center rounded-full border border-t-chalk-line bg-t-chalk-soft px-2.5 text-xs font-bold whitespace-nowrap text-t-chalk-text"
        >
          見本（デモ）
        </span>

        <ClassSwitcher />

        <nav aria-label="メインメニュー" className="flex flex-auto flex-wrap gap-x-3.5 self-stretch min-[1360px]:gap-x-[22px]">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`inline-flex min-h-14 items-center px-0.5 text-sm ${FOCUS} ${active ? "font-bold text-white shadow-[inset_0_-3px_0_var(--color-t-chalk)]" : "text-t-on-board"}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-wrap items-center gap-2 py-2">
          <SessionStatus />
          <Link
            href="/teacher/cast"
            className={`inline-flex ${CONTROL_HEIGHT} items-center gap-2 rounded-tbtn bg-t-chalk px-3 text-[13px] font-bold whitespace-nowrap text-t-text ${FOCUS}`}
          >
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="12" rx="1.5" />
              <path d="M8 20h8" />
              <path d="M12 16v4" />
            </svg>
            教室に映す
          </Link>
          <Link
            href={SETTINGS_HREF}
            aria-label="クラスの設定"
            aria-current={onSettings ? "page" : undefined}
            className={`inline-flex ${CONTROL_HEIGHT} w-9 items-center justify-center rounded-tbtn border border-white/30 pointer-coarse:w-11 ${FOCUS} ${onSettings ? "bg-white/15" : ""}`}
          >
            <Icon name="gear" size={18} stroke="#FFFFFF" strokeWidth={1.8} />
          </Link>
          <span
            role="img"
            aria-label={`${DEMO_TEACHER.name} 先生`}
            className="inline-flex size-8 items-center justify-center rounded-full bg-[#34604F] text-[13px] font-bold"
          >
            {DEMO_TEACHER.initial}
          </span>
        </div>
      </div>
    </header>
  );
}
