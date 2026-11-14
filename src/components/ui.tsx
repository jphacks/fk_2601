import { Jp } from "./RubyText";
import Link from "next/link";
import { isValidElement, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Navigator, type Mood } from "./Navigator";
import { useReportError } from "./PresenceProvider";

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

/**
 * 押せるものと押せないものを、見た目で分ける（docs/02-spec.md 2.3・docs/design/README.md「形」）。
 * 押せるもの：太い線と、下にずれた影（押すと沈む）。押せないもの：線も影もなし、うすい色の地だけ（PANEL）。
 * 押せないカードの形（地の色は、それぞれの場所で足す。白い地の上に白いカードは置かない）
 */
export const PANEL = "rounded-card";

/**
 * 選ぶボタン（学年・予想の選択肢 など）。選ぶ前は ほかのボタンと同じく影つき（押せると分かる）、
 * 選んだら「押しこまれた」形（影なし・少し下がる）にする。色は それぞれの場所で足す
 */
export const CHOICE_UP = "shadow-pop-sm active:translate-y-1 active:shadow-none";
export const CHOICE_DOWN = "translate-y-1 shadow-none";

/** うすい色のカード（押せない。お知らせ・説明用） */
export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`${PANEL} bg-cloud p-5 ${className}`}>{children}</div>;
}

/**
 * ナビのふきだし（ナビ画像の右。しっぽは回転した四角）。押せないので、線も影もなく地の色だけ。
 * 地は navi-light。ピタリのときだけ red-light（tone="red"）
 */
export function Say({
  mood = "happy",
  children,
  size = 88,
  tone = "navi",
  react = false,
  small = false,
}: {
  mood?: Mood;
  children: ReactNode;
  size?: number;
  tone?: "navi" | "red";
  react?: boolean;
  /** 場所がせまいときの、小さなふきだし（文字は 18px。22px より小さいので、中の文は ひらがなにする） */
  small?: boolean;
}) {
  const bg = tone === "red" ? "bg-red-light" : "bg-navi-light";
  return (
    <div className="flex items-center gap-3">
      <Navigator mood={mood} size={size} react={react} />
      <div className={`relative grow rounded-card font-black ${small ? "px-3 py-2 text-[18px] leading-[1.5]" : "px-4 py-3 text-[21px] leading-[1.7]"} ${bg}`}>
        <span aria-hidden className={`absolute -left-2 top-[calc(50%-8px)] size-4 rotate-45 ${bg}`} />
        <div className="relative">{children}</div>
      </div>
    </div>
  );
}

/** 文そのもの、または <Jp>文</Jp> の文を取り出す（それ以外は null） */
function textOf(node: ReactNode): string | null {
  if (typeof node === "string") return node;
  if (isValidElement<{ children?: ReactNode }>(node) && typeof node.props.children === "string") return node.props.children;
  return null;
}

export function ErrorNotice({ children, onRetry }: { children: ReactNode; onRetry?: () => void }) {
  // 文のときは、先生の画面の「さいごのエラー」に知らせる（#192。グループに入っていない子・デモでは何も起きない）
  useReportError(textOf(children));
  return (
    <div className="space-y-4">
      {/* 文字だけのときは、ふりがなの記法で書かれていても 学年に合わせて出す */}
      <Say mood="sorry">{typeof children === "string" ? <Jp big>{children}</Jp> : children}</Say>
      {onRetry && (
        <Button onClick={onRetry}>
          <Jp big>{"もう{一度|いちど} {試|ため}す"}</Jp>
        </Button>
      )}
    </div>
  );
}

/** 小さな札（分類・「いくつ？」など）。押せないので地の色だけ（分類の色をうすく敷く） */
export function Tag({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-block rounded-xl px-3 py-0.5 text-sm font-black ${className}`}>
      {children}
    </span>
  );
}
