"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { sanitizeRuby, unitKana } from "@/lib/ruby";
import { scenePhoto, SCENE_NAMES, type SceneKey } from "@/lib/scenes";
import { castAnswer, castChoices, DEMO_RECORDS, FIELD_KANA, fillCast, timeKey, UNIT_KANA, type DemoRecord, type TeacherClass } from "@/lib/teacherDemo";
import { CastFrame, castSize, type CastTheme } from "./CastFrame";
import { useTeacher } from "./TeacherProvider";

// 教室に映す（はてな → よそう → しょうたい）。見本は docs/design/teachers/screens/06〜11、仕様は docs/06-school-expansion.md 5.8
// 映すのは、クラスに共有された はてなだけ。名前はユーザー名だけで、本名と、投稿した子の予想と結果は出さない（7.1）
// 答えは「しょうたいを 見せる」まで出さない（8章）。答えと3択の数は、問いのデータの式からコードで計算する

type Post = DemoRecord & { id: string; user: string };
type Step = 1 | 2 | 3;

const STEPS: { n: Step; label: string }[] = [
  { n: 1, label: "はてな" },
  { n: 2, label: "よそう" },
  { n: 3, label: "しょうたい" },
];
const NEXT_LABEL: Record<Step, string> = { 1: "みんなで よそう", 2: "しょうたいを 見せる", 3: "つぎの はてなへ" };
const CHOICE_KEYS = ["ア", "イ", "ウ"];

// 文の長さで、文字の大きさを決める（見本の 64px のままだと、長い問いが はみ出すため）
function sizeFor(text: string, sizes: [number, number, number]) {
  const length = text.replace(/\{([^|}]+)\|[^}]+\}/g, "$1").length;
  return length > 34 ? sizes[2] : length > 24 ? sizes[1] : sizes[0];
}

// 学年で まだ習っていない漢字は、ひらがなにする（docs/02-spec.md 2.1）。LLM の出力と同じ、安全な変換を通す
function CastText({ text, grade, className, style }: { text: string; grade: number; className?: string; style?: React.CSSProperties }) {
  // わかち書きの空白でだけ折り返す（ことばの途中で切らない）
  return <p className={`m-0 break-keep ${className ?? ""}`} style={style} dangerouslySetInnerHTML={{ __html: sanitizeRuby(text, grade) }} />;
}

// 見本の絵（切り抜き画像の代わり）。絵はブラウザで描くので、表示したあとに入れる
const photoCache = new Map<SceneKey, string>();
function Polaroid({ scene, alt, height, rotate, t }: { scene: SceneKey; alt: string; height: string; rotate: string; t: CastTheme }) {
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const url = photoCache.get(scene) ?? scenePhoto(scene).dataUrl;
    photoCache.set(scene, url);
    ref.current.src = url;
  }, [scene]);
  return (
    <div className="relative shrink-0 rounded-[4px] bg-white p-[1.4vh] pb-[2vh]" style={{ transform: `rotate(${rotate})` }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- 絵はブラウザで描いた data URL なので、next/image を使わない */}
      <img ref={ref} alt={alt} className="block aspect-[3/4] bg-[#EEF2F0] object-cover" style={{ height }} />
      <span aria-hidden="true" className={`absolute -top-3 left-1/2 size-7 -translate-x-1/2 rounded-full ${t.magnet}`} />
    </div>
  );
}

export function CastScreen({ post, field, unit }: { post?: string; field?: string; unit?: string }) {
  const { currentClass } = useTeacher();
  return <Cast key={currentClass.id} klass={currentClass} startId={post} field={field} unit={unit} />;
}

function Cast({ klass, startId, field, unit }: { klass: TeacherClass; startId?: string; field?: string; unit?: string }) {
  const router = useRouter();
  const grade = Number(klass.grade.replace(/\D/g, "")) || 6;

  // はてなの画面でしぼりこんだ分野・単元の、共有された はてなを新しい順に
  const posts = useMemo(
    () =>
      klass.shared
        .flatMap((s): (Post & { at: string })[] => {
          const m = klass.members.find((x) => x.id === s.memberId);
          const r = DEMO_RECORDS[s.record];
          return m && r ? [{ ...r, id: s.id, user: m.user, at: s.at }] : [];
        })
        .filter((p) => (!field || p.field === field) && (!unit || p.unit === unit))
        .sort((a, b) => timeKey(b.at) - timeKey(a.at)),
    [klass, field, unit],
  );

  const [index, setIndex] = useState(() => Math.max(0, posts.findIndex((p) => p.id === startId)));
  const [step, setStep] = useState<Step>(1);
  const i = Math.min(index, Math.max(0, posts.length - 1));
  const current = posts[i];

  const close = () => {
    if (window.history.length > 1) router.back();
    else router.push("/teacher/hatena");
  };
  const goPost = (j: number) => {
    setIndex(j);
    setStep(1);
  };
  const next = () => (step < 3 ? setStep((step + 1) as Step) : goPost((i + 1) % posts.length));
  const back = () => step > 1 && setStep((step - 1) as Step);

  // 発表用のリモコン（←→・PageUp/PageDown）でも進められるようにする
  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!current) return;
    if (e.key === "ArrowRight" || e.key === "PageDown") {
      e.preventDefault();
      next();
    } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
      e.preventDefault();
      back();
    }
  };

  if (!current) {
    return (
      <CastFrame label="はてなを教室に映す" title="きょうしつに うつす はてな" info={`${klass.name} ・ 0件`} onClose={close}>
        {(t) => (
          <div className="flex flex-1 flex-col items-center justify-center gap-[4vh] text-center">
            <Image src="/navi/navi-think.png" alt="" width={150} height={150} style={{ width: castSize(150), height: castSize(150) }} />
            <p className={`${t.weight} ${t.chalk}`} style={{ fontSize: castSize(44) }}>
              クラスに みせて くれた はてなは、 まだ ないよ
            </p>
            <p className={`font-t-body text-base ${t.sub}`}>子どもが「クラスに みせる」を選んで ずかんに のこすと、ここで映せます。</p>
          </div>
        )}
      </CastFrame>
    );
  }

  const isLast = i === posts.length - 1;
  const nextLabel = step === 3 && isLast ? (posts.length > 1 ? "さいしょの はてなへ" : "もういちど") : NEXT_LABEL[step];
  const alt = `${current.user} さんが かこんだ ${SCENE_NAMES[current.scene]}（見本の絵）`;

  return (
    <CastFrame
      label="はてなを教室に映す"
      title={`${current.user} さんが みつけた はてな`}
      info={`${klass.name} ・ ${FIELD_KANA[current.field]}（${UNIT_KANA[current.unit] ?? current.unit}） ・ ${i + 1} / ${posts.length}`}
      onClose={close}
      onKeyDown={onKeyDown}
      controls={(t: CastTheme) => (
        <div role="group" aria-label="はてなを えらぶ" className="flex gap-2">
          <NavButton t={t} label="まえの はてな" disabled={i === 0} onClick={() => goPost(i - 1)} path="M15 6l-6 6 6 6" />
          <NavButton t={t} label="つぎの はてな" disabled={isLast} onClick={() => goPost(i + 1)} path="M9 6l6 6-6 6" />
        </div>
      )}
    >
      {(t) => (
        <>
          {/* 段階が変わったことを、読み上げでも伝える */}
          <p className="sr-only" aria-live="polite">
            {i + 1}こめの はてな・{STEPS[step - 1].label}
          </p>
          {step === 1 && <QuestionStep post={current} grade={grade} alt={alt} t={t} />}
          {step === 2 && <GuessStep post={current} grade={grade} t={t} />}
          {step === 3 && <AnswerStep post={current} grade={grade} alt={alt} t={t} />}

          <div className="flex flex-wrap items-center justify-between gap-6">
            <ol aria-label="すすみぐあい" className="flex gap-3">
              {STEPS.map((st) => (
                <li key={st.n}>
                  <StepButton t={t} n={st.n} label={st.label} on={st.n === step} onClick={() => setStep(st.n)} />
                </li>
              ))}
            </ol>
            <div className="flex gap-2.5 font-t-body">
              <button
                type="button"
                onClick={back}
                disabled={step === 1}
                className={`inline-flex h-14 items-center rounded-xl px-5 text-base font-bold disabled:opacity-40 ${t.line} ${t.control}`}
              >
                もどる
              </button>
              <button type="button" onClick={next} className={`inline-flex h-14 items-center gap-2.5 rounded-xl px-7 text-lg font-bold ${t.accentBg} ${t.onAccent}`}>
                {nextLabel}
                <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14" />
                  <path d="M13 6l6 6-6 6" />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
    </CastFrame>
  );
}

function NavButton({ t, label, disabled, onClick, path }: { t: CastTheme; label: string; disabled: boolean; onClick: () => void; path: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex size-12 items-center justify-center rounded-[10px] disabled:opacity-40 ${t.line} ${t.control}`}
    >
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
        <path d={path} />
      </svg>
    </button>
  );
}

function StepButton({ t, n, label, on, onClick }: { t: CastTheme; n: Step; label: string; on: boolean; onClick: () => void }) {
  const box = on
    ? `border-2 ${t.monitor ? "border-t-proj-yellow bg-t-proj-yellow text-t-proj-board" : "border-t-cast-yellow bg-t-cast-yellow text-black"}`
    : t.monitor
      ? "border-2 border-[rgba(244,241,232,0.35)] text-[#DCE7E1]"
      : "border-[3px] border-t-cast-fg text-t-cast-fg";
  const num = on
    ? `${t.monitor ? "bg-t-proj-board" : "bg-black"} ${t.accentText}`
    : t.monitor
      ? "bg-[rgba(244,241,232,0.16)] text-t-proj-chalk"
      : "bg-t-cast-fg text-black";
  return (
    <button type="button" aria-current={on ? "step" : undefined} onClick={onClick} className={`inline-flex h-[52px] items-center gap-2.5 rounded-full pr-5 pl-2.5 text-2xl ${t.weight} ${box}`}>
      <span className={`inline-flex size-[34px] items-center justify-center rounded-full text-xl ${num}`}>{n}</span>
      {label}
    </button>
  );
}

// 1. はてな：写真と問い
function QuestionStep({ post, grade, alt, t }: { post: Post; grade: number; alt: string; t: CastTheme }) {
  return (
    <div className="flex min-h-0 flex-1 items-center justify-center px-[3vw]" style={{ gap: castSize(80) }}>
      <Polaroid scene={post.scene} alt={alt} height={castSize(520)} rotate="-2deg" t={t} />
      <div className="flex min-w-0 flex-1 flex-col" style={{ gap: castSize(40) }}>
        <CastText text={post.cast.question} grade={grade} className={`leading-[1.85] tracking-[0.04em] ${t.weight} ${t.chalk}`} style={{ fontSize: castSize(sizeFor(post.cast.question, [64, 56, 48])) }} />
        <div className="flex items-center" style={{ gap: castSize(20) }}>
          <Image src="/navi/navi-think.png" alt="" width={120} height={120} style={{ width: castSize(120), height: castSize(120) }} />
          <span className={`${t.weight} ${t.accentText} ${t.chalk}`} style={{ fontSize: castSize(36) }}>
            どのくらい だと おもう？
          </span>
        </div>
      </div>
    </div>
  );
}

// 2. よそう：3択で、せーので手をあげる（投稿した子の予想は出さない）
function GuessStep({ post, grade, t }: { post: Post; grade: number; t: CastTheme }) {
  const answer = castAnswer(post);
  const unit = unitKana(post.answerUnit);
  const choices = answer ? castChoices(answer.value) : [];
  const keyColor = t.monitor ? ["border-t-proj-chalk text-t-proj-chalk", "border-t-proj-yellow text-t-proj-yellow", "border-t-proj-pink text-t-proj-pink"] : ["border-t-cast-fg", "border-t-cast-fg", "border-t-cast-fg"];
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center px-[3vw] text-center" style={{ gap: castSize(44) }}>
      <CastText text={post.cast.question} grade={grade} className={`leading-[1.8] tracking-[0.04em] ${t.weight} ${t.chalk}`} style={{ fontSize: castSize(sizeFor(post.cast.question, [46, 42, 38])) }} />
      <ul className="grid w-full grid-cols-3" style={{ gap: castSize(40) }}>
        {choices.map((c, k) => {
          const text = `${c}${unit}`;
          return (
            <li
              key={CHOICE_KEYS[k]}
              className={`flex flex-col items-center rounded-[32px] px-6 ${t.monitor ? "border-4 border-dashed border-[rgba(244,241,232,0.7)]" : "border-[6px] border-t-cast-fg"}`}
              style={{ gap: castSize(24), paddingBlock: castSize(40) }}
            >
              <span
                className={`inline-flex items-center justify-center rounded-full ${t.monitor ? "border-4" : "border-[6px]"} ${keyColor[k]} ${t.weight}`}
                style={{ width: castSize(88), height: castSize(88), fontSize: castSize(48) }}
              >
                {CHOICE_KEYS[k]}
              </span>
              <span className={`whitespace-nowrap tabular-nums ${t.weight} ${t.chalk}`} style={{ fontSize: castSize(text.length > 10 ? 40 : text.length > 7 ? 52 : 64) }}>
                {text}
              </span>
            </li>
          );
        })}
      </ul>
      <p className={`${t.weight} ${t.accentText} ${t.chalk}`} style={{ fontSize: castSize(44) }}>
        せーの！で てを あげよう
      </p>
    </div>
  );
}

// 3. しょうたい：答え（式から計算）と、どうやって求めたか
function AnswerStep({ post, grade, alt, t }: { post: Post; grade: number; alt: string; t: CastTheme }) {
  const answer = castAnswer(post);
  const unit = unitKana(post.answerUnit);
  const big = answer ? answer.text.length : 1;
  return (
    <div className="relative flex min-h-0 flex-1 items-center justify-center px-[3vw]" style={{ gap: castSize(72) }}>
      <Polaroid scene={post.scene} alt={alt} height={castSize(400)} rotate="2deg" t={t} />
      <div className="flex min-w-0 flex-1 flex-col" style={{ gap: castSize(20) }}>
        <span className={`${t.weight} ${t.sub} ${t.chalk}`} style={{ fontSize: castSize(36) }}>
          しょうたいは……
        </span>
        {answer ? (
          <span className={`leading-none whitespace-nowrap tabular-nums ${t.weight} ${t.accentText} ${t.chalk}`} style={{ fontSize: castSize(big > 7 ? 112 : 156) }}>
            {answer.approx && <span className="mr-[0.15em] text-[0.4em]">やく</span>}
            {answer.text}
            <span className="ml-[0.1em] text-[0.41em]">{unit}</span>
          </span>
        ) : (
          <span className={`${t.weight} ${t.accentText}`} style={{ fontSize: castSize(64) }}>
            けいさん できなかったよ
          </span>
        )}
        <div aria-hidden="true" className={`my-2 ${t.monitor ? "border-t-[3px] border-dashed border-[rgba(244,241,232,0.45)]" : "border-t-[5px] border-t-cast-fg"}`} />
        <CastText text={fillCast(post.cast.how, post.scope)} grade={grade} className={`leading-[1.7] tabular-nums ${t.weight} ${t.chalk}`} style={{ fontSize: castSize(40) }} />
        <CastText text={fillCast(post.cast.why, post.scope)} grade={grade} className={`leading-[1.8] ${t.bodyWeight} ${t.soft} ${t.chalk}`} style={{ fontSize: castSize(32) }} />
      </div>
      <Image src="/navi/navi-smile.png" alt="" width={150} height={150} className="absolute right-0 max-[1100px]:hidden" style={{ width: castSize(150), height: castSize(150), bottom: castSize(32) }} />
    </div>
  );
}
