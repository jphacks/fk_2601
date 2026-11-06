// 管理画面の見本（デモ）で使う架空のデータ。実在の先生・学校・子どもは入れない
// 見た目と動きの決まりは docs/design/teachers/README.md、画面の仕様は docs/06-school-expansion.md 5章

export type TeacherRole = "担任" | "副担任" | "学年の先生";

export type TeacherClass = {
  id: string;
  name: string;
  schoolYear: string;
  role: TeacherRole;
  // 授業時間のおわりの時刻。いまが授業時間の外なら null（docs/06-school-expansion.md 5.2）
  classUntil: string | null;
};

export const DEMO_TEACHER = { name: "山田 花子", initial: "山" };

export const DEMO_CLASSES: TeacherClass[] = [
  { id: "5-2", name: "5年2組", schoolYear: "2026年度", role: "担任", classUntil: "15:30" },
  { id: "5-1", name: "5年1組", schoolYear: "2026年度", role: "学年の先生", classUntil: null },
];
