"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import {
  dateKey,
  newJoinCode,
  parseDateKey,
  scheduleOf,
  SCHOOL_DOMAIN,
  SCHOOL_YEAR,
  shortTime,
  TODAY_KEY,
  toMinutes,
  WEEKDAYS,
  type AddedDay,
  type ClassHours,
  type ClassTeacher,
  type DayHours,
  type DaySchedule,
  type ExcludedDays,
  type TeacherClass,
  type TeacherRole,
} from "@/lib/teacherDemo";
import { CastFrame, CastIcon, castSize, ClassNameRuby } from "./CastFrame";
import { useTeacher } from "./TeacherProvider";

// クラスの設定（授業時間・参加コードと先生）。見本は docs/design/teachers/screens/15〜18、仕様は docs/06-school-expansion.md 5.1・5.2・5.6
// 操作の結果はこの画面と TeacherProvider の中だけに反映し、読み込み直すとはじめに戻る（デモのデータ）

// 大きさは組み合わせごとに決める（同じ種類のクラスを重ねると、どちらが効くかが CSS の順番で決まってしまうため）
// タブレットでは押せるものを 44px 以上にし、入力欄の文字を 16px にする（iPad で拡大されないように）
const BTN_BASE = "inline-flex items-center justify-center gap-1.5 rounded-tbtn border text-[13px] font-bold whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-45";
const SIZE_36 = "h-9 px-3.5 pointer-coarse:h-11";
const SIZE_40 = "h-10 px-3.5 pointer-coarse:h-11";
const PRIMARY = "border-t-board bg-t-board text-white";
const SUB = "border-t-board bg-white text-t-board";
const CHALK = "border-t-chalk bg-t-chalk text-t-text";
const GHOST = "min-h-8 px-1.5 text-xs font-bold text-t-board pointer-coarse:min-h-11";
const GHOST_DANGER = "min-h-8 px-1.5 text-xs font-bold text-t-danger pointer-coarse:min-h-11";
const FIELD_BASE = "rounded-tbtn border border-t-field-line bg-white px-2 text-[13px] text-t-text disabled:bg-t-ground disabled:text-t-text-sub aria-invalid:border-t-danger pointer-coarse:text-base";
const FIELD_34 = `${FIELD_BASE} h-[34px] pointer-coarse:h-11`;
const FIELD_40 = `${FIELD_BASE} h-10 pointer-coarse:h-11`;
const CARD = "rounded-tcard border border-t-line bg-t-surface";
const SUBTEXT = "text-xs leading-[1.7] text-t-text-sub";
const PANEL = "flex min-h-0 flex-col gap-3.5 overflow-auto max-[1100px]:overflow-visible";

const DOW = ["日", "月", "火", "水", "木", "金", "土"];

// 「2026-12-25」→「12/25（金）」
function dateLabel(key: string) {
  const d = parseDateKey(key);
  return `${d.getMonth() + 1}/${d.getDate()}（${DOW[d.getDay()]}）`;
}

const validRange = (start: string, end: string) => start !== "" && end !== "" && toMinutes(start) < toMinutes(end);
const inSchoolYear = (key: string) => SCHOOL_YEAR.from <= key && key <= SCHOOL_YEAR.to;
const newId = (prefix: string) => `${prefix}-${Date.now()}`;

type Tab = "hours" | "join";
const TABS: { id: Tab; label: string }[] = [
  { id: "hours", label: "授業時間" },
  { id: "join", label: "参加コードと先生" },
];

// クラスを切り替えたら、そのクラスのデータで はじめから出す
export function SettingsScreen() {
  const { currentClass } = useTeacher();
  return <Settings key={currentClass.id} klass={currentClass} />;
}

function Settings({ klass }: { klass: TeacherClass }) {
  const [tab, setTab] = useState<Tab>("hours");

  // ←→ でタブを移る（タブの決まりどおり）
  const onTabKey = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const next = tab === "hours" ? "join" : "hours";
    setTab(next);
    document.getElementById(`settings-tab-${next}`)?.focus();
  };

  return (
    <main className="mx-auto flex min-h-0 w-full max-w-[1400px] flex-1 flex-col gap-3.5 px-6 pt-4 pb-5">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <h1 className="text-[22px] font-bold tracking-[0.02em]">クラスの設定</h1>
        <div role="tablist" aria-label="設定の種類" className="flex gap-[3px] rounded-[9px] bg-[#E6ECE9] p-[3px]">
          {TABS.map((t) => {
            const on = t.id === tab;
            return (
              <button
                key={t.id}
                id={`settings-tab-${t.id}`}
                type="button"
                role="tab"
                aria-selected={on}
                aria-controls={`settings-panel-${t.id}`}
                tabIndex={on ? 0 : -1}
                onClick={() => setTab(t.id)}
                onKeyDown={onTabKey}
                className={`inline-flex h-[34px] items-center rounded-md px-3.5 text-[13px] pointer-coarse:h-11 ${on ? "bg-white font-bold text-t-text" : "text-t-text-2"}`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        <span className="text-[13px] text-t-text-sub">
          {klass.name} ・ {klass.schoolYear}
        </span>
      </div>

      {/* 両方のタブを出したままにして、切り替えても保存前の変更が消えないようにする */}
      <div id="settings-panel-hours" role="tabpanel" aria-labelledby="settings-tab-hours" hidden={tab !== "hours"} className="flex min-h-0 flex-1 flex-col">
        <HoursTab klass={klass} />
      </div>
      <div id="settings-panel-join" role="tabpanel" aria-labelledby="settings-tab-join" hidden={tab !== "join"} className="flex min-h-0 flex-1 flex-col">
        <JoinTab klass={klass} />
      </div>
    </main>
  );
}

// ---- 授業時間（見本 15） ----

function HoursTab({ klass }: { klass: TeacherClass }) {
  const { updateClass } = useTeacher();
  const [draft, setDraft] = useState<ClassHours>(klass.hours);
  const [saved, setSaved] = useState(false);

  const dirty = JSON.stringify(draft) !== JSON.stringify(klass.hours);
  const hasError = WEEKDAYS.some((w) => draft.week[w].on && !validRange(draft.week[w].start, draft.week[w].end));

  const change = (next: ClassHours) => {
    setDraft(next);
    setSaved(false);
  };
  const save = () => {
    updateClass(klass.id, (c) => ({ ...c, hours: draft }));
    setSaved(true);
  };

  let status: { text: string; error?: boolean } | null = null;
  if (hasError) status = { text: "時刻を直すと保存できます", error: true };
  else if (dirty) status = { text: "保存していない変更があります" };
  else if (saved) status = { text: "保存しました。これから保存されるものに使います" };

  return (
    <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,6fr)_minmax(0,5fr)] gap-4 max-[1100px]:grid-cols-1">
      <div className={PANEL}>
        <WeekCard week={draft.week} onChange={(week) => change({ ...draft, week })} />
        <section aria-label="外す日と足す日" className={`${CARD} grid grid-cols-2 gap-5 px-[18px] py-3.5 max-[760px]:grid-cols-1`}>
          <ExcludedList hours={draft} onChange={change} />
          <AddedList hours={draft} onChange={change} />
        </section>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex flex-[1_1_360px] flex-col gap-0.5">
            <p className={SUBTEXT}>変えた時間は、これから保存されるものに使います。前に保存されたものの見え方は変わりません。</p>
            <p className={SUBTEXT}>保存した時刻で分けるため、欠席の日などに授業時間中に家で保存したものも見えます（保護者向けの資料で説明しています）。</p>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2.5">
            <span role="status" className={`text-xs ${status?.error ? "font-bold text-t-danger" : "text-t-text-sub"}`}>
              {status?.text}
            </span>
            {dirty && (
              <button type="button" onClick={() => change(klass.hours)} className={GHOST}>
                変更をやめる
              </button>
            )}
            <button type="button" onClick={save} disabled={!dirty || hasError} className={`${BTN_BASE} ${SIZE_40} ${PRIMARY}`}>
              授業時間を保存
            </button>
          </div>
        </div>
      </div>
      <CalendarCard hours={draft} />
    </div>
  );
}

// 帯のグラフは 7:00〜18:00 を出す
const MIN0 = 7 * 60;
const SPAN = 11 * 60;
const pct = (min: number) => (Math.max(0, Math.min(SPAN, min - MIN0)) / SPAN) * 100;
const TICKS = [7, 9, 11, 13, 15, 17];
const ROW_GRID = "grid grid-cols-[48px_minmax(0,1fr)_248px] gap-3 max-[760px]:grid-cols-[48px_minmax(0,1fr)]";

function WeekCard({ week, onChange }: { week: ClassHours["week"]; onChange: (week: ClassHours["week"]) => void }) {
  return (
    <section aria-labelledby="h-week" className={`${CARD} flex flex-col gap-2 px-[18px] py-3.5`}>
      <div className="flex flex-col gap-0.5">
        <h2 id="h-week" className="text-base font-bold">
          平日の時間帯
        </h2>
        <p className={SUBTEXT}>この時間に保存された はてなだけ、内容（問い・予想・結果・切り抜き画像）が見られます。外の時間は件数だけです。</p>
      </div>
      <div aria-hidden="true" className={`${ROW_GRID} items-end`}>
        <span />
        <div className="relative h-4">
          {TICKS.map((h) => (
            <span key={h} className="absolute -translate-x-1/2 text-[10px] text-t-text-sub tabular-nums" style={{ left: `${pct(h * 60)}%` }}>
              {h}:00
            </span>
          ))}
        </div>
        <span className="grid grid-cols-2 gap-1.5 text-[10px] text-t-text-sub max-[760px]:hidden">
          <span>はじまり</span>
          <span>おわり</span>
        </span>
      </div>
      {WEEKDAYS.map((w) => (
        <DayRow key={w} name={w} day={week[w]} onChange={(day) => onChange({ ...week, [w]: day })} />
      ))}
    </section>
  );
}

function DayRow({ name, day, onChange }: { name: string; day: DayHours; onChange: (day: DayHours) => void }) {
  const valid = validRange(day.start, day.end);
  const left = valid ? pct(toMinutes(day.start)) : 0;
  const width = valid ? pct(toMinutes(day.end)) - left : 0;
  const invalid = day.on && !valid;
  return (
    <div className={`${ROW_GRID} min-h-10 items-center`}>
      <label className="flex items-center gap-1.5 text-sm font-bold">
        <input
          type="checkbox"
          checked={day.on}
          onChange={() => onChange({ ...day, on: !day.on })}
          aria-label={`${name}曜日を授業時間にする`}
          className="size-[17px] accent-t-board pointer-coarse:size-5"
        />
        {name}
      </label>
      <div className="relative h-[30px] rounded-[7px] bg-[#F1F4F2]">
        {TICKS.map((h) => (
          <span key={h} aria-hidden="true" className="absolute inset-y-0 border-l border-dashed border-[#D5DDD9]" style={{ left: `${pct(h * 60)}%` }} />
        ))}
        {day.on && valid && (
          <span
            className="absolute inset-y-[3px] flex items-center overflow-hidden rounded-[5px] bg-t-board px-2 text-[11px] font-bold whitespace-nowrap text-white tabular-nums"
            style={{ left: `${left}%`, width: `${width}%` }}
          >
            {shortTime(day.start)}〜{shortTime(day.end)}
          </span>
        )}
        {!day.on && <span className="absolute inset-0 flex items-center pl-2.5 text-[11px] text-t-text-sub">授業時間に入れない</span>}
        {invalid && <span className="absolute inset-0 flex items-center pl-2.5 text-[11px] font-bold text-t-danger">おわりを、はじまりより後にしてください</span>}
      </div>
      <span className="grid grid-cols-2 gap-1.5 max-[760px]:col-start-2">
        <input
          type="time"
          step={300}
          value={day.start}
          disabled={!day.on}
          aria-invalid={invalid || undefined}
          aria-label={`${name}曜日のはじまり`}
          onChange={(e) => onChange({ ...day, start: e.target.value })}
          className={FIELD_34}
        />
        <input
          type="time"
          step={300}
          value={day.end}
          disabled={!day.on}
          aria-invalid={invalid || undefined}
          aria-label={`${name}曜日のおわり`}
          onChange={(e) => onChange({ ...day, end: e.target.value })}
          className={FIELD_34}
        />
      </span>
    </div>
  );
}

function ListHead({ id, title, adding, onAdd }: { id: string; title: string; adding: boolean; onAdd: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2 pb-1">
      <h2 id={id} className="text-[13px] font-bold">
        {title}
      </h2>
      {!adding && (
        <button type="button" onClick={onAdd} className={GHOST}>
          ＋ 足す
        </button>
      )}
    </div>
  );
}

function ListRow({ name, detail, onDelete }: { name: string; detail: string; onDelete: () => void }) {
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 border-t border-t-line-soft py-2">
      <span className="flex flex-col gap-px">
        <strong className="text-[13px]">{name}</strong>
        <span className="text-[11px] text-t-text-sub tabular-nums">{detail}</span>
      </span>
      <button type="button" onClick={onDelete} aria-label={`${name}（${detail}）を削除`} className={GHOST_DANGER}>
        削除
      </button>
    </li>
  );
}

// 足すときの入力欄。決まった形の確認をしてから足す
function AddForm({ label, error, onCancel, onSubmit, children }: { label: string; error: string | null; onCancel: () => void; onSubmit: () => void; children: React.ReactNode }) {
  return (
    <form
      aria-label={label}
      noValidate // ブラウザの吹き出しではなく、下のエラーの文で伝える
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
      className="mb-2 flex flex-col gap-2 rounded-[10px] bg-t-board-soft p-3"
    >
      {children}
      {error && <p className="text-xs font-bold text-t-danger">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className={GHOST}>
          やめる
        </button>
        <button type="submit" className={`${BTN_BASE} ${SIZE_36} ${PRIMARY}`}>
          足す
        </button>
      </div>
    </form>
  );
}

function Field({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`flex min-w-0 flex-col gap-1 ${className}`}>
      <span className="text-[11px] text-t-text-sub">{label}</span>
      {children}
    </label>
  );
}

function ExcludedList({ hours, onChange }: { hours: ClassHours; onChange: (h: ClassHours) => void }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", from: "", to: "" });
  const [error, setError] = useState<string | null>(null);
  const items = [...hours.excluded].sort((a, b) => a.from.localeCompare(b.from));

  const close = () => {
    setAdding(false);
    setForm({ name: "", from: "", to: "" });
    setError(null);
  };
  const submit = () => {
    const name = form.name.trim();
    if (!name) return setError("名前を入れてください。");
    if (!form.from || !form.to) return setError("はじめの日と、おわりの日を入れてください。");
    if (!inSchoolYear(form.from) || !inSchoolYear(form.to)) return setError(`${SCHOOL_YEAR.label}の中の日にしてください。`);
    if (form.to < form.from) return setError("おわりの日を、はじめの日と同じか後にしてください。");
    const item: ExcludedDays = { id: newId("x"), name, from: form.from, to: form.to };
    onChange({ ...hours, excluded: [...hours.excluded, item] });
    close();
  };

  return (
    <div aria-labelledby="h-excluded" role="group" className="flex flex-col">
      <ListHead id="h-excluded" title="授業時間から外す日" adding={adding} onAdd={() => setAdding(true)} />
      <label className="flex items-center gap-2 py-1.5 text-[13px]">
        <input
          type="checkbox"
          checked={hours.autoHolidays}
          onChange={() => onChange({ ...hours, autoHolidays: !hours.autoHolidays })}
          className="size-[17px] accent-t-board pointer-coarse:size-5"
        />
        祝日は自動で外す
      </label>
      {adding && (
        <AddForm label="授業時間から外す日を足す" error={error} onCancel={close} onSubmit={submit}>
          <Field label="名前">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="冬休み など" className={FIELD_34} />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="はじめの日">
              <input type="date" min={SCHOOL_YEAR.from} max={SCHOOL_YEAR.to} value={form.from} onChange={(e) => setForm({ ...form, from: e.target.value })} className={FIELD_34} />
            </Field>
            <Field label="おわりの日">
              <input type="date" min={form.from || SCHOOL_YEAR.from} max={SCHOOL_YEAR.to} value={form.to} onChange={(e) => setForm({ ...form, to: e.target.value })} className={FIELD_34} />
            </Field>
          </div>
        </AddForm>
      )}
      <ul>
        {items.map((x) => (
          <ListRow
            key={x.id}
            name={x.name}
            detail={x.from === x.to ? dateLabel(x.from) : `${dateLabel(x.from)} 〜 ${dateLabel(x.to)}`}
            onDelete={() => onChange({ ...hours, excluded: hours.excluded.filter((e) => e.id !== x.id) })}
          />
        ))}
      </ul>
    </div>
  );
}

function AddedList({ hours, onChange }: { hours: ClassHours; onChange: (h: ClassHours) => void }) {
  const empty = { name: "", date: "", start: "08:30", end: "12:00" };
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState<string | null>(null);
  const items = [...hours.added].sort((a, b) => a.date.localeCompare(b.date));

  const close = () => {
    setAdding(false);
    setForm(empty);
    setError(null);
  };
  const submit = () => {
    const name = form.name.trim();
    if (!name) return setError("名前を入れてください。");
    if (!form.date) return setError("日を入れてください。");
    if (!inSchoolYear(form.date)) return setError(`${SCHOOL_YEAR.label}の中の日にしてください。`);
    if (hours.added.some((a) => a.date === form.date)) return setError("この日は、もう足してあります。");
    if (!validRange(form.start, form.end)) return setError("おわりの時刻を、はじまりより後にしてください。");
    const item: AddedDay = { id: newId("a"), name, date: form.date, start: form.start, end: form.end };
    onChange({ ...hours, added: [...hours.added, item] });
    close();
  };

  return (
    <div aria-labelledby="h-added" role="group" className="flex flex-col">
      <ListHead id="h-added" title="授業時間に足す日" adding={adding} onAdd={() => setAdding(true)} />
      <p className={`${SUBTEXT} py-1.5`}>土日の行事や、時間の外の社会科見学など</p>
      {adding && (
        <AddForm label="授業時間に足す日を足す" error={error} onCancel={close} onSubmit={submit}>
          <Field label="名前">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="学習発表会 など" className={FIELD_34} />
          </Field>
          <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] gap-2">
            <Field label="日">
              <input type="date" min={SCHOOL_YEAR.from} max={SCHOOL_YEAR.to} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={FIELD_34} />
            </Field>
            <Field label="はじまり">
              <input type="time" step={300} value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} className={FIELD_34} />
            </Field>
            <Field label="おわり">
              <input type="time" step={300} value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} className={FIELD_34} />
            </Field>
          </div>
        </AddForm>
      )}
      <ul>
        {items.map((a) => (
          <ListRow
            key={a.id}
            name={a.name}
            detail={`${dateLabel(a.date)} ${shortTime(a.start)}〜${shortTime(a.end)}`}
            onDelete={() => onChange({ ...hours, added: hours.added.filter((x) => x.id !== a.id) })}
          />
        ))}
      </ul>
    </div>
  );
}

// カレンダーは年度の中だけ動かせる
const monthIndex = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return y * 12 + m - 1;
};
const FIRST_MONTH = monthIndex(SCHOOL_YEAR.from);
const LAST_MONTH = monthIndex(SCHOOL_YEAR.to);

const CELL_STYLE: Record<DaySchedule["kind"], { box: string; day: string; label: string; bar: boolean; sr: string }> = {
  class: { box: "border-[#E3E9E6] bg-white", day: "text-t-text", label: "text-t-text-sub", bar: true, sr: "授業時間" },
  added: { box: "border-[#E2B32A] bg-t-chalk-soft", day: "text-t-text", label: "text-t-chalk-text", bar: true, sr: "授業時間に足した日" },
  excluded: { box: "border-[#D5DDD9] bg-[#ECEFED]", day: "text-t-text-sub", label: "text-t-text-sub", bar: false, sr: "授業時間から外した日" },
  holiday: { box: "border-[#D5DDD9] bg-[#ECEFED]", day: "text-t-text-sub", label: "text-t-text-sub", bar: false, sr: "祝日（授業時間から外す）" },
  weekend: { box: "border-t-line-soft bg-[#F7F9F8]", day: "text-t-text-sub", label: "text-t-text-sub", bar: false, sr: "授業時間なし" },
  off: { box: "border-[#E3E9E6] bg-white", day: "text-t-text", label: "text-t-text-sub", bar: false, sr: "授業時間なし" },
};

function CalendarCard({ hours }: { hours: ClassHours }) {
  const [month, setMonth] = useState(() => monthIndex(TODAY_KEY));
  const y = Math.floor(month / 12);
  const m = (month % 12) + 1;
  const lead = new Date(y, m - 1, 1).getDay();
  const days = new Date(y, m, 0).getDate();
  const monthLabel = (i: number) => `${(i % 12) + 1}月`;

  return (
    <section aria-labelledby="h-cal" className={`${CARD} flex min-h-0 flex-col gap-2.5 overflow-auto px-[18px] py-3.5 max-[1100px]:overflow-visible`}>
      <div className="flex items-center justify-between gap-2">
        <h2 id="h-cal" className="text-base font-bold">
          カレンダー
        </h2>
        <span className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMonth(month - 1)}
            disabled={month <= FIRST_MONTH}
            aria-label={`${monthLabel(month - 1)}を見る`}
            className={`${BTN_BASE} size-8 border-t-field-line bg-white text-t-board pointer-coarse:size-11`}
          >
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
          <span aria-live="polite" className="min-w-[92px] text-center text-[13px] font-bold tabular-nums">
            {y}年{m}月
          </span>
          <button
            type="button"
            onClick={() => setMonth(month + 1)}
            disabled={month >= LAST_MONTH}
            aria-label={`${monthLabel(month + 1)}を見る`}
            className={`${BTN_BASE} size-8 border-t-field-line bg-white text-t-board pointer-coarse:size-11`}
          >
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </span>
      </div>
      <div aria-hidden="true" className="flex flex-wrap gap-x-3.5 gap-y-1 text-[11px] text-t-text-2">
        <span className="inline-flex items-center gap-[5px]">
          <span className="h-[5px] w-4 rounded-[3px] bg-t-board" />
          授業時間がある日
        </span>
        <span className="inline-flex items-center gap-[5px]">
          <span className="size-3 rounded-[3px] border border-[#D5DDD9] bg-[#ECEFED]" />
          外した日
        </span>
        <span className="inline-flex items-center gap-[5px]">
          <span className="size-3 rounded-[3px] border border-[#E2B32A] bg-t-chalk-soft" />
          足した日
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {DOW.map((name, i) => (
          <span key={name} aria-hidden="true" className={`py-0.5 text-center text-[11px] font-bold ${i === 0 || i === 6 ? "text-t-text-sub" : "text-t-text-2"}`}>
            {name}
          </span>
        ))}
        {Array.from({ length: lead }, (_, i) => (
          <span key={`lead-${i}`} aria-hidden="true" />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const d = i + 1;
          const key = dateKey(y, m, d);
          const s = scheduleOf(hours, key);
          const style = CELL_STYLE[s.kind];
          const today = key === TODAY_KEY;
          const time = s.kind === "class" || s.kind === "added" ? `${shortTime(s.start)}〜${shortTime(s.end)}` : "";
          const label = s.kind === "added" ? `${s.label} 〜${shortTime(s.end)}` : s.label || (today ? "きょう" : "");
          return (
            <div key={key} className={`flex min-h-[72px] flex-col gap-0.5 rounded-lg border p-1.5 ${style.box}`}>
              <span
                className={`inline-flex h-[22px] min-w-[22px] items-center justify-center self-start rounded-full text-xs font-bold tabular-nums ${style.day} ${today ? "shadow-[0_0_0_2px_var(--color-t-board)]" : ""}`}
              >
                <span aria-hidden="true">{d}</span>
                <span className="sr-only">
                  {m}月{d}日（{DOW[parseDateKey(key).getDay()]}）{today ? "・きょう" : ""}・{style.sr}
                  {time && ` ${time}`}
                </span>
              </span>
              <span aria-hidden="true" className={`text-[10px] leading-[1.35] ${style.label}`}>
                {label}
              </span>
              <span aria-hidden="true" className={`mt-auto h-1 rounded-sm ${style.bar ? "bg-t-board" : ""}`} />
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ---- 参加コードと先生（見本 16） ----

function JoinTab({ klass }: { klass: TeacherClass }) {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-2 gap-4 max-[1100px]:grid-cols-1">
      <div className={PANEL}>
        <JoinCodeCard klass={klass} />
        <section aria-labelledby="h-class" className={`${CARD} flex flex-col gap-2.5 p-[18px]`}>
          <h2 id="h-class" className="text-base font-bold">
            クラスの情報
          </h2>
          <dl className="grid grid-cols-[96px_1fr] gap-x-3.5 gap-y-2 text-[13px]">
            <dt className="text-t-text-sub">クラス名</dt>
            <dd>{klass.name}</dd>
            <dt className="text-t-text-sub">学年</dt>
            <dd>{klass.grade}</dd>
            <dt className="text-t-text-sub">年度</dt>
            <dd>{SCHOOL_YEAR.label}</dd>
          </dl>
          <p className={SUBTEXT}>クラスは年度ごとに作り直します。進級やクラス替えのときは、子どもが新しいコードで入り直します。</p>
        </section>
      </div>
      <TeachersCard klass={klass} />
    </div>
  );
}

type Note = { text: string; error?: boolean } | null;

function NoteLine({ note }: { note: Note }) {
  return (
    <p role="status" className={`text-xs empty:hidden ${note?.error ? "font-bold text-t-danger" : "text-t-board"}`}>
      {note?.text}
    </p>
  );
}

function JoinCodeCard({ klass }: { klass: TeacherClass }) {
  const { updateClass } = useTeacher();
  const [note, setNote] = useState<Note>(null);
  const [casting, setCasting] = useState(false);
  const open = klass.joinOpen;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(klass.joinCode);
      setNote({ text: "コードをコピーしました。" });
    } catch {
      setNote({ text: "コピーできませんでした。コードを見て書き写してください。", error: true });
    }
  };
  const regenerate = () => {
    const old = klass.joinCode;
    let code = newJoinCode();
    while (code === old) code = newJoinCode();
    updateClass(klass.id, (c) => ({ ...c, joinCode: code }));
    setNote({ text: `新しいコードにしました。前のコード（${old}）では参加できなくなりました。` });
  };

  return (
    <section aria-labelledby="h-code" className={`${CARD} flex flex-col gap-3.5 p-[18px]`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 id="h-code" className="text-base font-bold">
            参加コード
          </h2>
          <p className={SUBTEXT}>子どもが「せってい」でコードを入れ、先生が確認すると参加が完了します。</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={open}
          aria-label="参加コードの受付"
          onClick={() => {
            updateClass(klass.id, (c) => ({ ...c, joinOpen: !c.joinOpen }));
            setNote(null);
          }}
          className="inline-flex min-h-8 items-center gap-2 py-1.5 text-[13px] font-bold whitespace-nowrap pointer-coarse:min-h-11"
        >
          {open ? "受付中" : "受付を止めています"}
          <span aria-hidden="true" className={`relative inline-block h-[26px] w-11 rounded-full ${open ? "bg-t-board" : "bg-[#B4C0BA]"}`}>
            <span className={`absolute top-[3px] size-5 rounded-full bg-white ${open ? "left-[21px]" : "left-[3px]"}`} />
          </span>
        </button>
      </div>
      <div className={`flex flex-col items-center gap-3.5 rounded-xl p-[18px] ${open ? "bg-t-board-tint" : "bg-[#F1F4F2]"}`}>
        <span className={`font-mono text-[40px] font-bold tracking-[0.12em] ${open ? "text-t-text" : "text-[#7D8984]"}`}>{klass.joinCode}</span>
        <span className="flex flex-wrap justify-center gap-2">
          <button type="button" onClick={copy} className={`${BTN_BASE} ${SIZE_36} ${SUB}`}>
            コピー
          </button>
          <button type="button" onClick={() => setCasting(true)} className={`${BTN_BASE} ${SIZE_36} ${CHALK}`}>
            <CastIcon size={15} />
            教室に大きく映す
          </button>
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={SUBTEXT}>{open ? "クラスの全員が入ったら、受付を止めておくと安心です。" : "受付を止めている間は、このコードを入れても参加できません。"}</p>
        <button type="button" onClick={regenerate} className={GHOST}>
          コードを作り直す
        </button>
      </div>
      <NoteLine note={note} />
      {casting && <JoinCodeCast klass={klass} onClose={() => setCasting(false)} />}
    </section>
  );
}

const ROLE_ORDER: Record<TeacherRole, number> = { 担任: 0, 副担任: 1, 学年の先生: 2 };
const ADDABLE_ROLES: TeacherRole[] = ["副担任", "学年の先生"];
const MAIL_PATTERN = /^[^\s@]+@[^\s@]+$/;

const teacherName = (t: ClassTeacher) => t.name ?? t.mail;

function TeachersCard({ klass }: { klass: TeacherClass }) {
  const { classes, updateClass } = useTeacher();
  const [confirm, setConfirm] = useState<{ type: "remove" | "transfer"; teacher: ClassTeacher } | null>(null);
  const [mail, setMail] = useState("");
  const [role, setRole] = useState<TeacherRole>("副担任");
  const [note, setNote] = useState<Note>(null);
  const amHomeroom = klass.role === "担任";
  const homeroom = klass.teachers.find((t) => t.role === "担任");
  const teachers = [...klass.teachers].sort((a, b) => ROLE_ORDER[a.role] - ROLE_ORDER[b.role]);

  // 同じ学校のアカウントだけ。子どもとしてクラスにいるアカウントは追加できない（docs/06-school-expansion.md 5.6）
  const addError = (m: string) => {
    if (!m) return "メールアドレスを入れてください。";
    if (!MAIL_PATTERN.test(m)) return "メールアドレスの形になっていません。";
    if (!m.endsWith(`@${SCHOOL_DOMAIN}`)) return `同じ学校のアカウント（@${SCHOOL_DOMAIN}）だけ追加できます。`;
    if (klass.teachers.some((t) => t.mail === m)) return "この先生は、もう追加されています。";
    const isChild = classes.some((c) => c.members.some((x) => x.mail === m) || c.pending.some((x) => x.mail === m));
    if (isChild) return "子どもとしてクラスに参加しているアカウントは追加できません。";
    return null;
  };
  const add = () => {
    const m = mail.trim().toLowerCase();
    const error = addError(m);
    if (error) return setNote({ text: error, error: true });
    updateClass(klass.id, (c) => ({ ...c, teachers: [...c.teachers, { id: newId("t"), name: null, mail: m, role, me: false }] }));
    setMail("");
    setNote({ text: `${m} を${role}として追加しました。はじめてログインすると、名前が出ます。` });
  };
  const run = () => {
    if (!confirm) return;
    const t = confirm.teacher;
    if (confirm.type === "remove") {
      updateClass(klass.id, (c) => ({ ...c, teachers: c.teachers.filter((x) => x.id !== t.id) }));
      setNote({ text: `${teacherName(t)} 先生をクラスから外しました。` });
    } else {
      // 渡した相手が担任になり、あなたは相手の役割になる
      updateClass(klass.id, (c) => ({
        ...c,
        teachers: c.teachers.map((x) => (x.id === t.id ? { ...x, role: "担任" } : x.me ? { ...x, role: t.role } : x)),
      }));
      setNote({ text: `${teacherName(t)} 先生に担任を渡しました。あなたは${t.role}になりました。` });
    }
    setConfirm(null);
  };

  return (
    <section aria-labelledby="h-teachers" className={`${CARD} flex min-h-0 flex-col gap-3.5 overflow-auto p-[18px] max-[1100px]:overflow-visible`}>
      <div className="flex flex-col gap-0.5">
        <h2 id="h-teachers" className="text-base font-bold">
          一緒に見る先生
        </h2>
        <p className={SUBTEXT}>追加した先生も、確認・ミッション・設定・教室に映す操作ができます。先生の追加と解除は担任だけができます。</p>
      </div>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-[#F7F9F8] text-left text-[11px] font-bold whitespace-nowrap text-t-text-sub">
            <th scope="col" className="border-b border-t-line px-2.5 py-2">
              名前
            </th>
            <th scope="col" className="border-b border-t-line px-2.5 py-2">
              役割
            </th>
            <th scope="col" className="border-b border-t-line px-2.5 py-2">
              <span className="sr-only">操作</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {teachers.map((t) => (
            <tr key={t.id}>
              <td className="border-b border-t-line-soft p-2.5 align-middle text-[13px]">
                <span className="flex flex-col gap-px">
                  <strong>
                    {t.name ?? <span className="font-normal text-t-text-sub">ログインを待っています</span>}
                    {t.me && <span className="font-normal text-t-text-sub">（あなた）</span>}
                  </strong>
                  <span className="text-[11px] break-all text-t-text-sub">{t.mail}</span>
                </span>
              </td>
              <td className="border-b border-t-line-soft p-2.5 align-middle">
                <span
                  className={`inline-flex h-[22px] items-center rounded-full px-[9px] text-[11px] font-bold whitespace-nowrap ${t.role === "担任" ? "bg-t-board text-white" : "bg-t-board-tint text-t-board"}`}
                >
                  {t.role}
                </span>
              </td>
              <td className="border-b border-t-line-soft p-2.5 text-right align-middle whitespace-nowrap">
                {amHomeroom && !t.me && (
                  <>
                    {/* まだログインしていない先生には、担任を渡さない */}
                    {t.name && (
                      <button type="button" onClick={() => setConfirm({ type: "transfer", teacher: t })} aria-label={`${t.name} 先生に担任を渡す`} className={GHOST}>
                        担任を渡す
                      </button>
                    )}
                    <button type="button" onClick={() => setConfirm({ type: "remove", teacher: t })} aria-label={`${teacherName(t)} 先生を外す`} className={GHOST_DANGER}>
                      外す
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {amHomeroom ? (
        <form
          aria-label="先生を追加する"
          noValidate // ブラウザの吹き出しではなく、下の文で伝える
          onSubmit={(e) => {
            e.preventDefault();
            add();
          }}
          className="flex flex-wrap items-end gap-2 rounded-[10px] bg-t-ground p-3.5"
        >
          <label className="flex min-w-0 flex-[1_1_260px] flex-col gap-1.5">
            <span className="text-[13px] font-bold">先生を追加する</span>
            <input
              type="email"
              autoComplete="off"
              value={mail}
              onChange={(e) => setMail(e.target.value)}
              placeholder={`学校のメールアドレス（@${SCHOOL_DOMAIN}）`}
              className={`${FIELD_40} w-full`}
            />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-xs text-t-text-sub">役割</span>
            <select value={role} onChange={(e) => setRole(e.target.value as TeacherRole)} className={FIELD_40}>
              {ADDABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className={`${BTN_BASE} ${SIZE_40} ${PRIMARY}`}>
            追加する
          </button>
          <p className={`${SUBTEXT} basis-full`}>同じ学校のアカウントだけ追加できます。子どもとしてクラスに参加中のアカウントは追加できません。</p>
        </form>
      ) : (
        <p className="rounded-[10px] bg-t-ground p-3.5 text-[13px] leading-[1.7] text-t-text-2">
          あなたは{klass.role}です。先生の追加・解除と、担任を渡すことは、担任{homeroom?.name ? `の${homeroom.name} 先生` : ""}だけができます。
        </p>
      )}
      <NoteLine note={note} />

      {confirm?.type === "remove" && (
        <ConfirmDialog
          title={`${teacherName(confirm.teacher)} 先生を、このクラスから外しますか？`}
          items={["外したあとは、この先生は このクラスの内容を見られなくなります", "もう一度見てもらうときは、担任が追加し直します"]}
          confirmLabel="外す"
          danger
          onCancel={() => setConfirm(null)}
          onConfirm={run}
        />
      )}
      {confirm?.type === "transfer" && (
        <ConfirmDialog
          title={`${teacherName(confirm.teacher)} 先生に担任を渡しますか？`}
          items={[
            `渡したあとは、先生の追加・解除と、担任を渡すことは、${teacherName(confirm.teacher)} 先生だけができます`,
            `あなたは${confirm.teacher.role}になります。このクラスは、これまでどおり見られます`,
          ]}
          confirmLabel="担任を渡す"
          onCancel={() => setConfirm(null)}
          onConfirm={run}
        />
      )}
    </section>
  );
}

function ConfirmDialog({ title, items, confirmLabel, danger = false, onCancel, onConfirm }: {
  title: string;
  items: string[];
  confirmLabel: string;
  danger?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onCancel}
      className="m-auto w-[calc(100%-48px)] max-w-[480px] rounded-2xl bg-white p-7 text-t-text backdrop:bg-[rgba(14,28,22,0.55)]"
    >
      <div className="flex flex-col gap-4">
        <h2 id={titleId} className="text-xl font-bold">
          {title}
        </h2>
        <ul className="flex list-disc flex-col gap-2 pl-5 text-sm leading-[1.75] text-t-text-2">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <div className="mt-1 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className={`${BTN_BASE} ${SIZE_40} ${SUB}`}>
            やめる
          </button>
          <button type="button" onClick={onConfirm} className={`${BTN_BASE} ${SIZE_40} ${danger ? "border-t-danger bg-t-danger text-white" : PRIMARY}`}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  );
}

// ---- 参加コードを教室に映す（見本 17・18） ----

function JoinCodeCast({ klass, onClose }: { klass: TeacherClass; onClose: () => void }) {
  return (
    <CastFrame
      label="参加コードを教室に映す"
      title={
        <>
          <ClassNameRuby name={klass.name} />に はいろう
        </>
      }
      info={`${klass.schoolYear} ・ 参加コード ・ ${klass.joinOpen ? "受付中" : "受付を止めています"}`}
      onClose={onClose}
    >
      {(t) => (
        <div className="flex flex-1 flex-col items-center justify-center gap-[5vh] text-center">
          <p className={`tracking-[0.04em] ${t.weight} ${t.chalk}`} style={{ fontSize: castSize(40) }}>
            「せってい」で この コードを いれてね
          </p>
          <div className={`rounded-[28px] px-[4.5vw] py-[4.5vh] ${t.monitor ? "border-4 border-dashed border-t-proj-yellow" : "border-[6px] border-t-cast-fg"}`}>
            {/* 見まちがえにくいよう、コードだけは BIZ UDPゴシックで出す（README「参加コードを映す」） */}
            <span className={`-mr-[0.1em] block font-t-body leading-none font-bold tracking-[0.1em] whitespace-nowrap tabular-nums ${t.accentText}`} style={{ fontSize: castSize(168) }}>
              {klass.joinCode}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Image src="/navi/navi-think.png" alt="" width={88} height={88} style={{ width: castSize(88), height: castSize(88) }} />
            <span className={`${t.weight} ${t.monitor ? "text-t-proj-sub" : ""}`} style={{ fontSize: castSize(32) }}>
              せんせいが たしかめたら、 はいれるよ
            </span>
          </div>
        </div>
      )}
    </CastFrame>
  );
}
