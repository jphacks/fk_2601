"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { DEMO_CLASSES, type TeacherClass } from "@/lib/teacherDemo";

type TeacherContextValue = {
  currentClass: TeacherClass;
  selectClass: (id: string) => void;
};

const TeacherContext = createContext<TeacherContextValue | null>(null);

// 表示中のクラスを持つ。保存しないので、読み込み直すとはじめのクラスに戻る
export function TeacherProvider({ children }: { children: React.ReactNode }) {
  const [classId, setClassId] = useState(DEMO_CLASSES[0].id);

  const value = useMemo(
    () => ({
      currentClass: DEMO_CLASSES.find((c) => c.id === classId) ?? DEMO_CLASSES[0],
      selectClass: setClassId,
    }),
    [classId],
  );

  return <TeacherContext.Provider value={value}>{children}</TeacherContext.Provider>;
}

export function useTeacher() {
  const value = useContext(TeacherContext);
  if (!value) throw new Error("useTeacher は TeacherProvider の中で使う");
  return value;
}
