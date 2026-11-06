"use client";

import Link from "next/link";
import { useState } from "react";
import {
  DEMO_HOLIDAYS,
  DEMO_NOW,
  DEMO_RECORDS,
  DEMO_TEACHER,
  DEMO_TODAY,
  kanjiIn,
  memberRecords,
  MISSION_EXAMPLE,
  MISSION_MAX_LENGTH,
  timeKey,
  type DemoField,
  type DemoPending,
  type TeacherClass,
} from "@/lib/teacherDemo";
import { HomeMissionCard } from "./HomeMissionCard";
import { SceneThumb } from "./SceneThumb";
import { useTeacher } from "./TeacherProvider";

// きょう（やること・この2週間・きょう授業中に集まった はてな）。見本は docs/design/teachers/screens/01〜02、仕様は docs/06-school-expansion.md 5.1・5.3・5.5
// 操作の結果はこの画面の中だけに反映し、読み込み直すとはじめに戻る（デモのデータ）
// クラス全体の数だけを出す。子どもごとの数の表・順位・予想の当たり外れの割合は出さない（5.5）

// 大きさは組み合わせごとに決める。タブレットでは押せるものを 44px 以上にする（MembersScreen と同じ）
const BTN_BASE = "inline-flex items-center justify-center gap-1.5 rounded-tbtn border text-[13px] font-bold whitespace-nowrap";
const PRIMARY = "border-t-board bg-t-board text-white";
const GHOST = "min-h-9 px-1.5 text-[13px] font-bold text-t-board pointer-coarse:min-h-11";

const FIELD_COLOR: Record<DemoField, string> = { 算数: "bg-t-math", 理科: "bg-t-sci", 情報: "bg-t-info" };
const FIELDS: DemoField[] = ["算数", "理科", "情報"];
const DOW = ["日", "月", "火", "水", "木", "金", "土"];

const [TODAY_Y, TODAY_M, TODAY_D] = DEMO_TODAY.split("/").map(Number);
const TODAY = new Date(TODAY_Y, TODAY_M - 1, TODAY_D);
const TODAY_KEY = `${TODAY_M}/${TODAY_D}`;
const TOMORROW = new Date(TODAY_Y, TODAY_M - 1, TODAY_D + 1);
const TOMORROW_KEY = `${TOMORROW.getMonth() + 1}/${TOMORROW.getDate()}`;
const TOMORROW_LABEL = `${TOMORROW.getMonth() + 1}月${TOMORROW.getDate()}日（${DOW[TOMORROW.getDay()]}）`;
const NOW_LABEL = `${TODAY_Y}年${TODAY_M}月${TODAY_D}日（${DOW[TODAY.getDay()]}） ${DEMO_NOW}`;

// 単元がどの分野か（見本の問いから引く）
const UNIT_FIELD = new Map(DEMO_RECORDS.map((r) => [r.unit, r.field]));

const sumFields = (f: Record<DemoField, number>) => FIELDS.reduce((n, x) => n + f[x], 0);

// 割合（%）を、合計がちょうど100になるように整数にする（いちばん大きい端数から1ずつ足す）
function percents(counts: Record<DemoField, number>): Record<DemoField, number> {
  const total = sumFields(counts);
  const result = { 算数: 0, 理科: 0, 情報: 0 };
  if (total === 0) return result;
  const raw = FIELDS.map((f) => ({ f, v: (counts[f] / total) * 100 }));
  for (const r of raw) result[r.f] = Math.floor(r.v);
  let rest = 100 - sumFields(result);
  for (const r of [...raw].sort((a, b) => (b.v % 1) - (a.v % 1))) {
    if (rest <= 0) break;
    result[r.f] += 1;
    rest -= 1;
  }
  return result;
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5 rounded-[10px] bg-t-ground px-3.5 py-3">
      <span className="text-xs text-t-text-sub">{label}</span>
      {children}
    </div>
  );
}

function BigNumber({ value, unit, size = "text-3xl" }: { value: number | string; unit: string; size?: string }) {
  return (
    <span>
      <span className={`${size} leading-none font-bold tabular-nums`}>{value}</span>
      <span className="ml-[3px] text-xs text-t-text-sub">{unit}</span>
    </span>
  );
}

function FieldBar({ counts, label, height = "h-2.5" }: { counts: Record<DemoField, number>; label: string; height?: string }) {
  return (
    <div role="img" aria-label={label} className={`mt-1 flex gap-0.5 overflow-hidden rounded-[5px] bg-t-line-soft ${height}`}>
      {FIELDS.map((f) => (counts[f] > 0 ? <div key={f} className={FIELD_COLOR[f]} style={{ flex: counts[f] }} /> : null))}
    </div>
  );
}

function TodoIcon({ children }: { children: React.ReactNode }) {
  return (
    <span aria-hidden="true" className="inline-flex size-[30px] shrink-0 items-center justify-center rounded-tbtn bg-[#FFF3CC] text-[#6B4E00]">
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </span>
  );
}

function PendingTodo({ pending, onDone }: { pending: DemoPending[]; onDone: (p: DemoPending) => void }) {
  return (
    <div className="flex flex-col gap-2 border-t border-t-line-soft py-3.5">
      <div className="flex items-center gap-2.5">
        <TodoIcon>
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" />
          <path d="M19 8v6" />
          <path d="M16 11h6" />
        </TodoIcon>
        <h3 className="text-sm font-bold">参加の確認</h3>
        <span className="ml-auto text-xs text-t-text-sub">{pending.length > 0 ? `${pending.length}人が待っています` : "なし"}</span>
      </div>
      {pending.length > 0 ? (
        <ul className="flex flex-col">
          {pending.map((p) => (
            <li key={p.id} className="flex items-center gap-1.5 py-1.5">
              <span className="flex min-w-0 flex-1 flex-col gap-px">
                <span className="truncate text-sm font-bold">
                  {p.name}
                  <span className="text-xs font-normal text-t-text-sub">（{p.user}）</span>
                </span>
                <span className="truncate text-[11px] text-t-text-sub">{p.mail}</span>
              </span>
              <button type="button" onClick={() => onDone(p)} aria-label={`${p.name}さんはこのクラスではない`} className={GHOST}>
                ちがう
              </button>
              <button type="button" onClick={() => onDone(p)} aria-label={`${p.name}さんを確認する`} className={`${BTN_BASE} ${PRIMARY} h-[34px] px-3.5 pointer-coarse:h-11`}>
                確認
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[13px] leading-[1.7] text-t-text-2">全員の確認がおわりました。これから保存される はてなが先生に見えます。</p>
      )}
    </div>
  );
}

function MissionTodo({ text, setText, isSet, onSubmit, onEdit }: {
  text: string;
  setText: (text: string) => void;
  isSet: boolean;
  onSubmit: () => void;
  onEdit: () => void;
}) {
  const length = Array.from(text).length;
  const over = length > MISSION_MAX_LENGTH;
  const kanji = kanjiIn(text);
  const cannotSubmit = text.trim() === "" || over;

  return (
    <div className="flex flex-col gap-2 border-t border-t-line-soft py-3.5">
      <div className="flex items-center gap-2.5">
        <TodoIcon>
          <path d="M5 21V4" />
          <path d="M5 4h11l-2 4 2 4H5" />
        </TodoIcon>
        <h3 className="text-sm font-bold">あしたの ミッション</h3>
        <span className="ml-auto text-xs text-t-text-sub">
          {TOMORROW_LABEL} ・ {isSet ? "出しました" : "まだ"}
        </span>
      </div>
      {isSet ? (
        <>
          <HomeMissionCard text={text} />
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-t-text-sub">あしたの朝、子どものホームに出ます</span>
            <button type="button" onClick={onEdit} className={GHOST}>
              変える
            </button>
          </div>
        </>
      ) : (
        <>
          <form
            className="flex items-center gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!cannotSubmit) onSubmit();
            }}
          >
            <label className="min-w-0 flex-1">
              <span className="sr-only">ミッションの文</span>
              <input
                type="text"
                value={text}
                placeholder={MISSION_EXAMPLE}
                aria-invalid={over}
                aria-describedby="today-mission-note"
                onChange={(e) => setText(e.target.value)}
                className={`h-10 w-full rounded-tbtn border bg-white px-3 text-sm text-t-text pointer-coarse:h-11 pointer-coarse:text-base ${over ? "border-t-danger" : "border-t-field-line"}`}
              />
            </label>
            <button type="submit" disabled={cannotSubmit} className={`${BTN_BASE} ${PRIMARY} h-10 px-3.5 pointer-coarse:h-11 disabled:cursor-not-allowed disabled:opacity-45`}>
              出す
            </button>
          </form>
          {kanji.length > 0 && (
            <p role="status" className="rounded-tbtn border border-t-chalk-line bg-t-chalk-soft px-2.5 py-2 text-xs leading-[1.6] text-t-chalk-text">
              漢字が入っています（{kanji.join("・")}）。ひらがなに直すと、どの学年でも読めます。このままでも出せます。
            </p>
          )}
          <span id="today-mission-note" className={`text-xs ${over ? "font-bold text-t-danger" : "text-t-text-sub"}`}>
            {over ? `${length} / ${MISSION_MAX_LENGTH}字。${MISSION_MAX_LENGTH}字までにしてください。` : "出さない日は アプリのお題が出ます"}
          </span>
        </>
      )}
    </div>
  );
}

function Today({ klass }: { klass: TeacherClass }) {
  const [pending, setPending] = useState(klass.pending);
  const planned = klass.missionPlans[TOMORROW_KEY]?.text ?? "";
  const [missionText, setMissionText] = useState(planned);
  const [missionSet, setMissionSet] = useState(planned !== "");

  const members = klass.members.length;
  const todoCount = (pending.length > 0 ? 1 : 0) + (missionSet ? 0 : 1);

  // きょう授業中に保存された はてな（はてな・メンバーの画面と同じもの）
  const todayItems = klass.members
    .flatMap((m) => memberRecords(m).map((r) => ({ ...r, name: m.name })))
    .filter((r) => r.at.startsWith(`${TODAY_KEY} `))
    .sort((a, b) => timeKey(b.at) - timeKey(a.at));
  const todayFields = { 算数: 0, 理科: 0, 情報: 0 };
  for (const r of todayItems) todayFields[r.field] += 1;
  const todayChildren = new Set(todayItems.map((r) => r.memberId)).size;

  // この2週間（きょうまでの14日）。きょうの授業中の分は上の数、授業の外は まだ0件として足す
  const days = [...klass.twoWeeks.days, { day: TODAY_KEY, fields: todayFields, out: 0 }].map((d) => {
    const [m, day] = d.day.split("/").map(Number);
    const date = new Date(TODAY_Y, m - 1, day);
    const off = date.getDay() === 0 || date.getDay() === 6 || d.day in DEMO_HOLIDAYS;
    return { ...d, date, inClass: sumFields(d.fields), off, isToday: d.day === TODAY_KEY };
  });
  const inTotal = days.reduce((n, d) => n + d.inClass, 0);
  const outTotal = days.reduce((n, d) => n + d.out, 0);
  const fieldTotals = { 算数: 0, 理科: 0, 情報: 0 };
  for (const d of days) for (const f of FIELDS) fieldTotals[f] += d.fields[f];
  const pct = percents(fieldTotals);
  const maxDay = Math.max(1, ...days.map((d) => d.inClass + d.out));
  const range = `${days[0].day}〜${days[days.length - 1].day}`;

  // よく出る単元（授業中に保存したものだけで数える）
  const unitCounts = new Map(Object.entries(klass.twoWeeks.units));
  for (const r of todayItems) unitCounts.set(r.unit, (unitCounts.get(r.unit) ?? 0) + 1);
  const topUnits = [...unitCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);

  // ミッションのクリア：この2週間に出した日（きょうより前）の平均と、きょうの途中の数
  const firstDay = timeKey(`${days[0].day} 0:00`);
  const pastMissions = Object.entries(klass.missionPlans).filter(([key, m]) => {
    const t = timeKey(`${key} 0:00`);
    return t >= firstDay && t < timeKey(`${TODAY_KEY} 0:00`) && typeof m.cleared === "number";
  });
  const clearAverage = pastMissions.length > 0 ? Math.round(pastMissions.reduce((n, [, m]) => n + (m.cleared ?? 0), 0) / pastMissions.length) : null;
  const todayCleared = klass.missionPlans[TODAY_KEY]?.cleared;

  const chartLabel = `日ごとの保存件数（${range}）。${days.map((d) => `${d.day} 授業中${d.inClass}件・授業の外${d.out}件`).join("、")}`;

  return (
    <main className="mx-auto flex min-h-0 w-full max-w-[1400px] flex-1 flex-col gap-3.5 px-6 pt-4 pb-5 max-[640px]:px-4">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h1 className="text-[22px] font-bold tracking-[0.02em]">きょうの {klass.name}</h1>
        <span className="text-[13px] text-t-text-sub tabular-nums">{NOW_LABEL}</span>
        <span className="ml-auto text-[13px] text-t-text-sub">
          参加中 {members}人 ・ {klass.role} {DEMO_TEACHER.name} 先生
        </span>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-4 max-[1100px]:grid-cols-1">
        <div className="flex min-h-0 flex-col gap-4 overflow-auto max-[1100px]:overflow-visible">
          <section aria-labelledby="h-todo" className="flex flex-col rounded-tcard border border-t-line bg-t-surface px-[18px] pt-4 pb-1">
            <div className="flex items-center gap-2 pb-3">
              <h2 id="h-todo" className="text-base font-bold">
                やること
              </h2>
              {todoCount > 0 ? (
                <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-t-chalk px-[7px] text-xs font-bold text-t-text tabular-nums">
                  {todoCount}
                  <span className="sr-only">件</span>
                </span>
              ) : (
                <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-t-board-tint px-2.5 text-xs font-bold text-t-board">
                  <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12l4.5 4.5L19 7" />
                  </svg>
                  ぜんぶ おわりました
                </span>
              )}
            </div>
            <PendingTodo pending={pending} onDone={(p) => setPending((prev) => prev.filter((x) => x.id !== p.id))} />
            <MissionTodo
              text={missionText}
              setText={setMissionText}
              isSet={missionSet}
              onSubmit={() => {
                setMissionText((t) => t.trim());
                setMissionSet(true);
              }}
              onEdit={() => setMissionSet(false)}
            />
          </section>

          <section aria-labelledby="h-2w" className="flex flex-col gap-3.5 rounded-tcard border border-t-line bg-t-surface px-[18px] py-4">
            <div className="flex items-baseline justify-between gap-2">
              <h2 id="h-2w" className="text-base font-bold">
                この2週間
              </h2>
              <span className="text-xs text-t-text-sub tabular-nums">{range}</span>
            </div>
            {/* 4つ横にならべると見出しが折り返すので、2つずつ2段にする */}
            <div className="grid grid-cols-2 gap-2">
              <Stat label="使った子ども">
                <BigNumber value={klass.twoWeeks.users} unit={`/ ${members}人`} size="text-2xl" />
              </Stat>
              <Stat label="保存した はてな">
                <BigNumber value={inTotal + outTotal} unit="件" size="text-2xl" />
              </Stat>
              <Stat label="ミッションのクリア">
                <BigNumber value={clearAverage ?? "—"} unit="人（平均）" size="text-2xl" />
                {typeof todayCleared === "number" && (
                  <span className="text-[11px] text-t-text-2 tabular-nums">
                    きょう {todayCleared}人（{DEMO_NOW} 時点）
                  </span>
                )}
              </Stat>
              <Stat label="分野（授業中）">
                <FieldBar counts={fieldTotals} label={FIELDS.map((f) => `${f}${pct[f]}%`).join("、")} height="h-2" />
                <span className="text-[11px] whitespace-nowrap text-t-text-2 tabular-nums">{FIELDS.map((f) => pct[f]).join(" ・ ")} %</span>
              </Stat>
            </div>

            <div role="img" aria-label={chartLabel} className="flex flex-col gap-1">
              <div className="grid h-[110px] grid-cols-[repeat(14,minmax(0,1fr))] items-end gap-1.5 border-b border-t-line">
                {days.map((d) => (
                  <div key={d.day} className="flex flex-col">
                    <div className="rounded-t-[2px] bg-t-board-line" style={{ height: `${(d.out / maxDay) * 100}px` }} />
                    <div className={`bg-t-board ${d.out === 0 ? "rounded-t-[2px]" : ""}`} style={{ height: `${(d.inClass / maxDay) * 100}px` }} />
                  </div>
                ))}
              </div>
              <div aria-hidden="true" className="grid grid-cols-[repeat(14,minmax(0,1fr))] gap-1.5">
                {days.map((d) => (
                  <span key={d.day} className={`text-center text-[10px] tabular-nums ${d.off ? "text-[#7D8984]" : "text-t-text-2"} ${d.isToday ? "font-bold" : ""}`}>
                    {d.date.getDate()}
                  </span>
                ))}
              </div>
            </div>
            <span className="flex flex-wrap gap-x-3.5 gap-y-1 text-[11px] text-t-text-2 tabular-nums">
              <span className="inline-flex items-center gap-[5px]">
                <span aria-hidden="true" className="size-[9px] rounded-[2px] bg-t-board" />
                授業中 {inTotal}
              </span>
              <span className="inline-flex items-center gap-[5px]">
                <span aria-hidden="true" className="size-[9px] rounded-[2px] bg-t-board-line" />
                授業の外 {outTotal}
              </span>
              <span className="text-t-text-sub">灰色の日付は土日・祝日</span>
            </span>

            <div className="flex flex-col gap-1.5 border-t border-t-line-soft pt-3">
              <h3 className="text-sm font-bold">よく出る単元（授業中）</h3>
              <ol className="flex flex-wrap gap-1.5">
                {topUnits.map(([unit, count]) => {
                  const field = UNIT_FIELD.get(unit);
                  return (
                    <li key={unit} className="inline-flex h-[26px] items-center gap-[5px] rounded-full bg-[#F1F4F2] px-2.5 text-xs whitespace-nowrap text-t-text-2">
                      {field && <span aria-hidden="true" className={`size-2 rounded-full ${FIELD_COLOR[field]}`} />}
                      {unit}
                      <strong className="tabular-nums">{count}件</strong>
                    </li>
                  );
                })}
              </ol>
            </div>
          </section>
        </div>

        <section aria-labelledby="h-live" className="flex min-h-0 flex-col gap-4 overflow-hidden rounded-tcard border border-t-line bg-t-surface px-5 py-[18px] max-[1100px]:overflow-visible">
          <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-1">
            <h2 id="h-live" className="text-base font-bold">
              きょう 授業中に 集まった はてな
            </h2>
            <Link href="/teacher/hatena" className="text-[13px] font-bold whitespace-nowrap text-t-board pointer-coarse:inline-flex pointer-coarse:min-h-11 pointer-coarse:items-center">
              はてなで すべて見る →
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3 max-[640px]:grid-cols-1">
            <Stat label="保存された はてな">
              <BigNumber value={todayItems.length} unit="件" />
            </Stat>
            <Stat label="保存した子ども">
              <BigNumber value={todayChildren} unit={`/ ${members}人`} />
            </Stat>
            <Stat label="分野">
              <FieldBar counts={todayFields} label={FIELDS.map((f) => `${f}${todayFields[f]}件`).join("、")} />
              <span className="flex gap-2.5 text-xs whitespace-nowrap text-t-text-2">
                {FIELDS.map((f) => (
                  <span key={f}>
                    {f} <strong>{todayFields[f]}</strong>
                  </span>
                ))}
              </span>
            </Stat>
          </div>

          <div className="flex min-h-0 flex-1 flex-col border-t border-t-line-soft pt-3">
            <h3 className="pb-1 text-sm font-bold">いま届いた はてな</h3>
            {todayItems.length > 0 ? (
              <ul className="flex min-h-0 flex-1 flex-col overflow-auto max-[1100px]:overflow-visible">
                {todayItems.map((r) => (
                  <li key={r.id} className="grid grid-cols-[44px_84px_minmax(0,1fr)_auto] items-center gap-3.5 border-b border-[#F1F4F2] py-2.5 max-[640px]:grid-cols-[84px_minmax(0,1fr)]">
                    <span className="text-[13px] text-t-text-sub tabular-nums max-[640px]:hidden">{r.at.split(" ")[1]}</span>
                    <SceneThumb scene={r.scene} className="h-14 w-[84px] rounded-tbtn" />
                    <span className="flex min-w-0 flex-col gap-[3px]">
                      <span className="truncate text-[15px] font-bold" title={r.question}>
                        {r.question}
                      </span>
                      <span className="text-xs text-t-text-sub">
                        {r.name}
                        <span className="hidden max-[640px]:inline tabular-nums"> ・ {r.at.split(" ")[1]}</span>
                      </span>
                    </span>
                    <span className="inline-flex h-[26px] items-center gap-[5px] rounded-full bg-[#F1F4F2] px-2.5 text-xs whitespace-nowrap text-t-text-2 max-[640px]:col-start-2 max-[640px]:justify-self-start">
                      <span aria-hidden="true" className={`size-2 rounded-full ${FIELD_COLOR[r.field]}`} />
                      {r.unit}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="rounded-[10px] bg-t-ground p-4 text-[13px] text-t-text-sub">きょう授業中に保存された はてなは、まだありません。</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

// クラスを切り替えたら、そのクラスのデータで はじめから出す
export function TodayScreen() {
  const { currentClass } = useTeacher();
  return <Today key={currentClass.id} klass={currentClass} />;
}
