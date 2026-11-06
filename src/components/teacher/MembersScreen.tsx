"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { answerText, DEMO_TODAY, memberRecords, type DemoField, type DemoMember, type DemoPending, type TeacherClass } from "@/lib/teacherDemo";
import { SceneThumb } from "./SceneThumb";
import { useTeacher } from "./TeacherProvider";

// メンバー（一覧・参加の確認・個別）。見本は docs/design/teachers/screens/13〜14、仕様は docs/06-school-expansion.md 5.1・5.2・5.5
// 操作の結果はこの画面の中だけに反映し、読み込み直すとはじめに戻る（デモのデータ）

// 大きさは組み合わせごとに決める（同じ種類のクラスを重ねると、どちらが効くかが CSS の順番で決まってしまうため）
// タブレットでは押せるものを 44px 以上にし、入力欄の文字を 16px にする（iPad で拡大されないように）
const BTN_BASE = "inline-flex items-center justify-center gap-1.5 rounded-tbtn border text-[13px] font-bold whitespace-nowrap";
const SIZE_36 = "h-9 px-3.5 pointer-coarse:h-11";
const SIZE_32 = "h-8 px-2.5 pointer-coarse:h-11";
const SIZE_40 = "h-10 px-3.5 pointer-coarse:h-11";
const PRIMARY = "border-t-board bg-t-board text-white";
const SUB = "border-t-board bg-white text-t-board";
const GHOST = "min-h-[34px] px-1.5 text-xs font-bold text-t-board pointer-coarse:min-h-11";
const GHOST_SMALL = "min-h-6 px-1 py-0.5 text-xs font-bold text-t-board pointer-coarse:min-h-11";
const GHOST_SMALL_MUTED = "min-h-6 px-1 py-0.5 text-xs font-bold text-t-text-sub pointer-coarse:min-h-11";
const FIELD_BASE = "rounded-tbtn border border-t-field-line bg-white text-t-text pointer-coarse:text-base";
const NUMBER_FIELD = `${FIELD_BASE} w-[58px] px-1.5 text-[13px]`;

const PAGE_SIZE = 10;

const FIELD_COLOR: Record<DemoField, string> = { 算数: "bg-t-math", 理科: "bg-t-sci", 情報: "bg-t-info" };
const FIELDS: DemoField[] = ["算数", "理科", "情報"];

// 確認した子どもは、件数0・いま参加 の印つきで一覧に足す
type Row = DemoMember & { joinedOrder: number; isNew: boolean };

type SortKey = "no" | "joined";

function toDate(joined: string) {
  const [y, m, d] = joined.split("/").map(Number);
  return y * 10000 + m * 100 + d;
}

function sortRows(rows: Row[], key: SortKey) {
  return [...rows].sort((a, b) => {
    if (key === "joined") return toDate(a.joined) - toDate(b.joined) || a.joinedOrder - b.joinedOrder;
    // 出席番号順。番号がまだの子どもは うしろに、参加した順で並べる
    if (a.no === null || b.no === null) return a.no === null ? (b.no === null ? a.joinedOrder - b.joinedOrder : 1) : -1;
    return a.no - b.no;
  });
}

// 出席番号の入力を数にする（1〜60。空や範囲の外は「まだ」）
function parseNo(text: string): number | null {
  const n = Number(text);
  return text.trim() !== "" && Number.isInteger(n) && n >= 1 && n <= 60 ? n : null;
}

const normalize = (s: string) => s.replace(/\s/g, "");

function inClassTotal(m: DemoMember) {
  return FIELDS.reduce((sum, f) => sum + m.fields[f], 0);
}

function Avatar({ size }: { size: number }) {
  return (
    <Image
      src="/navi/navi-smile.png"
      alt=""
      width={size}
      height={size}
      className="shrink-0 rounded-full bg-[#EEF2F0]"
      style={{ width: size, height: size, padding: size > 40 ? 5 : 2 }}
    />
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-[10px] bg-t-ground px-3.5 py-3">
      <span className="text-xs text-t-text-sub">{label}</span>
      {children}
    </div>
  );
}

function BigNumber({ value, unit }: { value: number; unit: string }) {
  return (
    <span>
      <span className="text-[28px] leading-none font-bold tabular-nums">{value}</span>
      <span className="ml-[3px] text-xs text-t-text-sub">{unit}</span>
    </span>
  );
}

function PendingSection({ pending, numbers, onNumber, onApprove, onReject }: {
  pending: DemoPending[];
  numbers: Record<string, string>;
  onNumber: (id: string, value: string) => void;
  onApprove: (p: DemoPending) => void;
  onReject: (p: DemoPending) => void;
}) {
  return (
    <section aria-labelledby="h-pending" className="flex flex-col gap-1.5 border-y border-[#F0DDA0] bg-t-pending px-3 py-2.5">
      <h2 id="h-pending" className="flex flex-wrap items-center gap-2 text-[13px] font-bold">
        <span aria-hidden="true" className="size-[9px] rounded-full bg-[#D99A00]" />
        確認待ち {pending.length}人
        <span className="text-[11px] font-normal text-t-chalk-text">番号はあとでも入れられます</span>
      </h2>
      {pending.map((p) => (
        <div key={p.id} className="flex items-center gap-1.5 rounded-tbtn bg-white px-2 py-1.5">
          <span className="flex min-w-0 flex-1 flex-col gap-px">
            <span className="truncate text-[13px] font-bold">
              {p.name}
              <span className="text-[11px] font-normal text-t-text-sub">（{p.user}）</span>
            </span>
            <span className="truncate text-[11px] text-t-text-sub">{p.mail}</span>
          </span>
          <input
            type="number"
            min={1}
            max={60}
            inputMode="numeric"
            placeholder="番号"
            aria-label={`${p.name}さんの出席番号`}
            value={numbers[p.id] ?? ""}
            onChange={(e) => onNumber(p.id, e.target.value)}
            className={`${NUMBER_FIELD} h-8 pointer-coarse:h-11`}
          />
          <button type="button" onClick={() => onReject(p)} aria-label={`${p.name}さんはこのクラスではない`} className={GHOST}>
            ちがう
          </button>
          <button type="button" onClick={() => onApprove(p)} aria-label={`${p.name}さんを確認する`} className={`${BTN_BASE} ${SIZE_32} ${PRIMARY}`}>
            確認
          </button>
        </div>
      ))}
    </section>
  );
}

function NumberEditor({ row, onSave }: { row: Row; onSave: (no: number | null) => void }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState("");
  if (!editing) {
    return (
      <dd className="m-0 flex items-center gap-1">
        <strong className="text-sm tabular-nums">{row.no ?? "—"}</strong>
        <button
          type="button"
          onClick={() => {
            setText(row.no === null ? "" : String(row.no));
            setEditing(true);
          }}
          aria-label={`${row.name}さんの出席番号を変える`}
          className={GHOST_SMALL}
        >
          変える
        </button>
      </dd>
    );
  }
  return (
    <dd className="m-0">
      <form
        className="flex items-center gap-1"
        onSubmit={(e) => {
          e.preventDefault();
          onSave(parseNo(text));
          setEditing(false);
        }}
      >
        <input
          type="number"
          min={1}
          max={60}
          inputMode="numeric"
          autoFocus
          aria-label={`${row.name}さんの出席番号`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setEditing(false);
          }}
          className={`${NUMBER_FIELD} h-7 pointer-coarse:h-11`}
        />
        <button type="submit" className={GHOST_SMALL}>
          保存
        </button>
        <button type="button" onClick={() => setEditing(false)} className={GHOST_SMALL_MUTED}>
          やめる
        </button>
      </form>
    </dd>
  );
}

function MemberDetail({ row, grade, onNumber, onAskRemove }: { row: Row; grade: string; onNumber: (no: number | null) => void; onAskRemove: () => void }) {
  const inClass = inClassTotal(row);
  const records = memberRecords(row);
  const fieldLabel = FIELDS.map((f) => `${f}${row.fields[f]}件`).join("、");

  return (
    <section aria-labelledby="h-person" className="flex min-h-0 flex-col gap-4 overflow-auto rounded-tcard border border-t-line bg-t-surface px-[22px] py-5 max-[1100px]:overflow-visible">
      <div className="flex flex-wrap items-center gap-4">
        <Avatar size={60} />
        <div className="flex flex-[1_1_220px] flex-col gap-1">
          <h2 id="h-person" className="text-[22px] font-bold tracking-[0.02em]">
            {row.name}
          </h2>
          <p className="text-[13px] text-t-text-2">
            ユーザー名 <strong>{row.user}</strong> ・ 称号「{row.title}」
          </p>
        </div>
        <dl className="m-0 grid grid-cols-[auto_auto_auto_auto] items-center gap-x-3.5 gap-y-1 text-xs max-[640px]:grid-cols-[auto_auto]">
          <dt className="text-t-text-sub">出席番号</dt>
          <NumberEditor key={row.id} row={row} onSave={onNumber} />
          <dt className="text-t-text-sub">学年</dt>
          <dd className="m-0">{grade}</dd>
          <dt className="text-t-text-sub">メール</dt>
          <dd className="m-0 break-all">{row.mail}</dd>
          <dt className="text-t-text-sub">参加した日</dt>
          <dd className="m-0 tabular-nums">{row.joined}</dd>
        </dl>
      </div>

      <div className="grid grid-cols-3 gap-2.5 max-[640px]:grid-cols-1">
        <Stat label="保存した はてな（今年度）">
          <BigNumber value={inClass + row.out} unit="件" />
          <span className="flex gap-2.5 text-[11px] text-t-text-2">
            <span>
              授業中 <strong>{inClass}</strong>
            </span>
            <span>
              授業の外 <strong>{row.out}</strong>
            </span>
          </span>
        </Stat>
        <Stat label={`分野（授業中の ${inClass}件）`}>
          <div role="img" aria-label={fieldLabel} className="mt-1.5 flex h-2.5 gap-0.5 overflow-hidden rounded-[5px] bg-t-line-soft">
            {FIELDS.map((f) => (row.fields[f] > 0 ? <div key={f} className={FIELD_COLOR[f]} style={{ flex: row.fields[f] }} /> : null))}
          </div>
          <span className="flex flex-wrap gap-x-2.5 gap-y-0.5 text-[11px] text-t-text-2">
            {FIELDS.map((f) => (
              <span key={f} className="inline-flex items-center gap-1">
                <span aria-hidden="true" className={`size-2 rounded-full ${FIELD_COLOR[f]}`} />
                {f} <strong>{row.fields[f]}</strong>
              </span>
            ))}
          </span>
        </Stat>
        <Stat label="ミッションをクリアした日">
          <BigNumber value={row.missions} unit="日" />
        </Stat>
      </div>

      <div className="flex items-center gap-2.5 rounded-[10px] bg-t-board-tint px-3.5 py-2 text-xs leading-[1.6] text-t-board">
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
          <rect x="5" y="11" width="14" height="9" rx="2" />
          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
        </svg>
        <span>授業時間の外に保存した {row.out}件 は件数だけです。見るだけで、書きかえや削除はできません。</span>
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="flex items-baseline justify-between gap-3 pointer-coarse:items-center">
          <h3 className="text-sm font-bold">授業中に保存した はてな（新しい順）</h3>
          <Link href="/teacher/hatena" className="text-[13px] font-bold whitespace-nowrap text-t-board pointer-coarse:inline-flex pointer-coarse:min-h-11 pointer-coarse:items-center">
            すべて見る →
          </Link>
        </div>
        {records.length > 0 ? (
          <div className="grid grid-cols-3 gap-3 max-[640px]:grid-cols-1">
            {records.map((r) => (
              <article key={r.id} className="flex flex-col overflow-hidden rounded-xl border border-[#E3E9E6]">
                <SceneThumb scene={r.scene} className="h-24 w-full" />
                <div className="flex flex-1 flex-col gap-1.5 px-3 py-2.5">
                  <span className="inline-flex items-center gap-1.5 text-[11px] text-t-text-2">
                    <span aria-hidden="true" className={`size-2 rounded-full ${FIELD_COLOR[r.field]}`} />
                    {r.unit} ・ {r.at}
                  </span>
                  <p className="line-clamp-2 text-[13px] leading-[1.55] font-bold">{r.question}</p>
                  <span className="mt-auto flex flex-wrap items-center gap-1.5 text-xs text-t-text-2 tabular-nums">
                    <span className="text-t-text-sub">予想</span>
                    {r.guess}
                    <span aria-hidden="true" className="text-t-text-sub">
                      →
                    </span>
                    <span className="sr-only">答え</span>
                    <strong>{answerText(r)}</strong>
                  </span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-[10px] bg-t-ground p-4 text-[13px] text-t-text-sub">参加が確認されてから保存された はてなは、まだありません。</p>
        )}
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-t-line-soft pt-3.5">
        <p className="text-xs text-t-text-sub">転校したときや、まちがって入ったときは、クラスから外せます。</p>
        <button type="button" onClick={onAskRemove} className={`${BTN_BASE} ${SIZE_36} border-t-danger-line bg-white text-t-danger`}>
          クラスから外す
        </button>
      </div>
    </section>
  );
}

function RemoveDialog({ name, open, onCancel, onConfirm }: { name: string; open: boolean; onCancel: () => void; onConfirm: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="h-remove"
      onClose={onCancel}
      className="m-auto w-[calc(100%-48px)] max-w-[480px] rounded-2xl bg-white p-7 text-t-text backdrop:bg-[rgba(14,28,22,0.55)]"
    >
      <div className="flex flex-col gap-4">
        <h2 id="h-remove" className="text-xl font-bold">
          {name}さんをクラスから外しますか？
        </h2>
        <ul className="flex list-disc flex-col gap-2 pl-5 text-sm leading-[1.75] text-t-text-2">
          <li>外したあとは、この子の内容を先生は見られなくなります</li>
          <li>子どものずかんは、そのまま残ります</li>
          <li>もう一度入るときは、参加コードを入れ直して、先生が確認します</li>
        </ul>
        <div className="mt-1 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className={`${BTN_BASE} ${SIZE_40} ${SUB}`}>
            やめる
          </button>
          <button type="button" onClick={onConfirm} className={`${BTN_BASE} ${SIZE_40} border-t-danger bg-t-danger text-white`}>
            クラスから外す
          </button>
        </div>
      </div>
    </dialog>
  );
}

function Members({ klass }: { klass: TeacherClass }) {
  const [rows, setRows] = useState<Row[]>(() => klass.members.map((m, i) => ({ ...m, joinedOrder: i, isNew: false })));
  const [pending, setPending] = useState(klass.pending);
  const [numbers, setNumbers] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("no");
  const [shown, setShown] = useState(PAGE_SIZE);
  const [selectedId, setSelectedId] = useState<string | null>(klass.members[0]?.id ?? null);
  const [removing, setRemoving] = useState(false);

  const sorted = useMemo(() => sortRows(rows, sortKey), [rows, sortKey]);
  const q = normalize(query);
  const match = (name: string, user: string) => q === "" || normalize(name).includes(q) || normalize(user).includes(q);
  const visibleRows = sorted.filter((r) => match(r.name, r.user));
  const visiblePending = pending.filter((p) => match(p.name, p.user));
  const listed = visibleRows.slice(0, shown);
  const selected = rows.find((r) => r.id === selectedId) ?? sorted[0] ?? null;

  const approve = (p: DemoPending) => {
    setRows((prev) => [
      ...prev,
      {
        ...p,
        no: parseNo(numbers[p.id] ?? ""),
        joined: DEMO_TODAY,
        title: "はじめての はてな",
        fields: { 算数: 0, 理科: 0, 情報: 0 },
        out: 0,
        missions: 0,
        recordStart: 0,
        recordShift: 0,
        joinedOrder: prev.length,
        isNew: true,
      },
    ]);
    setPending((prev) => prev.filter((x) => x.id !== p.id));
  };

  const remove = () => {
    if (!selected) return;
    const index = sorted.findIndex((r) => r.id === selected.id);
    const next = sorted[index + 1] ?? sorted[index - 1] ?? null;
    setRows((prev) => prev.filter((r) => r.id !== selected.id));
    setSelectedId(next?.id ?? null);
    setRemoving(false);
  };

  return (
    <main className="mx-auto flex min-h-0 w-full max-w-[1400px] flex-1 flex-col gap-3.5 px-6 pt-4 pb-5">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <h1 className="text-[22px] font-bold tracking-[0.02em]">メンバー</h1>
        <span className="text-[13px] text-t-text-sub">
          参加中 {rows.length}人 ・ 確認待ち {pending.length}人
        </span>
        <Link href="/teacher/settings" className={`${BTN_BASE} ${SIZE_36} ${SUB} ml-auto`}>
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="4" width="16" height="16" rx="2" />
            <path d="M8 9h8" />
            <path d="M8 13h8" />
            <path d="M8 17h5" />
          </svg>
          参加コードを表示
        </Link>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[360px_minmax(0,1fr)] gap-4 max-[1100px]:grid-cols-1">
        <aside aria-label="メンバーの一覧" className="flex min-h-0 flex-col overflow-auto rounded-tcard border border-t-line bg-t-surface max-[1100px]:overflow-visible">
          <div className="p-3">
            <label className="relative flex items-center">
              <span className="sr-only">名前・ユーザー名でさがす</span>
              <svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#55615B" strokeWidth="2" strokeLinecap="round" className="absolute left-[11px]">
                <circle cx="11" cy="11" r="7" />
                <path d="M20 20l-4-4" />
              </svg>
              <input
                type="search"
                placeholder="名前・ユーザー名でさがす"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setShown(PAGE_SIZE);
                }}
                className={`${FIELD_BASE} h-10 w-full pr-2.5 pl-[34px] text-[13px] pointer-coarse:h-11`}
              />
            </label>
          </div>

          {visiblePending.length > 0 && (
            <PendingSection
              pending={visiblePending}
              numbers={numbers}
              onNumber={(id, value) => setNumbers((prev) => ({ ...prev, [id]: value }))}
              onApprove={approve}
              onReject={(p) => setPending((prev) => prev.filter((x) => x.id !== p.id))}
            />
          )}

          <div className="flex items-center justify-between gap-2 px-3 pt-2.5 pb-1">
            <h2 className="text-sm font-bold">参加中</h2>
            <label className="flex items-center gap-1.5 text-xs text-t-text-2">
              並び順
              <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)} className={`${FIELD_BASE} h-8 px-2.5 text-xs pointer-coarse:h-11`}>
                <option value="no">出席番号</option>
                <option value="joined">参加した順</option>
              </select>
            </label>
          </div>

          {listed.length > 0 ? (
            <ul className="flex flex-col gap-px px-1.5 pb-1.5">
              {listed.map((r) => {
                const on = r.id === selected?.id;
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(r.id)}
                      aria-current={on ? "true" : undefined}
                      className={`flex min-h-11 w-full items-center gap-2.5 rounded-tbtn px-2 py-1 text-left ${on ? "bg-t-board-tint" : "hover:bg-t-board-soft"}`}
                    >
                      <span className="w-[22px] shrink-0 text-right text-xs text-t-text-sub tabular-nums">{r.no ?? "—"}</span>
                      <Avatar size={26} />
                      <span className={`text-sm ${on ? "font-bold" : ""}`}>{r.name}</span>
                      <span className="min-w-0 truncate text-xs text-t-text-sub">{r.user}</span>
                      {r.isNew && (
                        <span className="ml-auto inline-flex h-5 shrink-0 items-center rounded-full bg-t-board-tint px-[7px] text-[10px] font-bold text-t-board">いま参加</span>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-3 py-4 text-[13px] text-t-text-sub">{rows.length === 0 ? "参加中のメンバーはいません。" : "見つかりませんでした。"}</p>
          )}

          {visibleRows.length > listed.length && (
            <div className="mt-auto flex items-center justify-between border-t border-t-line-soft px-3 pt-1.5 pb-2.5">
              <span className="text-xs text-t-text-sub">あと {visibleRows.length - listed.length}人</span>
              <button type="button" onClick={() => setShown((n) => n + PAGE_SIZE)} className={GHOST}>
                もっと見る
              </button>
            </div>
          )}
        </aside>

        {selected ? (
          <MemberDetail
            row={selected}
            grade={klass.grade}
            onNumber={(no) => setRows((prev) => prev.map((r) => (r.id === selected.id ? { ...r, no } : r)))}
            onAskRemove={() => setRemoving(true)}
          />
        ) : (
          <section className="rounded-tcard border border-t-line bg-t-surface p-5 text-[13px] text-t-text-sub">一覧からメンバーを選ぶと、ここに様子が出ます。</section>
        )}
      </div>

      {selected && <RemoveDialog name={selected.name} open={removing} onCancel={() => setRemoving(false)} onConfirm={remove} />}
    </main>
  );
}

// クラスを切り替えたら、そのクラスのデータで はじめから出す
export function MembersScreen() {
  const { currentClass } = useTeacher();
  return <Members key={currentClass.id} klass={currentClass} />;
}
