"use client";

import { useTeacher } from "./TeacherProvider";

// 中身を作る前の画面。共通レイアウトと画面の切りかえを確かめるためのもの
export function TeacherPlaceholder({ title, description }: { title: string; description: string }) {
  const { currentClass } = useTeacher();
  return (
    <main className="mx-auto flex min-h-0 w-full max-w-[1400px] flex-1 flex-col gap-3.5 px-6 pt-4 pb-5">
      <div>
        <h1 className="text-[22px] font-bold">{title}</h1>
        <p className="text-xs text-t-text-sub">
          {currentClass.name} ・ {currentClass.schoolYear} ・ あなたは{currentClass.role}
        </p>
      </div>
      <section className="min-h-0 flex-1 overflow-auto rounded-tcard border border-t-line bg-t-surface p-4">
        <p className="text-sm font-bold">この画面は準備中です</p>
        <p className="mt-1 text-[13px] text-t-text-sub">{description}</p>
      </section>
    </main>
  );
}
