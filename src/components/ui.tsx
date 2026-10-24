import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Navigator, type Mood } from "./Navigator";

/**
 * ボタン（docs/design/README.md「部品の Tailwind レシピ」）
 * main：青いメインボタン（72px）／seeno：ピンクの「せーの！」／sub：白いサブボタン／danger：ピンクうすい地／ghost：下線だけ
 */
type Variant = "main" | "seeno" | "sub" | "danger" | "ghost" | "plain" | "primary" | "secondary";

const VARIANT: Record<Exclude<Variant, "primary" | "secondary">, string> = {
  main: "h-[72px] rounded-btn border-3 border-ink bg-navi font-pop text-2xl text-white shadow-pop active:translate-y-[6px] active:shadow-none",
  seeno:
    "h-[76px] rounded-[28px] border-3 border-ink bg-pink font-pop text-[28px] text-ink shadow-pop active:translate-y-[6px] active:shadow-none",
  sub: "min-h-14 rounded-[22px] border-3 border-ink bg-white text-lg font-black text-ink shadow-pop-sm active:translate-y-1 active:shadow-none",
  danger:
    "min-h-14 rounded-[22px] border-3 border-ink bg-pink-light text-lg font-black text-pink-dark shadow-pop-sm active:translate-y-1 active:shadow-none",
  ghost: "min-h-11 bg-transparent text-base font-black text-ink-sub underline underline-offset-4",
  // 見た目は className で全部決める（形の変わるボタン用）
  plain: "",
};

// 前の名前（primary / secondary）も使えるようにしておく
const ALIAS = { primary: "main", secondary: "sub" } as const;

const BASE =
  "inline-flex w-full items-center justify-center gap-2 px-5 text-center transition disabled:pointer-events-none disabled:opacity-40";

function styleOf(variant: Variant): string {
  const key = variant === "primary" || variant === "secondary" ? ALIAS[variant] : variant;
  return `${BASE} ${VARIANT[key]}`;
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant };

export function Button({ variant = "main", className = "", ...props }: ButtonProps) {
  return <button type="button" className={`${styleOf(variant)} ${className}`} {...props} />;
}

export function LinkButton({
  href,
  variant = "main",
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={`${styleOf(variant)} ${className}`}>
      {children}
    </Link>
  );
}

/** 白いカード。太い線と、下にずれた影 */
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-card border-3 border-ink bg-white p-5 shadow-pop-md ${className}`}>{children}</div>;
}

/** ナビのふきだし（ナビ画像の右。しっぽは回転した四角） */
export function Say({ mood = "happy", children, size = 88 }: { mood?: Mood; children: ReactNode; size?: number }) {
  return (
    <div className="flex items-center gap-3">
      <Navigator mood={mood} size={size} />
      <div className="relative grow rounded-card border-3 border-ink bg-white px-4 py-3 text-[19px] font-black leading-[1.75] shadow-pop-sm">
        <span aria-hidden className="absolute -left-[11px] top-[calc(50%-9px)] size-4 rotate-45 border-b-3 border-l-3 border-ink bg-white" />
        <div className="relative">{children}</div>
      </div>
    </div>
  );
}

export function ErrorNotice({ children, onRetry }: { children: ReactNode; onRetry?: () => void }) {
  return (
    <div className="space-y-4">
      <Say mood="sorry">{children}</Say>
      {onRetry && <Button onClick={onRetry}>もういちど ためす</Button>}
    </div>
  );
}

/** 小さな札（分類・「いくつ？」など）。色は分類の色をうすく敷く */
export function Tag({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-block rounded-xl border-[2.5px] border-ink px-3 py-0.5 text-sm font-black ${className}`}>
      {children}
    </span>
  );
}
