import Link from "next/link";
import { Icon, type IconName } from "./Icons";

export type Tab = "home" | "zukan" | "stamp" | "minna" | "settings";

// 横の4つ。いまいる画面は、色のついた下じきで示す（docs/design/README.md「下のナビ」）
const SIDE: { key: Exclude<Tab, "home">; href: string; label: string; icon: IconName; on: string; text: string; stroke: string }[] = [
  { key: "zukan", href: "/archive", label: "ずかん", icon: "book", on: "bg-yellow-soft", text: "text-yellow-deep", stroke: "#9A6B00" },
  { key: "stamp", href: "/stamp", label: "スタンプ", icon: "stamp", on: "bg-purple-light", text: "text-purple-dark", stroke: "#6A3FD6" },
  { key: "minna", href: "/others", label: "みんな", icon: "people", on: "bg-pink-light", text: "text-pink-deep", stroke: "#C23668" },
  { key: "settings", href: "/settings", label: "せってい", icon: "gear", on: "bg-mint-light", text: "text-mint-dark", stroke: "#0F7A63" },
];

function SideTab({ tab, active }: { tab: (typeof SIDE)[number]; active: boolean }) {
  return (
    <Link
      href={tab.href}
      aria-current={active ? "page" : undefined}
      className={`flex flex-col items-center justify-center gap-0.5 pt-[3px] text-sm ${active ? `${tab.text} font-black` : "font-bold text-ink-muted"}`}
    >
      <span className={`flex h-[34px] w-14 items-center justify-center rounded-[17px] ${active ? tab.on : ""}`}>
        <Icon name={tab.icon} size={26} stroke={active ? tab.stroke : "#6B7090"} strokeWidth={active ? 2.4 : 2.2} />
      </span>
      {tab.label}
    </Link>
  );
}

// 上の 18px だけ すきまにして、その下に 3px の線と白い地を敷く
const BAR_BACKGROUND =
  "linear-gradient(var(--color-ink), var(--color-ink)) 0 18px / 100% 3px no-repeat, linear-gradient(var(--color-white), var(--color-white)) 0 18px / 100% 100% no-repeat";

/**
 * 下のナビ（5つ）。ずかん・スタンプ ｜ ホーム ｜ みんな・せってい。ホームだけ まんなかの大きい丸で、バーから はみ出す。
 * 上の 18px は丸がはみ出すぶんのすきまで、線と白い地は それより下だけ
 */
export function TabBar({ current }: { current: Tab }) {
  const home = current === "home";
  return (
    <nav aria-label="メニュー" className="sticky bottom-0 z-10 grid h-[102px] shrink-0 grid-cols-5 pt-[18px]" style={{ background: BAR_BACKGROUND }}>
      <SideTab tab={SIDE[0]} active={current === "zukan"} />
      <SideTab tab={SIDE[1]} active={current === "stamp"} />
      <Link href="/" aria-current={home ? "page" : undefined} className="flex flex-col items-center">
        <span
          className={`-mt-[14px] flex size-[76px] shrink-0 flex-col items-center justify-center rounded-full border-3 border-ink bg-navi text-[13px] font-black text-white ${
            home
              ? "shadow-[0_0_0_3px_var(--color-white),0_0_0_7px_var(--color-yellow)]"
              : "shadow-pop-sm active:translate-y-1 active:shadow-none"
          }`}
        >
          <Icon name="home" size={30} strokeWidth={2.6} />
          ホーム
        </span>
      </Link>
      <SideTab tab={SIDE[2]} active={current === "minna"} />
      <SideTab tab={SIDE[3]} active={current === "settings"} />
    </nav>
  );
}
