"use client";

import { useState } from "react";
import { Icon } from "@/components/Icons";
import { todaysMission } from "@/lib/missions";
import { DEMO_CLASSES, DEMO_HOLIDAYS, DEMO_NOW, DEMO_TODAY, type TeacherClass } from "@/lib/teacherDemo";
import { useTeacher } from "./TeacherProvider";

// ミッション（今週・これまで・出す）。見本は docs/design/teachers/screens/12、仕様は docs/06-school-expansion.md 5.3
// 操作の結果はこの画面の中だけに反映し、読み込み直すとはじめに戻る（デモのデータ）。子どものホームは変えない

// 大きさは組み合わせごとに決める。タブレットでは押せるものを 44px 以上にする（MembersScreen と同じ）
const BTN_BASE = "inline-flex items-center justify-center gap-1.5 rounded-tbtn border text-sm font-bold whitespace-nowrap";
const SIZE_40 = "h-10 px-4 pointer-coarse:h-11";
const PRIMARY = "border-t-board bg-t-board text-white";
const SUB = "border-t-field-line bg-white text-t-board";
const PILL = "inline-flex h-[22px] items-center justify-center justify-self-start rounded-full px-[9px] text-[11px] font-bold whitespace-nowrap";

const MAX_LENGTH = 30;
const EXAMPLE = "うんどうじょうで まるい ものを さがそう";
const DOW = ["日", "月", "火", "水", "木", "金", "土"];
// 前の週から、2週先まで見られる
const WEEK_MIN = -1;
const WEEK_MAX = 2;

// クラスごとの、先生が出したミッションの文（キーは「M/D」）
type Plans = Record<string, Record<string, string>>;

const [TODAY_Y, TODAY_M, TODAY_D] = DEMO_TODAY.split("/").map(Number);
const TODAY = new Date(TODAY_Y, TODAY_M - 1, TODAY_D);

const keyOf = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
const labelOf = (d: Date) => `${d.getMonth() + 1}月${d.getDate()}日（${DOW[d.getDay()]}）`;
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const compareDay = (a: Date, b: Date) => a.getTime() - b.getTime();

function fromKey(key: string) {
  const [m, d] = key.split("/").map(Number);
  return new Date(TODAY_Y, m - 1, d);
}

// その週の月〜金
function weekDays(offset: number) {
  const monday = addDays(TODAY, 1 - (TODAY.getDay() || 7) + offset * 7);
  return [0, 1, 2, 3, 4].map((i) => addDays(monday, i));
}

function weekLabel(days: Date[]) {
  const first = days[0];
  const last = days[days.length - 1];
  const tail = first.getMonth() === last.getMonth() ? `${last.getDate()}日（${DOW[last.getDay()]}）` : labelOf(last);
  return `${labelOf(first)} 〜 ${tail}`;
}

// 漢字（くり返しの「々」も）を、出てきた順に1つずつ
function kanjiIn(text: string) {
  return [...new Set(text.match(/[㐀-䶿一-鿿豈-﫿々]/g) ?? [])];
}

const initialPlans = (): Plans =>
  Object.fromEntries(DEMO_CLASSES.map((c) => [c.id, Object.fromEntries(Object.entries(c.missionPlans).map(([k, m]) => [k, m.text]))]));

// 同じ日に同じ文を出しているクラス（まとめて出したもの）
function classesWith(plans: Plans, key: string, text: string) {
  return DEMO_CLASSES.filter((c) => plans[c.id]?.[key] === text);
}

function ClearBar({ cleared, total, label }: { cleared: number; total: number; label: string }) {
  const pct = total > 0 ? Math.min(100, Math.round((cleared / total) * 100)) : 0;
  return (
    <span className="flex flex-col gap-[5px]">
      <span className="flex justify-between text-[11px] text-t-text-2 tabular-nums">
        <span>{label}</span>
        <strong>
          {cleared} / {total}人
        </strong>
      </span>
      <span className="h-1.5 overflow-hidden rounded-[3px] bg-[#E6ECE9]">
        <span className="block h-full bg-t-board" style={{ width: `${pct}%` }} />
      </span>
    </span>
  );
}

// 子どものホームの「きょうの おだい」と同じ見た目（src/app/page.tsx）。ホームそのものは変えない
function ChildPreview({ text, isApp }: { text: string; isApp: boolean }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[13px] font-bold">子どもの ホームでの 見え方</span>
      <div className="rounded-tcard bg-t-ground p-3">
        <div className="flex items-center gap-3 rounded-card bg-yellow-soft px-4 py-3 font-body text-ink">
          <span className="flex size-[46px] shrink-0 items-center justify-center rounded-full bg-white">
            <Icon name="star" size={26} fill="#FFC83D" stroke="#22223A" strokeWidth={2} />
          </span>
          <span className="flex min-w-0 grow flex-col">
            <span className="text-sm font-black">きょうの おだい</span>
            <span className="font-pop text-[19px] leading-snug [overflow-wrap:anywhere]">{text}</span>
          </span>
        </div>
      </div>
      {isApp && <span className="text-xs text-t-text-sub">文を入れないときは、この日のアプリのお題が出ます。</span>}
    </div>
  );
}

function Editor({ date, klass, plans, onSubmit, onClear }: {
  date: Date;
  klass: TeacherClass;
  plans: Plans;
  onSubmit: (text: string, classIds: string[]) => void;
  onClear: (classIds: string[]) => void;
}) {
  const key = keyOf(date);
  const planned = plans[klass.id]?.[key] ?? "";
  const [text, setText] = useState(planned);
  // 出してあれば同じ文を出しているクラス、まだなら担当クラスすべてにチェックを入れておく（見本と同じ）
  const [classIds, setClassIds] = useState<string[]>(() => (planned ? classesWith(plans, key, planned).map((c) => c.id) : DEMO_CLASSES.map((c) => c.id)));
  const [saved, setSaved] = useState(false);

  const length = Array.from(text).length;
  const over = length > MAX_LENGTH;
  const kanji = kanjiIn(text);
  const empty = text.trim() === "";
  const cannotSubmit = empty || over || classIds.length === 0;
  // チェックしたクラスのうち、この日に出してあるもの（「この日は出さない」で取り消す先）
  const clearable = classIds.filter((id) => plans[id]?.[key]);

  const toggle = (id: string) => {
    setClassIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : DEMO_CLASSES.map((c) => c.id).filter((x) => x === id || prev.includes(x))));
    setSaved(false);
  };

  return (
    <section id="mission-editor" aria-labelledby="h-edit" className="flex min-h-0 flex-col gap-3.5 overflow-auto rounded-tcard border border-t-line bg-t-surface px-5 py-[18px] max-[1100px]:overflow-visible">
      <div className="flex flex-col gap-0.5">
        <h2 id="h-edit" className="text-lg font-bold">
          {labelOf(date)}の ミッション
        </h2>
        <p className="text-xs leading-[1.7] text-t-text-sub">
          {planned
            ? `${klass.name}に出してあります。変えると、その日の朝に子どものホームに出る文が変わります。`
            : `${klass.name}には、まだ出していません。出さなければ、アプリのお題が出ます。`}
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <span className="flex items-baseline justify-between">
          <label htmlFor="mission-text" className="text-[13px] font-bold">
            ミッションの文
          </label>
          <span id="mission-count" className={`text-[11px] tabular-nums ${over ? "font-bold text-t-danger" : "text-t-text-sub"}`}>
            {length} / {MAX_LENGTH}字
          </span>
        </span>
        <textarea
          id="mission-text"
          rows={2}
          value={text}
          placeholder={EXAMPLE}
          aria-describedby="mission-count mission-hint"
          aria-invalid={over}
          onChange={(e) => {
            setText(e.target.value);
            setSaved(false);
          }}
          className={`resize-none rounded-[10px] border px-3 py-2.5 text-base leading-[1.7] text-t-text ${over ? "border-t-danger" : "border-t-field-line"}`}
        />
        <span id="mission-hint" className="text-xs leading-[1.7] text-t-text-sub">
          ひらがなとカタカナで、ことばの間に空白を入れてください。（例：{EXAMPLE}）
        </span>
        {over && <span className="text-xs font-bold text-t-danger">{MAX_LENGTH}字までにしてください。このままでは出せません。</span>}
      </div>

      {kanji.length > 0 && (
        <p role="status" className="rounded-tbtn border border-t-chalk-line bg-t-chalk-soft px-3 py-2 text-xs leading-[1.6] text-t-chalk-text">
          漢字が入っています（{kanji.join("・")}）。ひらがなに直すと、どの学年でも読めます。このままでも出せます。
        </p>
      )}

      <fieldset className="flex flex-wrap items-center gap-2">
        <legend className="mb-1.5 text-[13px] font-bold">出すクラス</legend>
        {DEMO_CLASSES.map((c) => {
          const on = classIds.includes(c.id);
          return (
            <label
              key={c.id}
              className={`flex min-h-10 cursor-pointer items-center gap-2 rounded-tbtn border px-3 text-[13px] pointer-coarse:min-h-11 ${on ? "border-t-board bg-t-board-soft" : "border-t-field-line bg-white"}`}
            >
              <input type="checkbox" checked={on} onChange={() => toggle(c.id)} className="size-[18px] accent-t-board" />
              {c.name}
              <span className="text-[11px] text-t-text-sub">{c.role}</span>
            </label>
          );
        })}
        {classIds.length === 0 && <span className="w-full text-xs font-bold text-t-danger">クラスを1つ以上選んでください。</span>}
      </fieldset>

      <ChildPreview text={empty ? todaysMission(date) : text} isApp={empty} />

      <div className="mt-auto flex flex-wrap items-center gap-2.5 border-t border-t-line-soft pt-3.5">
        {clearable.length > 0 && !saved && (
          <button
            type="button"
            onClick={() => onClear(clearable)}
            className="min-h-9 px-1.5 text-[13px] font-bold text-t-danger pointer-coarse:min-h-11"
          >
            この日は出さない
          </button>
        )}
        {saved && (
          <span role="status" className="inline-flex items-center gap-1.5 text-[13px] font-bold text-t-board">
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12l4.5 4.5L19 7" />
            </svg>
            出しました
          </span>
        )}
        <button
          type="button"
          disabled={cannotSubmit}
          onClick={() => {
            onSubmit(text.trim(), classIds);
            setSaved(true);
          }}
          className={`${BTN_BASE} ${SIZE_40} ${PRIMARY} ml-auto disabled:cursor-not-allowed disabled:opacity-45`}
        >
          {classIds.length > 1 ? `${classIds.length}クラスに出す` : "ミッションを出す"}
        </button>
      </div>
    </section>
  );
}

export function MissionsScreen() {
  const { currentClass: klass } = useTeacher();
  // クラスを切りかえても、出したものが残るように、ここで持つ（まとめて出したものを、ほかのクラスでも確かめられる）
  const [plans, setPlans] = useState<Plans>(initialPlans);
  const [week, setWeek] = useState(0);
  const [selectedKey, setSelectedKey] = useState(keyOf(addDays(TODAY, 1)));
  // 出したり取り消したりしたら、編集の欄を はじめから作り直す
  const [revision, setRevision] = useState(0);

  const days = weekDays(week);
  const mine = plans[klass.id] ?? {};
  const total = klass.members.length;
  const selectedDate = fromKey(selectedKey);
  const isFuture = (d: Date) => compareDay(d, TODAY) > 0;
  const selectable = (d: Date) => isFuture(d) && !DEMO_HOLIDAYS[keyOf(d)];

  const past = Object.keys(mine)
    .map(fromKey)
    .filter((d) => compareDay(d, TODAY) < 0)
    .sort((a, b) => compareDay(b, a));

  // 幅が狭いと編集の欄は下にあるので、選んだらそこまで動かす
  const pick = (key: string) => {
    setSelectedKey(key);
    if (window.matchMedia("(max-width: 1100px)").matches) {
      requestAnimationFrame(() => document.getElementById("mission-editor")?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  };

  const submit = (text: string, classIds: string[]) => {
    setPlans((prev) => {
      const next = { ...prev };
      for (const id of classIds) next[id] = { ...next[id], [selectedKey]: text };
      return next;
    });
  };

  const clear = (classIds: string[]) => {
    setPlans((prev) => {
      const next = { ...prev };
      for (const id of classIds) {
        const rest = { ...next[id] };
        delete rest[selectedKey];
        next[id] = rest;
      }
      return next;
    });
    setRevision((n) => n + 1);
  };

  return (
    <main className="mx-auto flex min-h-0 w-full max-w-[1400px] flex-1 flex-col gap-3.5 px-6 pt-4 pb-5 max-[640px]:px-4">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <h1 className="text-[22px] font-bold tracking-[0.02em]">ミッション</h1>
        <p className="flex-[1_1_360px] text-xs leading-[1.7] text-t-text-2">
          先生が出した日は、子どものホームの「きょうの おだい」に先生の文が出ます。出さない日はアプリのお題です。
        </p>
        <div className="flex items-center gap-1">
          <button type="button" aria-label="前の週" disabled={week <= WEEK_MIN} onClick={() => setWeek((w) => w - 1)} className={`${BTN_BASE} ${SUB} size-9 pointer-coarse:size-11 disabled:opacity-40`}>
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 6l-6 6 6 6" />
            </svg>
          </button>
          <span aria-live="polite" className="min-w-[190px] text-center text-sm font-bold tabular-nums">
            {weekLabel(days)}
          </span>
          <button type="button" aria-label="次の週" disabled={week >= WEEK_MAX} onClick={() => setWeek((w) => w + 1)} className={`${BTN_BASE} ${SUB} size-9 pointer-coarse:size-11 disabled:opacity-40`}>
            <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,7fr)_minmax(0,5fr)] gap-4 max-[1100px]:grid-cols-1">
        <div className="flex min-h-0 flex-col gap-4 overflow-auto max-[1100px]:overflow-visible">
          <section aria-labelledby="h-week" className="flex flex-col rounded-tcard border border-t-line bg-t-surface px-[18px] pt-3.5 pb-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2 pb-1.5">
              <h2 id="h-week" className="text-base font-bold">
                {week === 0 ? "今週" : week < 0 ? "前の週" : week === 1 ? "来週" : `${week}週あと`}
              </h2>
              <span className="text-xs text-t-text-sub">
                これからの日を選ぶと、<span className="max-[1100px]:hidden">右</span>
                <span className="hidden max-[1100px]:inline">下</span>で出せます
              </span>
            </div>
            <ul>
              {days.map((d) => {
                const key = keyOf(d);
                const text = mine[key];
                const holiday = DEMO_HOLIDAYS[key];
                const isToday = compareDay(d, TODAY) === 0;
                const cleared = klass.missionPlans[key]?.cleared;
                const on = key === selectedKey;
                const classes = text ? classesWith(plans, key, text).map((c) => c.name).join("・") : "";

                let pill = { label: "おわり", tone: "bg-[#EEF2F0] text-t-text-2" };
                if (holiday) pill = { label: "祝日", tone: "bg-[#EEF2F0] text-t-text-2" };
                else if (isToday) pill = { label: "きょう", tone: "bg-t-board-tint text-t-board" };
                else if (on) pill = { label: "編集中", tone: "bg-t-board text-white" };
                else if (isFuture(d)) pill = text ? { label: "予定", tone: "bg-[#FFF3CC] text-t-chalk-text" } : { label: "まだ", tone: "bg-[#EEF2F0] text-t-text-2" };

                const body = (
                  <>
                    <span className="flex items-baseline gap-1 tabular-nums">
                      <strong className="text-[17px]">{key}</strong>
                      <span className="text-xs text-t-text-sub">{DOW[d.getDay()]}</span>
                    </span>
                    <span className={`${PILL} ${pill.tone}`}>{pill.label}</span>
                    <span className="flex min-w-0 flex-col gap-0.5">
                      {holiday ? (
                        <span className="text-sm leading-normal text-t-text-sub">{holiday}（授業時間の外・アプリのお題）</span>
                      ) : text ? (
                        <>
                          <span className="text-sm leading-normal">{text}</span>
                          <span className="text-[11px] text-t-text-sub">{classes}</span>
                        </>
                      ) : (
                        <span className="text-sm leading-normal text-t-text-sub">アプリのお題{isFuture(d) ? "が出ます" : ""}：{todaysMission(d)}</span>
                      )}
                    </span>
                    <span className="max-[640px]:col-span-full">
                      {!isFuture(d) && text && typeof cleared === "number" && (
                        <ClearBar cleared={cleared} total={total} label={isToday ? `${DEMO_NOW} 時点` : "クリア"} />
                      )}
                      {selectable(d) && !on && <span className="block text-right text-[13px] font-bold text-t-board">{text ? "変える" : "＋ 出す"}</span>}
                    </span>
                  </>
                );
                const grid =
                  "-mx-2.5 grid min-h-[60px] w-[calc(100%+20px)] grid-cols-[56px_64px_minmax(0,1fr)_140px] items-center gap-3 rounded-[10px] border-t border-t-line-soft px-2.5 py-2 text-left max-[640px]:grid-cols-[48px_64px_minmax(0,1fr)]";
                return (
                  <li key={key}>
                    {selectable(d) ? (
                      <button
                        type="button"
                        aria-pressed={on}
                        onClick={() => pick(key)}
                        className={`${grid} ${on ? "bg-t-board-soft shadow-[inset_0_0_0_2px_var(--color-t-board)]" : "hover:bg-t-board-soft"}`}
                      >
                        {body}
                      </button>
                    ) : (
                      <div className={grid}>{body}</div>
                    )}
                  </li>
                );
              })}
            </ul>
            <p className="border-t border-t-line-soft pt-2 pb-1.5 text-xs leading-[1.7] text-t-text-sub">土日は、クラスの設定で授業の日に足した日だけ出せます。</p>
          </section>

          <section aria-labelledby="h-past" className="flex flex-col rounded-tcard border border-t-line bg-t-surface px-[18px] pt-3.5 pb-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2 pb-1.5">
              <h2 id="h-past" className="text-base font-bold">
                これまで
              </h2>
              <span className="text-xs text-t-text-sub">クリア＝その日に ずかんへ保存した人数（お題に合っているかは見ません）</span>
            </div>
            {past.length > 0 ? (
              <ul>
                {past.map((d) => {
                  const key = keyOf(d);
                  const cleared = klass.missionPlans[key]?.cleared ?? 0;
                  return (
                    <li key={key} className="grid grid-cols-[84px_minmax(0,1fr)_140px] items-center gap-3 border-t border-t-line-soft py-2.5 max-[640px]:grid-cols-[84px_minmax(0,1fr)]">
                      <span className="text-[13px] text-t-text-2 tabular-nums">
                        {key}（{DOW[d.getDay()]}）
                      </span>
                      <span className="truncate text-[13px]" title={mine[key]}>
                        {mine[key]}
                      </span>
                      <span className="flex items-center gap-2 max-[640px]:col-span-full">
                        <span className="h-1.5 flex-1 overflow-hidden rounded-[3px] bg-[#E6ECE9]">
                          <span className="block h-full bg-t-board" style={{ width: `${total > 0 ? Math.round((cleared / total) * 100) : 0}%` }} />
                        </span>
                        <strong className="text-xs whitespace-nowrap tabular-nums">
                          {cleared}人<span className="sr-only">（{total}人中）</span>
                        </strong>
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="border-t border-t-line-soft py-3 text-[13px] text-t-text-sub">これまでに出したミッションは、まだありません。</p>
            )}
          </section>
        </div>

        <Editor key={`${klass.id}-${selectedKey}-${revision}`} date={selectedDate} klass={klass} plans={plans} onSubmit={submit} onClear={clear} />
      </div>
    </main>
  );
}
