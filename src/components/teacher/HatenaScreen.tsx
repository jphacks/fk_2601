"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { answerText, DEMO_RECORDS, memberRecords, timeKey, type DemoField, type DemoRecord, type TeacherClass } from "@/lib/teacherDemo";
import { SceneThumb } from "./SceneThumb";
import { useTeacher } from "./TeacherProvider";

// はてな（クラスに共有・授業中の記録）。見本は docs/design/teachers/screens/03〜05、仕様は docs/06-school-expansion.md 5.2・5.4
// 操作の結果はこの画面の中（クラスから外したものは TeacherProvider）だけに反映し、読み込み直すとはじめに戻る（デモのデータ）
// 子どもどうしを比べないよう、人ごとの件数の並びや、予想の当たり外れの割合は出さない（5.5）

// 大きさは組み合わせごとに決める。タブレットでは押せるものを 44px 以上にし、入力欄の文字を 16px にする（MembersScreen と同じ）
const BTN_BASE = "inline-flex items-center justify-center gap-1.5 rounded-tbtn border text-[13px] font-bold whitespace-nowrap";
const SIZE_40 = "h-10 px-3.5 pointer-coarse:h-11";
const SUB = "border-t-board bg-white text-t-board";
const FIELD_BASE = "rounded-tbtn border border-t-field-line bg-white text-t-text pointer-coarse:text-base";

const FIELD_COLOR: Record<DemoField, string> = { 算数: "bg-t-math", 理科: "bg-t-sci", 情報: "bg-t-info" };
const FIELDS: DemoField[] = ["算数", "理科", "情報"];

type Tab = "shared" | "records";
type FieldFilter = DemoField | "all";

// 1枚のカードに出すもの。共有には予想と結果を出さない（7.1）。授業中の記録は先生だけが見るので、予想と結果も出す（5.2）
type Item = DemoRecord & {
  id: string;
  memberId: string;
  at: string;
  who: string;
  isNew: boolean;
  shared: boolean;
};

const byNewest = (a: Item, b: Item) => timeKey(b.at) - timeKey(a.at);

function FieldDot({ field }: { field: DemoField }) {
  return <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${FIELD_COLOR[field]}`} />;
}

function Count({ children, tone = "board" }: { children: React.ReactNode; tone?: "board" | "chalk" }) {
  return (
    <span
      className={`inline-flex h-5 items-center rounded-full px-[7px] text-[11px] font-bold tabular-nums ${tone === "chalk" ? "bg-t-chalk text-t-text" : "bg-t-board-tint text-t-board"}`}
    >
      {children}
    </span>
  );
}

function HatenaCard({ item, castHref, onAskRemove }: { item: Item; castHref: string; onAskRemove: (item: Item) => void }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-[#E3E9E6] bg-white">
      <div className="relative">
        <SceneThumb scene={item.scene} className="h-[104px] w-full" />
        {item.isNew && (
          <span className="absolute top-2 left-2">
            <Count tone="chalk">新着</Count>
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1.5 px-3 pt-2.5 pb-3">
        <span className="inline-flex items-center gap-1.5 text-[11px] text-t-text-2">
          <FieldDot field={item.field} />
          {item.unit}
        </span>
        <p className="line-clamp-2 text-[13px] leading-[1.55] font-bold">{item.question}</p>
        <span className="text-[11px] text-t-text-sub tabular-nums">
          {item.who} ・ {item.at}
        </span>
        {item.shared ? (
          <span className="mt-auto flex items-center justify-between gap-1.5 pt-1">
            <Link
              href={castHref}
              className="inline-flex h-8 items-center gap-[5px] rounded-tbtn border border-t-chalk-line bg-t-chalk-soft px-2.5 text-xs font-bold whitespace-nowrap text-t-chalk-text pointer-coarse:h-11"
            >
              <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="12" rx="1.5" />
                <path d="M8 20h8" />
                <path d="M12 16v4" />
              </svg>
              教室に映す
            </Link>
            <button
              type="button"
              onClick={() => onAskRemove(item)}
              className="min-h-[34px] px-1.5 text-xs font-bold whitespace-nowrap text-t-danger pointer-coarse:min-h-11"
            >
              クラスから外す
            </button>
          </span>
        ) : (
          <span className="mt-auto flex flex-wrap items-center gap-1.5 border-t border-t-line-soft pt-1.5 text-xs text-t-text-2 tabular-nums">
            <span className="text-t-text-sub">予想</span>
            {item.guess}
            <span aria-hidden="true" className="text-t-text-sub">
              →
            </span>
            <span className="sr-only">答え</span>
            <strong>{answerText(item)}</strong>
          </span>
        )}
      </div>
    </article>
  );
}

function RemoveDialog({ item, onCancel, onConfirm }: { item: Item | null; onCancel: () => void; onConfirm: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (item && !dialog.open) dialog.showModal();
    if (!item && dialog.open) dialog.close();
  }, [item]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="h-remove-post"
      onClose={onCancel}
      className="m-auto w-[calc(100%-48px)] max-w-[500px] rounded-2xl bg-white p-7 text-t-text backdrop:bg-[rgba(14,28,22,0.55)]"
    >
      {item && (
        <div className="flex flex-col gap-4">
          <h2 id="h-remove-post" className="text-xl font-bold">
            この投稿をクラスから外しますか？
          </h2>
          <div className="flex items-center gap-3 rounded-[10px] bg-t-ground p-3">
            <SceneThumb scene={item.scene} className="h-12 w-[72px] shrink-0 rounded-md" />
            <span className="flex min-w-0 flex-col gap-1">
              <span className="text-sm leading-normal font-bold">{item.question}</span>
              <span className="text-xs text-t-text-sub tabular-nums">
                {item.who} ・ {item.at}
              </span>
            </span>
          </div>
          <ul className="flex list-disc flex-col gap-2 pl-5 text-sm leading-[1.75] text-t-text-2">
            <li>クラスの子どもから見えなくなります</li>
            <li>本人のずかんには残り、その はてなに「せんせいが クラスから はずしたよ」と出ます</li>
            <li>友達の顔や名札が写っているときは、本人に声をかけて、ずかんからも消してもらってください</li>
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
      )}
    </dialog>
  );
}

function Hatena({ klass }: { klass: TeacherClass }) {
  const { updateClass } = useTeacher();
  const [tab, setTab] = useState<Tab>("shared");
  const [field, setField] = useState<FieldFilter>("all");
  const [unit, setUnit] = useState<string | null>(null);
  const [memberId, setMemberId] = useState("all");
  const [removing, setRemoving] = useState<Item | null>(null);

  const members = useMemo(() => [...klass.members].sort((a, b) => (a.no ?? 99) - (b.no ?? 99)), [klass]);

  const sharedItems = useMemo(() => {
    const items: Item[] = [];
    for (const s of klass.shared) {
      const m = klass.members.find((x) => x.id === s.memberId);
      if (!m) continue;
      items.push({ ...DEMO_RECORDS[s.record], id: s.id, memberId: m.id, at: s.at, who: `${m.user}（${m.name}）`, isNew: s.isNew, shared: true });
    }
    return items.sort(byNewest);
  }, [klass]);

  // 授業中の記録は、メンバーの個別ページと同じもの（一人につき新しい3件まで）を出す
  const recordItems = useMemo(
    () =>
      klass.members
        .flatMap((m) => memberRecords(m).map((r): Item => ({ ...r, who: m.name, isNew: false, shared: false })))
        .sort(byNewest),
    [klass],
  );

  const isShared = tab === "shared";
  const source = isShared ? sharedItems : recordItems;
  const newCount = sharedItems.filter((s) => s.isNew).length;
  // 授業中に保存した本当の件数（メンバーの画面と同じ数）。一覧に出すのは そのうちの新しいものだけ
  const recordTotal = (f: FieldFilter, id: string) =>
    klass.members.filter((m) => id === "all" || m.id === id).reduce((sum, m) => sum + (f === "all" ? FIELDS.reduce((n, x) => n + m.fields[x], 0) : m.fields[f]), 0);

  const inScope = source.filter((r) => (memberId === "all" || r.memberId === memberId) && (field === "all" || r.field === field));
  const unitCounts = new Map<string, { field: DemoField; count: number }>();
  for (const r of inScope) {
    const u = unitCounts.get(r.unit);
    unitCounts.set(r.unit, { field: r.field, count: (u?.count ?? 0) + 1 });
  }
  const units = [...unitCounts.entries()].sort((a, b) => b[1].count - a[1].count);
  // 選んでいた単元が消えたとき（最後の1件を外したときなど）は「すべて」にもどす
  const currentUnit = unit !== null && unitCounts.has(unit) ? unit : null;
  const items = currentUnit === null ? inScope : inScope.filter((r) => r.unit === currentUnit);
  // 「すべて」の件数：共有は出しているものすべて、授業中の記録は本当の件数
  const allCount = isShared ? inScope.length : recordTotal(field, memberId);
  const total = currentUnit === null ? allCount : items.length;

  const pickTab = (next: Tab) => {
    setTab(next);
    setUnit(null);
  };

  // 教室に映すときは、いま しぼりこんでいる はてなを、選んだものから順に映す
  const castHref = (item: Item) => {
    const q = new URLSearchParams({ post: item.id });
    if (field !== "all") q.set("field", field);
    if (currentUnit !== null) q.set("unit", currentUnit);
    return `/teacher/cast?${q}`;
  };

  const confirmRemove = () => {
    // 外した投稿は、教室に映す画面にも出さない（TeacherProvider に覚える）
    if (removing) updateClass(klass.id, (c) => ({ ...c, shared: c.shared.filter((x) => x.id !== removing.id) }));
    setRemoving(null);
  };

  const tabClass = (on: boolean) =>
    `inline-flex h-[34px] items-center gap-1.5 rounded-md px-3 text-[13px] whitespace-nowrap pointer-coarse:h-11 ${on ? "bg-white font-bold text-t-text" : "text-t-text-2"}`;

  return (
    <main className="mx-auto flex min-h-0 w-full max-w-[1400px] flex-1 flex-col gap-3.5 px-6 pt-4 pb-5 max-[640px]:px-4">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <h1 className="text-[22px] font-bold tracking-[0.02em]">はてな</h1>
        <div role="tablist" aria-label="表示するもの" className="flex max-w-full flex-wrap gap-[3px] rounded-[9px] bg-[#E6ECE9] p-[3px]">
          <button type="button" role="tab" id="tab-shared" aria-selected={isShared} aria-controls="hatena-panel" onClick={() => pickTab("shared")} className={tabClass(isShared)}>
            クラスに共有
            <Count>{sharedItems.length}</Count>
            {newCount > 0 && <Count tone="chalk">新着 {newCount}</Count>}
          </button>
          <button type="button" role="tab" id="tab-records" aria-selected={!isShared} aria-controls="hatena-panel" onClick={() => pickTab("records")} className={tabClass(!isShared)}>
            授業中の記録
            <Count>{recordTotal("all", "all")}</Count>
          </button>
        </div>
        <p className="flex-[1_1_420px] text-xs leading-[1.7] text-t-text-2">
          {isShared
            ? "子どもが「クラスに みせる」を選んだ はてな。クラスの全員に見えています。教室に映せるのはここにある はてなだけです（共有するとき、子どもには「せんせいが きょうしつで みせることも あるよ」と伝えています）。"
            : "授業時間中に保存された はてな。先生だけが見られ、子どもには見えません。授業時間の外に保存されたものは件数だけです。"}
        </p>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[272px_minmax(0,1fr)] gap-4 max-[1100px]:grid-cols-1">
        <aside aria-label="単元で選ぶ" className="flex min-h-0 flex-col gap-2.5 overflow-auto rounded-tcard border border-t-line bg-t-surface p-3.5 max-[1100px]:overflow-visible">
          <div role="group" aria-label="分野でしぼる" className="grid grid-cols-4 gap-1">
            {(["all", ...FIELDS] as FieldFilter[]).map((f) => {
              const on = field === f;
              return (
                <button
                  key={f}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    setField(f);
                    setUnit(null);
                  }}
                  className={`inline-flex h-8 items-center justify-center rounded-tbtn border px-1 text-xs pointer-coarse:h-11 ${on ? "border-t-board bg-t-board font-bold text-white" : "border-t-line bg-white text-t-text-2"}`}
                >
                  {f === "all" ? "すべて" : f}
                </button>
              );
            })}
          </div>
          <ul className="flex flex-col gap-0.5">
            {[{ key: null, name: "すべて（新しい順）", count: allCount, field: null }, ...units.map(([name, u]) => ({ key: name, name, count: u.count, field: u.field }))].map((u) => {
              const on = currentUnit === u.key;
              return (
                <li key={u.key ?? "all"}>
                  <button
                    type="button"
                    onClick={() => setUnit(u.key)}
                    aria-current={on ? "true" : undefined}
                    className={`flex min-h-10 w-full items-center gap-2.5 rounded-tbtn px-2.5 py-1.5 text-left text-sm pointer-coarse:min-h-11 ${on ? "bg-t-board-tint font-bold" : "hover:bg-t-board-soft"}`}
                  >
                    {u.field ? <FieldDot field={u.field} /> : <span aria-hidden="true" className="size-2 shrink-0 rounded-full bg-t-board" />}
                    <span className="min-w-0 flex-1">{u.name}</span>
                    <span className="text-xs font-normal text-t-text-sub tabular-nums">{u.count}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          {!isShared && <p className="px-2.5 text-xs leading-[1.7] text-t-text-sub">見本では、一人につき新しい3件までを一覧に出しています。単元の数は、一覧に出している件数です。</p>}
        </aside>

        <section
          id="hatena-panel"
          role="tabpanel"
          aria-labelledby={isShared ? "tab-shared" : "tab-records"}
          className="flex min-h-0 flex-col overflow-hidden rounded-tcard border border-t-line bg-t-surface max-[1100px]:overflow-visible"
        >
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-t-line-soft px-[18px] py-3.5">
            <div className="flex flex-wrap items-baseline gap-x-2.5">
              <h2 className="text-lg font-bold">{currentUnit ?? "すべて"}</h2>
              <span className="text-[13px] text-t-text-sub tabular-nums">
                {currentUnit === null ? "新しい順" : unitCounts.get(currentUnit)?.field} ・ {total}件{items.length < total ? `（${items.length}件を表示）` : ""}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[13px] text-t-text-2">
              <label htmlFor="hatena-member">子ども</label>
              <select
                id="hatena-member"
                value={memberId}
                onChange={(e) => {
                  setMemberId(e.target.value);
                  setUnit(null);
                }}
                className={`${FIELD_BASE} h-9 px-2.5 text-[13px] pointer-coarse:h-11`}
              >
                <option value="all">全員</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {items.length > 0 ? (
            <div className="grid min-h-0 flex-1 auto-rows-max grid-cols-[repeat(auto-fill,minmax(224px,1fr))] content-start gap-3.5 overflow-auto px-[18px] py-4 max-[1100px]:overflow-visible">
              {items.map((item) => (
                <HatenaCard key={item.id} item={item} castHref={castHref(item)} onAskRemove={setRemoving} />
              ))}
            </div>
          ) : (
            <p className="m-[18px] rounded-[10px] bg-t-ground p-4 text-[13px] text-t-text-sub">
              {isShared ? "この条件で、クラスに共有された はてなは ありません。" : "この条件で、授業中に保存された はてなは ありません。"}
            </p>
          )}
        </section>
      </div>

      <RemoveDialog item={removing} onCancel={() => setRemoving(null)} onConfirm={confirmRemove} />
    </main>
  );
}

// クラスを切り替えたら、そのクラスのデータで はじめから出す
export function HatenaScreen() {
  const { currentClass } = useTeacher();
  return <Hatena key={currentClass.id} klass={currentClass} />;
}
