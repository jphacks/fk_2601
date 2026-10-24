import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Navigator, type Mood } from "./Navigator";

type Variant = "primary" | "secondary" | "ghost" | "danger";

// 太い線と、下にずれた影（押すと、ぎゅっとへこむ）
const VARIANT: Record<Variant, string> = {
  primary:
    "border-2 border-ink bg-brand text-white shadow-[0_5px_0_var(--color-ink)] active:translate-y-[5px] active:shadow-[0_0_0_var(--color-ink)]",
  secondary:
    "border-2 border-ink bg-white text-ink shadow-[0_4px_0_var(--color-ink)] active:translate-y-1 active:shadow-[0_0_0_var(--color-ink)]",
  ghost: "bg-transparent text-ink/70 underline underline-offset-4",
  danger:
    "border-2 border-berry bg-white text-berry shadow-[0_4px_0_var(--color-berry)] active:translate-y-1 active:shadow-[0_0_0_var(--color-berry)]",
};

const BASE =
  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-center text-lg font-black transition disabled:pointer-events-none disabled:opacity-40";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant };

export function Button({ variant = "primary", className = "", ...props }: ButtonProps) {
  return <button type="button" className={`${BASE} ${VARIANT[variant]} ${className}`} {...props} />;
}

export function LinkButton({
  href,
  variant = "primary",
  className = "",
  children,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={`${BASE} ${VARIANT[variant]} ${className}`}>
      {children}
    </Link>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`paper-card p-5 ${className}`}>{children}</div>;
}

/** ナビゲーターキャラのふきだし */
export function Say({ mood = "happy", children }: { mood?: Mood; children: ReactNode }) {
  return (
    <div className="flex items-end gap-2">
      <Navigator mood={mood} size={76} />
      <div className="paper-card relative mb-3 flex-1 rounded-bl-md px-4 py-3 text-base font-medium">
        <span
          aria-hidden
          className="absolute -left-[9px] bottom-3 size-4 rotate-45 border-b-2 border-l-2 border-ink bg-white"
        />
        <div className="relative">{children}</div>
      </div>
    </div>
  );
}

export function ErrorNotice({ children, onRetry }: { children: ReactNode; onRetry?: () => void }) {
  return (
    <div className="space-y-3">
      <Say mood="sorry">{children}</Say>
      {onRetry && <Button onClick={onRetry}>もういちど ためす</Button>}
    </div>
  );
}
