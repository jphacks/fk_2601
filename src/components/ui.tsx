import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Navigator, type Mood } from "./Navigator";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const VARIANT: Record<Variant, string> = {
  primary: "bg-brand text-white shadow-[0_4px_0_var(--color-brand-dark)] active:translate-y-1 active:shadow-none",
  secondary: "bg-white text-brand border-2 border-brand active:bg-brand/10",
  ghost: "bg-transparent text-ink/70 underline underline-offset-4",
  danger: "bg-white text-berry border-2 border-berry active:bg-berry/10",
};

const BASE =
  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl px-5 py-3 text-center text-lg font-bold transition disabled:opacity-40 disabled:pointer-events-none";

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
  return <div className={`rounded-3xl bg-white p-5 shadow-sm ring-1 ring-ink/5 ${className}`}>{children}</div>;
}

/** ナビゲーターキャラのふきだし */
export function Say({ mood = "happy", children }: { mood?: Mood; children: ReactNode }) {
  return (
    <div className="flex items-end gap-2">
      <Navigator mood={mood} size={72} />
      <div className="relative mb-2 flex-1 rounded-2xl rounded-bl-sm bg-white px-4 py-3 text-base shadow-sm ring-1 ring-ink/5">
        {children}
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
