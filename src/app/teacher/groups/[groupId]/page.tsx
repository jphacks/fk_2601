import type { Metadata } from "next";
import { GroupTodayScreen } from "@/components/teacher/GroupTodayScreen";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `グループの きょう｜${APP_NAME}`,
};

export default async function TeacherGroupTodayPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  return <GroupTodayScreen groupId={groupId} />;
}
