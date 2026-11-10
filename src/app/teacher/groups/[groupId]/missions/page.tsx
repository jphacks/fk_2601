import type { Metadata } from "next";
import { GroupMissionsScreen } from "@/components/teacher/GroupMissionsScreen";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `グループのミッション｜${APP_NAME}`,
};

export default async function TeacherGroupMissionsPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  return <GroupMissionsScreen groupId={groupId} />;
}
