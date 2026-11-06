import type { Metadata } from "next";
import { GroupMembersScreen } from "@/components/teacher/GroupMembersScreen";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `グループのメンバー｜${APP_NAME}`,
};

export default async function TeacherGroupMembersPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  return <GroupMembersScreen groupId={groupId} />;
}
