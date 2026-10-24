"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { requestQuestions } from "@/lib/api";
import { messageOf } from "@/lib/errors";
import type { Crop, Photo } from "@/lib/image";
import { buildGenerationContext } from "@/lib/progress";
import type { Guess } from "@/lib/rating";
import type { QuestionsResponse } from "@/server/llm/generate";
import type { Question } from "@/server/llm/schema";
import { useApp } from "./AuthProvider";

export type Generation =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; data: QuestionsResponse }
  | { status: "error"; message: string };

type QuizContext = {
  photo: Photo | null;
  crop: Crop | null;
  generation: Generation;
  /** えらんだ問いと、その予想 */
  selected: Question | null;
  guess: Guess | null;
  setPhoto: (photo: Photo) => void;
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
  const [photo, setPhotoState] = useState<Photo | null>(null);
  const [crop, setCrop] = useState<Crop | null>(null);
  const [generation, setGeneration] = useState<Generation>({ status: "idle" });
  const [selected, setSelected] = useState<Question | null>(null);
  const [guess, setGuessState] = useState<Guess | null>(null);
  const latest = useRef(0);
  // 作り直すときに、いま出ている問いと同じ対象×単元を避けるため、見たものを覚えておく
  const seen = useRef<{ target: string; topic: string }[]>([]);

  const run = useCallback(
    (nextCrop: Crop) => {
      if (!profile) return;
      const id = ++latest.current;
      setGeneration({ status: "loading" });
      const context = buildGenerationContext(profile, []);
      requestQuestions(backend, {
        image: nextCrop.base64,
        ...context,
        asked: [...context.asked, ...seen.current],
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
    [backend, profile],
  );

  const setPhoto = useCallback((next: Photo) => {
    latest.current++;
    seen.current = [];
    setPhotoState(next);
    setCrop(null);
    setSelected(null);
    setGuessState(null);
    setGeneration({ status: "idle" });
  }, []);

  const startGeneration = useCallback(
    (next: Crop) => {
      seen.current = [];
      setCrop(next);
      setSelected(null);
      setGuessState(null);
      run(next);
    },
    [run],
  );

  const regenerate = useCallback(() => {
    if (crop) run(crop);
  }, [crop, run]);

  const reset = useCallback(() => {
    latest.current++;
    seen.current = [];
    setPhotoState(null);
    setCrop(null);
    setSelected(null);
    setGuessState(null);
    setGeneration({ status: "idle" });
  }, []);

  const selectQuestion = useCallback((question: Question) => {
    setSelected(question);
    setGuessState(null);
  }, []);

  const setGuess = useCallback((next: Guess) => setGuessState(next), []);

  const value = useMemo<QuizContext>(
    () => ({ photo, crop, generation, selected, guess, setPhoto, startGeneration, regenerate, selectQuestion, setGuess, reset }),
    [photo, crop, generation, selected, guess, setPhoto, startGeneration, regenerate, selectQuestion, setGuess, reset],
  );
  return <Context.Provider value={value}>{children}</Context.Provider>;
}
