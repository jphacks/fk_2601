import type { Metadata } from "next";
import { GroupsScreen } from "@/components/teacher/GroupsScreen";
import { APP_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `グループの投稿｜${APP_NAME}`,
};

export default async function TeacherGroupPostsPage({ params }: { params: Promise<{ groupId: string }> }) {
  const { groupId } = await params;
  return <GroupsScreen groupId={groupId} />;
}
