"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { DEMO_CLASSES, type TeacherClass } from "@/lib/teacherDemo";

// 教室に映す先（docs/design/teachers/README.md「教室に映す画面の色」）
export type CastMode = "monitor" | "board";

type TeacherContextValue = {
  classes: TeacherClass[];
  currentClass: TeacherClass;
  selectClass: (id: string) => void;
  // クラスの設定（授業時間・参加コード・一緒に見る先生）を変える
  updateClass: (id: string, update: (c: TeacherClass) => TeacherClass) => void;
  castMode: CastMode;
  setCastMode: (mode: CastMode) => void;
};

const TeacherContext = createContext<TeacherContextValue | null>(null);

// 表示中のクラスと、クラスの設定の変更を持つ。保存しないので、読み込み直すとはじめに戻る
export function TeacherProvider({ children }: { children: React.ReactNode }) {
  const [classId, setClassId] = useState(DEMO_CLASSES[0].id);
  const [classes, setClasses] = useState(DEMO_CLASSES);
  const [castMode, setCastMode] = useState<CastMode>("monitor");

  const updateClass = useCallback((id: string, update: (c: TeacherClass) => TeacherClass) => {
    setClasses((prev) =>
      prev.map((c) => {
        if (c.id !== id) return c;
        const next = update(c);
        // あなたの役割は、一緒に見る先生の一覧に合わせる（担任を渡したとき）
        const me = next.teachers.find((t) => t.me);
        return me && me.role !== next.role ? { ...next, role: me.role } : next;
      }),
    );
  }, []);

  const value = useMemo(
    () => ({
      classes,
      currentClass: classes.find((c) => c.id === classId) ?? classes[0],
      selectClass: setClassId,
      updateClass,
      castMode,
      setCastMode,
    }),
    [classes, classId, updateClass, castMode],
  );

  return <TeacherContext.Provider value={value}>{children}</TeacherContext.Provider>;
}

export function useTeacher() {
  const value = useContext(TeacherContext);
  if (!value) throw new Error("useTeacher は TeacherProvider の中で使う");
  return value;
}
