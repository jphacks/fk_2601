import Link from "next/link";
import { Icon, type IconName } from "./Icons";

export type Tab = "home" | "zukan" | "minna" | "settings";

// 現在のタブは、色のついた丸い地で示す（見本 04・20・21・22）
const TABS: { key: Tab; href: string; label: string; icon: IconName; on: string; text: string }[] = [
  { key: "home", href: "/", label: "ホーム", icon: "home", on: "bg-navi-light", text: "text-navi-dark" },
  { key: "zukan", href: "/archive", label: "ずかん", icon: "book", on: "bg-yellow-soft", text: "text-yellow-deep" },
  { key: "minna", href: "/others", label: "みんな", icon: "people", on: "bg-pink-light", text: "text-pink-deep" },
  { key: "settings", href: "/settings", label: "せってい", icon: "gear", on: "bg-mint-light", text: "text-mint-dark" },
];

/** 下の4つのタブ */
export function TabBar({ current }: { current: Tab }) {
  return (
    <nav className="sticky bottom-0 z-10 grid h-[84px] shrink-0 grid-cols-4 border-t-3 border-ink bg-white" aria-label="メニュー">
      {TABS.map((tab) => {
        const active = tab.key === current;
        return (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`flex flex-col items-center justify-center gap-0.5 text-sm ${active ? `${tab.text} font-black` : "font-bold text-ink-muted"}`}
          >
            <span className={`flex h-[34px] w-[58px] items-center justify-center rounded-[17px] ${active ? tab.on : ""}`}>
              <Icon name={tab.icon} size={26} strokeWidth={active ? 2.4 : 2.2} />
            </span>
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
