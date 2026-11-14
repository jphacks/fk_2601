"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { requestDetail, requestQuestions } from "@/lib/api";
import { ASKED_MAX } from "@/lib/constants";
import { messageOf, UserFacingError } from "@/lib/errors";
import type { Crop, Photo } from "@/lib/image";
import { buildGenerationContext } from "@/lib/progress";
import { detailRequestBody, needsDetail, withDetail } from "@/lib/questionDetail";
import type { Guess } from "@/lib/rating";
import type { SceneKey } from "@/lib/scenes";
import type { ArchiveRecord } from "@/lib/types";
import type { QuestionsResponse } from "@/server/llm/generate";
import type { Detail, Question } from "@/server/llm/schema";
import { useApp } from "./AuthProvider";
import { useArchive } from "./ArchiveProvider";

export type Generation =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; data: QuestionsResponse }
  | { status: "error"; message: string };

/**
 * えらんだ問いの 解説などを作る 2回目（#165）の状態。none は 2回目が要らない（見本・デモ・自分で書いた問いは、はじめから そろっている）。
 * loading・error の間は、解説が空なので、ずかんに 保存しない
 */
export type DetailState =
  | { status: "none" }
  | { status: "loading" }
  | { status: "ready"; data: Detail }
  | { status: "error"; message: string };

type QuizContext = {
  photo: Photo | null;
  /** 見本の絵を使っているとき、その名前（撮った写真のときは null） */
  scene: SceneKey | null;
  /** 写真を手に入れた画面（囲む画面の「もどる」の行き先） */
  photoFrom: string;
  crop: Crop | null;
  generation: Generation;
  /** えらんだ問いと、その予想（解説などが 2回目で届いたら、重ねて返す） */
  selected: Question | null;
  detail: DetailState;
  /** 2回目が 失敗したとき、もう一度 呼ぶ（ユーザーの操作で呼ぶ1回。自動リトライではない） */
  retryDetail: () => void;
  guess: Guess | null;
  /** いまの問いを、ずかんに保存したか（保存したら、もどっても もう一度は保存しない） */
  saved: boolean;
  markSaved: () => void;
  /** from は写真を手に入れた画面（撮影なら /capture、ホームの見本の絵・アルバムなら /） */
  setPhoto: (photo: Photo, from: string, scene?: SceneKey) => void;
  /** 囲んだ直後に呼ぶ。裏で LLM を呼び始める（先読み生成） */
  startGeneration: (crop: Crop) => void;
  /** 同じ切り抜きで、問いを作り直す（ユーザーの操作で呼ぶ1回。自動リトライではない） */
  regenerate: () => void;
  selectQuestion: (question: Question) => void;
  setGuess: (guess: Guess) => void;
  reset: () => void;
};

const Context = createContext<QuizContext | null>(null);

export function useQuiz(): QuizContext {
  const value = useContext(Context);
  if (!value) throw new Error("QuizProvider の中で使ってください");
  return value;
}

/** 撮影から答え合わせまでの、1回ぶんの途中の状態（ページをまたいで持つ）。ユーザーが変わったら作り直す */
export function QuizProvider({ children }: { children: React.ReactNode }) {
  const { user } = useApp();
  return <QuizState key={user?.uid ?? "none"}>{children}</QuizState>;
}

function QuizState({ children }: { children: React.ReactNode }) {
  const { backend, profile } = useApp();
  const { archives, status: archiveStatus, reload } = useArchive();
  const [photo, setPhotoState] = useState<Photo | null>(null);
  const [scene, setSceneState] = useState<SceneKey | null>(null);
  const [photoFrom, setPhotoFrom] = useState("/");
  const [crop, setCrop] = useState<Crop | null>(null);
  const [generation, setGeneration] = useState<Generation>({ status: "idle" });
  const [picked, setPicked] = useState<Question | null>(null);
  const [detail, setDetail] = useState<DetailState>({ status: "none" });
  const [guess, setGuessState] = useState<Guess | null>(null);
  const [saved, setSaved] = useState(false);
  const latest = useRef(0);
  // 2回目の結果は、問いごとに覚える（もどって同じ問いを えらんでも、呼びなおさない）。新しい写真・作りなおしで捨てる
  const detailCache = useRef(new Map<Question, Detail>());
  const detailRun = useRef(0);
  // 問いを作るときに、いまの図鑑（出題済みの組み合わせ・学習の進み具合）を使う
  const archivesRef = useRef(archives);
  useEffect(() => {
    archivesRef.current = archives;
  }, [archives]);
  const archiveStatusRef = useRef(archiveStatus);
  useEffect(() => {
    archiveStatusRef.current = archiveStatus;
  }, [archiveStatus]);
  // 作り直すときに、いま出ている問いと同じ対象×単元を避けるため、見たものを覚えておく
  const seen = useRef<{ target: string; topic: string }[]>([]);

  // えらんだ問いと、2回目の状態を消す
  const clearPicked = useCallback(() => {
    detailRun.current++;
    detailCache.current.clear();
    setPicked(null);
    setDetail({ status: "none" });
  }, []);

  // 2回目：えらんだ1問の 解説などを作る。子どもが 予想している あいだに 終わる
  const loadDetail = useCallback(
    (question: Question) => {
      const id = ++detailRun.current;
      const cached = detailCache.current.get(question);
      if (cached) {
        setDetail({ status: "ready", data: cached });
        return;
      }
      if (!profile) return;
      setDetail({ status: "loading" });
      const body = detailRequestBody(question, buildGenerationContext(profile, archivesRef.current));
      requestDetail(backend, body)
        .then((data) => {
          detailCache.current.set(question, data);
          if (id !== detailRun.current) return;
          setDetail({ status: "ready", data });
        })
        .catch((error) => {
          if (id !== detailRun.current) return;
          setDetail({ status: "error", message: messageOf(error) });
        });
    },
    [backend, profile],
  );

  const run = useCallback(
    (nextCrop: Crop) => {
      if (!profile) return;
      const id = ++latest.current;
      setGeneration({ status: "loading" });
      // ずかんの読み込みに失敗したままだと、出題済みの組み合わせが空で送られてしまう。先に読みなおして、だめなら問いを作らない
      const loaded: Promise<ArchiveRecord[] | null> =
        archiveStatusRef.current === "error" ? reload() : Promise.resolve(archivesRef.current);
      loaded
        .then((list) => {
          if (!list) throw new UserFacingError("ずかんを {読|よ}みこめなかったよ。ネットに つながっているか {見|み}て、もう{一度|いちど} {試|ため}してね");
          const context = buildGenerationContext(profile, list);
          const body = {
            image: nextCrop.base64,
            ...context,
            // 作り直しで見た問いも足す。サーバーの上限（200件）をこえないよう、新しい方を残す
            asked: [...context.asked, ...seen.current].slice(-ASKED_MAX),
            ...(scene ? { scene } : {}),
          };
          // 見本の絵のときだけ、AI が使えなかったら、AI を呼ばずに見本の問いに切り替える（1回だけ。自動リトライではない）
          return requestQuestions(backend, body).catch((error) => {
            if (!scene) throw error;
            return requestQuestions(backend, { ...body, fallback: true });
          });
        })
        .then((data) => {
          if (id !== latest.current) return;
          seen.current = [...seen.current, ...data.questions.map((q) => ({ target: q.target, topic: q.topic }))];
          setGeneration({ status: "ready", data });
        })
        .catch((error) => {
          if (id !== latest.current) return;
          setGeneration({ status: "error", message: messageOf(error) });
        });
    },
    [backend, profile, scene, reload],
  );

  const setPhoto = useCallback((next: Photo, from: string, nextScene?: SceneKey) => {
    latest.current++;
    seen.current = [];
    setSceneState(nextScene ?? null);
    setPhotoFrom(from);
    setPhotoState(next);
    setCrop(null);
    clearPicked();
    setGuessState(null);
    setSaved(false);
    setGeneration({ status: "idle" });
  }, [clearPicked]);

  const startGeneration = useCallback(
    (next: Crop) => {
      seen.current = [];
      setCrop(next);
      clearPicked();
      setGuessState(null);
      setSaved(false);
      run(next);
    },
    [run, clearPicked],
  );

  const regenerate = useCallback(() => {
    if (crop) run(crop);
  }, [crop, run]);

  const reset = useCallback(() => {
    latest.current++;
    seen.current = [];
    setSceneState(null);
    setPhotoFrom("/");
    setPhotoState(null);
    setCrop(null);
    clearPicked();
    setGuessState(null);
    setSaved(false);
    setGeneration({ status: "idle" });
  }, [clearPicked]);

  const selectQuestion = useCallback(
    (question: Question) => {
      setPicked(question);
      setGuessState(null);
      setSaved(false);
      if (needsDetail(question)) loadDetail(question);
      else {
        detailRun.current++;
        setDetail({ status: "none" });
      }
    },
    [loadDetail],
  );

  const retryDetail = useCallback(() => {
    if (picked && needsDetail(picked)) loadDetail(picked);
  }, [picked, loadDetail]);

  const selected = useMemo(() => (picked && detail.status === "ready" ? withDetail(picked, detail.data) : picked), [picked, detail]);

  const setGuess = useCallback((next: Guess) => setGuessState(next), []);
  const markSaved = useCallback(() => setSaved(true), []);

  const value = useMemo<QuizContext>(
    () => ({
      photo, scene, photoFrom, crop, generation, selected, detail, retryDetail, guess, saved, markSaved,
      setPhoto, startGeneration, regenerate, selectQuestion, setGuess, reset,
    }),
    [photo, scene, photoFrom, crop, generation, selected, detail, retryDetail, guess, saved, markSaved, setPhoto, startGeneration, regenerate, selectQuestion, setGuess, reset],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
