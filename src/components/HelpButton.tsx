"use client";

import { Jp } from "./RubyText";
import { Icon } from "./Icons";
import { usePresence } from "./PresenceProvider";

/**
 * 「たすけて」ボタン（#192）。グループに入っている子にだけ出る（入っていない子・デモでは何も出ない）。
 * 押すと グループの先生の画面に「たすけて」が出て、「せんせいに しらせたよ」と出る。もう一度 押すと とりけせる。
 * 場所は、画面の上のはし（もどる・タイトルと同じ段の右）。下のナビや 撮る・囲む の操作と かさならない
 */
export function HelpButton({ className = "" }: { className?: string }) {
  const presence = usePresence();
  if (!presence?.canHelp) return null;
  const { help, toggleHelp } = presence;
  return (
    <button
      type="button"
      aria-pressed={help}
      aria-label={help ? "せんせいに しらせたよ。もういちど おすと とりけす" : "せんせい たすけて"}
      onClick={toggleHelp}
      className={`flex h-11 shrink-0 items-center gap-1 rounded-full border-3 border-ink px-3 text-[15px] font-black shadow-pop-xs active:translate-y-[3px] active:shadow-none ${
        help ? "translate-y-[3px] bg-yellow shadow-none" : "bg-white"
      } ${className}`}
    >
      <Icon name={help ? "check" : "flag"} size={20} strokeWidth={2.6} />
      <Jp>{help ? "しらせたよ" : "たすけて"}</Jp>
    </button>
  );
}

/** 「グループの先生に いま どの画面かが 見えるよ」という、子どもへの お知らせ（はじめに伝える：#192） */
export function PresenceNote({ className = "" }: { className?: string }) {
  return (
    <p className={`text-[15px] font-bold leading-normal text-ink-sub ${className}`}>
      <Jp>{"グループの {先生|せんせい}に、いま どの {画面|がめん}を {使|つか}っているか {見|み}えるよ"}</Jp>
    </p>
  );
}
