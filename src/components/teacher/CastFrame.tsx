"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { useTeacher, type CastMode } from "./TeacherProvider";

// 教室に映す画面の外わく（上の帯・映す先・とじる・チョーク受け）。はてなを映す画面と、参加コードを映す画面で使う
// 見本は docs/design/teachers/screens/06〜11・17〜18、色と文字は docs/design/teachers/README.md「教室に映す画面の色」「文字」
// 映す文字は子どもが読むので、子どもの画面の文字の決まり（ひらがな・わかち書き・22px 以上の漢字にふりがな）に合わせる

// 見本（1600×900）の px を、画面の大きさに合わせて縮める（横と縦の、きつい方に合わせる）
export const castSize = (px: number) => `min(${px / 16}vw, ${px / 9}vh)`;

export function castTheme(mode: CastMode) {
  const monitor = mode === "monitor";
  return {
    monitor,
    root: monitor ? "bg-t-proj-board font-t-chalk text-t-proj-chalk" : "bg-t-cast-bg font-t-cast text-t-cast-fg",
    weight: monitor ? "font-semibold" : "font-black",
    bodyWeight: monitor ? "font-normal" : "font-bold",
    // チョークのにじみ（モニターだけ）
    chalk: monitor ? "[text-shadow:0_0_1px_rgba(255,255,255,0.35)]" : "",
    line: monitor ? "border border-[rgba(244,241,232,0.38)]" : "border-2 border-t-cast-fg",
    control: monitor ? "text-[#E4ECE7]" : "text-t-cast-fg",
    sub: monitor ? "text-t-proj-sub" : "text-t-cast-fg",
    soft: monitor ? "text-[#DCE7E1]" : "text-t-cast-fg",
    accentText: monitor ? "text-t-proj-yellow" : "text-t-cast-yellow",
    accentBg: monitor ? "bg-t-proj-yellow" : "bg-t-cast-yellow",
    onAccent: monitor ? "text-t-text" : "text-black",
    magnet: monitor ? "bg-t-chalk" : "bg-t-cast-yellow",
  };
}

export type CastTheme = ReturnType<typeof castTheme>;

export function CastIcon({ size }: { size: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="12" rx="1.5" />
      <path d="M8 20h8" />
      <path d="M12 16v4" />
    </svg>
  );
}

function BoardIcon({ size }: { size: number }) {
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="13" rx="1" />
      <path d="M5 20h14" />
      <path d="M15 20v-3" />
    </svg>
  );
}

const CAST_MODES: { id: CastMode; label: string; Icon: typeof CastIcon }[] = [
  { id: "monitor", label: "モニター", Icon: CastIcon },
  { id: "board", label: "黒板", Icon: BoardIcon },
];

// 全画面の dialog で開く（後ろの管理画面は押せなくなり、Esc で閉じる）
export function CastFrame({ label, title, info, controls, onClose, onKeyDown, children }: {
  label: string;
  title: React.ReactNode; // 子どもが読む見出し（「〇〇 さんが みつけた はてな」など）
  info: string; // 先生向けの小さな説明（クラス・何問目か など）
  controls?: (theme: CastTheme) => React.ReactNode; // 映す先と とじる のあいだに出す先生の操作
  onClose: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  children: (theme: CastTheme) => React.ReactNode;
}) {
  const { castMode: mode, setCastMode } = useTeacher();
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const t = castTheme(mode);

  return (
    <dialog
      ref={ref}
      aria-label={label}
      onClose={onClose}
      onKeyDown={onKeyDown}
      className={`fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none overflow-hidden border-0 p-0 ${t.root}`}
    >
      <div className="relative flex h-full flex-col px-[4vw] pt-[4.5vh] pb-[calc(36px+4vh)]">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div className="flex min-w-0 items-center gap-[18px]">
            <span className={`inline-flex size-16 shrink-0 items-center justify-center rounded-full ${t.monitor ? "bg-t-proj-chalk" : "bg-t-cast-fg"}`}>
              <Image src="/navi/navi-smile.png" alt="" width={54} height={54} className="size-[54px]" />
            </span>
            <span className="flex min-w-0 flex-col gap-1.5">
              <span className={`text-[32px] tracking-[0.04em] ${t.weight} ${t.chalk}`}>{title}</span>
              <span className={`font-t-body text-base tabular-nums ${t.monitor ? "text-t-proj-sub" : "font-bold"}`}>{info}</span>
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 font-t-body">
            <div role="group" aria-label="映す先" className={`flex items-center gap-1 rounded-xl p-1 ${t.line}`}>
              <span className={`px-2 text-[13px] font-bold ${t.control}`}>映す先</span>
              {CAST_MODES.map(({ id, label: modeLabel, Icon }) => {
                const on = id === mode;
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setCastMode(id)}
                    className={`inline-flex h-10 items-center gap-1.5 rounded-lg px-3.5 text-sm font-bold pointer-coarse:h-11 ${on ? `${t.accentBg} ${t.onAccent}` : t.control}`}
                  >
                    <Icon size={18} />
                    {modeLabel}
                  </button>
                );
              })}
            </div>
            {controls?.(t)}
            <button type="button" onClick={() => ref.current?.close()} className={`inline-flex h-12 items-center gap-2 rounded-[10px] px-4 text-[15px] font-bold ${t.line} ${t.control}`}>
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                <path d="M6 6l12 12" />
                <path d="M18 6L6 18" />
              </svg>
              とじる
            </button>
          </div>
        </div>

        {children(t)}

        {/* チョーク受けの絵は、モニターだけ（黒板には本物がある） */}
        {t.monitor && (
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-9 border-t-[6px] border-[#4A3524] bg-[#5C432D]">
            <span className="absolute top-1.5 right-[220px] h-3 w-[60px] -rotate-[4deg] rounded bg-t-proj-chalk" />
            <span className="absolute top-2 right-[140px] h-3 w-[52px] rotate-[3deg] rounded bg-t-proj-yellow" />
            <span className="absolute top-1.5 right-[72px] h-3 w-11 -rotate-2 rounded bg-t-proj-pink" />
          </div>
        )}
      </div>
    </dialog>
  );
}

// 学年・組の漢字にふりがなをつける（「5年2組」は 22px 以上で出すため）
const CLASS_NAME_RUBY: Record<string, string> = { 年: "ねん", 組: "くみ" };

export function ClassNameRuby({ name }: { name: string }) {
  return (
    <>
      {[...name].map((ch, i) =>
        CLASS_NAME_RUBY[ch] ? (
          <ruby key={i}>
            {ch}
            <rt className="text-[0.42em] tracking-normal">{CLASS_NAME_RUBY[ch]}</rt>
          </ruby>
        ) : (
          ch
        ),
      )}
    </>
  );
}
